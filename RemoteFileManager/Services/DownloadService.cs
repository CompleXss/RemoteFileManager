using Microsoft.AspNetCore.SignalR;
using RemoteFileManager.Extensions;
using RemoteFileManager.Hubs;

namespace RemoteFileManager.Services;

public class DownloadService(IHubContext<AppHub, IAppHub> hub, DirectoryService directoryService, IHttpClientFactory httpClientFactory, ILogger<DownloadService> logger, FileLogger fileLogger)
{
	private const int REPORT_PROGRESS_DELAY_MS = 500;

	public List<Download> ActiveDownloads { get; } = new(16);
	private readonly IHubContext<AppHub, IAppHub> hub = hub;
	private readonly DirectoryService directoryService = directoryService;
	private readonly IHttpClientFactory httpClientFactory = httpClientFactory;
	private readonly ILogger<DownloadService> logger = logger;
	private readonly FileLogger fileLogger = fileLogger;



	/// <returns> True if download has started, False if not. </returns>
	public async Task<bool> StartDownload(Uri uri, string directoryName, string? fileName = null)
	{
		var directory = directoryService.GetAllowedDirectoryInfoByName(directoryName);
		if (directory is null)
		{
			logger.InvalidDirectoryDownloadAborted(directoryName);
			return false;
		}
		if (!directory.CreateAllowed)
		{
			logger.ProhibitedDirectoryDownloadAborted(directoryName);
			return false;
		}



		var download = new Download(httpClientFactory, logger);
		bool progressWorking = true;

		download.Started += () =>
		{
			ActiveDownloads.Add(download);

			logger.DownloadStarted(download);
			hub.Clients.All.DownloadAdded(download);

			// Report progress info
			Task.Run(async () =>
			{
				DateTime prevTime = DateTime.Now;
				long bytesDownloaded = 0;

				do
				{
					while (download.Paused)
						await Task.Delay(REPORT_PROGRESS_DELAY_MS);

					double secondsElapsed = (DateTime.Now - prevTime).TotalSeconds;
					prevTime = DateTime.Now;

					download.Speed = (download.BytesDownloaded - bytesDownloaded) / secondsElapsed;
					bytesDownloaded = download.BytesDownloaded;

					_ = hub.Clients.All.DownloadUpdated(download.ID, bytesDownloaded, download.TotalBytes, download.Speed);
					await Task.Delay(REPORT_PROGRESS_DELAY_MS);
				}
				while (progressWorking);
			});
		};

		download.Ended += (completed) =>
		{
			progressWorking = false;

			ActiveDownloads.Remove(download);
			download.Dispose();

			if (completed)
			{
				logger.DownloadCompleted(download);
				fileLogger.DownloadCompleted(download);
			}

			hub.Clients.All.DownloadRemoved(download.ID, completed);
		};



		bool started = await download.Start(uri, directory, fileName);

		if (!started)
			download.Dispose();

		return started;
	}



	/// <summary> Tries to stop download with provided ID. </summary>
	/// <returns> True if successfully stopeed. False if not. </returns>
	public bool CancelDownload(string downloadID)
	{
		var download = FindDownloadByID(downloadID);
		if (download is null || download.IsCancellationRequested)
		{
			logger.CouldNotCancelDownload(downloadID);
			return false;
		}

		download.Cancel();
		download.Dispose();

		logger.DownloadCancelled(download);
		return true;
	}

	public bool PauseDownload(string downloadID)
	{
		var download = FindDownloadByID(downloadID);
		if (download is null) return false;

		download.Pause();
		return true;
	}

	public bool ResumeDownload(string downloadID)
	{
		var download = FindDownloadByID(downloadID);
		if (download is null) return false;

		download.Resume();
		return true;
	}



	public Download? FindDownloadByID(string downloadID)
	{
		return ActiveDownloads.FirstOrDefault(x => x.ID == downloadID);
	}
}
