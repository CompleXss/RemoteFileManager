namespace RemoteFileManager.Extensions;

public static partial class AppRunnerLoggerExtensions
{
	[LoggerMessage(EventId = 10, Level = LogLevel.Information, Message = "START '{appName}' app")]
	public static partial void AppStarted(this ILogger logger, string appName);

	[LoggerMessage(EventId = 11, Level = LogLevel.Information, Message = "STOP '{appName}' app")]
	public static partial void AppStopped(this ILogger logger, string appName);


	[LoggerMessage(EventId = 12, Level = LogLevel.Warning, Message = "Could not start '{appName}' app")]
	public static partial void CouldNotStartApp(this ILogger logger, string appName);

	[LoggerMessage(EventId = 13, Level = LogLevel.Warning, Message = "Could not start '{appName}' app: {reason}")]
	public static partial void CouldNotStartApp(this ILogger logger, string appName, string reason);

	[LoggerMessage(EventId = 14, Level = LogLevel.Warning, Message = "Could not stop '{appName}' app: {reason}")]
	public static partial void CouldNotStopApp(this ILogger logger, string appName, string reason);
}
