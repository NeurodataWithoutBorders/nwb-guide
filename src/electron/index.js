import isElectron from "./check.js";

export { isElectron };

export let port = 4242;
export let SERVER_FILE_PATH = "";
export let electron = {}; // ipcRenderer, remote, shell, etc.
export let fs = null;
export let os = null;
export let remote = {};
export let app = null;
export let path = null;
export let log = null;
export let crypto = null;

// Used in tests
try {
    crypto = require("node:crypto");
} catch {}

if (isElectron) {
    try {
        electron = require("electron");
        fs = require("fs-extra"); // File System
        os = require("node:os");
        console.log("User OS:", os.type(), os.platform(), "version:", os.release());

        path = require("node:path");

        const { url, filepath } = commoners.services.flask;

        port = new URL(url).port;

        SERVER_FILE_PATH = filepath;
    } catch (e) {
        console.error("Electron API access failed —", e);
    }
} else console.warn("Electron API is blocked for web builds");