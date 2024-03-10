using Microsoft.AspNetCore.SignalR;
using RemoteFileManager.Hubs;

namespace RemoteFileManager.Services;

public class DownloadService(IHubContext<AppHub, IAppHub> hub, DirectoryService directoryService, IHttpClientFactory httpClientFactory, ILogger<DownloadService> logger)
{
	public List<Download> ActiveDownloads { get; } = new(8);
	private readonly IHubContext<AppHub, IAppHub> hub = hub;
	private readonly DirectoryService directoryService = directoryService;
	private readonly IHttpClientFactory httpClientFactory = httpClientFactory;
	private readonly ILogger<DownloadService> logger = logger;



	/// <returns> Download ID or null if download has not started. </returns>
	public async Task<bool> StartDownload(Uri uri, string directoryName, string? fileName = null)
	{
		var directory = directoryService.GetAllowedDirectoryInfoByName(directoryName);
		if (directory is null)
		{
			logger.LogWarning("Invalid directory name '{directoryName}'. Download aborted.", directoryName);
			return false;
		}

		var download = new Download(httpClientFactory, logger);
		bool progressWorking = true;

		download.Started += () =>
		{
			ActiveDownloads.Add(download);

			logger.LogInformation("Download with id {id} has started.", download.ID);
			hub.Clients.All.DownloadAdded(download);


			// Report progress info
			const int delayMs = 500;

			Task.Run(async () =>
			{
				DateTime prevTime = DateTime.Now;
				long bytesDownloaded = 0;

				do
				{
					while (download.Paused)
						await Task.Delay(delayMs);

					double secondsElapsed = (DateTime.Now - prevTime).TotalSeconds;
					prevTime = DateTime.Now;

					download.Speed = (download.BytesDownloaded - bytesDownloaded) / secondsElapsed;
					bytesDownloaded = download.BytesDownloaded;

					_ = hub.Clients.All.DownloadUpdated(download.ID, bytesDownloaded, download.TotalBytes, download.Speed);
					await Task.Delay(delayMs);
				}
				while (progressWorking);
			});
		};

		download.Ended += (completed) =>
		{
			progressWorking = false;

			ActiveDownloads.Remove(download);
			var downloadID = download.ID;
			download.Dispose();

			if (completed)
				logger.LogInformation("Download with id {id} has completed.", downloadID);

			hub.Clients.All.DownloadRemoved(downloadID, completed);
			directoryService.ReportDirectoryUpdated(hub, directoryName);
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
		var download = GetDownloadInfo(downloadID);
		if (download is null || download.IsCancellationRequested)
		{
			logger.LogInformation("Could not cancel download. There was no active download with id {id}", downloadID);
			return false;
		}

		download.Cancel();
		download.Dispose();

		logger.LogInformation("Download with id {id} has been cancelled.", downloadID);
		return true;
	}

	public bool PauseDownload(string downloadID)
	{
		var download = GetDownloadInfo(downloadID);
		if (download is null) return false;

		download.Pause();
		return true;
	}

	public bool ResumeDownload(string downloadID)
	{
		var download = GetDownloadInfo(downloadID);
		if (download is null) return false;

		download.Resume();
		return true;
	}



	public Download? GetDownloadInfo(string downloadID)
	{
		return ActiveDownloads.FirstOrDefault(x => x.ID == downloadID);
	}
}
