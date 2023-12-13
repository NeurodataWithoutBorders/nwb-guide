import Swal from "sweetalert2";

import {
    guidedProgressFilePath,
    reloadPageToHome,
    isStorybook,
    appDirectory,
    ENCRYPTION_KEY,
    ENCRYPTION_IV,
} from "../dependencies/simple.js";
import { fs, crypto } from "../electron/index.js";

import { joinPath, runOnLoad } from "../globals.js";
import { merge } from "../stories/pages/utils.js";
import { updateAppProgress, updateFile } from "./update.js";
import { updateURLParams } from "../utils/url.js";

import * as operations from "./operations.js";

export * from "./update.js";

const CRYPTO_VERSION = "0.0.1"; // NOTE: Update to wipe values created using an outdated encryption algorithm
const CRYPTO_ALGORITHM = "aes-256-cbc";

function encode(text) {
    if (!crypto) return text;
    const cipher = crypto.createCipheriv(CRYPTO_ALGORITHM, ENCRYPTION_KEY, ENCRYPTION_IV);

    const encrypted = cipher.update(text);
    return CRYPTO_VERSION + Buffer.concat([encrypted, cipher.final()]).toString("hex");
}

// Try to decode the value
function decode(text) {
    if (!crypto || !/[0-9A-Fa-f]{6}/g.test(text)) return text;
    if (text.slice(0, CRYPTO_VERSION.length) !== CRYPTO_VERSION) return undefined;

    text = text.slice(CRYPTO_VERSION.length);

    try {
        let textParts = text.split(":");
        let encryptedText = Buffer.from(textParts.join(":"), "hex");
        let decipher = crypto.createDecipheriv(CRYPTO_ALGORITHM, ENCRYPTION_KEY, ENCRYPTION_IV);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch {
        return text;
    }
}

function drill(o, callback) {
    if (o && typeof o === "object") {
        const copy = Array.isArray(o) ? [...o] : { ...o };
        for (let k in copy) {
            const res = drill(copy[k], callback);
            if (res) copy[k] = res;
            else delete copy[k];
        }
        return copy;
    } else return callback(o);
}

function encodeObject(o) {
    return drill(o, (v) => (typeof v === "string" ? encode(v) : v));
}

function decodeObject(o) {
    return drill(o, (v) => (typeof v === "string" ? decode(v) : v));
}

class GlobalAppConfig {
    path = `${appDirectory}/config.json`;
    data = {};

    constructor() {
        const exists = fs ? fs.existsSync(this.path) : localStorage[this.path];
        if (exists) {
            const data = JSON.parse(fs ? fs.readFileSync(this.path) : localStorage.getItem(this.path));
            this.data = decodeObject(data);
        }
    }

    save() {
        const encoded = encodeObject(this.data);

        if (fs) fs.writeFileSync(this.path, JSON.stringify(encoded, null, 2));
        else localStorage.setItem(this.path, JSON.stringify(encoded));
    }
}

export const global = new GlobalAppConfig();

export const hasEntry = (name) => {
    const existingProgressNames = getEntries();
    existingProgressNames.forEach((element, index) => (existingProgressNames[index] = element.replace(".json", "")));
    return existingProgressNames.includes(name);
};

export const save = (page, overrides = {}) => {
    const globalState = merge(overrides, page.info.globalState); // Merge the overrides into the actual global state

    let guidedProgressFileName = globalState.project?.name;

    //return if guidedProgressFileName is not a string greater than 0
    if (typeof guidedProgressFileName !== "string" || guidedProgressFileName.length === 0) return;

    updateFile(guidedProgressFileName, () => {
        updateAppProgress(page.info.id, globalState, guidedProgressFileName); // Will automatically set last updated time
        return globalState;
    });
};

export const getEntries = () => {
    if (fs && !fs.existsSync(guidedProgressFilePath)) fs.mkdirSync(guidedProgressFilePath, { recursive: true }); //Check if progress folder exists. If not, create it.
    const progressFiles = fs ? fs.readdirSync(guidedProgressFilePath) : Object.keys(localStorage);
    return progressFiles.filter((path) => path.slice(-5) === ".json");
};

export const getAll = (progressFiles) => {
    return progressFiles.map((progressFile) => {
        let progressFilePath = joinPath(guidedProgressFilePath, progressFile);
        return JSON.parse(fs ? fs.readFileSync(progressFilePath) : localStorage.getItem(progressFilePath));
    });
};

export const getCurrentProjectName = () => {
    const params = new URLSearchParams(location.search);
    return params.get("project");
};

export const get = (name) => {
    if (!name) {
        const params = new URLSearchParams(location.search);
        const projectName = params.get("project");
        if (!projectName) {
            if (isStorybook) return {};

            runOnLoad(() => {
                Swal.fire({
                    title: "No project specified.",
                    text: "Reload the application and load a project to view.",
                    icon: "error",
                    confirmButtonText: "Restart",
                }).then(reloadPageToHome);
            });

            return;
        }
    }

    let progressFilePath = joinPath(guidedProgressFilePath, name + ".json");

    const exists = fs ? fs.existsSync(progressFilePath) : localStorage.getItem(progressFilePath) !== null;
    return exists ? JSON.parse(fs ? fs.readFileSync(progressFilePath) : localStorage.getItem(progressFilePath)) : {};
};

export function resume(name) {
    const global = this ? this.load(name) : get(name);

    const commandToResume = global["page-before-exit"] || "conversion/start";
    updateURLParams({ project: name });

    if (this) this.onTransition(commandToResume);

    return commandToResume;
}

export const remove = async (name) => {
    const result = await Swal.fire({
        title: `Are you sure you would like to delete this conversion pipeline?`,
        html: `All related files will be deleted permanently, and existing progress will be lost.`,
        icon: "warning",
        heightAuto: false,
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: `Delete ${name}`,
        cancelButtonText: "Cancel",
        focusCancel: true,
    });

    if (result.isConfirmed) return operations.remove(name);

    return false;
};

export const deleteProgressCard = async (progressCardDeleteButton) => {
    const progressCard = progressCardDeleteButton.parentElement.parentElement;
    const progressCardNameToDelete = progressCard.querySelector(".progress-file-name").textContent.trim();
    const hasBeenDeleted = await remove(progressCardNameToDelete);
    if (hasBeenDeleted) progressCard.remove(); //remove the progress card from the DOM
};