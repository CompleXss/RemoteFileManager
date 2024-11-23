using RemoteFileManager.Models.FileManager;

namespace RemoteFileManager.Options;

public class FileManagerOptions
{
	public const string SECTION_KEY = "FileManager";

	public DirectoryModel[] AllowedDirectories { get; set; } = [];
	public QueryParams[] QueryParams { get; set; } = [];
	public string? FilesChangesLogFile { get; set; } = null;
}

public record QueryParams
{
	public string HostWildcard { get; set; } = string.Empty;
	public Dictionary<string, string> Params { get; set; } = [];
}
