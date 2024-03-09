using RemoteFileManager.Configuration;
using RemoteFileManager.Hubs;
using RemoteFileManager.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorPages();
builder.Services.AddHttpClient();
builder.Services.AddSignalR();

builder.Services.Configure<DirectoryOptions>(builder.Configuration.GetSection(DirectoryOptions.SECTION_NAME));
builder.Services.AddSingleton<DirectoryService>();
builder.Services.AddSingleton<DownloadService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
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

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();
//app.UseAuthorization();

app.MapHub<AppHub>("/hub");
app.MapRazorPages();

app.Run();