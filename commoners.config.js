export default {

    plugins: [
        // NOTE: Add the auto-update plugin
    ],

    services: {
        flask: {
            src: './pyflask/app.py',
            port: 4242,
            buildCommand: "npm run build:flask",
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