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
const PYFLASK_BUILD_SUBFOLDER_NAME =  'flask'
const PYFLASK_DIST_FOLDER_BASE = path.join('build', PYFLASK_BUILD_SUBFOLDER_NAME)
const PY_FLASK_DIST_FOLDER = path.join('..', '..', PYFLASK_DIST_FOLDER_BASE);
const PY_FLASK_FOLDER = path.join('..', '..', "pyflask");
const PYINSTALLER_NAME = "nwb-guide"

let pyflaskProcess: any = null;

let PORT: number | string | null = 4242;
let selectedPort: number | string | null = null;
const portRange = 100;

const isWindows = process.platform === 'win32'

let mainWindowReady = false
let readyQueue: Function[] = []

let globals: {
  mainWindow: BrowserWindow,
  python: {
    status: boolean,
    sent: boolean,
    latestError: string
  },
  mainWindowReady: boolean
} =  {

  // mainWindow: undefined,

  python: {
    status: false,
    sent: false,
    restart: false,
    latestError: ''
  },

  // Reactive ready variable
  get mainWindowReady() {
    return mainWindowReady
  },

  set mainWindowReady(v) {
    if (!globals.mainWindow) throw new Error('Main window cannot be ready. It does not exist...')
    mainWindowReady = v
    if (v) readyQueue.forEach(f => onWindowReady(f))
    readyQueue = []
  }
}

function send(this: BrowserWindow, ...args: any[]) {
  return this.webContents.send(...args)
}

const onWindowReady = (f: (win: BrowserWindow) => any) => (globals.mainWindowReady) ? f(globals.mainWindow) : readyQueue.push(f)


// Pass all important log functions to the application
const ogConsoleMethods: any = {};
['log', 'warn', 'error'].forEach(method => {
  const ogMethod = ogConsoleMethods[method] = console[method]
  console[method] = (...args) => {
    onWindowReady(win => send.call(win, `console.${method}`, ...args))
    ogMethod(...args)
  }
})


// The open message can only be sent once, but close can happen at any time
const pythonIsOpen = (force = false) => {

  if (!globals.python.sent || force) {
    onWindowReady(win => {
      send.call(win, "python.open")
      globals.python.sent = true
    })
  }

  globals.python.status = true
}


const pythonIsClosed = (err = globals.python.latestError) => {

    onWindowReady(win => {
      send.call(win, globals.python.restart ? "python.restart" : "python.closed", err)
      globals.python.sent = true
    })

    globals.python.status = false
}

/**
 * Determine if the application is running from a packaged version or from a dev version.
 * The resources path is used for Linux and Mac builds and the app.getAppPath() is used for Windows builds.
 * @returns {boolean} True if the app is packaged, false if it is running from a dev version.
 */
const getPackagedPath = () => {
  const scriptPath = isWindows ? path.join(__dirname, PY_FLASK_DIST_FOLDER, PYFLASK_BUILD_SUBFOLDER_NAME, `${PYINSTALLER_NAME}.exe`) : path.join(process.resourcesPath, PYFLASK_BUILD_SUBFOLDER_NAME, PYINSTALLER_NAME)
  if (fs.existsSync(scriptPath)) return scriptPath;
};

const createPyProc = async () => {

  return new Promise(async (resolve, reject) => {

    let script = getPackagedPath() || path.join(__dirname, PY_FLASK_FOLDER, "app.py");
    await killAllPreviousProcesses();

    const defaultPort = PORT as number


    fp(defaultPort, defaultPort + portRange)
      .then(([freePort]: string[]) => {
        selectedPort = freePort;

        pyflaskProcess = (script.slice(-3) === '.py') ? child_process.spawn("python", [script, freePort], {}) : child_process.spawn(`${script}`, [freePort], {});

        if (pyflaskProcess != null) {

          // Listen for errors from Python process
          pyflaskProcess.stderr.on("data", (data: string) => {
            console.error(`${data}`)
            globals.python.latestError = data.toString()
          });

          pyflaskProcess.stdout.on('data', (data: string) => {
            const isRestarting = globals.python.restart
            setTimeout(() => pythonIsOpen(isRestarting), 100); // Wait just a bit to give the server some time to come online
            console.log(`${data}`)
            resolve(true)
          });

          pyflaskProcess.on('close', (code: number) => {
            console.error(`exit code ${code}`)
            pythonIsClosed()
            reject()
          });

        }
      })
      .catch((err: Error) => {
        console.log(err);
        reject(err)
      });
    })
};

/**
 * Kill the python server process. Needs to be called before GUIDE closes.
 */
const exitPyProc = async () => {

  await killAllPreviousProcesses();

  // Kill signal to pyproc
  if (isWindows) child_process.spawnSync("taskkill", [
    "/pid",
    pyflaskProcess.pid,
    "/f",
    "/t",
  ])  // Windows does not properly shut off the python server process. This ensures it is killed.

  else pyflaskProcess.kill()

  pyflaskProcess = null;
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

let user_restart_confirmed = false;
let updatechecked = false;

let hasBeenOpened = false;

function initialize() {

  makeSingleInstance();

  function createWindow() {

    globals.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    globals.mainWindow.webContents.once("dom-ready", () => {
      if (updatechecked == false) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    globals.mainWindow.once("close", async (e) => {

      globals.mainWindowReady = false

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
              if (response === 0) quit_app()
              else globals.mainWindowReady = true
            });
        }
      } else {
        await exitPyProc();
        app.exit();
      }
    });
  }

  const quit_app = () => {
    globals.mainWindow.close();
    if (!globals.mainWindow.closed) globals.mainWindow.destroy()
  };

  function onAppReady () {

    const promise = createPyProc();

    // Listen after first load
    promise.then(() => {
      const chokidar = require('chokidar');
      chokidar.watch(path.join(__dirname, "../../pyflask"), {
        ignored:  ['**/__pycache__/**']
      }).on('all', async (event: string) => {
        if (event === 'change' && !globals.python.restart) {
          globals.python.restart = true
          await exitPyProc();
          setTimeout(async () => {
            await createPyProc();
            globals.python.restart = false
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

    globals.mainWindow = new BrowserWindow(windowOptions);
    console.log('SETTING MAIN WINDOW')
    main.enable(globals.mainWindow.webContents);

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) globals.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else globals.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

    globals.mainWindow.once("closed", () => {
      console.log('DELETING MAIN WINDOW')
      delete globals.mainWindow
    })

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
    globals.mainWindow.once("ready-to-show", () => {

      setTimeout(function () {

        hasBeenOpened = true

        splash.close();
        globals.mainWindow.show();
        createWindow();

        autoUpdater.checkForUpdatesAndNotify();
        updatechecked = true;

        globals.mainWindowReady = true

      }, hasBeenOpened ? 100 : 1000);
    });
  }


  if (app.isReady()) onAppReady()
  else app.on("ready", onAppReady)
}

function isValidFile(filepath: string) {
  return !fs.existsSync(filepath) && path.extname(filepath) === '.nwb'
}

function onFileOpened(_, filepath: string) {
    restoreWindow() || initialize(); // Ensure the application is properly visible
    onWindowReady((win) => send.call(win, 'fileOpened', filepath))
}

if (isWindows && process.argv.length >= 2) {
  const openFilePath = process.argv[1];
  if (isValidFile(openFilePath)) onFileOpened(null, openFilePath)
}

// Make this app a single instance app.

function restoreWindow(){
  if (globals.mainWindow) {
    if (globals.mainWindow.isMinimized()) globals.mainWindow.restore();
    globals.mainWindow.focus();
  }

  return globals.mainWindow
}

function makeSingleInstance() {
  if (process.mas) return;

  if (!app.requestSingleInstanceLock()) app.quit();
  else app.on("second-instance", () => restoreWindow());
}

initialize();

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) initialize()
})

app.on("window-all-closed", async () => {
  if (process.platform != 'darwin') {
    await exitPyProc();
    app.quit();
  }
});

// app.on("will-quit", () => app.quit());

app.on("open-file", onFileOpened)

ipcMain.on("resize-window", (event, dir) => {
  var x = globals.mainWindow.getSize()[0];
  var y = globals.mainWindow.getSize()[1];
  if (dir === "up") {
    x = x + 1;
    y = y + 1;
  } else {
    x = x - 1;
    y = y - 1;
  }
  globals.mainWindow.setSize(x, y);
});

autoUpdater.on("update-available", () => {
  onWindowReady(win => send.call(win, "update_available"));
});

autoUpdater.on("update-downloaded", () => {
  onWindowReady(win => send.call(win, "update_downloaded"));
});

ipcMain.on("restart_app", async () => {
  user_restart_confirmed = true;
  autoUpdater.quitAndInstall();
});

ipcMain.on("get-port", (event) => {
  event.returnValue = selectedPort;
});

// Allow the browser to request status if already sent once
ipcMain.on("python.status", (event) => {
  if (globals.python.sent) ((globals.python.status) ? pythonIsOpen : pythonIsClosed)(true); // Force send
});
