import { getStatusTextElement, getStatusIndicatorElement } from './domElements.js'

/** @param {'Stopped' | 'Running' | undefined} state */
export function setAppState(state) {
    const text = state ?? 'unknown'
    const color = !state ? 'white' :
        state === 'Running'
            ? 'green'
            : 'red'

    getStatusTextElement().textContent = text;
    getStatusIndicatorElement().style.backgroundColor = color;
}
