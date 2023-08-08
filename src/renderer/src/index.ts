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

// Set the sidebar subtitle to the current app version
const dashboard = document.querySelector('nwb-dashboard') as Dashboard
const appVersion = app?.getVersion();
dashboard.subtitle = appVersion ?? 'Web Version';


//////////////////////////////////
// Connect to Python back-end
//////////////////////////////////
let update_available_notification = "";
let update_downloaded_notification = "";

// utility function for async style set timeout
const wait = async (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

// check that the client connected to the server using exponential backoff
// verify the api versions match
const startupServerAndApiCheck = async () => {

  const waitTime = 1000*60*(isElectron ? 2 : 0.1); // Wait 2 seconds if in electron context
  let status = false;
  let time_start = new Date();
  let error = "";
  while (true) {
    try {
      status = await serverIsLiveStartup();
    } catch (e) {
      error = e;
      status = false;
    }
    if (status) break;
    if (new Date() - time_start > waitTime) break; //break after two minutes
    await wait(2000);
  }

  if (!status) {
    //two minutes pass then handle connection error
    // SWAL that the server needs to be restarted for the app to work
    console.error(error)

    if (isElectron) {
      await Swal.fire({
        icon: "error",
        html: `Something went wrong while initializing the application's background services. Please restart NWB GUIDE and try again. If this issue occurs multiple times, please open an issue on the <a href='https://github.com/catalystneuro/nwb-guide/issues'>NWB GUIDE Issue Tracker</a>.`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Restart now",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      // Restart the app
      app.relaunch();
      app.exit();
    } else console.warn('Python server was not found in development mode.')
  } else {
    console.log("Connected to Python back-end successfully");
  }

  // dismiss the Swal
  Swal.close();
};

// Run a set of functions that will check all the core systems to verify that a user can upload datasets with no issues.
async function run_pre_flight_checks(check_update = true) {
  // log.info("Running pre flight checks");
  return new Promise(async (resolve) => {
    let connection_response: any = "";

    // Check the internet connection and if available check the rest.
    connection_response = await check_internet_connection();

    if (!connection_response) {
      await Swal.fire({
        title: "No Internet Connection",
        icon: "success",
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
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Do nothing
        }
      });
      return resolve(false);
    }
  });
};

// Check if the Pysoda server is live
const serverIsLiveStartup = async () => {
  let echoResponse;

  try {
    echoResponse = await fetch(`${baseUrl}/startup/echo?arg=server ready`).then(res => res.json())
  } catch (error) {
    throw error;
  }

  return echoResponse === "server ready" ? true : false;
};

async function check_internet_connection(show_notification = true) {
  let notification = null;
  if (show_notification) {
    notification = notyf.open({
      type: "loading_internet",
      message: "Checking Internet status...",
    });
  }

  await wait(800);

  if ( navigator.onLine) {
    console.log("Connected to the internet");

      if (show_notification) {
        notyf.dismiss(notification);
        notyf.open({
          type: "success",
          message: "Connected to the internet",
        });
      }
  } else {
      console.error("No internet connection");
      // if (electronImports.ipcRenderer) electronImports.ipcRenderer.send("warning-no-internet-connection"); // NOTE: Proposed syntax t continue accessing the ipcRenderer
      if (show_notification) {
        notyf.dismiss(notification);
        notyf.open({
          type: "error",
          message: "Not connected to internet",
        });
      }
    }

    return navigator.onLine;
};

// Check for update and show the pop up box
ipcRenderer?.on("update_available", () => {
  ipcRenderer?.removeAllListeners("update_available");
  update_available_notification = notyf.open({
    type: "app_update",
    message: "A new update is available. Downloading now...",
  });
});

// When the update is downloaded, show the restart notification
ipcRenderer?.on("update_downloaded", async () => {
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
  ipcRenderer?.send("restart_app");
};


// Check API
startupServerAndApiCheck();

// check integrity of all the core systems
run_pre_flight_checks()
