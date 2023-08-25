import { guidedProgressFilePath } from "../dependencies/simple.js";
import { fs } from "../electron/index.js";
import { joinPath } from "../globals.js";

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

export function updateURLParams(paramsToUpdate) {
    const params = new URLSearchParams(location.search);
    for (let key in paramsToUpdate) {
        const value = paramsToUpdate[key];
        if (value == undefined) params.delete(key);
        else params.set(key, value);
    }

    // Update browser history state
    const value = `${location.pathname}?${params}`;
    if (history.state) Object.assign(history.state, paramsToUpdate);
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
