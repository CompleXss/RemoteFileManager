import { getElementById } from "../common/domElements.js";

export function getLogContainerElementForApp(appName) { return getElementById(`${appName}_logs`) }
export function getAllLogContainerElements() { return document.getElementsByClassName('logs_container') }
export function getSelectedAppName() { return getElementById('app_select').value }
export function getStatusTextElement() { return getElementById('status_text') }
export function getStatusIndicatorElement() { return getElementById('status_indicator') }
export function getLogsAnchorForApp(logContainer) { return logContainer.querySelector('.anchor') }
