import { updateURLParams } from "../globals.js";
import isElectron from "./check.js";

export { isElectron };

export let port = 4242;
export let electron = {};
export let fs = null;
export let os = null;
export let remote = {};
export let app = null;
export let path = null;
export let log = null;

if (isElectron) {
    try {
        // Import Electron API
        electron = require("electron"); // ipcRenderer, remote, shell, etc.
        fs = require("fs-extra"); // File System
        os = require("os");

        remote = require("@electron/remote");
        app = remote.app;

        electron.ipcRenderer.on("fileOpened", (info, filepath) => {
            if (filepath === ".") return; // BUG: Windows throws . when the application is opened (at least dev mode)...
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

        path = require("path");
    } catch (e) {
        console.error("Electron API access failed —", e);
    }
} else console.warn("Electron API is blocked for web builds");
