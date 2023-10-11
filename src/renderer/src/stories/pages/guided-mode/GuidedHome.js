import { html } from "lit";
import { Page } from "../Page.js";
import { ProgressCard } from "./ProgressCard.js";

import { startLottie } from "../../../dependencies/globals.js";
import * as progress from "../../../progress/index.js";
import { newDataset } from "../../../../assets/lotties/index.js";

export class GuidedHomePage extends Page {
    constructor(...args) {
        super(...args);
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
                elementToHide.setAttribute("hidden", "");
            }
        }
    }

    renderProgressCards = (progressFileJSONdata) => {
        const htmlBase = this.shadowRoot ?? this;

        //sort progressFileJSONdata by date to place newest cards on top
        progressFileJSONdata.sort((a, b) => {
            return new Date(b["last-modified"]) - new Date(a["last-modified"]);
        });

        //sort progressFileJSONdata into two rows one with property "previous-guided-upload-dataset-name"
        //and one without property "previous-guided-upload-dataset-name"
        const progressDataAlreadyUploadedToPennsieve = progressFileJSONdata.filter((progressFileJSONobj) => {
            return progressFileJSONobj["previous-guided-upload-dataset-name"];
        });
        const progressDataNotYetUploadedToPennsieve = progressFileJSONdata.filter((progressFileJSONobj) => {
            return !progressFileJSONobj["previous-guided-upload-dataset-name"];
        });
        //Add the progress cards that have already been uploaded to Pennsieve
        //to their container (datasets that have the globals.sodaJSONObj["previous-guided-upload-dataset-name"] property)

        const uploadedList = htmlBase.querySelector("#guided-div-update-uploaded-cards");
        uploadedList.innerHTML = "";

        const createCard = (progressFile) => {
            const card = new ProgressCard(progressFile);
            card.resume = (...args) => this.resume(...args);
            return card;
        };

        if (progressDataAlreadyUploadedToPennsieve.length > 0) {
            progressDataAlreadyUploadedToPennsieve.forEach((progressFile) =>
                uploadedList.appendChild(createCard(progressFile))
            );
        } else
            uploadedList.innerHTML = `
      <h2 class="guided--text-sub-step">
        No local datasets have been uploaded to Pennsieve yet.
      </h2>
      <p class="guided--text-input-instructions m-0 text-center">
        <b>Click "Datasets in progress" to view local datasets in progress.</b>
      </p>
    `;

        //Add the progress cards that have not yet been uploaded to Pennsieve
        //to their container (datasets that do not have the globals.sodaJSONObj["previous-guided-upload-dataset-name"] property)
        const resumeList = htmlBase.querySelector("#guided-div-resume-progress-cards");
        resumeList.innerHTML = "";

        if (progressDataNotYetUploadedToPennsieve.length > 0) {
            progressDataNotYetUploadedToPennsieve.forEach((progressFile) =>
                resumeList.appendChild(createCard(progressFile))
            );
        } else
            resumeList.innerHTML = `
      <h2 class="guided--text-sub-step">
        All local datasets have been previously uploaded to Pennsieve.
      </h2>
      <p class="guided--text-input-instructions m-0 text-center">
        <b>Click "Datasets uploaded to Pennsieve" to view local datasets that have already been uploaded to Pennsieve.</b>
      </p>
    `;

        const radioButtons = Array.from(htmlBase.querySelectorAll(".guided--radio-button"));
        radioButtons.forEach((radioButton) => {
            radioButton.onclick = () =>
                this.#onRadioClick(
                    radioButton,
                    radioButtons.filter((button) => button !== radioButton)
                );
        });
    };

    #onRadioClick = (selectedButton, notSelectedButton) => {
        notSelectedButton.forEach((button) => {
            button.classList.add("selected");
            button.classList.add("not-selected");
            button.classList.add("basic");
        });

        //If button has prevent-radio-handler data attribute, other buttons, will be deselected
        //but all other radio button functions will be halted
        if (selectedButton.getAttribute("data-prevent-radio-handler") === true) return;

        selectedButton.classList.remove("not-selected");
        selectedButton.classList.remove("basic");
        selectedButton.classList.add("selected");

        //Hide all child containers of non-selected buttons
        notSelectedButton.forEach((button) => {
            const id = button.getAttribute("data-next-element");
            if (id) (this.shadowRoot ?? this).querySelector(`#${id}`).setAttribute("hidden", "");
        });

        //Display and scroll to selected element container if data-next-element exists
        const nextQuestionID = selectedButton.getAttribute("data-next-element");
        if (nextQuestionID) {
            const nextQuestionElement = (this.shadowRoot ?? this).querySelector(`#${nextQuestionID}`);
            nextQuestionElement.removeAttribute("hidden");
            //slow scroll to the next question
            //temp fix to prevent scrolling error
            const elementsToNotScrollTo = [
                "guided-add-samples-table",
                "guided-add-pools-table",
                "guided-div-add-subjects-table",
                "guided-div-resume-progress-cards",
                "guided-div-update-uploaded-cards",
            ];
            if (!elementsToNotScrollTo.includes(nextQuestionID))
                nextQuestionElement[0].scrollIntoView({ behavior: "smooth" });
        }
    };

    resume = async (resumeProgressButton) => {
        resumeProgressButton.classList.add("loading");
        const datasetNameToResume =
            resumeProgressButton.parentNode.parentNode.querySelector(".progress-file-name").innerText;

        progress.resume.call(this, datasetNameToResume);
    };

    async updated() {
        this.info.globalState = {}; // Reset global state when navigating back to this page

        const htmlBase = this.shadowRoot ?? this;
        // this.content = (this.shadowRoot ?? this).querySelector("#content");
        const lottieContainer = htmlBase.querySelector("#new-dataset-lottie-container");
        startLottie(lottieContainer, newDataset);

        // Render existing conversion pipelines
        // guidedResetProgressVariables();

        this.resetRadioButtons("guided-div-dataset-cards-radio-buttons");

        const datasetCardsRadioButtonsContainer = htmlBase.querySelector("#guided-div-dataset-cards-radio-buttons");

        const guidedSavedProgressFiles = progress.getEntries();

        //render progress resumption cards from progress file array
        if (guidedSavedProgressFiles.length != 0) {
            datasetCardsRadioButtonsContainer.removeAttribute("hidden");
            const progressFileData = progress.getAll(guidedSavedProgressFiles);
            this.renderProgressCards(progressFileData);
            htmlBase.querySelector("#guided-button-view-datasets-in-progress").click();
        } else {
            htmlBase.querySelector("#guided-continue-curation-header").innerHTML = "";
            datasetCardsRadioButtonsContainer.setAttribute("hidden", "");
        }
    }

    render() {
        return html`

        <div class="standalone-section">

            <div style="width: 800px;">
                    <div style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 5px;">
                        <h1 style="margin: 0;">Your Conversions</h1>
                    </div>
                    <hr />
            </div>

            <p class="guided--help-text" style="margin-bottom: 2rem">
                The NWB GUIDE walks users step-by-step through all the requirements for converting their data to
                the NWB format and uploading datasets to the DANDI Archive. Each stage is
                designed to conveniently guide users through the conversion process and include all necessary
                information such that no prior knowledge of the NWB data standard is required.
            </p>

            <div class="justify-center" id="curate-new-home" style="align-items: center">
                <div
                    class="container--dashed"
                    id="guided-button-start-new-curate"
                    style="margin: 5px;"
                    @click="${() => this.to(1)}"
                >
                    <div id="new-dataset-lottie-container" style="height: 150px; width: 150px"></div>
                    <h2 class="guided--text-sub-step" style="width: 100%;">Create a new conversion pipeline</h2>
                </div>
            </div>

            <div style="max-width: 800px; width: 100%;">
                <div
                    id="continue-curating-existing"
                    style="margin-top: 20px; width: 100%"
                >
                    <h2 class="guided--text-sub-step" id="guided-continue-curation-header"></h2>
                    <div
                        class="guided--radio-button-container guided--button-tab-container"
                        hidden
                        id="guided-div-dataset-cards-radio-buttons"
                        style="justify-content: space-evenly"
                    >
                        <button
                            class="ui button guided--radio-button guided--tab-button"
                            id="guided-button-view-datasets-in-progress"
                            data-next-element="guided-div-resume-progress-cards"
                            style="width: 250px"
                        >
                            Existing Conversions
                        </button>
                    </div>
                </div>
                <div class="guided--section" hidden id="guided-div-resume-progress-cards"></div>
                <div class="guided--section" hidden id="guided-div-update-uploaded-cards"></div>
            </div>
        </div>
        `;
    }
}

customElements.get("nwbguide-guided-home-page") || customElements.define("nwbguide-guided-home-page", GuidedHomePage);
