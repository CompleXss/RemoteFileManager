# RemoteFileManager
A web app that allows simple remote file management such as:
- Downloading files from url
- Deleting files in a directory
- Seeing available and total disk space

# Installation
1. Make sure you have ``.NET 8`` installed.
2. Clone repo ``git clone https://github.com/CompleXss/RemoteFileManager.git``
3. ``cd RemoteFileManager`` (into the inner folder)
4. Run one of the following:

```shell
# To run in debug mode
dotnet run

# To run in release mode
dotnet run -c Release

# To publish (production mode)
dotnet publish
```

Note that you can run ``dotnet publish`` with [options](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-publish#options)

For example:
```shell
dotnet publish -p:PublishSingleFile=true --self-contained=false -o my/folder

# Where:
# -p:PublishSingleFile=true  - builds into single file
# --self-contained=false     - makes an app dependent on .NET runtime (executable size is ~200 KB)
# --self-contained=true      - bundles .NET runtime into an executable (size is ~100 MB)
# -o my/folder               - specifies output folder
```

After ``publish`` the app is ready to be used outside of this project folder

# Configuring
To configure app, edit ``appsettings.json`` which looks like this:
```json
{
  "Directories": {
    "AllowedDirectories": [
      {
        "Name": "Test directory",
        "Path": "C:/test/",
        "CreateAllowed": true,
        "EditAllowed": true
      }
    ]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Urls": "https://0.0.0.0:7007;http://0.0.0.0:7006",
  "AllowedHosts": "*"
}

```

In ``Directories/AllowedDirectories`` you can specify array of directories available to clients
```
"Name"           - directory name that will be shown to client
"Path"           - path to directory (client won't see it)
"CreateAllowed"  - allows clients to download files into this directory
"EditAllowed"    - allows clients to delete files from this directory
```

In ``Urls`` you can specify adress and port for ``https`` and ``http`` protocols (``0.0.0.0`` means ``localhost`` but available for other computers in the same local network)
