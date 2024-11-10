export class SignalrConnection {
    /**
     * signalR HubConnection
     * @internal
     * */
    connection

    /**
     * @constructor
     * @param {string} url signalR hub connection URL
     */
    constructor(url) {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(url)
            .withAutomaticReconnect([0, 2000, 2000, 2000, 2000])
            .configureLogging(signalR.LogLevel.None)
            .build()
    }

    async start() {
        return await this.connection.start()
    }

    async stop() {
        return await this.connection.stop()
    }

    on(eventName, callback) {
        return this.connection.on(eventName, callback)
    }

    onreconnecting(callback) {
        return this.connection.onreconnecting(callback)
    }

    onreconnected(callback) {
        return this.connection.onreconnected(callback)
    }

    onclose(callback) {
        return this.connection.onclose(callback)
    }

    /**
     * @param {string} method
     * @param {...object} args
     * */
    invoke(method, ...args) {
        return this.connection.invoke(method, ...args)
    }
}
