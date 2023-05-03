import Swal from "sweetalert2";

import { joinPath, guidedProgressFilePath, runOnLoad, reloadPageToHome, isStorybook } from "./globals.js";
import { fs } from "./electron/index.js";

export const hasEntry = (name) => {
    const existingProgressNames = getEntries();
    existingProgressNames.forEach((element, index) => (existingProgressNames[index] = element.replace(".json", "")));
    return existingProgressNames.includes(name);
};

export const update = (newDatasetName, previousDatasetName) => {
    return new Promise((resolve, reject) => {
        //If updataing the dataset, update the old banner image path with a new one
        if (previousDatasetName) {
            if (previousDatasetName === newDatasetName) resolve("No changes made to dataset name");

            if (hasEntry(newDatasetName))
                reject("An existing progress file already exists with that name. Please choose a different name.");

            // update old progress file with new dataset name
            const oldProgressFilePath = `${guidedProgressFilePath}/${previousDatasetName}.json`;
            const newProgressFilePath = `${guidedProgressFilePath}/${newDatasetName}.json`;
            if (fs) fs.renameSync(oldProgressFilePath, newProgressFilePath);
            else {
                localStorage.setItem(newProgressFilePath, localStorage.getItem(oldProgressFilePath));
                localStorage.removeItem(oldProgressFilePath);
            }
            resolve("Dataset name updated");
        } else reject("No previous dataset name provided");
    });
};

export const save = (page, overrides = {}) => {
    const globalState = page.info.globalState;
    let guidedProgressFileName = overrides.globalState?.project?.name ?? globalState.project?.name;

    //return if guidedProgressFileName is not a string greater than 0
    if (typeof guidedProgressFileName !== "string" || guidedProgressFileName.length === 0) return;
    const params = new URLSearchParams(location.search);

    params.set("project", guidedProgressFileName);

    const value = `${location.pathname}?${params}`;
    history.state.project = guidedProgressFileName;

    window.history.pushState(history.state, null, value);

    //Destination: HOMEDIR/NWBGUIDE/Guided-Progress
    globalState["last-modified"] = new Date();
    globalState["page-before-exit"] = overrides.id ?? page.info.id;

    var guidedFilePath = joinPath(guidedProgressFilePath, guidedProgressFileName + ".json");

    // Save the file through the available mechanisms
    if (fs) {
        if (!fs.existsSync(guidedProgressFilePath)) fs.mkdirSync(guidedProgressFilePath, { recursive: true }); //create Guided-Progress folder if one does not exist
        fs.writeFileSync(guidedFilePath, JSON.stringify(globalState, null, 2));
    } else localStorage.setItem(guidedFilePath, JSON.stringify(globalState));
};

export const getEntries = () => {
    if (fs && !fs.existsSync(guidedProgressFilePath)) fs.mkdirSync(guidedProgressFilePath, { recursive: true }); //Check if Guided-Progress folder exists. If not, create it.
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
    return JSON.parse(fs ? fs.readFileSync(progressFilePath) : localStorage.getItem(progressFilePath));
};

export const deleteProgressCard = async (progressCardDeleteButton) => {
    const progressCard = progressCardDeleteButton.parentElement.parentElement;
    const progressCardNameToDelete = progressCard.querySelector(".progress-file-name").textContent;

    const result = await Swal.fire({
        title: `Are you sure you would like to delete NWB GUIDE progress made on the dataset: ${progressCardNameToDelete}?`,
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
        const progressFilePathToDelete = joinPath(guidedProgressFilePath, progressCardNameToDelete + ".json");

        //delete the progress file
        if (fs) fs.unlinkSync(progressFilePathToDelete, (err) => console.log(err));
        else localStorage.removeItem(progressFilePathToDelete);

        //remove the progress card from the DOM
        progressCard.remove();
    }
};
