import { isElectron, electron } from '../electron/index.js'

import {
  notyf,
} from '../dependencies/globals.js'

import Swal from 'sweetalert2'

import { activateServer, baseUrl, statusBar } from './globals.js';

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

    if (isElectron) commoners.exit();
    else location.reload()

    Swal.close();


}

let openPythonStatusNotyf: undefined | any;

export const loadServerEvents = () => {
    if (isElectron) {
        const service = commoners.services.flask
        service.onActivityDetected(pythonServerOpened)
        service.onClosed(pythonServerClosed)
    }

    else activateServer() // Just mock-activate the server if we're in the browser
}
