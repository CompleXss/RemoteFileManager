import { ConnectionApiCaller } from './connectionApiCaller.js'
import { SignalrConnection } from "../common/signalrConnection.js";
import { setAppState } from './appState.js'
import {
    appendAppLog,
    clearAppLogs,
    showLogsForApp,
    setAppLogs
} from './appLogs.js'
import { getSelectedAppName } from './domElements.js'


const connection = new SignalrConnection('/app-runner', onConnected)
const api = new ConnectionApiCaller(connection)

addEventListeners(connection)


// Connect
export async function connectAppRunner() {
    return await connection.start()
}

function addEventListeners(connection) {
    connection.on('AppLog', appendAppLog)
    connection.on('AppLogsCleared', clearAppLogs)
    connection.on('AppStateChanged', setAppState)
}

async function onConnected() {
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
