namespace RemoteFileManager.Services;

public class FileLogger(string? filePath) : ILogger
{
	public const string DATE_TIME_FORMAT = "dd.MM.yyyy HH:mm:ss";
	private readonly string? filePath = filePath;
	private static readonly object lockObject = new();

	public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
	{
		if (filePath is null || formatter is null)
			return;

		var n = Environment.NewLine;
		string exc = "";

		if (exception is not null)
			exc = n + exception.GetType() + ": " + exception.Message + n + exception.StackTrace + n;

		string message = $"[{DateTime.Now.ToString(DATE_TIME_FORMAT)}] [{logLevel}]: " + formatter(state, exception) + n + exc;

		lock (lockObject)
		{
			try
			{
				var directory = Path.GetDirectoryName(filePath);
				if (!string.IsNullOrWhiteSpace(directory))
					Directory.CreateDirectory(directory);

				File.AppendAllText(filePath, message);
			}
			catch (Exception)
			{
			}
		}
	}

	public IDisposable? BeginScope<TState>(TState state) where TState : notnull
	{
		return null;
	}

	public bool IsEnabled(LogLevel logLevel)
	{
		return true;
	}
}
