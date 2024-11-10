using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Options;
using RemoteFileManager.Options;

namespace RemoteFileManager.Pages;

public class AppRunnerModel : PageModel
{
	public string[] AppNames { get; }

	public AppRunnerModel(IOptions<AppRunnerOptions> options)
	{
		AppNames = options.Value.AppPaths.Keys.ToArray();
	}

	public void OnGet()
	{
	}
}
