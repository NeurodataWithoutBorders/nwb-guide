import "./pages.js"
import { isElectron, electron } from '../utils/electron'
import { isTestEnvironment } from './globals.js'

const { ipcRenderer } = electron;

import { Dashboard } from './components/Dashboard.js'

import {
  notyf,
  notify
} from './notifications'

import Swal from 'sweetalert2'
import { loadServerEvents, pythonServerOpened } from "./server/index.js";

import { statusBar } from "./server/globals.js";

// Set the sidebar subtitle to the current app version
const dashboard = document.querySelector('nwb-dashboard') as Dashboard

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
    text: "You may continue, but certain features (e.g. uploading data to DANDI, viewing data on Neurosift, etc.) will be unavailable.",
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

  if (isTestEnvironment) return

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

    const hasInternet = navigator.onLine
    if (hasInternet) isOnline()
    else await isOffline()

    return hasInternet
};


loadServerEvents()

if (isElectron) {

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

      update_downloaded_notification.on("click", async () => {
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
