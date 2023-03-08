const tippy = require("tippy.js").default;
const lottie = require("lottie-web");


// export default {
//     sodaJSONObj: {},
//     datasetStructureJSONObj: {},
//     subjectsTableData: [],
//     samplesTableData: []
// }

const fs = require("fs");
const path = require("path");
const remote = require("@electron/remote");
const app = remote.app;
const homeDirectory = app.getPath("home");

var guidedProgressFilePath = path.join(homeDirectory, "SODA", "Guided-Progress");

const templateArray = [
    "submission.xlsx",
    "dataset_description.xlsx",
    "subjects.xlsx",
    "samples.xlsx",
    "manifest.xlsx",
    "DataDeliverablesDocument-template.docx",
  ];


  function resetProgress () {
    this.sodaJSONObj = {};
    this.datasetStructureJSONObj = {};
    this.subjectsTableData = [];
    this.samplesTableData = [];
  };


const resetGuidedRadioButtons = (parentPageID) => {
    const parentPage = document.getElementById(parentPageID);
    const guidedRadioButtons = parentPage.querySelectorAll(".guided--radio-button");
    for (const guidedRadioButton of guidedRadioButtons) {
      guidedRadioButton.classList.remove("selected");
      guidedRadioButton.classList.remove("not-selected");
      guidedRadioButton.classList.add("basic");

      //get the data-next-element attribute
      const elementButtonControls = guidedRadioButton.getAttribute("data-next-element");
      if (elementButtonControls) {
        const elementToHide = document.getElementById(elementButtonControls);
        elementToHide.classList.add("hidden");
      }
    }
  };

  const guidedUnLockSideBar = () => {
    const sidebar = document.getElementById("sidebarCollapse");
    const guidedModeSection = document.getElementById("guided_mode-section");
    const guidedDatsetTab = document.getElementById("guided_curate_dataset-tab");
    const guidedNav = document.getElementById("guided-nav");

    if (sidebar.classList.contains("active")) {
      sidebar.click();
    }
    sidebar.disabled = false;
    guidedModeSection.style.marginLeft = "-15px";
    //remove the marginLeft style from guidedDatasetTab
    guidedDatsetTab.style.marginLeft = "";
    guidedNav.style.display = "none";
  };

  const generateProgressCardElement = (progressFileJSONObj) => {
    let progressFileImage = progressFileJSONObj["digital-metadata"]["banner-image-path"] || "";

    if (progressFileImage === "") {
      progressFileImage = `
        <img
          src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
          alt="Dataset banner image placeholder"
          style="height: 80px; width: 80px"
        />
      `;
    } else {
      progressFileImage = `
        <img
          src='${progressFileImage}'
          alt="Dataset banner image"
          style="height: 80px; width: 80px"
        />
      `;
    }
    const progressFileName = progressFileJSONObj["digital-metadata"]["name"] || "";
    const progressFileSubtitle =
      progressFileJSONObj["digital-metadata"]["subtitle"] || "No designated subtitle";
    const progressFileOwnerName =
      progressFileJSONObj["digital-metadata"]["pi-owner"]["name"] || "Not designated yet";
    const progressFileLastModified = new Date(progressFileJSONObj["last-modified"]).toLocaleString(
      [],
      {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }
    );
    const savedUploadDataProgress =
      progressFileJSONObj["previously-uploaded-data"] &&
      Object.keys(progressFileJSONObj["previously-uploaded-data"]).length > 0;

    return `
      <div class="guided--dataset-card">
        ${progressFileImage /* banner image */}

        <div class="guided--dataset-card-body">
          <div class="guided--dataset-card-row">
            <h1
              class="guided--text-dataset-card progress-file-name progress-card-popover"
              data-tippy-content="Dataset name: ${progressFileName}"
              rel="popover"
              placement="bottom"
              data-trigger="hover"
            >${progressFileName}</h1>
          </div>
          <div class="guided--dataset-card-row">
            <h1
              class="guided--text-dataset-card progress-card-popover"
              data-tippy-content="Dataset subtitle: ${progressFileSubtitle}"
              rel="popover"
              data-placement="bottom"
              data-trigger="hover"
              style="font-weight: 400;"
            >
                ${
                  progressFileSubtitle.length > 70
                    ? `${progressFileSubtitle.substring(0, 70)}...`
                    : progressFileSubtitle
                }
            </h1>
          </div>
          <div class="guided--dataset-card-row">
            <h2 class="guided--text-dataset-card-sub" style="width: auto;">
              <i
                class="fas fa-clock-o progress-card-popover"
                data-tippy-content="Last modified: ${progressFileLastModified}"
                rel="popover"
                data-placement="bottom"
                data-trigger="hover"
              ></i>
            </h2>
            <h1 class="guided--text-dataset-card ml-sm-1">${progressFileLastModified}</h1>
            ${
              savedUploadDataProgress
                ? `
                  <span class="badge badge-warning mx-2">Incomplete upload</span>
                `
                : ``
            }
          </div>
        </div>
        <div class="guided--container-dataset-card-center">
          ${
            progressFileJSONObj["previous-guided-upload-dataset-name"]
              ? `
                  <button
                    class="ui positive button guided--button-footer"
                    style="
                      background-color: var(--color-light-green) !important;
                      width: 160px !important;
                      margin: 4px;
                      margin-bottom: 15px;
                    "
                    onClick="guidedResumeProgress($(this))"
                  >
                    Edit dataset
                  </button>
                `
              : `
                  <button
                    class="ui positive button guided--button-footer"
                    style="
                      background-color: var(--color-light-green) !important;
                      width: 160px !important;
                      margin: 4px;
                      margin-bottom: 15px;
                    "
                    onClick="guidedResumeProgress($(this))"
                  >
                    ${savedUploadDataProgress ? "Resume upload" : "Continue curating"}
                  </button>
                `
          }
          <h2 class="guided--text-dataset-card" style="width: auto; text-decoration: underline; cursor: pointer;" onclick="deleteProgressCard(this)">
            <i
              class="fas fa-trash mr-sm-1"
            ></i>
            Delete progress file
          </h2>
        </div>
      </div>
    `;
  };

  const renderProgressCards = (progressFileJSONdata) => {
    //sort progressFileJSONdata by date to place newest cards on top
    progressFileJSONdata.sort((a, b) => {
      return new Date(b["last-modified"]) - new Date(a["last-modified"]);
    });

    //sort progressFileJSONdata into two rows one with property "previous-guided-upload-dataset-name"
    //and one without property "previous-guided-upload-dataset-name"
    const progressDataAlreadyUploadedToPennsieve = progressFileJSONdata.filter(
      (progressFileJSONobj) => {
        return progressFileJSONobj["previous-guided-upload-dataset-name"];
      }
    );
    const progressDataNotYetUploadedToPennsieve = progressFileJSONdata.filter(
      (progressFileJSONobj) => {
        return !progressFileJSONobj["previous-guided-upload-dataset-name"];
      }
    );
    //Add the progress cards that have already been uploaded to Pennsieve
    //to their container (datasets that have the globals.sodaJSONObj["previous-guided-upload-dataset-name"] property)
    document.getElementById("guided-div-update-uploaded-cards").innerHTML =
      progressDataAlreadyUploadedToPennsieve.length > 0
        ? progressDataAlreadyUploadedToPennsieve
            .map((progressFile) => generateProgressCardElement(progressFile))
            .join("\n")
        : `
            <h2 class="guided--text-sub-step">
              No local datasets have been uploaded to Pennsieve yet.
            </h2>
            <p class="guided--text-input-instructions m-0 text-center">
              <b>Click "Datasets in progress" to view local datasets in progress.</b>
            </p>
          `;

    //Add the progress cards that have not yet been uploaded to Pennsieve
    //to their container (datasets that do not have the globals.sodaJSONObj["previous-guided-upload-dataset-name"] property)
    document.getElementById("guided-div-resume-progress-cards").innerHTML =
      progressDataNotYetUploadedToPennsieve.length > 0
        ? progressDataNotYetUploadedToPennsieve
            .map((progressFile) => generateProgressCardElement(progressFile))
            .join("\n")
        : `
            <h2 class="guided--text-sub-step">
              All local datasets have been previously uploaded to Pennsieve.
            </h2>
            <p class="guided--text-input-instructions m-0 text-center">
              <b>Click "Datasets uploaded to Pennsieve" to view local datasets that have already been uploaded to Pennsieve.</b>
            </p>
          `;

    tippy(".progress-card-popover", {
      allowHTML: true,
      interactive: true,
    });
  };

  const readDirAsync = async (path) => {
    return new Promise((resolve, reject) => {
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
      fs.readFile(path, "utf-8", (error, result) => {
        if (error) {
          throw new Error(error);
        } else {
          resolve(JSON.parse(result));
        }
      });
    });
  };

  const getAllProgressFileData = async (progressFiles) => {
    return Promise.all(
      progressFiles.map((progressFile) => {
        let progressFilePath = path.join(guidedProgressFilePath, progressFile);
        return readFileAsync(progressFilePath);
      })
    );
  };

  const prepareHomeScreen = async () => {
    //Wipe out existing progress if it exists

    moduleExports.resetProgress()
    //Check if Guided-Progress folder exists. If not, create it.
    if (!fs.existsSync(guidedProgressFilePath)) {
      fs.mkdirSync(guidedProgressFilePath, { recursive: true });
    }

    resetGuidedRadioButtons("guided-div-dataset-cards-radio-buttons");

    const datasetCardsRadioButtonsContainer = document.getElementById(
      "guided-div-dataset-cards-radio-buttons"
    );

    const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);
    //render progress resumption cards from progress file array on first page of guided mode
    if (guidedSavedProgressFiles.length != 0) {
      // $("#guided-continue-curation-header").text(
      //   "Or continue curating a previously started dataset below."
      // );
      datasetCardsRadioButtonsContainer.classList.remove("hidden");
      const progressFileData = await getAllProgressFileData(guidedSavedProgressFiles);
      renderProgressCards(progressFileData);
      document.getElementById("guided-button-view-datasets-in-progress").click();
    } else {
      $("#guided-continue-curation-header").text("");
      datasetCardsRadioButtonsContainer.classList.add("hidden");
    }
    //empty new-dataset-lottie-container div
    document.getElementById("new-dataset-lottie-container").innerHTML = "";
    lottie.loadAnimation({
      container: document.querySelector("#new-dataset-lottie-container"),
      animationData: newDataset,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });

    guidedUnLockSideBar();
  };


  const moduleExports = {
    sodaJSONObj: {},
    datasetStructureJSONObj: {},
    subjectsTableData: [],
    samplesTableData: [],
    resetProgress,
    prepareHomeScreen,
    resetGuidedRadioButtons,
    guidedUnLockSideBar,

    templateArray,
    organizeDSglobalPath: "", // Will be set to an HTMLElement in nav.js
    nextQuestionID: "" // Will be set with the next page ID
}

module.exports = moduleExports
