using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using RemoteFileManager.Configuration;
using RemoteFileManager.Hubs;
using RemoteFileManager.Models;

namespace RemoteFileManager.Services;

public class DirectoryService(IOptionsMonitor<DirectoryOptions> options)
{
	public IOptionsMonitor<DirectoryOptions> Options { get; } = options;



	public IEnumerable<DirectoryModel> GetAllAllowedDirectories() => Options.CurrentValue.AllowedDirectories;
	public IEnumerable<DirectoryModel> GetDownloadAllowedDirectories() => Options.CurrentValue.AllowedDirectories.Where(x => x.CreateAllowed);
	public IEnumerable<DirectoryModel> GetEditAllowedDirectories() => Options.CurrentValue.AllowedDirectories.Where(x => x.EditAllowed);

	public DirectoryModel? GetAllowedDirectoryInfoByName(string name)
	{
		return Options.CurrentValue.AllowedDirectories.FirstOrDefault(x => x.Name == name);
	}



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
		var fileInfos = files.Select(x => new FileInfoModel
		{
			Name = Path.GetFileName(x),
			LastModifiedTime = File.GetLastWriteTimeUtc(x)
		});

		return fileInfos;
	}



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





	public Task ReportDirectoryUpdated(IHubContext<AppHub, IAppHub> hub, string directoryName)
	{
		var directory = GetAllowedDirectoryInfoByName(directoryName);
		if (directory is null)
			return Task.CompletedTask;

		var diskSpace = GetDiskSpaceInfo(directory);
		var files = GetFilesInDirectory(directory);

		return hub.Clients.All.DirectoryUpdated(directoryName, diskSpace, files);
	}
}
