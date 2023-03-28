const { app, globalShortcut } = require("electron");

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
