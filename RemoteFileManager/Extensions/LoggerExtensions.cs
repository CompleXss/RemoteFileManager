using RemoteFileManager.Services;

namespace RemoteFileManager.Extensions;

public static partial class LoggerExtensions
{
	[LoggerMessage(EventId = 0, Level = LogLevel.Information, Message = "Started downloading file `{fileName}` to `{directoryName}` ({fullPath}). Download ID: `{id}`")]
	public static partial void DownloadStarted(this ILogger logger, string fileName, string directoryName, string fullPath, string id);

	[LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Completed downloading file `{fileName}` to `{directoryName}` ({fullPath})")]
	public static partial void DownloadCompleted(this ILogger logger, string fileName, string directoryName, string fullPath);

	[LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Cancelled downloading file `{fileName}` to `{directoryName}` ({fullPath})")]
	public static partial void DownloadCancelled(this ILogger logger, string fileName, string directoryName, string fullPath);

	[LoggerMessage(EventId = 3, Level = LogLevel.Information, Message = "Could not cancel download. There was no active download with id `{id}`")]
	public static partial void CouldNotCancelDownload(this ILogger logger, string id);



	[LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Invalid directory name `{directoryName}`. Download aborted.")]
	public static partial void InvalidDirectoryDownloadAborted(this ILogger logger, string directoryName);

	[LoggerMessage(EventId = 5, Level = LogLevel.Warning, Message = "Could not start download. Wrong url: `{url}`")]
	public static partial void WrongUrlCouldNotStartDownload(this ILogger logger, string url);



	public static void DownloadStarted(this ILogger logger, Download download)
	{
		string fullPath = GetFullPath(download.DirectoryPath, download.FileName);
		logger.DownloadStarted(download.FileName, download.DirectoryName, fullPath, download.ID);
	}

	public static void DownloadCompleted(this ILogger logger, Download download)
	{
		string fullPath = GetFullPath(download.DirectoryPath, download.FileName);
		logger.DownloadCompleted(download.FileName, download.DirectoryName, fullPath);
	}

	public static void DownloadCancelled(this ILogger logger, Download download)
	{
		string fullPath = GetFullPath(download.DirectoryPath, download.FileName);
		logger.DownloadCancelled(download.FileName, download.DirectoryName, fullPath);
	}



	private static string GetFullPath(string directoryPath, string fileName)
	{
		return Path.GetFullPath(Path.Combine(directoryPath, fileName));
	}
}
