

import { html } from 'lit';
import { Page } from '../Page.js';
import lottie from 'lottie-web';

export class GuidedHomePage extends Page {

  constructor () {
    super()
  }

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
    const lottieContainer = (this.shadowRoot ?? this).querySelector("#new-dataset-lottie-container")
    lottieContainer.innerHTML = "";
    lottie.loadAnimation({
      container: lottieContainer,
      animationData: newDataset,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });

  }

  render() {
    return html`
  <section
    class="section js-section u-category-windows"
  >

        <div id="guided-home" class="guided--main-tab">
          <div class="guided--panel">
            <h1 class="guided--text-sub-step">Guided Mode</h1>
            <!-- <div class="title-border">
              </div> -->
            <p class="guided--help-text" style="margin-bottom: 2rem">
              The Guided Mode is intended to guide users step-by-step through all the requirements for
              curating and sharing datasets according to the SPARC data standards. The user interfaces
              of the Guided Mode are designed to logically guide users through the curation steps and
              include all necessary information such that no prior knowledge of the SPARC data
              standards is required. Contrary to the Free Form Mode, the Guided Mode interfaces are
              interconnected and form a single workflow such that the curation process is streamlined
              further.
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
                <h2 class="guided--text-sub-step">Begin curating a new dataset</h2>
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
                  Datasets in progress
                </button>
                <button
                  class="ui button guided--radio-button guided--tab-button"
                  id="guided-button-view-datasets-uploaded"
                  data-next-element="guided-div-update-uploaded-cards"
                  style="width: 250px"
                >
                  Datasets uploaded to Pennsieve
                </button>
              </div>
            </div>
            <div class="guided--section hidden" id="guided-div-resume-progress-cards"></div>
            <div class="guided--section hidden" id="guided-div-update-uploaded-cards"></div>
          </div>
        </div>
    </section>
    `;
  }
};

customElements.get('nwbguide-guided-home-page') || customElements.define('nwbguide-guided-home-page',  GuidedHomePage);
