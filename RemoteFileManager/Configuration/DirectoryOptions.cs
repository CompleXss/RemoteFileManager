using RemoteFileManager.Models;

namespace RemoteFileManager.Configuration;

public class DirectoryOptions
{
	public const string SECTION_KEY = "Directories";

	public DirectoryModel[] AllowedDirectories { get; init; } = [];
	public string? FilesChangesLogFile { get; init; } = null;
}
