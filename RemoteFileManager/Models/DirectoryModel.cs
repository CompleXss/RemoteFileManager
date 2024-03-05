namespace RemoteFileManager.Models;

public class DirectoryModel
{
	public required string Name { get; init; }
	public required string Path { get; init; }
	public required bool CreateAllowed { get; init; }
	public required bool EditAllowed { get; init; }
}
