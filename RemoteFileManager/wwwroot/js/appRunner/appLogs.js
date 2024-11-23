import {
    getSelectedAppName,
    getLogContainerElementForApp,
    getAllLogContainerElements,
    getLogsAnchorForApp
} from './domElements.js'

const Convert = require('ansi-to-html');
const ansiConverter = new Convert();


/** @param {string} message */
export function appendAppLog(message) {
    const appName = getSelectedAppName()
    if (!appName) return

    const logContainer = getLogContainerElementForApp(appName)
    const anchor = getLogsAnchorForApp(logContainer)
    if (!logContainer || !anchor) return

    const overflowBeforeInsert = logContainer.scrollHeight > logContainer.offsetHeight
    logContainer.insertBefore(createLogElement(message), anchor)
    const overflowAfterInsert = logContainer.scrollHeight > logContainer.offsetHeight

    if (overflowAfterInsert && !overflowBeforeInsert) {
        logContainer.scrollTo(0, logContainer.scrollHeight)
    }
}

export function clearAppLogs() {
    const appName = getSelectedAppName()
    if (!appName) return

    const logContainer = getLogContainerElementForApp(appName)
    const anchor = getLogsAnchorForApp(logContainer)
    if (!logContainer || !anchor) return

    logContainer.replaceChildren(...[anchor])
}

/** @param {string[]} logs */
export function setAppLogs(logs) {
    const appName = getSelectedAppName()
    if (!appName) return

    const logContainer = getLogContainerElementForApp(appName)
    const anchor = getLogsAnchorForApp(logContainer)
    if (!logContainer || !anchor) return

    const logElements = logs.map(createLogElement)
    logContainer.replaceChildren(...logElements)
    logContainer.append(anchor)

    logContainer.scrollTo(0, logContainer.scrollHeight)
}

/** @param {string} appName */
export function showLogsForApp(appName) {
    const logContainer = getLogContainerElementForApp(appName)
    if (!logContainer) return

    const logContainers = getAllLogContainerElements()
    for (const container of logContainers) {
        container.classList.toggle('hidden', true)
    }

    logContainer.classList.toggle('hidden', false)
}



/** @param {string} message */
function createLogElement(message) {
    const element = document.createElement('div')
    element.className = 'log_line'
    element.innerHTML = ansiConverter.toHtml(message)

    return element
}
