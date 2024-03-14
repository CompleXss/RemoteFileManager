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

	public IOptionsMonitor<DirectoryOptions> Options { get; }
	private readonly IHubContext<AppHub, IAppHub> hub;
	private readonly List<IDisposable> watcherDisposables;
	private readonly IDisposable? eventToDispose;

	public DirectoryService(IOptionsMonitor<DirectoryOptions> options, IHubContext<AppHub, IAppHub> hub, ILogger<DirectoryService> logger)
	{
		this.Options = options;
		this.hub = hub;



		var directories = GetAllAllowedDirectories();
		watcherDisposables = new(directories.Length * 2);

		CreateWatchers(directories, logger);

		// Update fs watchers when appconfig file changes
		eventToDispose = options.OnChange(Helpers.Debounce<DirectoryOptions>(x =>
		{
			logger.LogInformation("App settings changed. Reloading file system watchers.");
			CreateWatchers(x.AllowedDirectories, logger);

			// tell client about changes
			foreach (var dir in x.AllowedDirectories)
				ReportDirectoryUpdated(dir.Name);
		}));
	}



	private void CreateWatchers(DirectoryModel[] directories, ILogger logger)
	{
		DisposeWatchers();

		foreach (var directory in directories)
		{
			if (!Directory.Exists(directory.Path))
				Directory.CreateDirectory(directory.Path);

			// Lock directory using empty file
			string lockFilePath = Path.Combine(directory.Path, "lockfile" + HIDDEN_TEMP_FILE_EXTENSION);
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



	public DirectoryModel[] GetAllAllowedDirectories() => Options.CurrentValue.AllowedDirectories;
	public IEnumerable<DirectoryModel> GetDownloadAllowedDirectories() => Options.CurrentValue.AllowedDirectories.Where(x => x.CreateAllowed);
	public IEnumerable<DirectoryModel> GetEditAllowedDirectories() => Options.CurrentValue.AllowedDirectories.Where(x => x.EditAllowed);

	public DirectoryModel? GetAllowedDirectoryInfoByName(string name)
	{
		return Options.CurrentValue.AllowedDirectories.FirstOrDefault(x => x.Name == name);
	}



	// Files
	public IEnumerable<FileInfoModel> GetFilesInDirectory(string directoryName)
	{
		var directory = GetEditAllowedDirectories().FirstOrDefault(x => x.Name == directoryName);
		return GetFilesInDirectory(directory);
	}

	public IEnumerable<FileInfoModel> GetFilesInDirectory(DirectoryModel? directory)
	{
		if (!Directory.Exists(directory?.Path))
			return [];

		var files = Directory.EnumerateFiles(directory.Path);
		var fileInfos = files.Where(x => !x.EndsWith(HIDDEN_TEMP_FILE_EXTENSION)).Select(x => new FileInfoModel
		{
			Name = Path.GetFileName(x),
			LastModifiedTime = File.GetLastWriteTimeUtc(x)
		});

		return fileInfos;
	}



	// Disk space
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



	// Delete files

	// TODO: add try-catch
	// TODO: test if it works
	public bool DeleteFile(string directoryName, string fileName)
	{
		var directory = GetAllowedDirectoryInfoByName(directoryName);
		if (directory is null)
			return false;

		string fullPath = Path.GetFullPath(Path.Combine(directory.Path, fileName));

		if (File.Exists(fullPath))
		{
			File.Delete(fullPath);
			return true;
		}

		return false;
	}



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
}
