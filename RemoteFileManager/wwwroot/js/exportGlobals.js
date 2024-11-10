import {toggleTheme} from "./site.js";
import {exportGlobals_AppRunner} from "./app_runner/exportGlobals.js";
import {exportGlobals_FileManager} from "./file_manager/exportGlobals.js";

window.toggleTheme = toggleTheme

exportGlobals_AppRunner()
exportGlobals_FileManager()
