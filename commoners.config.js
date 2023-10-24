export default {

    plugins: [],

    services: {
        flask: {
            src: './pyflask/app.py',
            port: 4242,
            publish: {
                src: './build/flask/nwb-guide/nwb-guide', 
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
        }
    }
}