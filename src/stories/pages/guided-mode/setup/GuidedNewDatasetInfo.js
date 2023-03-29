

import { html } from 'lit';
import { hasEntry, update } from '../../../../progress.js';
import { Page } from '../../Page.js';

import { notyf } from '../../../../globals.js';

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
      // Update existing progress file
      if (this.info.globalState.initialized) await update(name, this.info.globalState.name)
      else {
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

    this.info.globalState.initialized = true

    Object.assign(this.info.globalState, this.state)
    this.onTransition(1)

  }
}

  render() {

    // Transfer global state if applicable
    this.state.name = this.info.globalState.name

    return html`
        <div class="guided--panel" id="guided-new-dataset-info" style="flex-grow: 1">
        <div class="title">
          <h1 class="guided--text-sub-step">Project Setup</h1>
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
      </div>
    </div>
    `;
  }
};

customElements.get('nwbguide-guided-newdataset-page') || customElements.define('nwbguide-guided-newdataset-page',  GuidedNewDatasetPage);
