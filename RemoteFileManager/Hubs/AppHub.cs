using Microsoft.AspNetCore.SignalR;
using RemoteFileManager.Models;
using RemoteFileManager.Services;

namespace RemoteFileManager.Hubs;

public class AppHub(DownloadService downloadService, DirectoryService directoryService, ILogger<AppHub> logger) : Hub<IAppHub>
{
	private readonly DownloadService downloadService = downloadService;
	private readonly ILogger<AppHub> logger = logger;



	public async Task<bool> StartDownload(string url, string directoryName, string? fileName = null)
	{
		if (url is null)
			return false;

		try
		{
			var uri = new Uri(url);
			return await downloadService.StartDownload(uri, directoryName, fileName);
		}
		catch (UriFormatException)
		{
			logger.LogWarning("Could not start download. Wrong url: '{uri}'", url);
			return false;
		}
	}

	public bool CancelDownload(string downloadID)
	{
		bool cancelled = downloadService.CancelDownload(downloadID);

		if (cancelled)
			Clients.All.DownloadRemoved(downloadID, completed: false);

		return cancelled;
	}

	public bool PauseDownload(string downloadID)
	{
		bool paused = downloadService.PauseDownload(downloadID);

		if (paused)
			Clients.All.DownloadPaused(downloadID);

		return paused;
	}

	public bool ResumeDownload(string downloadID)
	{
		bool resumed = downloadService.ResumeDownload(downloadID);

		if (resumed)
			Clients.All.DownloadResumed(downloadID);

		return resumed;
	}



	public IEnumerable<Download> GetActiveDownloads() => downloadService.ActiveDownloads;
	public IEnumerable<string> GetDownloadAllowedDirectoryNames() => directoryService.GetDownloadAllowedDirectories().Select(x => x.Name);
	public IEnumerable<string> GetEditAllowedDirectoryNames() => directoryService.GetEditAllowedDirectories().Select(x => x.Name);

	public IEnumerable<EditAllowedDirectoryInfo> GetEditAllowedDirectoryInfos()
	{
		var directories = directoryService.GetEditAllowedDirectories();
		return directories.Select(x => new EditAllowedDirectoryInfo
		{
			DirectoryName = x.Name,
			DiskSpaceInfo = directoryService.GetDiskSpaceInfo(x),
			Files = directoryService.GetFilesInDirectory(x).ToArray()
		});
	}

	//public IEnumerable<FileInfoModel> GetFilesInDirectoryByName(string directoryName) => directoryService.GetFilesInDirectory(directoryName);

	//public DiskSpaceInfo? GetDiskSpaceInfo(string directoryName) => directoryService.GetDiskSpaceInfo(directoryName);
}
