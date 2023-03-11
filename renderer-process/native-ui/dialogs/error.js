const electron = require("../../../src/electron/index.js").default.electron ?? {};
const ipcRenderer = electron.ipcRenderer;

const errorBtn = document.getElementById("error-dialog");

errorBtn.addEventListener("click", (event) => {
  ipcRenderer?.send("open-error-dialog");
});
