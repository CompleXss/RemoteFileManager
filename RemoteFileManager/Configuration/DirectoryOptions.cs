using RemoteFileManager.Models;

namespace RemoteFileManager.Configuration;

public class DirectoryOptions
{
	public const string SECTION_NAME = "Directories";

	public required DirectoryModel[] AllowedDirectories { get; init; }
}
