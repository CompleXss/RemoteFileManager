# RemoteFileManager (WIP)
A web app that allows simple remote file management on the host machine such as:
- Downloading files from url
- Deleting files in a directory
- Seeing available and total disk space

App uses SignalR for realtime server-client communication. Multiple clients can use this app at the same time without any problems.

# Table of contents
* [Installation](#installation)
* [Configuration](#configuration)
* [Usage](#usage)

# Installation
* Make sure you have ``.NET 8 sdk`` installed
* Clone repo ``git clone https://github.com/CompleXss/RemoteFileManager.git``
* To build framework-dependent app (executable size is ~200 KB), run:
  + ``build.bat`` on Windows
  + ``build.sh`` on Linux
* To build framework-independent app (executable size is ~100 MB), run:
  + ``build_self_contained.bat`` on Windows
  + ``build_self_contained.sh`` on Linux

***

If you want to just run the app and not publish it:
1. ``cd RemoteFileManager`` (into the inner folder)
2. Run one of the following (or use your IDE instead):

```shell
# To run in debug mode
dotnet run

# To run in release mode
dotnet run -c Release
```

Also you can run ``dotnet publish`` with [options](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-publish#options) manually if you want to customize build behaviour.<br/>
After using build scripts or ``dotnet publish`` the app is ready to be used outside of this project folder.

# Configuration
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

### What these settings mean
1. ``Directories/AllowedDirectories`` - array of directories available to clients where:
```
"Name"           - directory name that will be shown to client
"Path"           - path to directory (client won't see it)
"CreateAllowed"  - allows client to download files into this directory
"EditAllowed"    - allows client to edit and delete files in this directory
```
2. ``Directories/FilesChangesLogFile`` (optional) - location of the log file with ``"file was created / file was deleted"`` contents
3. ``Urls`` - address and port for ``https`` and/or ``http`` protocols (``0.0.0.0`` means ``localhost`` but available for other computers in the same local network)
4. ``AllowedHosts`` - who can connect to the app. * (star) means everyone

### Note the following
* ``Directories`` section supports hot reload. You can change this section while app is running
* All ``AllowedDirectories`` are locked when app is running so you can't delete/change them. If you remove directory from ``AllowedDirectories`` (when app is working) it will be unlocked
* Paths may be either absolute or relative
* App is redirecting to ``https`` by default

# Usage
* Download: select directory, paste file link, specify file name (if you want to), hit ``Start download``
* Delete: select directory, select file, hit ``Delete``, confirm
* Disk space shows info for directory selected in block "Manage files"

![ui.png](images/ui.png)
