import { updateURLParams } from "./src/renderer/utils/url";

import * as plugins from "./plugins";

const name = "nwb-guide";

const isSupported = {
    web: false,
    mobile: false,
};

export default {
    name: "NWB GUIDE",

    icon: "src/renderer/assets/img/logo-guide-draft.png",

    plugins: {
        ...plugins,

        // Avoid CORS for Dandiset creation
        allowDANDIRequests: {
            desktop: {
                load: ( win ) => {

                    win.webContents.session.webRequest.onBeforeSendHeaders(
                        (details, callback) => {
                            callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } })
                        }
                    );

                    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
                        callback({
                            responseHeaders: {
                                'Access-Control-Allow-Origin': ['*'],
                                ...details.responseHeaders,
                            },
                        });
                    });
                }
            }
        },

        // Support Electron dialog features
        dialog: {
            isSupported,
            desktop: {
                load: function () {
                    this.on(
                        `${name}:dialog`,
                        (event, type, ...args) => (event.returnValue = this.electron.dialog[type](...args))
                    );
                },
            },
            load: function () {
                return {
                    showOpenDialogSync: (...args) => this.sendSync(`${name}:dialog`, "showOpenDialogSync", ...args),
                };
            },
        },

        // Show a confirmation dialog when quitting the application
        customUnloadPopup: {
            isSupported,
            desktop: {
                unload: async function () {
                    const { response } = await this.electron.dialog.showMessageBox(
                        this.electron.BrowserWindow.getFocusedWindow(),
                        {
                            type: "question",
                            buttons: ["Yes", "No"],
                            title: "Confirm",
                            message: "Any running process will be stopped. Are you sure you want to quit?",
                        }
                    );

                    if (response !== 0) return false; // Skip quitting
                },
            },
        },

        // Allow for opening NWB files from the native file system
        openFile: {

            isSupported,

            load: function () {
                this.on(`${name}:fileOpened`, (info, filepath) => {
                    updateURLParams({ file: filepath });
                    const dashboard = document.querySelector("nwb-dashboard");
                    const activePage = dashboard.getAttribute("activePage");
                    if (activePage === "preview") dashboard.requestUpdate();
                    else dashboard.setAttribute("activePage", "preview");
                });
            },

            desktop: {
                preload: function () {
                    const fs = require("node:fs");
                    const path = require("node:path");

                    function isValidFile(filepath) {
                        return !fs.existsSync(filepath) && path.extname(filepath) === ".nwb";
                    }

                    const onFileOpened = (_, filepath) => {
                        this.open(); // Ensure the application is properly visible
                        this.send(`${name}:fileOpened`, filepath); // Safely send
                    };

                    if (process.platform === "win32" && process.argv.length >= 2) {
                        const openFilePath = process.argv[1];
                        if (isValidFile(openFilePath)) onFileOpened(null, openFilePath);
                    }

                    // NOTE: This event is triggered but the SEND function is not
                    // behaving as expected when the application is docked without a window (MacOS)
                    this.electron.app.on("open-file", onFileOpened);
                },
            },
        },
    },

    services: {
        flask: {
            src: "./pyflask/app.py",
            port: 4242,
            publish: {
                src: "nwb-guide",
                base: "./build/flask/nwb-guide",
                build: "npm run build:flask",
            },
        },
    },

    electron: {
        splash: "./src/main/splash-screen.html",
        window: {
            minWidth: 1121,
            minHeight: 735,
            width: 1121,
            height: 735,
            center: true,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true,
                contextIsolation: false,
                sandbox: false,
            },
        },

        build: {
            win: {
                requestedExecutionLevel: "requireAdministrator",
            },

            nsis: {
                createDesktopShortcut: "always",
                oneClick: false,
                perMachine: false,
                allowToChangeInstallationDirectory: true
            },

            mac: {

                // Create both M1 and Intel builds
                target: [
                    {
                      target: "dmg",
                      arch: [
                        "x64",
                        "arm64"
                      ]
                    },
                    {
                      target: "zip",
                      arch: [
                        "x64",
                        "arm64"
                      ]
                    }
                ],
            },

            fileAssociations: [
                {
                    ext: "nwb",
                    name: "NWB File",
                    role: "Viewer",
                },
            ],
        },
    },
};
