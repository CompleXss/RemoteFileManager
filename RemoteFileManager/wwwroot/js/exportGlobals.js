import { toggleTheme } from "./site.js";
import { exportGlobals_AppRunner } from "./appRunner/exportGlobals.js";
import { exportGlobals_FileManager } from "./fileManager/exportGlobals.js";

window.toggleTheme = toggleTheme
window.reconnect = () => {} // is overwritten in cshtml

exportGlobals_AppRunner()
exportGlobals_FileManager()
