using RemoteFileManager.Models;
using RemoteFileManager.Models.FileManager;

namespace RemoteFileManager.Options;

public class FileManagerOptions
{
	public const string SECTION_KEY = "FileManager";

	public DirectoryModel[] AllowedDirectories { get; init; } = [];
	public string? FilesChangesLogFile { get; init; } = null;
}
