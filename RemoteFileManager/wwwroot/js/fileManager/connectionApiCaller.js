export class ConnectionApiCaller {
    /**
     * @constructor
     * @param {SignalrConnection} connection
     */
    constructor(connection) {
        this.connection = connection
    }

    startDownloadRequest(downloadLink, directoryName, fileName) {
        return this.connection.invoke('StartDownload', downloadLink, directoryName, fileName)
    }
    restartDownloadRequest(downloadId) {
        return this.connection.invoke('RestartDownload', downloadId)
    }
    cancelDownloadRequest(id) {
        return this.connection.invoke('CancelDownload', id)
    }
    pauseDownloadRequest(id) {
        return this.connection.invoke('PauseDownload', id)
    }
    resumeDownloadRequest(id) {
        return this.connection.invoke('ResumeDownload', id)
    }
    deleteFileRequest(directoryName, fileName) {
        return this.connection.invoke('DeleteFile', directoryName, fileName)
    }
    getDownloadAllowedDirectoryNamesRequest() {
        return this.connection.invoke('GetDownloadAllowedDirectoryNames')
    }
    getAllowedDirectoryInfosRequest() {
        return this.connection.invoke('GetAllowedDirectoryInfos')
    }
    getActiveDownloadsRequest() {
        return this.connection.invoke('GetActiveDownloads')
    }
}
