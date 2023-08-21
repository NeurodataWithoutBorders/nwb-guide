import "./pages.js"
import { isElectron, electron, app } from './electron/index.js'
const { ipcRenderer } = electron;

import { Dashboard } from './stories/Dashboard.js'

import {
  notyf,
  notify
} from './dependencies/globals.js'

import { baseUrl } from './globals.js'

import Swal from 'sweetalert2'

import { StatusBar } from "./stories/status/StatusBar.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import pythonSVG from "./stories/assets/python.svg?raw";
import webAssetSVG from "./stories/assets/web_asset.svg?raw";
import wifiSVG from "./stories/assets/wifi.svg?raw";

// Set the sidebar subtitle to the current app version
const dashboard = document.querySelector('nwb-dashboard') as Dashboard
const appVersion = app?.getVersion();

const statusBar = new StatusBar({
  items: [
    { label: unsafeSVG(webAssetSVG), value: appVersion ?? 'Web' },
    { label: unsafeSVG(wifiSVG) },
    { label: unsafeSVG(pythonSVG) }
  ]
})

dashboard.subtitle = statusBar


//////////////////////////////////
// Connect to Python back-end
//////////////////////////////////
let update_available_notification = "";
let update_downloaded_notification = "";

// utility function for async style set timeout
const wait = async (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

async function isOffline() {

  statusBar.items[1].status = false

  await Swal.fire({
    title: "No Internet Connection",
    icon: "warning",
    text: "It appears that your computer is not connected to the internet. You may continue, but you will not be able to use features of NWB GUIDE related to uploading data to DANDI.",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I understand",
    showConfirmButton: true,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  })
}


// NOTE: This doesn't necessarily mean there is internet—only that we are connected to a network—so we may wish to add additional checks here using the Fetch API.
async function isOnline() {

  statusBar.items[1].status = true

  notyf.open({
    type: "success",
    message: "Connected to the internet",
  });

}


// Run a set of functions that will check all the core systems to verify that a user can upload datasets with no issues.
async function checkInternetConnection() {

    // Check the internet connection and if available check the rest.
    await wait(800);

    window.addEventListener('online', isOnline);
    window.addEventListener('offline', isOffline);

    let hasInternet = navigator.onLine
    if (hasInternet) isOnline()
    else await isOffline()

    return hasInternet
};

// Check if the Pysoda server is live
const serverIsLiveStartup = async () => {
  const echoResponse = await fetch(`${baseUrl}/startup/echo?arg=server ready`).then(res => res.json()).catch(e => e)
  return echoResponse === "server ready" ? true : false;
};


async function pythonServerOpened() {

  // Confirm requests are actually received by the server
  const isLive = await serverIsLiveStartup()
  if (!isLive) return pythonServerClosed()

  // Update server status and throw a notification
  statusBar.items[2].status = true
  notyf.open({
    type: "success",
    message: "Backend services are available",
  });
}


async function pythonServerClosed(message?: string) {

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

if (isElectron) {
    ipcRenderer.send("python.status"); // Trigger status check

    ipcRenderer.on("python.open", pythonServerOpened);

    ipcRenderer.on("python.closed", (_, message) => pythonServerClosed(message));

    // Check for update and show the pop up box
    ipcRenderer.on("update_available", () => {
      ipcRenderer?.removeAllListeners("update_available");
      update_available_notification = notyf.open({
        type: "app_update",
        message: "A new update is available. Downloading now...",
      });
    });

    // When the update is downloaded, show the restart notification
    ipcRenderer.on("update_downloaded", async () => {
      ipcRenderer?.removeAllListeners("update_downloaded");
      notyf.dismiss(update_available_notification);
      if (globalThis.process?.platform == "darwin") {
        update_downloaded_notification = notyf.open({
          type: "app_update_warning",
          message:
            "Update downloaded. It will be installed when you close and relaunch the app. Click here to close NWB GUIDE now.",
        });
      } else {
        update_downloaded_notification = notyf.open({
          type: "app_update_warning",
          message:
            "Update downloaded. It will be installed on the restart of the app. Click here to restart NWB GUIDE now.",
        });
      }
      update_downloaded_notification.on("click", async ({ target, event }) => {
        restartApp();
      });
    });

    // Restart the app for update. Does not restart on macos
    const restartApp = async () => {
      notify("Closing NWB GUIDE now...", "app_update_warning")
      ipcRenderer.send("restart_app");
    };

  }

  else pythonServerOpened() // Will fail if the request doesn't go through

// check integrity of all the core systems
checkInternetConnection()
