

import { html } from 'lit';
import { Page } from '../Page.js';
import './GuidedFooter';

export class GuidedStartPage extends Page {

  constructor(...args) {
    super(...args)
    this.info.globalState = {} // Reset global state when navigating back to this page
  }

  updated() {

    // this.content = (this.shadowRoot ?? this).querySelector("#content");
    // Handle dropdown text
    const infoDropdowns = (this.shadowRoot ?? this).getElementsByClassName("guided--info-dropdown");
    for (const infoDropdown of Array.from(infoDropdowns)) {
      const infoTextElement = infoDropdown.querySelector(".guided--dropdown-text");

      // Auto-add icons if they're not there
      const dropdownType = infoTextElement.dataset.dropdownType;
      if (infoTextElement.previousSibling.tagName !== 'I') {
        if (dropdownType === "info") {
          //insert the info icon before the text
          infoTextElement.insertAdjacentHTML("beforebegin", ` <i class="fas fa-info-circle"></i>`);
        }
        if (dropdownType === "warning") {
          //insert the warning icon before the text
          infoTextElement.insertAdjacentHTML(
            "beforebegin",
            ` <i class="fas fa-exclamation-triangle"></i>`
          );
        }
      }

      infoDropdown.onclick = () => {
        const infoContainer = infoDropdown.nextElementSibling;
        const infoContainerChevron = infoDropdown.querySelector(".fa-chevron-right");

        const infoContainerIsopen = infoContainer.classList.contains("container-open");

        if (infoContainerIsopen) {
          infoContainerChevron.style.transform = "rotate(0deg)";
          infoContainer.classList.remove("container-open");
        } else {
          infoContainerChevron.style.transform = "rotate(90deg)";
          infoContainer.classList.add("container-open");
        }
      };
    }
  }

  render() {

    return html`
        <div
          id="guided-mode-starting-container"
          class="guided--main-tab"
          data-parent-tab-name="Dataset Structure"
        >
          <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
            <div class="title-border">
              <h1 class="guided--text-sub-step">Welcome to Guided Mode!</h1>
            </div>
            <div class="guided--section">
              <p class="guided--help-text">
              Guided Mode is divided into four high-level sections. During the first three sections,
              you will be directed to specify the data formats and files to include in your dataset and provide
              information about your dataset. In the final section, NWB GUIDE will automatically generate
              a valid NWB file and ask for your review before uploading to DANDI. Note
              that none of your local data files will ever be modified or moved.
              </p>
              <div class="guided--info-dropdown">
                <p class="guided--dropdown-text" data-dropdown-type="info">
                  Learn more about the conversion process
                </p>
                <i class="fas fa-chevron-right"></i>
              </div>
              <div class="guided--info-container">
                <p class="guided--help-text">
                  Although not required to use Guided Mode, you can learn more about the NWB conversion process in the
                  <a href="https://neuroconv.readthedocs.io/en/main" target="_blank"
                    >neuroconv documentation page</a
                  >.
                </p>
              </div>
            </div>
          </div>
        </div>
        `;
  }
};

customElements.get('nwbguide-guided-start-page') || customElements.define('nwbguide-guided-start-page', GuidedStartPage);
