import { os, path, crypto, isElectron } from "../utils/electron.js";

import paths from "../../../paths.config.json" assert { type: "json" };

import supportedInterfaces from "../../../supported_interfaces.json" assert { type: "json" };

export const isTestEnvironment = globalThis?.process?.env?.VITEST;

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
const root = isTestEnvironment ? joinPath(paths.root, ".test") : paths.root;

export const homeDirectory = os.homedir();

export const appDirectory = joinPath(homeDirectory, root);

export const guidedProgressFilePath = joinPath(appDirectory, ...paths.subfolders.progress);

export const previewSaveFolderPath = joinPath(appDirectory, ...paths.subfolders.preview);
export const conversionSaveFolderPath = joinPath(appDirectory, ...paths.subfolders.conversions);

export const testDataFolderPath = joinPath(appDirectory, ...paths.subfolders.testdata);

// Encryption
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
export const ENCRYPTION_KEY = Buffer.concat([Buffer.from(appDirectory), Buffer.alloc(KEY_LENGTH)], KEY_LENGTH);

export const ENCRYPTION_IV = crypto.randomBytes(IV_LENGTH);

// Storybook
export const isStorybook = window.location.href.includes("iframe.html");

export { supportedInterfaces };
