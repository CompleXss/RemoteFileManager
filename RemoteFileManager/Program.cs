using RemoteFileManager.Hubs;
using RemoteFileManager.Options;
using RemoteFileManager.Services;
using RemoteFileManager.Services.AppRunner;
using RemoteFileManager.Services.FileManager;

var builder = WebApplication.CreateSlimBuilder(args);

builder.Services.AddHttpClient();
builder.Services.AddRazorPages();
builder.Services.AddSignalR();

builder.Services.AddSingleton<IAppLogService, AppLogService>();
builder.Services.AddSingleton<IProcessRunnerService, ProcessRunnerService>();
builder.Services.AddSingleton<DirectoryService>();
builder.Services.AddSingleton<DownloadService>();
builder.Services
	.AddOptions<FileManagerOptions>()
	.Bind(builder.Configuration.GetSection(FileManagerOptions.SECTION_KEY))
	.ValidateOnStart();
builder.Services
	.AddOptions<AppRunnerOptions>()
	.Bind(builder.Configuration.GetSection(AppRunnerOptions.SECTION_KEY))
	.ValidateOnStart();

const string logFilePathConfigurationPath = $"{FileManagerOptions.SECTION_KEY}:{nameof(FileManagerOptions.FilesChangesLogFile)}";
var logFilePath = builder.Configuration.GetValue<string>(logFilePathConfigurationPath);
builder.Logging.Services.AddSingleton(_ => new FileLogger(logFilePath));


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
	app.UseDeveloperExceptionPage();
}
else
{
	app.UseExceptionHandler("/error");
}


// redirect from root
app.Use(async (context, next) =>
{
	if (context.Request.Path == "/")
	{
		context.Response.Redirect("/apps");
		return;
	}

	await next();
});

// handle 404
app.Use(async (context, next) =>
{
	await next();
	if (context.Response.StatusCode == StatusCodes.Status404NotFound)
	{
		context.Request.Path = "/NotFound";
		await next();
	}
});

app.UseStaticFiles();
app.UseRouting();

app.MapHub<AppRunnerHub>("/app-runner");
app.MapHub<FileManagerHub>("/file-manager");
app.MapRazorPages();

app.Run();
