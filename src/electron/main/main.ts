import { app, BrowserWindow, dialog, shell, globalShortcut } from 'electron';
import { is } from '@electron-toolkit/utils'

import paths from '../../paths.config.json'

import main from '@electron/remote/main';
main.initialize()

import path from 'path';
// import { autoUpdater } from 'electron-updater';
import { ipcMain } from 'electron';
import fp from 'find-free-port';
import 'v8-compile-cache'

import child_process from 'child_process';
import fs from 'fs';

import './application-menu.js';

import icon from '../frontend/assets/img/logo-guide-draft.png?asset'
import splashHTML from './splash-screen.html?asset'
import preloadUrl from '../preload/preload.js?asset'

const runByTestSuite = !!process.env.VITEST

// Enable remote debugging port for Vitest
if (runByTestSuite) {
  app.commandLine.appendSwitch('remote-debugging-port', `${8315}`) // Mirrors the global electronDebugPort variable
  app.commandLine.appendSwitch('remote-allow-origins', '*') // Allow all remote origins
}

// autoUpdater.channel = "latest";

/*************************************************************
 * Python Process
 *************************************************************/

// flask setup environment variables
const PYFLASK_BUILD_SUBFOLDER_NAME =  'flask'
const PYFLASK_DIST_FOLDER_BASE = path.join('build', PYFLASK_BUILD_SUBFOLDER_NAME)
const PY_FLASK_DIST_FOLDER = path.join('..', '..', PYFLASK_DIST_FOLDER_BASE);
const PY_FLASK_FOLDER = path.join('..', '..', "src", "pyflask");
const PYINSTALLER_NAME = "nwb-guide"

const isWindows = process.platform === 'win32'




let pyflaskProcess: any = null;

let PORT: number | string | null = 4242;
let selectedPort: number | string | null = null;
let serverFilePath = getPackagedPath() || path.join(__dirname, PY_FLASK_FOLDER, "app.py");
const portRange = 100;

let readyQueue: Function[] = []

let globals: {
  mainWindow: BrowserWindow,
  python: {
    status: boolean,
    sent: boolean,
    latestError: string
  },
} =  {

  // mainWindow: undefined,

  python: {
    status: false,
    sent: false,
    restart: false,
    latestError: ''
  }
}

function send(this: BrowserWindow, ...args: any[]) {
  return this.webContents.send(...args)
}

const onWindowReady = (f: (win: BrowserWindow) => any) => (globals.mainWindow?.webContents) ? f(globals.mainWindow) : readyQueue.push(f)


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
function getPackagedPath () {
  const scriptPath = isWindows ? path.join(__dirname, PY_FLASK_DIST_FOLDER, PYINSTALLER_NAME, `${PYINSTALLER_NAME}.exe`) : path.join(process.resourcesPath, PYFLASK_BUILD_SUBFOLDER_NAME, PYINSTALLER_NAME)
  if (fs.existsSync(scriptPath)) return scriptPath;
};

const createPyProc = async () => {

  return new Promise(async (resolve, reject) => {

    await killAllPreviousProcesses();

    const defaultPort = PORT as number


    fp(defaultPort, defaultPort + portRange)
      .then(([freePort]: string[]) => {
        selectedPort = freePort;

        pyflaskProcess = (serverFilePath.slice(-3) === '.py') ? child_process.spawn("python", [serverFilePath, freePort], {}) : child_process.spawn(`${serverFilePath}`, [freePort], {});

        if (pyflaskProcess != null) {

          // Listen for errors from Python process
          pyflaskProcess.stderr.on("data", (data: string) => {
            console.error(`${data}`)
            globals.python.latestError = data.toString()
          });

          pyflaskProcess.stdout.on('data', (data: string) => {
            const isRestarting = globals.python.restart
            setTimeout(() => {
              pythonIsOpen(isRestarting)
            }, 100); // Wait just a bit to give the server some time to come online
            console.log(`${data}`)
            resolve(true)
          });

          pyflaskProcess.on('close', () => {
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

  pyflaskProcess.kill() // Try killing twice on Windows

  pyflaskProcess = null;
};

const killAllPreviousProcesses = async () => {

  const fetch = globalThis.fetch

  if (fetch){
    console.log("Killing all previous processes");

    // kill all previous python processes that could be running.
    let promisesArray = [];

    const defaultPort = PORT as number

    let endRange = defaultPort + portRange;

    // create a loop of 100
    for (let currentPort = defaultPort; currentPort <= endRange; currentPort++) promisesArray.push( fetch(`http://127.0.0.1:${currentPort}/server_shutdown`) );

    // wait for all the promises to resolve
    await Promise.allSettled(promisesArray);
  } else console.error('Cannot kill previous processes because fetch is not defined in this version of Node.js')
};

let updatechecked = false;

let hasBeenOpened = false;

function initialize() {

  makeSingleInstance();

  function createWindow() {

    globals.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    globals.mainWindow.webContents.on('will-prevent-unload', () => {
        return true // Avoid page refresh on Appzi feedback form submission
    });


    // globals.mainWindow.webContents.once("dom-ready", () => {
    //   if (updatechecked == false) {
    //     autoUpdater.checkForUpdatesAndNotify();
    //   }
    // });
  }

  function onAppReady () {

    if (globals.mainWindow) return // Do not re-initialize if the main window is already declared

    const minHeight = 800;
    const minWidth = 1280;

    const windowOptions = {
      minWidth,
      minHeight,
      width: minWidth,
      height: minHeight,
      center: true,
      show: false,
      icon,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
        sandbox: false,
        preload: path.join(preloadUrl),
      },
    };

    const win = globals.mainWindow = new BrowserWindow(windowOptions);

    // Avoid CORS (for all requests) for Dandiset creation
    win.webContents.session.webRequest.onBeforeSendHeaders(
      (details, callback) => {
        callback({ requestHeaders: {
          Origin: '*',
          Referer: "http://localhost:5174/", // Spoof the referrer
          ...details.requestHeaders
        } });
      },
    );

    const accessControlHeader = 'Access-Control-Allow-Origin'

    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {

      const accessHeader = [accessControlHeader, accessControlHeader.toLowerCase()].find(key => details.responseHeaders?.[key]) ?? accessControlHeader
      const origins = details.responseHeaders?.[accessHeader] ?? []
      if (origins.includes("*")) return callback(details)

      return callback({
        responseHeaders: {
          [accessHeader]: ['*'],
          ...details.responseHeaders,
        },
      });

    });


    // Only create one python process
    if (!pyflaskProcess) {
      const promise = createPyProc();

      // Listen after first load
      promise.then(() => {
        const chokidar = require('chokidar');
        chokidar.watch(path.join(__dirname, PY_FLASK_FOLDER), {
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
    }

    main.enable(win.webContents);

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else win.loadFile(path.join(__dirname, '../renderer/index.html'))

    win.once("closed", () => {
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
    win.once("ready-to-show", () => {

      setTimeout(function () {

        hasBeenOpened = true

        splash.close();
        win.show();
        createWindow();

        // autoUpdater.checkForUpdatesAndNotify();
        updatechecked = true;

        // Clear ready queue
        readyQueue.forEach(f => onWindowReady(f))
        readyQueue = []

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

  if (!app.requestSingleInstanceLock()){
    console.error('An instance of this application is already open...')
    app.exit(); // Skip quit callbacks
  }
  else app.on("second-instance", () => restoreWindow());
}

initialize();

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) initialize()
})


const root = runByTestSuite ? path.join(paths.root, '.test') : paths.root

if (runByTestSuite) onWindowReady(() => console.log('WINDOW READY FOR TESTING'))


const homeDirectory = app.getPath("home");
const appDirectory = path.join(homeDirectory, root)
const guidedProgressFilePath = path.join(appDirectory, ...paths.subfolders.progress);
const guidedConversionFolderPath = path.join(appDirectory, ...paths.subfolders.conversions);
const guidedStubFolderPath = path.join(appDirectory, ...paths.subfolders.preview);

function getEntries(path, type = 'isDirectory') {
  if (!fs.existsSync(path)) return []
  return fs.readdirSync(path, { withFileTypes: true })
  .filter(dirent => dirent[type]())
  .map(dirent => dirent.name)
}


// This function removes all folders that don't have a corresponding pipeline (specifically DANDI temp folders—but also any folders left after a pipeline is deleted)
function deleteFoldersWithoutPipelines() {
    const conversionDirectories = getEntries(guidedConversionFolderPath)
    const stubDirectories = getEntries(guidedStubFolderPath)

    const allowedDirectories = getEntries(guidedProgressFilePath, 'isFile').map(name => name.slice(0, -'.json'.length))
    const conversionsToRemove = conversionDirectories.filter(name => !allowedDirectories.includes(name))
    const stubsToRemove = stubDirectories.filter(name => !allowedDirectories.includes(name))

    conversionsToRemove.forEach(name => fs.rmSync(path.join(guidedConversionFolderPath, name), { recursive: true }))
    stubsToRemove.forEach(name => fs.rmSync(path.join(guidedStubFolderPath, name), { recursive: true }))
}

app.on("window-all-closed", () => {
  if (process.platform != 'darwin') app.quit() // Exit the application not on Mac
})

app.on("before-quit", async (ev: Event) => {

  ev.preventDefault()
    if (!runByTestSuite) {
    const { response } = await dialog
    .showMessageBox(BrowserWindow.getFocusedWindow() as BrowserWindow, {
      type: "question",
      buttons: ["Yes", "No"],
      title: "Confirm",
      message: "Any running process will be stopped. Are you sure you want to quit?",
    })

    if (response !== 0) return // Skip quitting
  }

  try {
    globalShortcut.unregisterAll();
    deleteFoldersWithoutPipelines()
    await exitPyProc()
  } catch (err) {
    console.error(err);
  } finally {
    app.exit()
  }
})

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

ipcMain.on('showItemInFolder', function(event, fullPath) {
  shell.showItemInFolder(fullPath);
});

// autoUpdater.on("update-available", () => {
//   onWindowReady(win => send.call(win, "update_available"));
// });

// autoUpdater.on("update-downloaded", () => {
//   onWindowReady(win => send.call(win, "update_downloaded"));
// });

// ipcMain.on("restart_app", async () => {
//   autoUpdater.quitAndInstall();
// });

ipcMain.on("get-port", (event) => {
  event.returnValue = selectedPort;
});

ipcMain.on("get-server-file-path", (event) => {
  event.returnValue = serverFilePath;
});

// Allow the browser to request status if already sent once
ipcMain.on("python.status", (event) => {
  if (globals.python.sent) ((globals.python.status) ? pythonIsOpen : pythonIsClosed)(true); // Force send
});
