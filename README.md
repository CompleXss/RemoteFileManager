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
        "Path": "./test/",
        "CreateAllowed": true,
        "EditAllowed": true
      }
    ],
    "FilesChangesLogFile": "./logs/files-changes.log"
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
"Path"           - path to directory (client won't see it), may be either absolute or relative
"CreateAllowed"  - allows client to download files into this directory
"EditAllowed"    - allows client to edit and delete files in this directory
```

Note that ``AllowedDirectories`` are constantly monitored for changes. If specified directory becomes unavailable (e.g. you delete it) program will try to recreate it. If this problem can't be fixed, an error is logged and you should resave ``appsetting.json`` file or reload the whole program.<br/>Be aware of this behaviour!

In ``Directories/FilesChangesLogFile`` you can specify location of the log file with ``"file was created / file was deleted"`` contents

In ``Urls`` you can specify address and port for ``https`` and/or ``http`` protocols (``0.0.0.0`` means ``localhost`` but available for other computers in the same local network)

Note that app is redirecting to ``https`` by default
