import { app, BrowserWindow, dialog, shell } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import main from '@electron/remote/main';
main.initialize()

let showExitPrompt = true;
import path from 'path';
import { autoUpdater } from 'electron-updater';
import { ipcMain } from 'electron';
import fp from 'find-free-port';
import 'v8-compile-cache'

import child_process from 'child_process';
import fs from 'fs';
import axios from 'axios';

import './application-menu.js';
import './shortcuts.js';

import icon from '../renderer/assets/img/logo-guide-draft.png?asset'
import splashHTML from './splash-screen.html?asset'

autoUpdater.channel = "latest";

/*************************************************************
 * Python Process
 *************************************************************/

// flask setup environment variables
const PYFLASK_DIST_FOLDER_BASE = path.join('out', 'python')
const PY_FLASK_DIST_FOLDER = path.join('..', '..', PYFLASK_DIST_FOLDER_BASE);
const PY_FLASK_FOLDER = path.join('..', '..', "pyflask");
const PY_FLASK_MODULE = "app";
let pyflaskProcess: any = null;

let PORT: number | string | null = 4242;
let selectedPort: number | string | null = null;
const portRange = 100;


/**
 * Determine if the application is running from a packaged version or from a dev version.
 * The resources path is used for Linux and Mac builds and the app.getAppPath() is used for Windows builds.
 * @returns {boolean} True if the app is packaged, false if it is running from a dev version.
 */
const getPackagedPath = () => {

  const windowsPath = path.join(__dirname, PY_FLASK_DIST_FOLDER, PY_FLASK_MODULE, PY_FLASK_MODULE + ".exe");
  const unixPath = path.join(process.resourcesPath, PY_FLASK_MODULE, PY_FLASK_MODULE);

  if ((process.platform === "darwin" || process.platform === "linux") && fs.existsSync(unixPath)) return unixPath;
  if (process.platform === "win32" && fs.existsSync(windowsPath)) return windowsPath;
};

const createPyProc = async () => {
  let script = getPackagedPath() || path.join(__dirname, PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py");
  await killAllPreviousProcesses();

  const defaultPort = PORT as number


  fp(defaultPort, defaultPort + portRange)
    .then(([freePort]: string[]) => {
      selectedPort = freePort;

      const processId = `nwb-guide:${selectedPort}`

      pyflaskProcess = (script.slice(-3) === '.py') ? child_process.spawn("python", [script, freePort], {}) : child_process.spawn(`${script}`, [freePort], {});

      if (pyflaskProcess != null) {

        // Listen for errors from Python process
        pyflaskProcess.stderr.on("data", (data: string) => console.error(`[${processId}]: ${data}`));
  
        pyflaskProcess.stdout.on('data', (data: string) => console.error(`[${processId}]: ${data}`));

        pyflaskProcess.on('close', (code: number) => console.error(`[nwb-guide:python] exit code ${code}`));    

      }
    })
    .catch((err: Error) => {
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
    const cmd = child_process.spawnSync("taskkill", [
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
    // PORT = null;
    return;
  }

  // kill signal to pyProc
  pyflaskProcess.kill();
  pyflaskProcess = null;
  // PORT = null;
};

const killAllPreviousProcesses = async () => {
  console.log("Killing all previous processes");

  // kill all previous python processes that could be running.
  let promisesArray = [];

  const defaultPort = PORT as number

  let endRange = defaultPort + portRange;

  // create a loop of 100
  for (let currentPort = defaultPort; currentPort <= endRange; currentPort++) {
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

let mainWindow: BrowserWindow;
let user_restart_confirmed = false;
let updatechecked = false;

function initialize() {

  makeSingleInstance();

  function createWindow() {
    mainWindow.webContents.openDevTools();

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.webContents.once("dom-ready", () => {
      if (updatechecked == false) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    mainWindow.on("close", async (e) => {
      if (!user_restart_confirmed) {
        if (showExitPrompt) {
          e.preventDefault(); // Prevents the window from closing
          dialog
            .showMessageBox(BrowserWindow.getFocusedWindow() as BrowserWindow, {
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
    showExitPrompt = false;
    mainWindow.close();
    /// feedback form iframe prevents closing gracefully
    /// so force close
    if (!mainWindow.closed) {
      mainWindow.destroy();
    }
  };

  app.on("ready", () => {

    const promise = createPyProc();

    // Listen after first load
    promise.then(() => {
      const chokidar = require('chokidar');
      let done = true
      chokidar.watch(path.join(__dirname, "../../pyflask"), {
        ignored:  ['**/__pycache__/**']
      }).on('all', async (event: string) => {
        if (event === 'change' && done) {
          done = false
          await exitPyProc();
          setTimeout(async () => {
            await createPyProc();
            done = true
          }, 1000)
        }
      });
    })

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
    main.enable(mainWindow.webContents);

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))



    const splash = new BrowserWindow({
      width: 340,
      height: 340,
      frame: false,
      icon,
      alwaysOnTop: true,
      transparent: true,
    });

    splash.loadFile(splashHTML)


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
      }, 1000);
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
