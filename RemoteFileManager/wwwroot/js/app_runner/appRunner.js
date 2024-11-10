import { SignalrConnection } from "../signalrConnection.js";
import { ConnectionApiCaller } from './connectionApiCaller.js'
import { setAppState } from './appState.js'
import {
    appendAppLog,
    clearAppLogs,
    showLogsForApp,
    setAppLogs
} from './appLogs.js'
import {
    getConnectionStateElement,
    getReconnectButtonElement,
    getSelectedAppName,
} from './domElements.js'


const connection = new SignalrConnection('/app-runner')
const api = new ConnectionApiCaller(connection)

addEventListeners(connection)


/**
 * @param {string} state
 * @param {string} color
 */
function showConnectionState(state, color = '') {
    const element = getConnectionStateElement()
    element.textContent = state
    element.style.color = color
}

/** @param {boolean} value */
function showReconnectButton(value) {
    getReconnectButtonElement().hidden = !value
}


// Connect
export async function connectAppRunner() {
    await connection.stop()
    showConnectionState('connecting...')
    showReconnectButton(false)

    return await connection.start()
        .then(() => {
            onConnected()
            console.log('Successfully connected to server.')
        })
        .catch(e => {
            showConnectionState('connection lost', 'var(--red)')
            showReconnectButton(true)

            console.log('Connection to server failed with error: ')
            console.log(e)
        })
}

function addEventListeners(connection) {
    connection.onreconnecting(() => {
        showConnectionState('reconnecting...', 'var(--orange)')
        showReconnectButton(true)

        console.log('Connection lost. Reconnecting...')
    })

    connection.onreconnected(() => {
        onConnected()
        console.log('Successfully reconnected.')
    })

    connection.onclose(() => {
        showConnectionState('connection lost', 'var(--red)')
        showReconnectButton(true)

        console.log('Connection closed.')
    })

    connection.on('AppLog', appendAppLog)
    connection.on('AppLogsCleared', clearAppLogs)
    connection.on('AppStateChanged', setAppState)
}

async function onConnected() {
    showConnectionState('')
    showReconnectButton(false)

    const appName = getSelectedAppName()
    if (appName) {
        await api.joinAppGroup(appName)
        getAppStateAndLogs(appName)
    }
}

/** @param {string} appName */
function getAppStateAndLogs(appName) {
    if (!appName) return

    api.getAppStateAndLogs(appName)
        .then(({ state, logs }) => {
            setAppState(state)
            setAppLogs(logs)
        })
        .catch(e => console.error(e))
}


function logMessage(message) {
    console.log(message)
    //const logs = document.getElementById('logs');
    //const timestamp = new Date().toLocaleTimeString();
    //logs.textContent += `[${timestamp}] ${message}\n`;
    //logs.scrollTop = logs.scrollHeight;
}


export function startApp() {
    const appName = getSelectedAppName()
    if (!appName) return

    console.log(`Requesting start of '${appName}'`)
    api.startApp(appName)
}

export function restartApp() {
    const appName = getSelectedAppName()
    if (!appName) return

    console.log(`Requesting restart of '${appName}'`)
    api.restartApp(appName)
}

export function stopApp() {
    const appName = getSelectedAppName()
    if (!appName) return

    console.log(`Requesting stop of '${appName}'`)
    api.stopApp(appName)
}

export async function appSelectOnChange(appName) {
    if (!appName) return

    await api.joinAppGroup(appName)
    getAppStateAndLogs(appName)
    showLogsForApp(appName)
}
