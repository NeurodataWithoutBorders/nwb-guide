

import { html } from 'lit';
import { Page } from '../Page.js';
import './GuidedHeader.js'

export class GuidedNewDatasetPage extends Page {

  constructor () {
    super()
  }

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
  }

  render() {
    return html`
  <section
    class="section js-section u-category-windows"
  >
        <nwbguide-guided-header></nwbguide-guided-header>

        <div class="guided--panel" id="guided-new-dataset-info" style="flex-grow: 1">
        <div class="title-border">
          <h1 class="guided--text-sub-step">Give your dataset a name and subtitle</h1>
        </div>
        <div class="guided--section">
          <label class="guided--form-label">Dataset name: </label>
          <input
            class="guided--input"
            id="guided-dataset-name-input"
            data-input-set="guided-dataset-starting-point-tab"
            data-alert-message="A Pennsieve dataset name cannot contain any of the following characters: /:*?'."
            data-alert-type="danger"
            type="text"
            name="guided-dataset-name"
            placeholder="Enter dataset name here"
            onkeyup="validateInput($(this))"
          />
          <p class="guided--text-input-instructions mb-0">
            Enter the desired name for your new dataset. This is the field that will be displayed
            in public as the title of the dataset once it is published on the
            <a href="https://sparc.science/">SPARC Data Portal</a>. Please make sure that your
            dataset title is different than your other dataset titles and is relatively
            informative.
          </p>
        </div>
        <div class="guided--section">
          <label class="guided--form-label">Dataset subtitle:</label>
          <p style="height: 0px; margin: 0px">
            <span
              id="guided-subtitle-char-count"
              style="position: relative; top: 100px; color: rgb(117, 107, 107)"
            >
              255 characters left
            </span>
          </p>
          <textarea
            class="guided--input guided--text-area"
            id="guided-dataset-subtitle-input"
            type="text"
            name="guided-dataset-subtitle"
            placeholder="Enter datset subtitle here"
            style="height: 7.5em; padding-bottom: 20px"
            onkeyup="validateInput($(this))"
            maxlength="255"
          ></textarea>
          <p class="guided--text-input-instructions mb-0">
            Add two or three sentences (limit of 255 characters) that describe the content of your
            dataset such that it is possible to differentiate it from other datasets. This field
            will become the short description visible immediately under the title of your dataset
            once it is published on the
            <a href="https://sparc.science/">SPARC Data Portal</a>.
          </p>
        </div>
      </div>
    </div>

    </section>
    `;
  }
};

customElements.get('nwbguide-guided-newdataset-page') || customElements.define('nwbguide-guided-newdataset-page',  GuidedNewDatasetPage);
