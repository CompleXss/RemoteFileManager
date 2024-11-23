/**
 * Attempts to get an element by id.
 * If element does not exist, throws an error.
 * @param {string} elementId
 * @returns {HTMLElement}
 */
export function getElementById(elementId) {
    const element = document.getElementById(elementId)

    if (!element) {
        throw new Error(`Could not find element with id '${elementId}'`)
    }

    return element
}

export function getReconnectButtonElement() { return getElementById('reconnect_button') }
export function getConnectionStateElement() { return getElementById('connection_state') }
