using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using RemoteFileManager.Hubs;
using RemoteFileManager.Options;

namespace RemoteFileManager.Services.AppRunner;

public interface IAppLogService
{
	string[] GetLogs(string appName);
	void ClearLogs(string appName);
	bool Log(string appName, string message);
}

public class AppLogService : IAppLogService
{
	private readonly IHubContext<AppRunnerHub, IAppRunnerHub> hub;
	private readonly Dictionary<string, Queue<string>> appLogs;
	private readonly int maxLogsCount;

	public AppLogService(IHubContext<AppRunnerHub, IAppRunnerHub> hub, IOptions<AppRunnerOptions> options)
	{
		var appPaths = options.Value.AppPaths;

		this.hub = hub;
		this.appLogs = new(appPaths.Count);
		this.maxLogsCount = options.Value.MaxLogsCountPerApp;

		foreach (var appName in appPaths.Keys)
		{
			appLogs.Add(appName, new(maxLogsCount));
		}
	}

	public string[] GetLogs(string appName)
	{
		if (!appLogs.TryGetValue(appName, out var logs))
			return [];

		return logs.ToArray();
	}

	public void ClearLogs(string appName)
	{
		if (!appLogs.TryGetValue(appName, out var logs))
			return;

		logs.Clear();
		_ = this.hub.Clients.Group(appName).AppLogsCleared();
	}

	public bool Log(string appName, string message)
	{
		if (!appLogs.TryGetValue(appName, out var logs))
			return false;

		AddMessageToLogsQueue(logs, message);
		_ = this.hub.Clients.Group(appName).AppLog(message);

		return true;
	}

	private void AddMessageToLogsQueue(Queue<string> queue, string message)
	{
		if (queue.Count >= maxLogsCount)
			queue.Dequeue();

		queue.Enqueue(message);
	}
}
