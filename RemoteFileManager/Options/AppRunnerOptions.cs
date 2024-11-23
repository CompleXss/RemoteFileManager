namespace RemoteFileManager.Options;

public class AppRunnerOptions
{
	public const string SECTION_KEY = "AppRunner";

	public Dictionary<string, string> AppPaths { get; set; } = [];
	public int MaxLogsCountPerApp { get; set; } = 256;
}
