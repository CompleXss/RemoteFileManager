using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using RemoteFileManager.Models;
using RemoteFileManager.Models.AppRunner;
using RemoteFileManager.Options;
using RemoteFileManager.Services;
using RemoteFileManager.Services.AppRunner;

namespace RemoteFileManager.Hubs;

public interface IAppRunnerHub
{
	Task AppLog(string message);
	Task AppLogsCleared();
	Task AppStateChanged(App.States state);
}

public class AppRunnerHub : Hub<IAppRunnerHub>
{
	private readonly IProcessRunnerService processRunner;
	private readonly IAppLogService logService;
	private readonly string[] availableAppNames;

	public AppRunnerHub(IProcessRunnerService processRunner, IAppLogService logService, IOptions<AppRunnerOptions> options)
	{
		this.processRunner = processRunner;
		this.logService = logService;
		this.availableAppNames = options.Value.AppPaths.Keys.ToArray();
	}


	public bool StartApp(string appName)
	{
		if (!availableAppNames.Contains(appName))
			return false;

		return processRunner.StartProcess(appName);
	}

	public async Task<bool> RestartApp(string appName)
	{
		if (!availableAppNames.Contains(appName))
			return false;

		return await processRunner.RestartProcess(appName);
	}

	public async Task<bool> StopApp(string appName)
	{
		if (!availableAppNames.Contains(appName))
			return false;

		return await processRunner.StopProcess(appName);
	}

	public AppStateDto GetAppStateAndLogs(string appName)
	{
		var state = processRunner.GetAppState(appName);
		var logs = logService.GetLogs(appName);

		return new(state, logs);
	}

	public async Task<bool> JoinAppGroup(string appName)
	{
		await LeaveAllAppGroupsExcept(appName);

		if (availableAppNames.Contains(appName))
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, appName);
			return true;
		}

		return false;
	}


	private async Task LeaveAllAppGroupsExcept(string appName)
	{
		foreach (var groupToLeave in availableAppNames)
		{
			if (groupToLeave == appName)
				continue;

			try
			{
				await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupToLeave);
			}
			catch
			{
			}
		}
	}
}
