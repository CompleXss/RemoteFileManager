import {
    connectAppRunner,
    startApp,
    restartApp,
    stopApp,
    appSelectOnChange,
} from './appRunner.js'

export function exportGlobals_AppRunner() {
    window.connectAppRunner = connectAppRunner
    window.startApp = startApp
    window.restartApp = restartApp
    window.stopApp = stopApp
    window.appSelectOnChange = appSelectOnChange
}
