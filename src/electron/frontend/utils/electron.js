import { updateURLParams } from "./url.js";

var userAgent = navigator.userAgent.toLowerCase();
export const isElectron = userAgent.indexOf(" electron/") > -1;

export let port = 4242;
export let SERVER_FILE_PATH = "";
export const electron = globalThis.electron ?? {}; // ipcRenderer, remote, shell, etc.
export let fs = null;
export let os = null;
export let remote = {};
export let app = null;
export let path = null;
export let log = null;
export let crypto = null;

// Used in tests
try {
    crypto = require("crypto");
} catch {}

if (isElectron) {
    try {
        fs = require("fs-extra"); // File System
        os = require("os");
        crypto = require("crypto");
        remote = require("@electron/remote");
        app = remote.app;

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

        port = electron.ipcRenderer.sendSync("get-port");
        console.log("User OS:", os.type(), os.platform(), "version:", os.release());

        SERVER_FILE_PATH = electron.ipcRenderer.sendSync("get-server-file-path");

        path = require("path");
    } catch (error) {
        console.error("Electron API access failed —", error);
    }
} else console.warn("Electron API is blocked for web builds");
