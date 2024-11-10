namespace RemoteFileManager.Models.FileManager;

public readonly struct EditAllowedDirectoryInfo(string directoryName, DiskSpaceInfo diskSpaceInfo, FileInfoModel[] files)
{
	public string DirectoryName { get; init; } = directoryName;
	public DiskSpaceInfo DiskSpaceInfo { get; init; } = diskSpaceInfo;
	public FileInfoModel[] Files { get; init; } = files;
}
