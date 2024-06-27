import {
    connect,
    clearCompletedDownloads,
    deleteFile,
    editDirectoryOnChange,
    getActiveDownloads,
    reloadDownloadDirectories,
    reloadFileManager,
    startDownload
} from './site.js'


window.connect = connect
window.clearCompletedDownloads = clearCompletedDownloads
window.deleteFile = deleteFile
window.editDirectoryOnChange = editDirectoryOnChange
window.getActiveDownloads = getActiveDownloads
window.reloadDownloadDirectories = reloadDownloadDirectories
window.reloadFileManager = reloadFileManager
window.startDownload = startDownload
