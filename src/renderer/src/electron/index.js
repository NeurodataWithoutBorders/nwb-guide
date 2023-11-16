import { updateURLParams } from "../../utils/url.js";
import isElectron from "./check.js";

export { isElectron };

export let port = 4242;
export let electron = {}; // ipcRenderer, remote, shell, etc.
export let fs = null;
export let os = null;
export let remote = {};
export let app = null;
export let path = null;
export let log = null;
export let crypto = null;

if (isElectron) {
    try {
        electron = require("electron");
        fs = require("fs-extra"); // File System
        os = require("node:os");

        // remote = require("@electron/remote");
        // app = remote.app;
        crypto = require("node:crypto");
        // NOTE: Must reintegrate...
        electron.ipcRenderer.on("nwb-guide:fileOpened", (info, filepath) => {
            updateURLParams({ file: filepath });
            const dashboard = document.querySelector("nwb-dashboard");
            const activePage = dashboard.getAttribute("activePage");
            if (activePage === "preview") dashboard.requestUpdate();
            else dashboard.setAttribute("activePage", "preview");
        });

        const pythonUrl = new URL(commoners.services.flask.url)

        port = pythonUrl.port
        console.log("User OS:", os.type(), os.platform(), "version:", os.release());

        path = require("node:path");
    } catch (e) {
        console.error("Electron API access failed —", e);
    }
} else console.warn("Electron API is blocked for web builds");
