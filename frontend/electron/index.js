import { isElectron } from "./check.js";

let electronExports = {}
if (isElectron) {
    try {
        electronExports.guide = require("./dist/nwb-guide.js"), // Target the Vite build output
        electronExports.ipcRenderer = require("./frontend/electron/ipcRenderer.js"), // Add (mostly top-level) ipc commands
        electronExports.shell = require("./frontend/electron/shell-commands.js") // Add shell commands

    } catch (e) {
        console.error('Electron functionality failed —', e)
    }
} else console.warn('Electron functionality disabled for web build')

export default electronExports