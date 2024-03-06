using RemoteFileManager.Models;

namespace RemoteFileManager.Hubs;

public interface IAppHub
{
	Task DownloadAdded(Download download);
	Task DownloadRemoved(string downloadID, bool completed);
	Task DownloadPaused(string downloadID);
	Task DownloadResumed(string downloadID);
	Task DownloadUpdated(string downloadID, long bytesDownloaded, long totalBytes, double speed);
	Task DiskSpaceUpdated(string directoryName, DiskSpaceInfo? diskSpaceInfo);
}
