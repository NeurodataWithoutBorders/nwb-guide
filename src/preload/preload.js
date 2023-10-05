
const electron = require('electron')

// Expose ipcRenderer
if (process.contextIsolated) {
    try {
      electron.contextBridge.exposeInMainWorld('electron', electron)
    } catch (error) {
      console.error(error)
    }
  } else {
    globalThis.electron = electron
  }