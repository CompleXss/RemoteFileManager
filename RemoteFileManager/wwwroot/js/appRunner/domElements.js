// Get DOM elements
export function getConnectionStateElement() { return getElementById('connection_state') }
export function getReconnectButtonElement() { return getElementById('reconnect_button') }
export function getLogContainerElementForApp(appName) { return getElementById(`${appName}_logs`) }
export function getAllLogContainerElements() { return document.getElementsByClassName('logs_container') }
export function getSelectedAppName() { return getElementById('app_select').value }
export function getStatusTextElement() { return getElementById('status_text') }
export function getStatusIndicatorElement() { return getElementById('status_indicator') }
export function getLogsAnchorForApp(logContainer) { return logContainer.querySelector('.anchor') }



/**
 * Attempts to get an element by id.
 * If element does not exist, throws an error.
 * @param {string} elementId
 * @returns {HTMLElement}
 */
function getElementById(elementId) {
    const element = document.getElementById(elementId)

    if (!element) {
        throw new Error(`Could not find element with id '${elementId}'`)
    }

    return element
}
