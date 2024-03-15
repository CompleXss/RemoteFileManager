using RemoteFileManager.Models;
using RemoteFileManager.Services;

namespace RemoteFileManager.Hubs;

public interface IAppHub
{
	Task DownloadAdded(Download download);
	Task DownloadRemoved(string downloadID, bool completed);
	Task DownloadPaused(string downloadID);
	Task DownloadResumed(string downloadID);
	Task DownloadUpdated(string downloadID, long bytesDownloaded, long totalBytes, double speed);
	Task DirectoryUpdated(string directoryName, DiskSpaceInfo diskSpace, IEnumerable<FileInfoModel> files);
	Task ShouldReloadDirectories();
}
