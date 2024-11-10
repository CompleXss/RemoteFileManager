using System.ComponentModel.DataAnnotations;

namespace RemoteFileManager.Options;

public class AppRunnerOptions
{
	public const string SECTION_KEY = "AppRunner";

	[Required]
	public Dictionary<string, string> AppPaths { get; set; } = [];

	[Required]
	public int MaxLogsCountPerApp { get; set; } = 128;
}
