
import globals from "../scripts/globals.js";
import electronExports from "./electron/index.js";

const { fs, log } = electronExports;

const {
  joinPath,
  guidedProgressFilePath,
} = globals;

let saveErrorThrown = false;

export const save = (page) => {

  const globalState = page.info.globalState
  const guidedProgressFileName = globalState.name
  console.log("Saving progress to " + guidedProgressFileName + ".json", globalState);

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

    //Destination: HOMEDIR/SODA/Guided-Progress
    globalState["last-modified"] = new Date();
    globalState["page-before-exit"] = page.info.id;

    try {
      //create Guided-Progress folder if one does not exist
      fs.mkdirSync(guidedProgressFilePath, { recursive: true });
    } catch (error) {
      console.error(error);
      log.error(error);
    }

    var guidedFilePath = joinPath(guidedProgressFilePath, guidedProgressFileName + ".json");

    fs?.writeFileSync(guidedFilePath, JSON.stringify(globalState, null, 2));
  };

  const readDirAsync = async (path) => {
    return new Promise((resolve, reject) => {
      if (!fs) reject('fs is not defined. Please check if fs is defined in the main process.')
      fs.readdir(path, (error, result) => {
        if (error) {
          throw new Error(error);
        } else {
          resolve(result);
        }
      });
    });
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


  export const getEntries = async () => {
    if (fs && !fs.existsSync(guidedProgressFilePath))  fs.mkdirSync(guidedProgressFilePath, { recursive: true });  //Check if Guided-Progress folder exists. If not, create it.
    return await readDirAsync(guidedProgressFilePath).then(arr => arr.filter(path => path.slice(-5) === '.json')).catch(() => []);
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
      title: `Are you sure you would like to delete SODA progress made on the dataset: ${progressCardNameToDelete}?`,
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
