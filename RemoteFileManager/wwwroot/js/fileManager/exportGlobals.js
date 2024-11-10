import {
    connectFileManager,
    clearCompletedDownloads,
    deleteFile,
    editDirectoryOnChange,
    getActiveDownloads,
    reloadDownloadDirectories,
    reloadFileManager,
    startDownload
} from './fileManager.js'

export function exportGlobals_FileManager() {
    window.connectFileManager = connectFileManager
    window.clearCompletedDownloads = clearCompletedDownloads
    window.deleteFile = deleteFile
    window.editDirectoryOnChange = editDirectoryOnChange
    window.getActiveDownloads = getActiveDownloads
    window.reloadDownloadDirectories = reloadDownloadDirectories
    window.reloadFileManager = reloadFileManager
    window.startDownload = startDownload
}
