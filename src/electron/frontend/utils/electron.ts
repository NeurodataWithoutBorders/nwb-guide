import { registerUpdate, registerUpdateProgress } from "./auto-update";
import { updateURLParams } from "./url";

export const isTestEnvironment = globalThis?.process?.env?.VITEST;

const userAgent = navigator.userAgent.toLowerCase();
export const isElectron = userAgent.indexOf(" electron/") > -1;

const hasNodeAccess = isElectron || isTestEnvironment;

export const electron = globalThis.electron ?? {}; // ipcRenderer, remote, shell, etc.

// Node Modules
export const fs = hasNodeAccess && require("fs-extra"); // File System
export const os = hasNodeAccess && require("os");
export const crypto = hasNodeAccess && require("crypto");
export const path = hasNodeAccess && require("path");

// Remote Electron Modules
export const remote = isElectron ? require("@electron/remote") : {};
export const app = remote.app;

// Electron Information
export const port = isElectron ? electron.ipcRenderer.sendSync("get-port") : 4242;
export const SERVER_FILE_PATH = isElectron ? electron.ipcRenderer.sendSync("get-server-file-path") : "";

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

    // Update Handling
    electron.ipcRenderer.on(`checking-for-update`, (_, ...args) => console.log(`[Update]:`, ...args));

    electron.ipcRenderer.on(`update-available`, (_, info) => (info ? registerUpdate(info) : ""));

    electron.ipcRenderer.on(`update-progress`, (_, info) => registerUpdateProgress(info));
    electron.ipcRenderer.on(`update-complete`, (_, ...args) => console.log(`[Update]:`, ...args));

    electron.ipcRenderer.on(`update-error`, (_, ...args) => console.log(`[Update]:`, ...args));
}
