using RemoteFileManager.Configuration;
using RemoteFileManager.Hubs;
using RemoteFileManager.Services;

var builder = WebApplication.CreateSlimBuilder(args);
builder.WebHost.UseKestrelHttpsConfiguration();

builder.Services.AddRazorPages();
builder.Services.AddHttpClient();
builder.Services.AddSignalR();

builder.Services.AddSingleton<DirectoryService>();
builder.Services.AddSingleton<DownloadService>();
builder.Services
	.AddOptions<DirectoryOptions>()
	.Bind(builder.Configuration.GetSection(DirectoryOptions.SECTION_KEY))
	.ValidateDataAnnotations()
	.ValidateOnStart();

string logFilePathConfigurationPath = $"{DirectoryOptions.SECTION_KEY}:{nameof(DirectoryOptions.FilesChangesLogFile)}";
string? logFilePath = builder.Configuration.GetValue<string>(logFilePathConfigurationPath);
builder.Logging.Services.AddSingleton(x => new FileLogger(logFilePath));



var app = builder.Build();

if (app.Environment.IsDevelopment())
{
	app.UseDeveloperExceptionPage();
}
else
{
	app.UseExceptionHandler("/error");
	// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
	app.UseHsts();
}

// Handle 404
app.Use(async (context, next) =>
{
	await next();
	if (context.Response.StatusCode == StatusCodes.Status404NotFound)
	{
		context.Request.Path = "/NotFound";
		await next();
	}
});

//app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.MapHub<AppHub>("/hub");
app.MapRazorPages();

app.Run();
