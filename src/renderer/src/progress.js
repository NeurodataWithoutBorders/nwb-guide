import Swal from "sweetalert2";

import { guidedProgressFilePath, reloadPageToHome, isStorybook, appDirectory } from "./dependencies/globals.js";
import { fs } from "./electron/index.js";
import { joinPath, runOnLoad } from "./globals.js";
import { merge } from "./stories/pages/utils.js";

class GlobalAppConfig {
    path = `${appDirectory}/config.json`;
    data = {};

    constructor() {
        const exists = fs ? fs.existsSync(this.path) : localStorage[this.path];
        if (exists) this.data = JSON.parse(fs ? fs.readFileSync(this.path) : localStorage.getItem(this.path));
    }

    save() {
        if (fs) fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
        else localStorage.setItem(this.path, JSON.stringify(this.data));
    }
}

export const global = new GlobalAppConfig();

export const hasEntry = (name) => {
    const existingProgressNames = getEntries();
    existingProgressNames.forEach((element, index) => (existingProgressNames[index] = element.replace(".json", "")));
    return existingProgressNames.includes(name);
};

export const update = (newDatasetName, previousDatasetName) => {
    //If updataing the dataset, update the old banner image path with a new one
    if (previousDatasetName) {
        if (previousDatasetName === newDatasetName) return "No changes made to dataset name";

        if (hasEntry(newDatasetName))
            throw new Error("An existing progress file already exists with that name. Please choose a different name.");

        // update old progress file with new dataset name
        const oldProgressFilePath = `${guidedProgressFilePath}/${previousDatasetName}.json`;
        const newProgressFilePath = `${guidedProgressFilePath}/${newDatasetName}.json`;
        if (fs) fs.renameSync(oldProgressFilePath, newProgressFilePath);
        else {
            localStorage.setItem(newProgressFilePath, localStorage.getItem(oldProgressFilePath));
            localStorage.removeItem(oldProgressFilePath);
        }

        return "Dataset name updated";
    } else throw new Error("No previous dataset name provided");
};

export const getCurrentProjectName = () => {
    const params = new URLSearchParams(location.search);
    return params.get("project");
};

function updateURLParams(paramsToUpdate) {
    const params = new URLSearchParams(location.search);
    for (let key in paramsToUpdate) {
        const value = paramsToUpdate[key];
        if (value == undefined) params.remove(key);
        else params.set(key, value);
    }

    // Update browser history state
    const value = `${location.pathname}?${params}`;
    Object.assign(history.state, paramsToUpdate);
    window.history.pushState(history.state, null, value);
}

export const updateAppProgress = (
    pageId,
    dataOrProjectName = {},
    projectName = typeof dataOrProjectName === "string" ? dataOrProjectName : undefined
) => {
    const transitionOffPipeline = pageId && pageId.split("/")[0] !== "conversion";

    if (transitionOffPipeline) {
        updateURLParams({ project: undefined });
        return; // Only save last page if within the conversion workflow
    }

    if (projectName) updateURLParams({ project: projectName });

    // Is a project name
    if (dataOrProjectName === projectName) updateFile(dataOrProjectName, (data) => (data["page-before-exit"] = pageId));
    // Is a data object
    else dataOrProjectName["page-before-exit"] = pageId;
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

//Destination: HOMEDIR/NWB_GUIDE/pipelines
export const updateFile = (projectName, callback) => {
    let data = get(projectName);

    if (callback) {
        const result = callback(data);
        if (result && typeof result === "object") data = result;
    }

    data["last-modified"] = new Date(); // Always update the last modified time

    var guidedFilePath = joinPath(guidedProgressFilePath, projectName + ".json");

    // Save the file through the available mechanisms
    if (fs) {
        if (!fs.existsSync(guidedProgressFilePath)) fs.mkdirSync(guidedProgressFilePath, { recursive: true }); //create progress folder if one does not exist
        fs.writeFileSync(guidedFilePath, JSON.stringify(data, null, 2));
    } else localStorage.setItem(guidedFilePath, JSON.stringify(data));
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
        title: `Are you sure you would like to delete NWB GUIDE progress made on the dataset: ${name}?`,
        text: "Your progress file will be deleted permanently, and all existing progress will be lost.",
        icon: "warning",
        heightAuto: false,
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Delete progress file",
        cancelButtonText: "Cancel",
        focusCancel: true,
    });

    if (result.isConfirmed) {
        //Get the path of the progress file to delete
        const progressFilePathToDelete = joinPath(guidedProgressFilePath, name + ".json");

        //delete the progress file
        if (fs) fs.unlinkSync(progressFilePathToDelete, (err) => console.log(err));
        else localStorage.removeItem(progressFilePathToDelete);

        return true;
    }

    return false;
};

export const deleteProgressCard = async (progressCardDeleteButton) => {
    const progressCard = progressCardDeleteButton.parentElement.parentElement;
    const progressCardNameToDelete = progressCard.querySelector(".progress-file-name").textContent.trim();
    const hasBeenDeleted = await remove(progressCardNameToDelete);
    if (hasBeenDeleted) progressCard.remove(); //remove the progress card from the DOM
};
