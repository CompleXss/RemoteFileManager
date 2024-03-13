namespace RemoteFileManager.Services;

public class FileLogger(string? filePath) : ILogger
{
	private readonly string? filePath = filePath;
	private static readonly object lockObject = new();

	public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
	{
		if (filePath is null || formatter is null)
			return;

		lock (lockObject)
		{
			var n = Environment.NewLine;
			string exc = "";

			if (exception is not null)
				exc = n + exception.GetType() + ": " + exception.Message + n + exception.StackTrace + n;

			try
			{
				var directory = Path.GetDirectoryName(filePath);
				if (!string.IsNullOrWhiteSpace(directory))
					Directory.CreateDirectory(directory);

				File.AppendAllText(filePath, "[" + DateTime.Now.ToString() + "] - " + logLevel.ToString() + ": " + formatter(state, exception) + n + exc);
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
