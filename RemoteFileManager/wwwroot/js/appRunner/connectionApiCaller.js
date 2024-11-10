export class ConnectionApiCaller {
    /**
     * @constructor
     * @param {SignalrConnection} connection
     */
    constructor(connection) {
        this.connection = connection
    }

    /**
     * @param {string} appName
     * @returns { Promise<boolean> }
     */
    startApp(appName) {
        return this.connection.invoke('StartApp', appName)
    }

    /**
     * @param {string} appName
     * @returns { Promise<boolean> }
     */
    restartApp(appName) {
        return this.connection.invoke('RestartApp', appName)
    }

    /**
     * @param {string} appName
     * @returns { Promise<boolean> }
     */
    stopApp(appName) {
        return this.connection.invoke('StopApp', appName)
    }

    /**
     * @param {string} appName
     * @returns {Promise<{ state: 'Stopped' | 'Running', logs: string[] }>}
     */
    getAppStateAndLogs(appName) {
        return this.connection.invoke('GetAppStateAndLogs', appName)
    }

    /**
     * @param {string} appName
     * @returns { Promise<boolean> }
     */
    joinAppGroup(appName) {
        return this.connection.invoke('JoinAppGroup', appName)
    }
}
