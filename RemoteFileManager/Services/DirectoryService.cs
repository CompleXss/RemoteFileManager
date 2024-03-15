using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using RemoteFileManager.Configuration;
using RemoteFileManager.Extensions;
using RemoteFileManager.Hubs;
using RemoteFileManager.Models;

namespace RemoteFileManager.Services;

public sealed class DirectoryService : IDisposable
{
	public const string HIDDEN_TEMP_FILE_EXTENSION = ".~";

	private readonly IOptionsMonitor<DirectoryOptions> options;
	private readonly IHubContext<AppHub, IAppHub> hub;
	private readonly ILogger<DirectoryService> logger;
	private readonly FileLogger fileLogger;
	private readonly List<IDisposable> watcherDisposables;
	private readonly IDisposable? eventToDispose;

	public DirectoryService(IOptionsMonitor<DirectoryOptions> options, IHubContext<AppHub, IAppHub> hub, ILogger<DirectoryService> logger, FileLogger fileLogger)
	{
		this.options = options;
		this.hub = hub;
		this.logger = logger;
		this.fileLogger = fileLogger;



		var directories = GetAllAllowedDirectories();
		watcherDisposables = new(directories.Length * 2);

		CreateWatchers(directories);

		// Update fs watchers when appconfig file changes
		eventToDispose = options.OnChange(Helpers.Debounce<DirectoryOptions>(x =>
		{
			logger.LogInformation("App settings changed. Reloading file system watchers.");
			CreateWatchers(x.AllowedDirectories);

			// tell clients to reload directories
			hub.Clients.All.ShouldReloadDirectories();
		}));
	}



	#region Watchers
	private void CreateWatchers(DirectoryModel[] directories)
	{
		DisposeWatchers();

		foreach (var directory in directories)
		{
			if (!Directory.Exists(directory.Path))
				Directory.CreateDirectory(directory.Path);

			// Lock directory using empty file
			string lockFilePath = Path.Combine(directory.Path, "$lockfile" + HIDDEN_TEMP_FILE_EXTENSION);
			var fs = new FileStream(lockFilePath, FileMode.Create, FileAccess.ReadWrite, FileShare.None, 0, FileOptions.DeleteOnClose);
			File.SetAttributes(fs.Name, FileAttributes.Hidden);


			// Create watcher
			var watcher = new FileSystemWatcher(directory.Path, "*.*")
			{
				NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite,
				EnableRaisingEvents = true,
				IncludeSubdirectories = false,
			};

			var debouncedHandler = Helpers.Debounce<object, FileSystemEventArgs>((sender, e) => Watcher_onEvent(e, directory.Name));
			watcher.Changed += (sender, e) => debouncedHandler(sender, e);
			watcher.Created += (sender, e) => debouncedHandler(sender, e);
			watcher.Deleted += (sender, e) => debouncedHandler(sender, e);
			watcher.Renamed += (sender, e) => debouncedHandler(sender, e);
			watcher.Error += (sender, error) =>
			{
				var e = error.GetException();
				logger.LogError("{className} produced an error in directory `{directoryPath}`: {error}", nameof(FileSystemWatcher), directory.Path, e.Message);
			};

			watcherDisposables.Add(fs);
			watcherDisposables.Add(watcher);
		}
	}

	private void Watcher_onEvent(FileSystemEventArgs e, string directoryName)
	{
		if (e.Name is null || e.Name.EndsWith(HIDDEN_TEMP_FILE_EXTENSION) || Directory.Exists(e.FullPath))
			return;

		ReportDirectoryUpdated(directoryName);
	}

	private Task ReportDirectoryUpdated(string directoryName)
	{
		var directory = GetAllowedDirectoryInfoByName(directoryName);
		if (directory is null)
			return Task.CompletedTask;

		var diskSpace = GetDiskSpaceInfo(directory);
		var files = GetFilesInDirectory(directory);

		return hub.Clients.All.DirectoryUpdated(directoryName, diskSpace, files);
	}
	#endregion



	#region Get directories
	public DirectoryModel[] GetAllAllowedDirectories()
		=> options.CurrentValue.AllowedDirectories;

	public IEnumerable<DirectoryModel> GetDownloadAllowedDirectories()
		=> GetAllAllowedDirectories().Where(x => x.CreateAllowed);

	public DirectoryModel? GetAllowedDirectoryInfoByName(string name)
		=> GetAllAllowedDirectories().FirstOrDefault(x => x.Name == name);
	#endregion



	#region Files
	public IEnumerable<FileInfoModel> GetFilesInDirectory(string directoryName)
	{
		var directory = GetAllAllowedDirectories().FirstOrDefault(x => x.Name == directoryName);
		return GetFilesInDirectory(directory);
	}

	public IEnumerable<FileInfoModel> GetFilesInDirectory(DirectoryModel? directory)
	{
		if (!Directory.Exists(directory?.Path) || !directory.EditAllowed)
			return [];

		var files = Directory.EnumerateFiles(directory.Path).Order();
		var fileInfos = files.Where(x => !x.EndsWith(HIDDEN_TEMP_FILE_EXTENSION)).Select(x => new FileInfoModel
		{
			Name = Path.GetFileName(x),
			LastModifiedTime = File.GetLastWriteTimeUtc(x)
		});

		return fileInfos;
	}

	// TODO: test if it works
	public bool DeleteFile(string directoryName, string fileName)
	{
		var directory = GetAllowedDirectoryInfoByName(directoryName);
		if (directory is null)
		{
			logger.InvalidDirectoryDeleteAborted(directoryName);
			return false;
		}
		if (!directory.EditAllowed)
		{
			logger.ProhibitedDirectoryDeleteAborted(directoryName);
			return false;
		}

		try
		{
			string fullPath = Path.GetFullPath(Path.Combine(directory.Path, fileName));

			if (!File.Exists(fullPath))
			{
				logger.NoSuchFileDeleteAborted(fileName, directoryName, fullPath);
				return false;
			}

			File.Delete(fullPath);
			logger.FileDeleted(fileName, directoryName, fullPath);
			fileLogger.FileDeleted(fileName, directoryName, fullPath);

			return true;
		}
		catch (Exception e)
		{
			logger.CouldNotDeleteFile(fileName, directoryName, e.Message);
			fileLogger.CouldNotDeleteFile(fileName, directoryName, e.Message);
			return false;
		}
	}
	#endregion



	#region Disk space
	public DiskSpaceInfo? GetDiskSpaceInfo(string directoryName)
	{
		var directory = GetAllowedDirectoryInfoByName(directoryName);
		if (directory is null)
			return null;

		return GetDiskSpaceInfo(directory);
	}

	public DiskSpaceInfo GetDiskSpaceInfo(DirectoryModel directory)
	{
		string absolutePath = Path.GetFullPath(directory.Path);
		var drive = new DriveInfo(absolutePath);

		return new DiskSpaceInfo(drive.AvailableFreeSpace, drive.TotalSize);
	}
	#endregion



	#region Dispose
	public void Dispose()
	{
		DisposeWatchers();
		eventToDispose?.Dispose();
	}

	private void DisposeWatchers()
	{
		foreach (var item in watcherDisposables)
			item.Dispose();

		watcherDisposables.Clear();
	}
	#endregion
}
