const isElectron = require("./check.js").isElectron;

let electronExports = {}
if (isElectron) {
    try {
        // Import App Scripts
        // require("./dist/index.js"), // Target the build output
        require("../../assets/imports"); // Imports html files into app
        require("../../assets/normalize-shortcuts"); // For normalizing shortcuts across OS

        // Import Electron API
        const electron = electronExports.electron = require("electron")  // ipcRenderer, remote, shell, etc.
        electronExports.fs = require("fs-extra")  // File System
        const os = electronExports.os = require("os");

        const log = require("electron-log");

        const remote = require("@electron/remote");
        const app = remote.app;

        // get port number from the main process
        log.info("Requesting the port");
        const port = electron.ipcRenderer.sendSync("get-port");
        log.info("Port is: " + port);

        //log user's OS version //
        log.info("User OS:", os.type(), os.platform(), "version:", os.release());
        console.log("User OS:", os.type(), os.platform(), "version:", os.release());

        // Check current app version //
        const appVersion = app.getVersion();
        log.info("Current SODA version:", appVersion);
        console.log("Current SODA version:", appVersion);

        electronExports.app = app;
        electronExports.port = port;
        electronExports.log = log;
        electronExports.path = require("path");
        electronExports.https = require("https");

        electronExports.imageDataURI = require("image-data-uri");

        const { JSONStorage } = require("node-localstorage");
        electronExports.JSONStorage = JSONStorage

    } catch (e) {
        console.error('Electron API access failed —', e)
    }
} else console.warn('Electron API is blocked for web builds')

exports.default = electronExports