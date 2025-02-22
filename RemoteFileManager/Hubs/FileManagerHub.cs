using Microsoft.AspNetCore.SignalR;
using RemoteFileManager.Models.FileManager;
using RemoteFileManager.Services.FileManager;

namespace RemoteFileManager.Hubs;

public interface IFileManagerHub
{
	Task DownloadAdded(Download download);
	Task DownloadRemoved(string downloadId, bool completed);
	Task DownloadPaused(string downloadId);
	Task DownloadResumed(string downloadId);
	Task DownloadUpdated(string downloadId, long bytesDownloaded, long totalBytes, double speed);
	Task DirectoryUpdated(string directoryName, DiskSpaceInfo diskSpace, IEnumerable<FileInfoModel> files);
	Task ShouldReloadDirectories();
}

public class FileManagerHub : Hub<IFileManagerHub>
{
	private readonly DownloadService downloadService;
	private readonly DirectoryService directoryService;

	public FileManagerHub(DownloadService downloadService, DirectoryService directoryService)
	{
		this.downloadService = downloadService;
		this.directoryService = directoryService;
	}

	public async Task<bool> StartDownload(string url, string directoryName, string? fileName = null)
	{
		return await downloadService.StartDownload(url, directoryName, fileName);
	}

	public Task<bool> RestartDownload(string downloadId)
	{
		return downloadService.RestartDownload(downloadId);
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
