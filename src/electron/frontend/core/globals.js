
import { app, path, crypto, isElectron } from "../utils/electron.js";

import paths from "../../../paths.config.json" assert { type: "json" };

import supportedInterfaces from "../../../supported_interfaces.json" assert { type: "json" };

export const joinPath = (...args) => (path ? path.join(...args) : args.filter((str) => str).join("/"));

export let runOnLoad = (fn) => {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn);
};

export const reloadPageToHome = () => {
    if (isStorybook) return;
    window.location = isElectron ? window.location.pathname : window.location.origin;
}; // Clear all query params

// Filesystem Management
const root = globalThis?.process?.env?.VITEST ? joinPath(paths.root, ".test") : paths.root;
export const homeDirectory = app?.getPath("home") ?? "";
export const appDirectory = homeDirectory ? joinPath(homeDirectory, root) : "";
export const guidedProgressFilePath = appDirectory ? joinPath(appDirectory, ...paths.subfolders.progress) : "";

export const previewSaveFolderPath = appDirectory ? joinPath(appDirectory, ...paths.subfolders.preview) : "";
export const conversionSaveFolderPath = appDirectory ? joinPath(appDirectory, ...paths.subfolders.conversions) : "";

export const testDataFolderPath = appDirectory ? joinPath(appDirectory, ...paths.subfolders.testdata) : "";

// Encryption
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
export const ENCRYPTION_KEY = appDirectory
    ? Buffer.concat([Buffer.from(appDirectory), Buffer.alloc(KEY_LENGTH)], KEY_LENGTH)
    : null;

export const ENCRYPTION_IV = crypto ? crypto.randomBytes(IV_LENGTH) : null;

// Storybook
export const isStorybook = window.location.href.includes("iframe.html");

export { supportedInterfaces };
