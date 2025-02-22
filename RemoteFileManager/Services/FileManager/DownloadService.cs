using System.Diagnostics.CodeAnalysis;
using System.Web;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using RemoteFileManager.Extensions;
using RemoteFileManager.Hubs;
using RemoteFileManager.Options;

namespace RemoteFileManager.Services.FileManager;

record FailedDownloadInfo
{
	public required string ID { get; init; }
	public required string? FileName { get; init; }
	public required string DirectoryName { get; init; }
	public required string Url { get; init; }
}

public sealed class DownloadService : IDisposable
{
	private const int REPORT_PROGRESS_DELAY_MS = 500; // todo: extract to options

	public List<Download> ActiveDownloads { get; } = new(16); // todo: make it thread safe
	private List<FailedDownloadInfo> FailedDownloadInfos { get; } = new(16); // todo: make it thread safe
	private readonly IHubContext<FileManagerHub, IFileManagerHub> hub;
	private readonly DirectoryService directoryService;
	private readonly IHttpClientFactory httpClientFactory;
	private readonly IOptions<FileManagerOptions> options;
	private readonly ILogger<DownloadService> logger;
	private readonly FileLogger fileLogger;

	public DownloadService(
		IHubContext<FileManagerHub, IFileManagerHub> hub,
		DirectoryService directoryService,
		IHttpClientFactory httpClientFactory,
		IOptions<FileManagerOptions> options,
		ILogger<DownloadService> logger,
		FileLogger fileLogger)
	{
		this.hub = hub;
		this.directoryService = directoryService;
		this.httpClientFactory = httpClientFactory;
		this.options = options;
		this.logger = logger;
		this.fileLogger = fileLogger;
	}


	/// <returns> True if download has started, False if not. </returns>
	public async Task<bool> StartDownload(string url, string directoryName, string? fileName = null)
	{
		if (!TryCreateUriWithQueryParams(url, out var uri))
			return false;

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

		var download = new Download(uri, directory, httpClientFactory, logger);
		var progressWorking = true;

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
			else
				FailedDownloadInfos.Add(new FailedDownloadInfo
				{
					ID = download.ID,
					FileName = fileName,
					DirectoryName = directoryName,
					Url = url,
				});

			hub.Clients.All.DownloadRemoved(download.ID, completed);
		};

		var started = await download.Start(fileName);

		if (!started)
			download.Dispose();

		return started;
	}

	public async Task<bool> RestartDownload(string downloadId)
	{
		var info = FailedDownloadInfos.FirstOrDefault(x => x.ID == downloadId);
		if (info is null) return false;

		FailedDownloadInfos.Remove(info);
		return await StartDownload(info.Url, info.DirectoryName, info.FileName);
	}


	/// <summary> Tries to stop download with provided ID. </summary>
	/// <returns> True if successfully stopped. False if not. </returns>
	public bool CancelDownload(string downloadId)
	{
		var download = FindDownloadById(downloadId);
		if (download is null || download.IsCancellationRequested)
		{
			logger.CouldNotCancelDownload(downloadId);
			return false;
		}

		download.Cancel();
		download.Dispose();

		logger.DownloadCancelled(download);
		return true;
	}

	public bool PauseDownload(string downloadId)
	{
		var download = FindDownloadById(downloadId);
		if (download is null) return false;

		download.Pause();
		return true;
	}

	public bool ResumeDownload(string downloadId)
	{
		var download = FindDownloadById(downloadId);
		if (download is null) return false;

		download.Resume();
		return true;
	}


	private bool TryCreateUriWithQueryParams(string url, [NotNullWhen(true)] out Uri? uri)
	{
		try
		{
			var uriBuilder = new UriBuilder(url);

			if (options.Value.QueryParams.Length > 0)
			{
				var query = HttpUtility.ParseQueryString(uriBuilder.Query);

				foreach (var parameters in options.Value.QueryParams)
				{
					if (!url.Contains(parameters.HostWildcard))
						continue;

					foreach (var (key, value) in parameters.Params)
					{
						query[key] = value;
					}
				}

				uriBuilder.Query = query.ToString();
			}

			uri = uriBuilder.Uri;
			return true;
		}
		catch (UriFormatException)
		{
			logger.WrongUrlCouldNotStartDownload(url);

			uri = null;
			return false;
		}
	}

	private Download? FindDownloadById(string downloadId)
	{
		return ActiveDownloads.FirstOrDefault(x => x.ID == downloadId);
	}


	public void Dispose()
	{
		foreach (var download in ActiveDownloads)
			download.Dispose();

		ActiveDownloads.Clear();
	}
}
