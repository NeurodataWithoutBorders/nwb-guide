

import { html } from 'lit';
import { Page } from '../../Page.js';

export class GuidedNewDatasetPage extends Page {

  constructor(...args) {
    super(...args)
  }

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
  }

  render() {

    return html`
        <div class="guided--panel" id="guided-new-dataset-info" style="flex-grow: 1">
        <div class="title">
          <h1 class="guided--text-sub-step">Project metadata</h1>
        </div>
        <div class="guided--section">
          <label class="guided--form-label">Project Name</label>
          <input
            class="guided--input"
            id="guided-dataset-name-input"
            data-input-set="guided-dataset-starting-point-tab"
            data-alert-message="A Pennsieve dataset name cannot contain any of the following characters: /:*?'."
            data-alert-type="danger"
            type="text"
            name="guided-dataset-name"
            placeholder="Enter dataset name here"
          />
          <p class="guided--text-input-instructions mb-0">Enter the name of your project.</p>
        </div>
        <div class="guided--section">
          <label class="guided--form-label">DOIs of Relevant Publications</label>
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
            maxlength="255"
          ></textarea>
          <p class="guided--text-input-instructions mb-0">
            Separete multiple DOIs with a comma.
          </p>
        </div>
      </div>
    </div>
    `;
  }
};

customElements.get('nwbguide-guided-newdataset-page') || customElements.define('nwbguide-guided-newdataset-page',  GuidedNewDatasetPage);
