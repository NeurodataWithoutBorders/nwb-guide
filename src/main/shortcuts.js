import { app, globalShortcut } from "electron";

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
