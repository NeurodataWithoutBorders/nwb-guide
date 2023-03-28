const { app, BrowserWindow, dialog, shell } = require("electron");
require("@electron/remote/main").initialize();
app.showExitPrompt = true;
const path = require("path");
const fp = require("find-free-port");
require("v8-compile-cache");
const { ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const axios = require("axios");

require('./application-menu.js')
require('./shortcuts.js')

autoUpdater.channel = "latest";

/*************************************************************
 * Python Process
 *************************************************************/

// flask setup environment variables
const PY_FLASK_DIST_FOLDER = "pyflaskdist";
const PY_FLASK_FOLDER = "pyflask";
const PY_FLASK_MODULE = "app";
let pyflaskProcess = null;

let PORT = 4242;
let selectedPort = null;
const portRange = 100;

const icon = path.join(__dirname, "src/assets/img/logo-nwbguide-draft.png");

/**
 * Determine if the application is running from a packaged version or from a dev version.
 * The resources path is used for Linux and Mac builds and the app.getAppPath() is used for Windows builds.
 * @returns {boolean} True if the app is packaged, false if it is running from a dev version.
 */
const guessPackaged = () => {

  const windowsPath = path.join(__dirname, PY_FLASK_DIST_FOLDER);
  const unixPath = path.join(process.resourcesPath, PY_FLASK_MODULE);

  if (process.platform === "darwin" || process.platform === "linux") {
    if (require("fs").existsSync(unixPath)) {
      return true;
    } else {
      return false;
    }
  }

  if (process.platform === "win32") {
    if (require("fs").existsSync(windowsPath)) {
      return true;
    } else {
      return false;
    }
  }
};

/**
 * Get the system path to the api server script.
 * The script is located in the resources folder for packaged Linux and Mac builds and in the app.getAppPath() for Windows builds.
 * It is relative to the main.js file directory when in dev mode.
 * @returns {string} The path to the api server script that needs to be executed to start the Python server
 */
const getScriptPath = () => {
  if (!guessPackaged()) {
    return path.join(__dirname, PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py");
  }

  if (process.platform === "win32") {
    return path.join(__dirname, PY_FLASK_DIST_FOLDER, PY_FLASK_MODULE + ".exe");
  } else {
    return path.join(process.resourcesPath, PY_FLASK_MODULE);
  }
};

const createPyProc = async () => {
  let script = getScriptPath();

  await killAllPreviousProcesses();

  fp(PORT, PORT + portRange)
    .then(([freePort]) => {
      let port = freePort;

      if (guessPackaged()) {
        pyflaskProcess = require("child_process").execFile(script, [port], {
          // stdio: "ignore",
        });
      } else {
        pyflaskProcess = require("child_process").spawn("python", [script, port], {
          // stdio: "ignore",
        });
      }

      if (pyflaskProcess != null) {
        console.log("child process success on port " + port);

        // Listen for errors from Python process
        pyflaskProcess.stderr.on("data", function (data) {
          console.log("[python]:", data.toString());
        });
      } else console.error("child process failed to start on port" + port);

      selectedPort = port;
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
 * Kill the python server process. Needs to be called before GUIDE closes.
 */
const exitPyProc = async () => {

  // Windows does not properly shut off the python server process. This ensures it is killed.
  const killPythonProcess = () => {
    // kill pyproc with command line
    const cmd = require("child_process").spawnSync("taskkill", [
      "/pid",
      pyflaskProcess.pid,
      "/f",
      "/t",
    ]);
  };

  await killAllPreviousProcesses();

  // check if the platform is Windows
  if (process.platform === "win32") {
    killPythonProcess();
    pyflaskProcess = null;
    PORT = null;
    return;
  }

  // kill signal to pyProc
  pyflaskProcess.kill();
  pyflaskProcess = null;
  PORT = null;
};

const killAllPreviousProcesses = async () => {
  console.log("Killing all previous processes");

  // kill all previous python processes that could be running.
  let promisesArray = [];

  let endRange = PORT + portRange;

  // create a loop of 100
  for (let currentPort = PORT; currentPort <= endRange; currentPort++) {
    promisesArray.push(
      axios.get(`http://127.0.0.1:${currentPort}/server_shutdown`, {})
    );
  }

  // wait for all the promises to resolve
  await Promise.allSettled(promisesArray);
};

// 5.4.1 change: We call createPyProc in a spearate ready event
// app.on("ready", createPyProc);
// 5.4.1 change: We call exitPyreProc when all windows are killed so it has time to kill the process before closing

/*************************************************************
 * Main app window
 *************************************************************/

let mainWindow = null;
let user_restart_confirmed = false;
let updatechecked = false;

function initialize() {

  makeSingleInstance();

  function createWindow() {
    // mainWindow.webContents.openDevTools();

    mainWindow.webContents.on("new-window", (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });

    mainWindow.webContents.once("dom-ready", () => {
      if (updatechecked == false) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    mainWindow.on("close", async (e) => {
      if (!user_restart_confirmed) {
        if (app.showExitPrompt) {
          e.preventDefault(); // Prevents the window from closing
          dialog
            .showMessageBox(BrowserWindow.getFocusedWindow(), {
              type: "question",
              buttons: ["Yes", "No"],
              title: "Confirm",
              message: "Any running process will be stopped. Are you sure you want to quit?",
            })
            .then((responseObject) => {
              let { response } = responseObject;
              if (response === 0) {
                // Runs the following if 'Yes' is clicked
                quit_app();
              }
            });
        }
      } else {
        await exitPyProc();
        app.exit();
      }
    });
  }

  const quit_app = () => {
    console.log("Quit app called");
    app.showExitPrompt = false;
    mainWindow.close();
    /// feedback form iframe prevents closing gracefully
    /// so force close
    if (!mainWindow.closed) {
      mainWindow.destroy();
    }
  };

  app.on("ready", () => {
    createPyProc();

    const windowOptions = {
      minWidth: 1121,
      minHeight: 735,
      width: 1121,
      height: 735,
      center: true,
      show: false,
      icon,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
        sandbox: false,
        // preload: path.join(__dirname, "preload.js"),
      },
    };

    mainWindow = new BrowserWindow(windowOptions);
    require("@electron/remote/main").enable(mainWindow.webContents);
    mainWindow.loadURL(path.join("file://", __dirname, "/index.html"));

    const splash = new BrowserWindow({
      width: 340,
      height: 340,
      frame: false,
      icon,
      alwaysOnTop: true,
      transparent: true,
    });
    splash.loadURL(path.join("file://", __dirname, "/splash-screen.html"));

    //  if main window is ready to show, then destroy the splash window and show up the main window
    mainWindow.once("ready-to-show", () => {
      setTimeout(function () {
        splash.close();
        //mainWindow.maximize();
        mainWindow.show();
        createWindow();
        // run_pre_flight_checks();
        autoUpdater.checkForUpdatesAndNotify();
        updatechecked = true;
      }, 6000);
    });
  });

  app.on("window-all-closed", async () => {
    await exitPyProc();
    app.quit();
  });

  app.on("will-quit", () => {
    app.quit();
  });
}

// function run_pre_flight_checks() {
//   console.log("Running pre-checks");
//   mainWindow.webContents.send("run_pre_flight_checks");
// }

// Make this app a single instance app.
const gotTheLock = app.requestSingleInstanceLock();

function makeSingleInstance() {
  if (process.mas) return;

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}


initialize();

ipcMain.on("resize-window", (event, dir) => {
  var x = mainWindow.getSize()[0];
  var y = mainWindow.getSize()[1];
  if (dir === "up") {
    x = x + 1;
    y = y + 1;
  } else {
    x = x - 1;
    y = y - 1;
  }
  mainWindow.setSize(x, y);
});

autoUpdater.on("update-available", () => {
  mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  mainWindow.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", async () => {
  user_restart_confirmed = true;
  autoUpdater.quitAndInstall();
});

ipcMain.on("get-port", (event) => {
  event.returnValue = selectedPort;
});
