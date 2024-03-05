namespace RemoteFileManager.Models;

public readonly struct FileInfoModel
{
	public string Name { get; init; }
	public DateTime LastModifiedTime { get; init; }

	public FileInfoModel(string name, DateTime lastModifiedTime) : this()
	{
		Name = name;
		LastModifiedTime = lastModifiedTime;
	}
}
