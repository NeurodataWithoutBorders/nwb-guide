

import { html } from 'lit';
import { Page } from '../Page.js';
import { ProgressCard } from './ProgressCard.js';

import lottie from 'lottie-web'
import tippy from 'tippy.js';

import globals from '../../../../scripts/globals.js'
const { notyf } = globals;
import * as progress from '../../../progress.js'
import { newDataset } from '../../../../assets/lotties.js';

export class GuidedHomePage extends Page {

  constructor(...args) {
    super(...args)
  }

  resetRadioButtons(parentPageID) {
      const parentPage = (this.shadowRoot ?? this).querySelector(`#${parentPageID}`);
      const guidedRadioButtons = parentPage.querySelectorAll(".guided--radio-button");
      for (const guidedRadioButton of guidedRadioButtons) {
        guidedRadioButton.classList.remove("selected");
        guidedRadioButton.classList.remove("not-selected");
        guidedRadioButton.classList.add("basic");

        //get the data-next-element attribute
        const elementButtonControls = guidedRadioButton.getAttribute("data-next-element");
        if (elementButtonControls) {
          const elementToHide = (this.shadowRoot ?? this).querySelector(`#${elementButtonControls}`);
          elementToHide.classList.add("hidden");
        }
      }
  }

  renderProgressCards = (progressFileJSONdata) => {

    const htmlBase =  this.shadowRoot ?? this

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

    const uploadedList = htmlBase.querySelector("#guided-div-update-uploaded-cards")
    uploadedList.innerHTML = ''

    const createCard = (progressFile) => {
      const card = new ProgressCard(progressFile)
      card.resume = (...args) => this.resume(...args)
      return card
    }

    if (progressDataAlreadyUploadedToPennsieve.length > 0) {
      progressDataAlreadyUploadedToPennsieve.forEach((progressFile) => uploadedList.appendChild(createCard(progressFile)))
    } else uploadedList.innerHTML = `
      <h2 class="guided--text-sub-step">
        No local datasets have been uploaded to Pennsieve yet.
      </h2>
      <p class="guided--text-input-instructions m-0 text-center">
        <b>Click "Datasets in progress" to view local datasets in progress.</b>
      </p>
    `

    //Add the progress cards that have not yet been uploaded to Pennsieve
    //to their container (datasets that do not have the globals.sodaJSONObj["previous-guided-upload-dataset-name"] property)
    const resumeList = htmlBase.querySelector("#guided-div-resume-progress-cards")
    resumeList.innerHTML = ''

    if (progressDataNotYetUploadedToPennsieve.length > 0) {
      progressDataNotYetUploadedToPennsieve.forEach((progressFile) => resumeList.appendChild(createCard(progressFile)))
    } else resumeList.innerHTML = `
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

    const radioButtons = Array.from(htmlBase.querySelectorAll(".guided--radio-button"));
    radioButtons.forEach((radioButton) => {
      radioButton.onclick = () => this.#onRadioClick(radioButton, radioButtons.filter((button) => button !== radioButton))
    })
  };

  #onRadioClick = (selectedButton, notSelectedButton) => {

      notSelectedButton.forEach(button => {
        button.classList.add("selected");
        button.classList.add("not-selected");
        button.classList.add("basic");
      })

      //If button has prevent-radio-handler data attribute, other buttons, will be deselected
      //but all other radio button functions will be halted
      if (selectedButton.getAttribute("data-prevent-radio-handler") === true) return;

      selectedButton.classList.remove("not-selected");
      selectedButton.classList.remove("basic");
      selectedButton.classList.add("selected");

      //Hide all child containers of non-selected buttons
      notSelectedButton.forEach(button => {
        const id = button.getAttribute("data-next-element")
        if (id) (this.shadowRoot ?? this).querySelector(`#${id}`).classList.add("hidden");
      })

      //Display and scroll to selected element container if data-next-element exists
      const nextQuestionID = selectedButton.getAttribute("data-next-element")
      if (nextQuestionID) {
        const nextQuestionElement = (this.shadowRoot ?? this).querySelector(`#${nextQuestionID}`);
        nextQuestionElement.classList.remove("hidden");
        //slow scroll to the next question
        //temp fix to prevent scrolling error
        const elementsToNotScrollTo = [
          "guided-add-samples-table",
          "guided-add-pools-table",
          "guided-div-add-subjects-table",
          "guided-div-resume-progress-cards",
          "guided-div-update-uploaded-cards",
        ];
        if (!elementsToNotScrollTo.includes(nextQuestionID)) nextQuestionElement[0].scrollIntoView({ behavior: "smooth" });
      }
  }

  resume = async (resumeProgressButton) => {
    resumeProgressButton.classList.add("loading");
    const datasetNameToResume = resumeProgressButton.parentNode.parentNode.querySelector(".progress-file-name").innerText;
    const datasetResumeJsonObj = await progress.get(datasetNameToResume);

    // If the dataset had been previously successfully uploaded, check to make sure it exists on Pennsieve still.
    if (datasetResumeJsonObj["previous-guided-upload-dataset-name"]) {
      const previouslyUploadedName = datasetResumeJsonObj["previous-guided-upload-dataset-name"];
      const datasetToResumeExistsOnPennsieve = await checkIfDatasetExistsOnPennsieve(
        previouslyUploadedName
      );
      if (!datasetToResumeExistsOnPennsieve) {
        notyf.open({
          type: "error",
          message: `The dataset ${previouslyUploadedName} was not found on Pennsieve therefore you can no longer modify this dataset via Guided Mode.`,
          duration: 7000,
        });
        resumeProgressButton.classList.remove("loading");
        return;
      }
    }

    this.info.globalState = datasetResumeJsonObj

    //Return the user to the last page they exited on
    let pageToReturnTo = this.info.globalState["page-before-exit"];
    if (pageToReturnTo) this.onTransition(pageToReturnTo)
    else throw new Error("No page to return to")
  }


  async updated(){

    this.info.globalState = {} // Reset the global information

    const htmlBase =  this.shadowRoot ?? this
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
    const lottieContainer = htmlBase.querySelector("#new-dataset-lottie-container")
    lottieContainer.innerHTML = "";
    lottie.loadAnimation({
      container: lottieContainer,
      animationData: newDataset,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });

    // Render existing conversion pipelines
  // guidedResetProgressVariables();

  this.resetRadioButtons("guided-div-dataset-cards-radio-buttons");

  const datasetCardsRadioButtonsContainer = htmlBase.querySelector("#guided-div-dataset-cards-radio-buttons");

  const guidedSavedProgressFiles = await progress.getEntries()

  //render progress resumption cards from progress file array on first page of guided mode
  if (guidedSavedProgressFiles.length != 0) {
    datasetCardsRadioButtonsContainer.classList.remove("hidden");
    const progressFileData = await progress.getAll(guidedSavedProgressFiles);
    this.renderProgressCards(progressFileData);
    htmlBase.querySelector("#guided-button-view-datasets-in-progress").click();
  } else {
    htmlBase.querySelector("#guided-continue-curation-header").innerHTML = "";
    datasetCardsRadioButtonsContainer.classList.add("hidden");
  }

}

  render() {
    return html`
        <div id="guided-home" class="guided--main-tab">
          <div class="guided--panel">
          <h1 class="guided--text-sub-step">Guided Mode</h1>
          <p class="guided--help-text" style="margin-bottom: 2rem">
              NWB GUIDE is intended to guide users step-by-step through all the requirements for
              converting their data to the NWB format and uploading datasets to the DANDI Archive. The user interfaces
              of the Guided Mode are designed to logically guide users through the conversion process and
              include all necessary information such that no prior knowledge of the NWB data
              standard is required.
            </p>

            <div class="justify-center" id="curate-new-home" style="align-items: center">
              <div
                class="container--dashed"
                id="guided-button-start-new-curate"
                style="width: 320px; margin: 5px; width: 28rem; height: 16.5rem"
                @click="${() => {
                    this.onTransition('guided/start')
                    // //Hide the home screen
                    // document.getElementById("guided-home").classList.add("hidden");
                    // //Hide the header and footer for the dataset name/subtitle page
                    // $("#guided-header-div").hide();
                    // $("#guided-footer-div").hide();

                    // //Show the guided mode starting container
                    // document.getElementById("guided-mode-starting-container").classList.remove("hidden");

                    // //hide the name+subtitle page and show the intro page
                    // switchElementVisibility("guided-new-dataset-info", "guided-intro-page");
                    // //Reset name, subtitle, and subtitle char count
                    // document.getElementById("guided-dataset-name-input").value = "";
                    // document.getElementById("guided-dataset-subtitle-input").value = "";
                    // document.getElementById("guided-subtitle-char-count").innerHTML = `255 characters remaining`;

                    // guidedLockSideBar();

                    // //Show the intro footer
                    // document.getElementById("guided-footer-intro").classList.remove("hidden");
                }}"
              >
                <div id="new-dataset-lottie-container" style="height: 150px; width: 150px"></div>
                <h2 class="guided--text-sub-step" style="width: 100%;">Convert a new dataset</h2>
              </div>
            </div>

            <div
              class="guided--panel"
              id="continue-curating-existing"
              style="margin-top: 20px; width: 100%"
            >
              <h2 class="guided--text-sub-step" id="guided-continue-curation-header"></h2>
              <div
                class="guided--radio-button-container hidden guided--button-tab-container"
                id="guided-div-dataset-cards-radio-buttons"
                style="justify-content: space-evenly"
              >
                <button
                  class="ui button guided--radio-button guided--tab-button"
                  id="guided-button-view-datasets-in-progress"
                  data-next-element="guided-div-resume-progress-cards"
                  style="width: 250px"
                >
                  Conversions in Progress
                </button>
              </div>
            </div>
            <div class="guided--section hidden" id="guided-div-resume-progress-cards"></div>
            <div class="guided--section hidden" id="guided-div-update-uploaded-cards"></div>
          </div>
        </div>
    `;
  }
};

customElements.get('nwbguide-guided-home-page') || customElements.define('nwbguide-guided-home-page',  GuidedHomePage);
