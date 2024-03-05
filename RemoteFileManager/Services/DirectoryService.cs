using Microsoft.Extensions.Options;
using RemoteFileManager.Configuration;
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



	public IEnumerable<FileInfoModel> GetFilesInDirectoryByName(string directoryName)
	{
		string? directoryPath = GetEditAllowedDirectories().FirstOrDefault(x => x.Name == directoryName)?.Path;
		if (directoryPath is null)
			return [];

		var files = Directory.EnumerateFiles(directoryPath);
		var fileInfos = files.Select(x => new FileInfoModel
		{
			Name = Path.GetFileName(x),
			LastModifiedTime = File.GetLastWriteTimeUtc(x)
		});

		return fileInfos;
	}

	public DiskSpaceInfo? GetDiskSpaceInfo(string directoryName)
	{
		var directoryPath = GetAllowedDirectoryInfoByName(directoryName)?.Path;
		if (directoryPath is null)
			return null;

		var drive = new DriveInfo(directoryPath);
		return new DiskSpaceInfo(drive.AvailableFreeSpace, drive.TotalSize);
	}
}
