using RemoteFileManager.Models;

namespace RemoteFileManager.Configuration;

public class DirectoryOptions
{
	public const string SECTION_NAME = "Directories";

	public DirectoryModel[] AllowedDirectories { get; init; } = [];
}
