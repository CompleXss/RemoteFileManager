using Microsoft.AspNetCore.Mvc.RazorPages;
using RemoteFileManager.Services.FileManager;

namespace RemoteFileManager.Pages;

public class FileManagerModel : PageModel
{
	public IEnumerable<string> DownloadDirectoryNames { get; private set; } = [];
	public IEnumerable<string> EditDirectoryNames { get; private set; } = [];

	public FileManagerModel(DirectoryService directoryService)
	{
	}

	public void OnGet()
	{
		//DownloadDirectoryNames = directoryService.GetDownloadAllowedDirectories().Select(x => x.Name);
		//EditDirectoryNames = directoryService.GetEditAllowedDirectories().Select(x => x.Name);
	}
}
