import { isElectron, electron, app } from './electron/index.js'
const { ipcRenderer } = electron;

import {
  notyf,
} from './dependencies/globals.js'

import { baseUrl } from './globals.js'

import Swal from 'sweetalert2'


import { StatusBar } from "./stories/status/StatusBar.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import serverSVG from "./stories/assets/server.svg?raw";
import webAssetSVG from "./stories/assets/web_asset.svg?raw";
import wifiSVG from "./stories/assets/wifi.svg?raw";

const appVersion = app?.getVersion();

export const statusBar = new StatusBar({
  items: [
    { label: unsafeSVG(webAssetSVG), value: isElectron ? appVersion ?? 'ERROR' : 'Web' },
    { label: unsafeSVG(wifiSVG) },
    { label: unsafeSVG(serverSVG) }
  ]
})


// Check if the Flask server is live
const serverIsLiveStartup = async () => {
    const echoResponse = await fetch(`${baseUrl}/startup/echo?arg=server ready`).then(res => res.json()).catch(e => e)
    return echoResponse === "server ready" ? true : false;
  };

  // Preload Flask imports for faster on-demand operations
  const preloadFlaskImports = () => fetch(`${baseUrl}/startup/preload-imports`).then(res => {
    if (res.ok) return res.json()
    else throw new Error('Error preloading Flask imports')
  })


let serverCallbacks: Function[] = []
export const onServerOpen = (callback:Function) => {
  if (statusBar.items[2].status === true) return callback()
  else {
    return new Promise(res => {
        serverCallbacks.push(() => {
            res(callback())
        })

    })
 }
}

export const activateServer = () => {
 statusBar.items[2].status = true

 serverCallbacks.forEach(cb => cb())
 serverCallbacks = []
}

export async function pythonServerOpened() {

  // Confirm requests are actually received by the server
  const isLive = await serverIsLiveStartup()

  // initiate preload of Flask imports
  if (isLive) await preloadFlaskImports()
  .then(() => {

    // Update server status and throw a notification
   activateServer()

    if (openPythonStatusNotyf) notyf.dismiss(openPythonStatusNotyf)
    openPythonStatusNotyf = notyf.open({
      type: "success",
      message: "Backend services are available",
    });

  })
  .catch(e =>{

    statusBar.items[2].status = 'issue'

    notyf.open({
      type: "warning",
      message: e.message,
    });

  })

  // If the server is not live, throw an error
  else return pythonServerClosed()

}


export async function pythonServerClosed(message?: string) {

  if (message) console.error(message)
  statusBar.items[2].status = false

    await Swal.fire({
      icon: "error",
      html: `<p>Something went wrong while initializing the application's background services.</p><small>Please restart NWB GUIDE and try again. If this issue occurs multiple times, please open an issue on the <a href='https://github.com/catalystneuro/nwb-guide/issues' target='_blank'>NWB GUIDE Issue Tracker</a>.</small>`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Exit Now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (isElectron) app.exit();
    else location.reload()

    Swal.close();


}

let openPythonStatusNotyf: undefined | any;

export const loadServerEvents = () => {
    if (isElectron) {
        ipcRenderer.send("python.status"); // Trigger status check

        ipcRenderer.on("python.open", pythonServerOpened);

        ipcRenderer.on("python.closed", (_, message) => pythonServerClosed(message));
        ipcRenderer.on("python.restart", () => {
        statusBar.items[2].status = undefined
        if (openPythonStatusNotyf) notyf.dismiss(openPythonStatusNotyf)
        openPythonStatusNotyf = notyf.open({
            type: "warning",
            message: "Backend services are restarting...",
        })
        });
    }

    else activateServer() // Just mock-activate the server if we're in the browser
}



const isPromise = (o) => typeof o === 'object' && typeof o.then === 'function'

export const resolve = (object, callback) => {
  if (isPromise(object)) {
    return new Promise(resolvePromise => {
        object.then((res) => resolvePromise((callback) ? callback(res) : res))
    })
  } else return (callback) ? callback(object) : object
}

export const serverGlobals = {
  species: new Promise((res, rej) => {
    onServerOpen(() => {
      fetch(new URL("get-recommended-species", baseUrl))
        .then((res) => res.json())
        .then((species) => {
          res(species)
          serverGlobals.species = species
        })
        .catch(() => rej());
    });
  }),
  cpus: new Promise((res, rej) => {
    onServerOpen(() => {
      fetch(new URL("cpus", baseUrl))
        .then((res) => res.json())
        .then((cpus) => {
          res(cpus)
          serverGlobals.cpus = cpus
        })
        .catch(() => rej());
    });
  })
}
