using Microsoft.AspNetCore.SignalR;
using RemoteFileManager.Extensions;
using RemoteFileManager.Models;
using RemoteFileManager.Services;

namespace RemoteFileManager.Hubs;

public class AppHub(DownloadService downloadService, DirectoryService directoryService, ILogger<AppHub> logger) : Hub<IAppHub>
{
	private readonly DownloadService downloadService = downloadService;
	private readonly DirectoryService directoryService = directoryService;
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
			logger.WrongUrlCouldNotStartDownload(url);
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

	public void DeleteFile(string directoryName, string fileName) => directoryService.DeleteFile(directoryName, fileName);



	public IEnumerable<Download> GetActiveDownloads() => downloadService.ActiveDownloads;
	public IEnumerable<string> GetDownloadAllowedDirectoryNames() => directoryService.GetDownloadAllowedDirectories().Select(x => x.Name);

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
