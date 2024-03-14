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

	[LoggerMessage(EventId = 4, Level = LogLevel.Information, Message = "Deleted file `{fileName}` from directory `{directoryName}` ({fullPath})")]
	public static partial void FileDeleted(this ILogger logger, string fileName, string directoryName, string fullPath);



	/// <param name="actionName"> e.g. "Download", "Delete" </param>
	[LoggerMessage(EventId = 5, Level = LogLevel.Warning, Message = "Invalid directory name `{directoryName}`. {actionName} aborted")]
	public static partial void InvalidDirectoryActionAborted(this ILogger logger, string actionName, string directoryName);

	/// <param name="actionName"> e.g. "Download", "Delete" </param>
	[LoggerMessage(EventId = 6, Level = LogLevel.Warning, Message = "Creating files is prohibited in directory `{directoryName}`. {actionName} aborted")]
	public static partial void ProhibitedDirectoryActionAborted(this ILogger logger, string actionName, string directoryName);

	[LoggerMessage(EventId = 7, Level = LogLevel.Warning, Message = "Could not start download. Wrong url: `{url}`")]
	public static partial void WrongUrlCouldNotStartDownload(this ILogger logger, string url);

	[LoggerMessage(EventId = 8, Level = LogLevel.Warning, Message = "File `{fileName}` not found in directory `{directoryName}` ({fullPath}). Delete aborted")]
	public static partial void NoSuchFileDeleteAborted(this ILogger logger, string fileName, string directoryName, string fullPath);



	[LoggerMessage(EventId = 9, Level = LogLevel.Error, Message = "Could not delete file `{fileName}` from directory `{directoryName}`. Error: {error}")]
	public static partial void CouldNotDeleteFile(this ILogger logger, string fileName, string directoryName, string error);



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



	public static void InvalidDirectoryDownloadAborted(this ILogger logger, string directoryName)
		=> InvalidDirectoryActionAborted(logger, "Download", directoryName);

	public static void InvalidDirectoryDeleteAborted(this ILogger logger, string directoryName)
		=> InvalidDirectoryActionAborted(logger, "Delete", directoryName);

	public static void ProhibitedDirectoryDownloadAborted(this ILogger logger, string directoryName)
		=> ProhibitedDirectoryActionAborted(logger, "Download", directoryName);

	public static void ProhibitedDirectoryDeleteAborted(this ILogger logger, string directoryName)
		=> ProhibitedDirectoryActionAborted(logger, "Delete", directoryName);



	private static string GetFullPath(string directoryPath, string fileName)
	{
		return Path.GetFullPath(Path.Combine(directoryPath, fileName));
	}
}
