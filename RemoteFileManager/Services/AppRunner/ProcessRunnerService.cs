using System.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using RemoteFileManager.Extensions;
using RemoteFileManager.Hubs;
using RemoteFileManager.Models.AppRunner;
using RemoteFileManager.Options;

namespace RemoteFileManager.Services.AppRunner;

public interface IProcessRunnerService
{
	App.States? GetAppState(string appName);
	bool StartProcess(string appName);
	Task<bool> RestartProcess(string appName);
	Task<bool> StopProcess(string appName);
}

public sealed class ProcessRunnerService : IProcessRunnerService, IDisposable
{
	private readonly IAppLogService logService;
	private readonly ILogger<ProcessRunnerService> logger;
	private readonly Dictionary<string, App> apps;

	public ProcessRunnerService(
		IHubContext<AppRunnerHub, IAppRunnerHub> hub,
		IAppLogService logService,
		IOptions<AppRunnerOptions> options,
		ILogger<ProcessRunnerService> logger)
	{
		//Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

		this.logService = logService;
		this.logger = logger;

		var appNames = options.Value.AppPaths.Keys;
		apps = new(appNames.Count);

		foreach (var appName in appNames)
		{
			var process = new Process();
			var filePath = options.Value.AppPaths[appName];

			process.StartInfo.FileName = filePath;
			process.StartInfo.WorkingDirectory = Path.GetDirectoryName(filePath);
			process.StartInfo.CreateNoWindow = false;
			process.StartInfo.RedirectStandardOutput = true;
			process.StartInfo.RedirectStandardError = true;
			//process.StartInfo.StandardOutputEncoding = Encoding.GetEncoding(CultureInfo.CurrentCulture.TextInfo.OEMCodePage);
			process.OutputDataReceived += (sender, args) => LogAppMessage(appName, args.Data);
			process.ErrorDataReceived += (sender, args) => LogAppMessage(appName, args.Data);

			var app = new App(process);
			app.StateChanged += state => hub.Clients.Group(appName).AppStateChanged(state);

			apps[appName] = app;
		}
	}

	public App.States? GetAppState(string appName)
	{
		apps.TryGetValue(appName, out var app);
		return app?.State;
	}

	public bool StartProcess(string appName)
	{
		if (!apps.TryGetValue(appName, out var app))
			return false;

		var process = app.Process;

		try
		{
			process.Refresh();

			if (!process.HasExited)
				return true;
		}
		catch { }

		logService.ClearLogs(appName);

		try
		{
			bool started = process.Start();

			if (started)
			{
				try
				{
					process.BeginOutputReadLine();
					process.BeginErrorReadLine();
				}
				catch { }

				logger.AppStarted(appName);
			}
			else
				logger.CouldNotStartApp(appName);

			app.State = started ? App.States.Running : App.States.Stopped;
			return started;
		}
		catch (Exception e)
		{
			logger.CouldNotStartApp(appName, e.Message);
			return false;
		}
	}

	public async Task<bool> RestartProcess(string appName)
	{
		await StopProcess(appName);
		return StartProcess(appName);
	}

	public async Task<bool> StopProcess(string appName)
	{
		if (!apps.TryGetValue(appName, out var app))
			return false;

		var process = app.Process;

		try
		{
			try
			{
				process.CancelOutputRead();
				process.CancelErrorRead();
			}
			catch { }

			process.Kill(true);
			await process.WaitForExitAsync();
			process.Close();

			app.State = App.States.Stopped;
			logger.AppStopped(appName);

			return true;
		}
		catch (Exception e)
		{
			logger.CouldNotStopApp(appName, e.Message);
			return false;
		}
	}

	private void LogAppMessage(string appName, string? message)
	{
		if (message is null)
			return;

		logService.Log(appName, message);
	}



	public void Dispose()
	{
		foreach (var app in apps.Values)
		{
			var process = app.Process;

			try
			{
				process.Kill(true);
				process.Close();
				process.Dispose();
			}
			catch { }
		}
	}
}
