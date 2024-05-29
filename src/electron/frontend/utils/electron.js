import { updateURLParams } from "./url.js";

const userAgent = navigator.userAgent.toLowerCase();
export const isElectron = userAgent.indexOf(" electron/") > -1;

export const electron = globalThis.electron ?? {}; // ipcRenderer, remote, shell, etc.

// Node Modules
export const fs = require("fs-extra"); // File System
export const os = require("os");
export const crypto = require("crypto");
export const path = require("path");

// Remote Electron Modules
export const remote = isElectron ? require("@electron/remote") : {}
export const app = remote.app;

// Electron Information
export const port = electron.ipcRenderer ? electron.ipcRenderer.sendSync("get-port") : 4242
export const SERVER_FILE_PATH = electron.ipcRenderer ? electron.ipcRenderer.sendSync("get-server-file-path") : ""


// Link the renderer to the main process
if (isElectron) {

    electron.ipcRenderer.on("fileOpened", (info, filepath) => {
        updateURLParams({ file: filepath });
        const dashboard = document.querySelector("nwb-dashboard");
        const activePage = dashboard.getAttribute("activePage");
        if (activePage === "preview") dashboard.requestUpdate();
        else dashboard.setAttribute("activePage", "preview");
    });

    ["log", "warn", "error"].forEach((method) =>
        electron.ipcRenderer.on(`console.${method}`, (_, ...args) => console[method](`[main-process]:`, ...args))
    );

    console.log("User OS:", os.type(), os.platform(), "version:", os.release());

}