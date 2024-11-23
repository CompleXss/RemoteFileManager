import { ConnectionStates, showConnectionState } from "./connection.js";

export class SignalrConnection {
    /**
     * signalR HubConnection
     * @internal
     * */
    connection

    /**
     * @internal
     * @type {string}
     * */
    url

    /**
     * @internal
     * @type {() => {}}
     * */
    onConnected

    /**
     * @constructor
     * @param {string} url signalR hub connection URL
     * @param {() => {}} onConnected on connected callback
     */
    constructor(url, onConnected) {
        this.url = url
        this.onConnected = onConnected
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(url)
            .withAutomaticReconnect([0, 2000, 2000, 2000, 2000])
            .configureLogging(signalR.LogLevel.None)
            .build()

        this.connection.onreconnecting(() => {
            showConnectionState(ConnectionStates.RECONNECTING)
            console.log('Connection lost. Reconnecting...')
        })

        this.connection.onreconnected(() => {
            onConnected()
            showConnectionState(ConnectionStates.CONNECTED)
            console.log('Successfully reconnected.')
        })

        this.connection.onclose(() => {
            showConnectionState(ConnectionStates.CONNECTION_LOST)
            console.log('Connection closed.')
        })
    }

    async start() {
        showConnectionState(ConnectionStates.CONNECTING)
        await this.connection.stop()

        return await this.connection.start()
            .then(() => {
                this.onConnected()
                showConnectionState(ConnectionStates.CONNECTED)
                console.log('Successfully connected to server.')
            })
            .catch(e => {
                showConnectionState(ConnectionStates.CONNECTION_LOST)
                console.log('Connection to server failed with error: ')
                console.log(e)
            })
    }

    async stop() {
        return await this.connection.stop()
    }

    on(eventName, callback) {
        return this.connection.on(eventName, callback)
    }

    /**
     * @param {string} method
     * @param {...object} args
     * */
    invoke(method, ...args) {
        return this.connection.invoke(method, ...args)
    }
}
