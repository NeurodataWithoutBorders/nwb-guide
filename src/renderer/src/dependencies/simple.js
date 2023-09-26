import { app, isElectron } from "../electron/index.js";
import paths from "../../../../paths.config.json" assert { type: "json" };
import { joinPath } from "../globals.js";

export const reloadPageToHome = () => {
    if (isStorybook) return;
    window.location = isElectron ? window.location.pathname : window.location.origin;
}; // Clear all query params

// Filesystem Management
export const homeDirectory = app?.getPath("home") ?? "";
export const appDirectory = homeDirectory ? joinPath(homeDirectory, paths.root) : "";
export const guidedProgressFilePath = homeDirectory ? joinPath(appDirectory, ...paths.subfolders.progress) : "";

export const previewSaveFolderPath = homeDirectory
    ? joinPath(homeDirectory, paths["root"], ...paths.subfolders.preview)
    : "";
export const conversionSaveFolderPath = homeDirectory
    ? joinPath(homeDirectory, paths["root"], ...paths.subfolders.conversions)
    : "";

export const isStorybook = window.location.href.includes("iframe.html");
