export default {


    icon: 'src/renderer/assets/img/logo-guide-draft.png',

    plugins: [
        {
            loadDesktop: function ( win ){

                function isValidFile(filepath) {
                    return !fs.existsSync(filepath) && path.extname(filepath) === '.nwb'
                }
                
                function onFileOpened(_, filepath) {
                    // restoreWindow() || initialize(); // Ensure the application is properly visible
                    win.webContents.send('fileOpened', filepath)
                }
                
                if (isWindows && process.argv.length >= 2) {
                    const openFilePath = process.argv[1];
                    if (isValidFile(openFilePath)) onFileOpened(null, openFilePath)
                }
                
                this.on("open-file", onFileOpened)
            }
        }
    ],

    services: {
        flask: {
            src: './pyflask/app.py',
            port: 4242,
            publish: {
                src: 'nwb-guide',
                base: './build/flask/nwb-guide',
                build: "npm run build:flask"
            }
        }
    },

    electron: {
        splash: './src/main/splash-screen.html',
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
                requestedExecutionLevel: "requireAdministrator"
            },
            fileAssociations: [
                {
                    ext: "nwb",
                    name: "NWB File",
                    role: "Viewer"
                }
              ],
        }
    }
}