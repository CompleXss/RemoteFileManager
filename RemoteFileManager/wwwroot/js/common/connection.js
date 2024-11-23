import {
    getReconnectButtonElement,
    getConnectionStateElement
} from "./domElements.js";

/**
 * @readonly
 * @enum {{ text: string, textColor: string, showReconnectButton: boolean }}
 */
export const ConnectionStates = Object.freeze({
    CONNECTED: {
        text: '',
        textColor: '',
        showReconnectButton: false
    },
    CONNECTING: {
        text: 'connecting...',
        textColor: '',
        showReconnectButton: false
    },
    RECONNECTING: {
        text: 'reconnecting...',
        textColor: 'var(--orange)',
        showReconnectButton: true
    },
    CONNECTION_LOST: {
        text: 'connection lost',
        textColor: 'var(--red)',
        showReconnectButton: true
    },
})

/** @param {{ text: string, textColor: string, showReconnectButton: boolean }} state */
export function showConnectionState(state) {
    const element = getConnectionStateElement()
    element.textContent = state.text
    element.style.color = state.textColor

    getReconnectButtonElement().hidden = !state.showReconnectButton
}
