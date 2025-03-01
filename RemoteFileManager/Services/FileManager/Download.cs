﻿using System.Diagnostics.CodeAnalysis;
using System.Net.Mime;
using System.Text.Json.Serialization;
using RemoteFileManager.Extensions;
using RemoteFileManager.Models.FileManager;

namespace RemoteFileManager.Services.FileManager;

public class Download : IDisposable
{
	private const string TEMP_EXTENSION_REPLACEMENT = "._";
	private const string TEMP_EXTENSION = DirectoryService.HIDDEN_TEMP_FILE_EXTENSION;
	private const int DEFAULT_BUFFER_SIZE = 8 * 1024;

	public string ID { get; }
	public bool Done { get; private set; }
	public bool Paused { get; private set; }

	/// <summary> Total file length in bytes or -1 if this value is unknown. </summary>
	public long TotalBytes { get; private set; }
	public long BytesDownloaded { get; private set; }
	public double Speed { get; set; }

	public string FileName { get; private set; } = string.Empty;
	public string DirectoryName { get; private set; }

	[JsonIgnore]
	public string DirectoryPath { get; private set; }

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

	private readonly Uri uri;
	private readonly CancellationTokenSource cancellationTokenSource = new();
	private readonly IHttpClientFactory httpClientFactory;
	private readonly ILogger logger;
	private readonly int bufferSize;
	private bool _started;
	private bool _disposed;


	public Download(Uri uri, DirectoryModel directory, IHttpClientFactory httpClientFactory, ILogger logger, int bufferSize = DEFAULT_BUFFER_SIZE)
	{
		this.uri = uri;
		this.DirectoryName = directory.Name;
		this.DirectoryPath = directory.Path;
		this.httpClientFactory = httpClientFactory;
		this.logger = logger;
		this.bufferSize = bufferSize;

		ID = Guid.NewGuid().ToString();
	}


	public async Task<bool> Start(string? fileName = null)
	{
		lock (this)
		{
			if (_disposed || Done)
				return false;

			if (_started)
				return true;
		}

		HttpResponseMessage? response = null;

		try
		{
			var token = cancellationTokenSource.Token;
			var client = httpClientFactory.CreateClient(); // should NOT be disposed!
			response = await client.ReadResponseHeaders(uri, token);

			if (!IsResponseHasFile(response))
				return false;


			// get fileName
			if (!TryGetFileName(response, ref fileName))
			{
				FileName = string.Empty;
				logger.LogWarning("Could not obtain fileName. Download aborted.");
				return false;
			}

			// replace file extension if it's the same as temp extension
			if (fileName.EndsWith(TEMP_EXTENSION))
			{
				int extLength = TEMP_EXTENSION.Length;
				fileName = fileName[..^extLength] + TEMP_EXTENSION_REPLACEMENT; // replace temp extension with '._' extension to avoid confusion

				logger.LogWarning("Name of the downloading file had prohibited extension ({oldExtension}). It was replaced with ({newExtension})",
					TEMP_EXTENSION,
					TEMP_EXTENSION_REPLACEMENT);
			}

			FileName = fileName = MakeFileNameUnique(DirectoryPath, fileName);
			fileName += TEMP_EXTENSION; // add temp extension during download


			Started?.Invoke();

			// Fire and forget
			_ = Task.Run(async () =>
			{
				var tempFilePath = Path.Combine(DirectoryPath, fileName);
				var finalFilePath = Path.Combine(DirectoryPath, this.FileName);

				try
				{
					if (!Directory.Exists(DirectoryPath))
						Directory.CreateDirectory(DirectoryPath);

					await DownloadFromResponse(response, tempFilePath, token);

					// rename back to normal extension
					if (!TryMoveFile(tempFilePath, finalFilePath, LogLevel.Information))
					{
						// try add (1) to file end
						FileName = MakeFileNameUnique(DirectoryPath, FileName);
						logger.LogInformation("Trying to rename file from '{from}' to '{to}'", tempFilePath, finalFilePath);

						if (!TryMoveFile(tempFilePath, finalFilePath, LogLevel.Error))
						{
							TryDeleteFile(tempFilePath); // if still could not move
						}
					}

					Ended?.Invoke(true);
				}
				catch (OperationCanceledException)
				{
					TryDeleteFile(tempFilePath);
					Ended?.Invoke(false);
				}
				catch (Exception e)
				{
					logger.LogError("There was an error during download with id {id}: {error}", ID, e.Message);
					TryDeleteFile(tempFilePath);
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
			response?.Dispose();

			logger.LogWarning("Could not start download with id {id}: {error}", ID, e.Message);
			Ended?.Invoke(false);
			return false;
		}
	}

	private bool IsResponseHasFile(HttpResponseMessage response)
	{
		if (response.StatusCode != System.Net.HttpStatusCode.OK)
		{
			logger.LogWarning("Did not get OK response from '{uri}'. Download aborted.", uri);
			return false;
		}

		if (response.Content.Headers.ContentDisposition?.DispositionType == DispositionTypeNames.Attachment)
			return true;

		if (response.Content.Headers.ContentType?.MediaType != MediaTypeNames.Text.Html)
			return true;

		logger.LogWarning(
			"Provided url's content is not an attachment and is text/html. It's probably not a file. Download aborted. Url: {url}",
			uri);
		return false;
	}


	private async Task DownloadFromResponse(HttpResponseMessage response, string filePath, CancellationToken token = default)
	{
		var contentLength = response.Content.Headers.ContentLength;
		TotalBytes = contentLength ?? -1;

		using var source = await response.Content.ReadAsStreamAsync(token);
		using var destination = new FileStream(filePath, FileMode.Create, FileAccess.Write);

		var buffer = new byte[bufferSize];
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
			return response.TryGetFileName(out fileName);

		if (Path.HasExtension(fileName))
			return true;

		if (!response.TryGetFileName(out var responseName))
			return true;

		var extension = Path.GetExtension(responseName);
		fileName = Path.ChangeExtension(fileName, extension);

		return true;
	}

	private static string MakeFileNameUnique(string directory, string fileName)
	{
		var name = Path.GetFileNameWithoutExtension(fileName);
		var extension = Path.GetExtension(fileName);
		int tries = 1;

		while (File.Exists(Path.Combine(directory, fileName)) || File.Exists(Path.Combine(directory, fileName + TEMP_EXTENSION)))
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
		if (!disposing || _disposed)
			return;

		lock (this)
			if (!cancellationTokenSource.IsCancellationRequested)
			{
				cancellationTokenSource.Cancel();
			}

		cancellationTokenSource.Dispose();
		_disposed = true;
	}
	#endregion
}
