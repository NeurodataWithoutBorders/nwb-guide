import Swal from 'sweetalert2'

import {
  joinPath,
  guidedProgressFilePath,
} from "./globals.js";
import { fs } from "./electron/index.js";

let saveErrorThrown = false;


export const hasEntry = (name) => {
    const existingProgressNames = getEntries();
    existingProgressNames.forEach((element, index) => existingProgressNames[index] = element.replace(".json", ""));
    return existingProgressNames.includes(name);
}

export const update = (newDatasetName, previousDatasetName) => {
    return new Promise((resolve, reject) => {
        //If updataing the dataset, update the old banner image path with a new one
        if (previousDatasetName) {
            if (previousDatasetName === newDatasetName)resolve("No changes made to dataset name");

            if (!fs) console.warn("fs is not defined. Will not perform changes on the filesystem.")

            if (hasEntry(newDatasetName))  reject("An existing progress file already exists with that name. Please choose a different name.");

            // update old progress file with new dataset name
            const oldProgressFilePath = `${guidedProgressFilePath}/${previousDatasetName}.json`;
            const newProgressFilePath = `${guidedProgressFilePath}/${newDatasetName}.json`;
            fs?.renameSync(oldProgressFilePath, newProgressFilePath);
            resolve("Dataset name updated");
        }

        else reject('No previous dataset name provided');
    });
}

export const save = (page) => {

  const globalState = page.info.globalState
  const guidedProgressFileName = globalState.name

    if (!fs) {
      if (!saveErrorThrown) console.warn("Cannot save progress in a web build.");
      saveErrorThrown = true;
      return
    }

    //return if guidedProgressFileName is not a strnig greater than 0
    if (typeof guidedProgressFileName !== "string" || guidedProgressFileName.length === 0) {
      console.warn("Failed to save because guidedProgressFileName is not a string or is empty.");
      return
    }

    //Destination: HOMEDIR/NWBGUIDE/Guided-Progress
    globalState["last-modified"] = new Date();
    globalState["page-before-exit"] = page.info.id;

    try {
      //create Guided-Progress folder if one does not exist
      fs.mkdirSync(guidedProgressFilePath, { recursive: true });
    } catch (error) {
      console.error(error);
    }

    var guidedFilePath = joinPath(guidedProgressFilePath, guidedProgressFileName + ".json");

    fs?.writeFileSync(guidedFilePath, JSON.stringify(globalState, null, 2));
  };

  const readFileAsync = async (path) => {
    return new Promise((resolve, reject) => {
      if (!fs) reject('fs is not defined. Please check if fs is defined in the main process.')
      fs.readFile(path, "utf-8", (error, result) => {
        if (error) {
          throw new Error(error);
        } else {
          resolve(JSON.parse(result));
        }
      });
    });
  };


  export const getEntries = () => {
    if (fs && !fs.existsSync(guidedProgressFilePath))  fs.mkdirSync(guidedProgressFilePath, { recursive: true });  //Check if Guided-Progress folder exists. If not, create it.
    const progressFiles = fs ? fs.readdirSync(guidedProgressFilePath) : [];
    return progressFiles.filter(path => path.slice(-5) === '.json')
  }

  export const getAll = async (progressFiles) => {
    return Promise.all(
      progressFiles.map((progressFile) => {
        let progressFilePath = joinPath(guidedProgressFilePath, progressFile);
        return readFileAsync(progressFilePath);
      })
    );
  };

  export const get = async (progressFile) => {
    let progressFilePath = joinPath(guidedProgressFilePath, progressFile + ".json");
    return readFileAsync(progressFilePath);
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
      const progressFilePathToDelete = joinPath(
        guidedProgressFilePath,
        progressCardNameToDelete + ".json"
      );


      //delete the progress file
      if (fs) fs.unlinkSync(progressFilePathToDelete, (err) => console.log(err));
      else console.warn(`Cannot delete the progress file`)

      //remove the progress card from the DOM
      progressCard.remove();
    }
  };
