namespace RemoteFileManager.Models;

public class DirectoryModel
{
	public string Name { get; init; }
	public string Path { get; init; }
	public bool CreateAllowed { get; init; }
	public bool EditAllowed { get; init; }

	public DirectoryModel(string name, string path, bool createAllowed = false, bool editAllowed = false)
	{
		Name = name;
		Path = path;
		CreateAllowed = createAllowed;
		EditAllowed = editAllowed;
	}
}
