import { html } from "lit";
import { Page } from "../Page.js";
import { ProgressCard } from "./ProgressCard.js";

import { startLottie } from "../../../lotties";
import * as progress from "../../../progress/index.js";
import { newDataset } from "../../../../assets/lotties/index.js";

export class GuidedHomePage extends Page {
    renderProgressCards = (progressFileJSONdata) => {
        const htmlBase = this.shadowRoot ?? this;

        // sort progressFileJSONdata by date to place newest cards on top
        progressFileJSONdata.sort((a, b) => {
            return new Date(b["last-modified"]) - new Date(a["last-modified"]);
        });

        const createCard = (progressFile) => {
            const card = new ProgressCard(progressFile);
            card.resume = (...args) => this.resume(...args);
            return card;
        };

        const resumeList = htmlBase.querySelector("#guided-div-resume-progress-cards");
        resumeList.innerHTML = "";

        progressFileJSONdata.forEach((progressFile) =>
            resumeList.appendChild(createCard(progressFile))
        );
    };

    resume = (resumeProgressButton) => {
        // get the name of the dataset by navigating to the card element with class "progress-file-name"
        const datasetNameToResume =
            resumeProgressButton.parentNode.parentNode.querySelector(".progress-file-name").innerText;
        progress.resume.call(this, datasetNameToResume);
    };

    async updated() {
        const htmlBase = this.shadowRoot ?? this;
        const lottieContainer = htmlBase.querySelector("#new-dataset-lottie-container");
        startLottie(lottieContainer, newDataset);

        // for legacy reasons, the "Existing Conversions" tab is a radio button that is always selected
        const datasetCardsRadioButtonsContainer = htmlBase.querySelector("#guided-div-dataset-cards-radio-buttons");
        const guidedSavedProgressFiles = progress.getEntries();

        //render progress resumption cards from progress file array
        if (guidedSavedProgressFiles.length != 0) {
            datasetCardsRadioButtonsContainer.removeAttribute("hidden");
            const progressFileData = progress.getAll(guidedSavedProgressFiles);
            this.renderProgressCards(progressFileData);
        } else {
            htmlBase.querySelector("#guided-continue-curation-header").innerHTML = "";
            datasetCardsRadioButtonsContainer.setAttribute("hidden", "");
        }
    }

    render() {
        return html`
            <div id="curate-new-home" style="display:flex; flex-direction:column; align-items: center">
                <div style="padding-bottom: 20px;">
                    <h3 style="margin-bottom: 0; padding-bottom: 0;">
                        Your one-stop tool for converting data to NWB and uploading it to the DANDI Archive.
                    </h3>
                    <small
                        >Don't know where to go next?
                        <a
                            href=""
                            @click="${(clickEvent) => {
                                clickEvent.preventDefault();
                                this.to("docs");
                            }}"
                            >Learn more about the NWB GUIDE</a
                        >.</small
                    >
                </div>

                <div class="create-button" @click="${() => this.to(1)}">
                    <div id="new-dataset-lottie-container" style="height: 150px; width: 150px"></div>
                    <h2 class="guided--text-sub-step" style="width: 100%;">Create a new conversion pipeline</h2>
                </div>

                <div style="max-width: 800px; width: 100%;">
                    <div id="continue-curating-existing" style="margin-top: 20px; width: 100%">
                        <h2 class="guided--text-sub-step" id="guided-continue-curation-header"></h2>
                        <div
                            class="guided--radio-button-container guided--button-tab-container"
                            hidden
                            id="guided-div-dataset-cards-radio-buttons"
                            style="justify-content: space-evenly"
                        >
                            <button
                                class="ui button guided--radio-button guided--tab-button selected"
                                id="guided-button-view-datasets-in-progress"
                                style="width: 250px"
                            >
                                Existing Conversions
                            </button>
                        </div>
                    </div>
                    <div class="guided--section" id="guided-div-resume-progress-cards"></div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-home-page") || customElements.define("nwbguide-guided-home-page", GuidedHomePage);
