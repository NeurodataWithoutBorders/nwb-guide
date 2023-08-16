const buildFlaskBase = "python -m PyInstaller --name nwb-guide --onedir --clean --noconfirm ./pyflask/app.py --distpath ./build/flask --collect-all nwbinspector --collect-all neuroconv --collect-all pynwb --collect-all hdmf --collect-all ci_info"
const buildFlaskWin = `${buildFlaskBase} --add-data ./paths.config.json;.`
const buildFlaskUnix = `${buildFlaskBase} --add-data ./paths.config.json:.`

export default {

    plugins: {
        autoupdate: true
    },

    services: {
        flask: {
            src: './pyflask/app.py',
            port: 4242,
            buildCommand: {
                mac: buildFlaskUnix,
                linux: buildFlaskUnix,
                windows: buildFlaskWin
            },
            production: {
                src: './flask/nwb-guide', // --onedir
                extraResources: [ 
                     {
                        "from": "./build/flask/nwb-guide",
                        "to": "flask"
                    }
                ]
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
        }
    }
}