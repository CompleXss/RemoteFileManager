using Microsoft.AspNetCore.Mvc.RazorPages;
using RemoteFileManager.Services;

namespace RemoteFileManager.Pages;

public class IndexModel(DirectoryService directoryService) : PageModel
{
	public IEnumerable<string> DownloadDirectoryNames { get; private set; } = [];
	public IEnumerable<string> EditDirectoryNames { get; private set; } = [];

	public void OnGet()
	{
		DownloadDirectoryNames = directoryService.GetDownloadAllowedDirectories().Select(x => x.Name);
		EditDirectoryNames = directoryService.GetEditAllowedDirectories().Select(x => x.Name);
	}
}
