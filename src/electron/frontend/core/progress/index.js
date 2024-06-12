import Swal from "sweetalert2";

import {
    guidedProgressFilePath,
    reloadPageToHome,
    isStorybook,
    appDirectory,
    ENCRYPTION_KEY,
    ENCRYPTION_IV,
} from "../globals.js";

import { fs, crypto } from "../../utils/electron";

import { joinPath, runOnLoad } from "../globals";
import { merge } from "../../utils/data";
import { updateAppProgress, updateFile } from "./update.js";
import { updateURLParams } from "../../utils/url";

import * as operations from "./operations.js";

export * from "./update.js";

const CRYPTO_VERSION = "0.0.1"; // NOTE: Update to wipe values created using an outdated encryption algorithm
const CRYPTO_ALGORITHM = "aes-256-cbc";

function encode(text) {
    if (!crypto) return text;
    const cipher = crypto.createCipheriv(CRYPTO_ALGORITHM, ENCRYPTION_KEY, ENCRYPTION_IV);

    const encrypted = cipher.update(text);
    return `${CRYPTO_VERSION}:${ENCRYPTION_IV.toString("hex")}:${Buffer.concat([encrypted, cipher.final()]).toString(
        "hex"
    )}`;
}

// Try to decode the value
function decode(text) {
    const [TEXT_CRYPTO_VERSION, ENCRYPTION_IV_HEX, encrypted] = text.split(":");

    if (text.slice(0, TEXT_CRYPTO_VERSION.length) !== CRYPTO_VERSION) return undefined;

    if (!crypto || !/[0-9A-Fa-f]{6}/g.test(encrypted)) return encrypted;

    try {
        let textParts = encrypted.split(":");
        let encryptedText = Buffer.from(textParts.join(":"), "hex");
        let decipher = crypto.createDecipheriv(CRYPTO_ALGORITHM, ENCRYPTION_KEY, Buffer.from(ENCRYPTION_IV_HEX, "hex"));
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch {
        return encrypted;
    }
}

export function drill(object, callback) {
    if (object && typeof object === "object") {
        const copy = Array.isArray(object) ? [...object] : { ...object };
        for (let k in copy) {
            const res = drill(copy[k], callback);
            if (res) copy[k] = res;
            else delete copy[k];
        }
        return copy;
    } else return callback(object);
}

function encodeObject(object) {
    return drill(object, (value) => (typeof value === "string" ? encode(value) : value));
}

function decodeObject(object) {
    return drill(object, (value) => (typeof value === "string" ? decode(value) : value));
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

const oldConversionsPath = "conversion";
const convertOldPath = (path) => {
    if (path && path.slice(0, oldConversionsPath.length) === oldConversionsPath)
        return `/${path.slice(oldConversionsPath.length)}`;
    else return path;
};

const transformProgressFile = (progressFile) => {
    progressFile["page-before-exit"] = convertOldPath(progressFile["page-before-exit"]);
    Object.values(progressFile.sections ?? {}).forEach((section) => {
        const pages = {};
        Object.entries(section.pages).forEach(([page, value]) => {
            pages[convertOldPath(page)] = value;
        });
        section.pages = pages;
    });

    return progressFile;
};
export const getAll = (progressFiles) => {
    return progressFiles.map((progressFile) => {
        let progressFilePath = joinPath(guidedProgressFilePath, progressFile);
        return transformProgressFile(
            JSON.parse(fs ? fs.readFileSync(progressFilePath) : localStorage.getItem(progressFile))
        );
    });
};

export const getCurrentProjectName = () => {
    const params = new URLSearchParams(location.search);
    return params.get("project");
};

export const get = (name) => {
    if (!name) {
        console.error("No name provided to get()");
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
    return transformProgressFile(
        exists ? JSON.parse(fs ? fs.readFileSync(progressFilePath) : localStorage.getItem(progressFilePath)) : {}
    );
};

export async function resume(name) {
    const global = this ? this.load(name) : get(name);

    let commandToResume = global["page-before-exit"] || "//details";
    updateURLParams({ project: name });

    if (this) await this.onTransition(commandToResume);

    return commandToResume;
}

export const remove = async (name, force = false) => {
    const result = force
        ? { isConfirmed: true }
        : await Swal.fire({
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
