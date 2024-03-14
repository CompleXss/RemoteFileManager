using RemoteFileManager.Extensions;
using RemoteFileManager.Models;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace RemoteFileManager.Services;

public class Download : IDisposable
{
	public string ID { get; }
	public bool Done { get; private set; }
	public bool Paused { get; private set; }

	/// <summary> Total file length in bytes or -1 if this value is unknown. </summary>
	public long TotalBytes { get; private set; }
	public long BytesDownloaded { get; private set; }
	public double Speed { get; set; }

	public string FileName { get; private set; } = string.Empty;
	public string DirectoryName { get; private set; } = string.Empty;

	[JsonIgnore]
	public string DirectoryPath { get; private set; } = string.Empty;

	public event Action? Started;
	public event Action<bool>? Ended;

	[JsonIgnore]
	public bool IsCancellationRequested
	{
		get
		{
			lock (this)
				return cancellationTokenSource.IsCancellationRequested;
		}
	}

	private readonly CancellationTokenSource cancellationTokenSource = new();
	private readonly IHttpClientFactory httpClientFactory;
	private readonly ILogger logger;
	private readonly int bufferSize;
	private bool _started;
	private bool _disposed;



	public Download(IHttpClientFactory httpClientFactory, ILogger logger, int bufferSize = 81920)
	{
		this.httpClientFactory = httpClientFactory;
		this.logger = logger;
		this.bufferSize = bufferSize;

		ID = Guid.NewGuid().ToString();
	}



	public async Task<bool> Start(Uri uri, DirectoryModel directory, string? fileName = null)
	{
		lock (this)
		{
			if (_disposed || Done)
				return false;

			if (_started)
				return true;
		}

		DirectoryName = directory.Name;
		DirectoryPath = directory.Path;

		try
		{
			var token = cancellationTokenSource.Token;
			var client = httpClientFactory.CreateClient(); // should NOT be disposed!
			var response = await client.ReadResponseHeaders(uri, token);

			if (response.StatusCode != System.Net.HttpStatusCode.OK)
			{
				logger.LogWarning("Did not get OK response from '{uri}'. Download aborted.", uri);
				return false;
			}



			// get fileName
			if (!TryGetFileName(response, ref fileName))
			{
				FileName = string.Empty;
				logger.LogWarning("Could not obtain fileName. Download aborted.");
				return false;
			}
			FileName = fileName = MakeFileNameUnique(directory.Path, fileName);
			fileName += DirectoryService.HIDDEN_TEMP_FILE_EXTENSION; // add temp extension



			Started?.Invoke();

			// Fire and forget
			_ = Task.Run(async () =>
			{
				string filePath = directory.Path + fileName;

				try
				{
					if (!Directory.Exists(directory.Path))
						Directory.CreateDirectory(directory.Path);

					await DownloadFromResponse(response, filePath, token);

					// rename back to normal extension
					if (!TryMoveFile(filePath, directory.Path + FileName, LogLevel.Information))
					{
						// try add (1) to file end
						FileName = MakeFileNameUnique(directory.Path, FileName);
						logger.LogInformation("Trying to rename file from '{from}' to '{to}'", filePath, directory.Path + FileName);

						if (!TryMoveFile(filePath, directory.Path + FileName, LogLevel.Error))
						{
							TryDeleteFile(filePath); // if still could not move
						}
					}

					Ended?.Invoke(true);
				}
				catch (OperationCanceledException)
				{
					TryDeleteFile(filePath);
					Ended?.Invoke(false);
				}
				catch (Exception e)
				{
					logger.LogError("There was an error during download with id {id}: {error}", ID, e.Message);
					TryDeleteFile(filePath);
					Ended?.Invoke(false);
				}
				finally
				{
					response.Dispose();
				}
			}, token);


			lock (this)
			{
				_started = true;
			}
			return true;
		}
		catch (Exception e)
		{
			logger.LogWarning("Could not start download with id {id}: {error}", ID, e.Message);
			Ended?.Invoke(false);
			return false;
		}
	}



	private async Task DownloadFromResponse(HttpResponseMessage response, string filePath, CancellationToken token = default)
	{
		var contentLength = response.Content.Headers.ContentLength;
		TotalBytes = contentLength ?? -1;


		using var source = await response.Content.ReadAsStreamAsync(token);
		using var destination = new FileStream(filePath, FileMode.Create, FileAccess.Write);

		byte[] buffer = new byte[bufferSize];
		int bytesRead;

		while ((bytesRead = await source.ReadAsync(buffer, token)) != 0)
		{
			await destination.WriteAsync(buffer.AsMemory(0, bytesRead), token);
			BytesDownloaded += bytesRead;

			while (Paused)
				await Task.Delay(1000, token);
		}

		Done = true;
	}



	private static bool TryGetFileName(HttpResponseMessage response, [NotNullWhen(true)] ref string? fileName)
	{
		if (string.IsNullOrWhiteSpace(fileName))
		{
			return response.TryGetFileName(out fileName);
		}
		else if (Path.HasExtension(fileName))
		{
			return true;
		}
		else
		{
			if (response.TryGetFileName(out var responseName))
			{
				string extension = Path.GetExtension(responseName);
				fileName = Path.ChangeExtension(fileName, extension);
			}

			return true;
		}
	}

	private static string MakeFileNameUnique(string directory, string fileName)
	{
		string name = Path.GetFileNameWithoutExtension(fileName);
		string extension = Path.GetExtension(fileName);
		int tries = 1;

		while (File.Exists(Path.Combine(directory, fileName)) || File.Exists(Path.Combine(directory, fileName + DirectoryService.HIDDEN_TEMP_FILE_EXTENSION)))
		{
			fileName = string.Format("{0} ({1}){2}", name, tries++, extension);
		}

		return fileName;
	}



	private bool TryMoveFile(string from, string to, LogLevel failureLogLevel)
	{
		try
		{
			File.Move(from, to);
			return true;
		}
		catch (Exception e)
		{
			logger.Log(failureLogLevel, "Could not move (rename) file from '{from}' to '{to}': {reason}", from, to, e.Message);
			return false;
		}
	}

	private bool TryDeleteFile(string filePath)
	{
		try
		{
			File.Delete(filePath);
			return true;
		}
		catch (Exception e)
		{
			logger.LogError("Could not delete temp file '{filePath}': {reason}", filePath, e.Message);
			return false;
		}
	}



	public void Pause()
	{
		Paused = true;
	}

	public void Resume()
	{
		Paused = false;
	}

	public void Cancel()
	{
		lock (this)
			cancellationTokenSource.Cancel();
	}



	#region Dispose
	public void Dispose()
	{
		Dispose(true);
		GC.SuppressFinalize(this);
	}

	protected virtual void Dispose(bool disposing)
	{
		if (disposing && !_disposed)
		{
			lock (this)
				if (!cancellationTokenSource.IsCancellationRequested)
				{
					cancellationTokenSource.Cancel();
				}

			cancellationTokenSource.Dispose();
			_disposed = true;
		}
	}
	#endregion
}
