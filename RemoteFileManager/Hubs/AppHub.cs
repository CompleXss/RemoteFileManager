using Microsoft.AspNetCore.SignalR;
using RemoteFileManager.Extensions;
using RemoteFileManager.Models;
using RemoteFileManager.Services;

namespace RemoteFileManager.Hubs;

public class AppHub : Hub<IAppHub>
{
	private readonly DownloadService downloadService;
	private readonly DirectoryService directoryService;
	private readonly ILogger<AppHub> logger;

	public AppHub(DownloadService downloadService, DirectoryService directoryService, ILogger<AppHub> logger)
	{
		this.downloadService = downloadService;
		this.directoryService = directoryService;
		this.logger = logger;
	}

	public async Task<bool> StartDownload(string url, string directoryName, string? fileName = null)
	{
		try
		{
			var uri = new Uri(url);
			return await downloadService.StartDownload(uri, directoryName, fileName);
		}
		catch (UriFormatException)
		{
			logger.WrongUrlCouldNotStartDownload(url);
			return false;
		}
	}

	public bool CancelDownload(string downloadId)
	{
		var cancelled = downloadService.CancelDownload(downloadId);

		if (cancelled)
			Clients.All.DownloadRemoved(downloadId, completed: false);

		return cancelled;
	}

	public bool PauseDownload(string downloadId)
	{
		var paused = downloadService.PauseDownload(downloadId);

		if (paused)
			Clients.All.DownloadPaused(downloadId);

		return paused;
	}

	public bool ResumeDownload(string downloadId)
	{
		var resumed = downloadService.ResumeDownload(downloadId);

		if (resumed)
			Clients.All.DownloadResumed(downloadId);

		return resumed;
	}

	public void DeleteFile(string directoryName, string fileName) =>
		directoryService.DeleteFile(directoryName, fileName);

	public IEnumerable<Download> GetActiveDownloads() =>
		downloadService.ActiveDownloads;

	public IEnumerable<string> GetDownloadAllowedDirectoryNames() =>
		directoryService.GetDownloadAllowedDirectories().Select(x => x.Name);

	public IEnumerable<EditAllowedDirectoryInfo> GetAllowedDirectoryInfos()
	{
		var directories = directoryService.GetAllAllowedDirectories();
		return directories.Select(x => new EditAllowedDirectoryInfo
		{
			DirectoryName = x.Name,
			DiskSpaceInfo = directoryService.GetDiskSpaceInfo(x),
			Files = directoryService.GetFilesInDirectory(x).ToArray()
		});
	}
}
