

import { html } from 'lit';
import { hasEntry, update } from '../../../../progress.js';
import { Page } from '../../Page.js';

import globals from '../../../../../scripts/globals.js';
const { notyf } = globals;

export class GuidedNewDatasetPage extends Page {

  state = {}

  constructor(...args) {
    super(...args)
  }

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
  }

  footer = {
    onNext: async () => {

      // Check validity of project name
      const name = this.state.name
      if (!name) {

        const message = "Please enter a project name."
        notyf.open({
          type: "error",
          message: message,
          duration: 7000,
        });

        return
      }


      // Check if name is already used
      if (Object.keys(this.info.globalState).length === 0) {
        const has = await hasEntry(name)
        if (has) {
          const message = "An existing progress file already exists with that name. Please choose a different name."
          notyf.open({
            type: "error",
            message: message,
            duration: 7000,
          });

          return
        }
    }

    // Update existing progress file
    else await update(name, this.info.globalState.name)

    Object.assign(this.info.globalState, this.state)
    this.onTransition(1)

  }
}

  render() {

    console.log('rendering GuidedNewDatasetPage', this.state, this.info.globalState)
    // Transfer global state if applicable
    this.state.name = this.info.globalState.name
    this.state.doi = this.info.globalState.doi

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
            placeholder="Enter project name here"
            .value=${this.state.name ?? ''}

            @input=${(ev) => this.state.name = ev.target.value.trim()}
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
            placeholder="Enter project DOIs here"
            style="height: 7.5em; padding-bottom: 20px"
            maxlength="255"
            @input=${(ev) => this.state.doi = ev.target.value}
            .value=${this.state.doi ?? ''}
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
