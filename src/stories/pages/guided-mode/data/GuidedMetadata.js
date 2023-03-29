

import { html } from 'lit';
import { Page } from '../../Page.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { notify } from '../../../../globals.js';

export class GuidedMetadataPage extends Page {

  constructor(...args) {
    super(...args)
  }

  form;

  footer = {
    onNext: async () => {
      this.save()
      this.form.validate() // Will throw an error in the callback
      this.onTransition(1)
    }
  }


  render() {

    this.form = new JSONSchemaForm({
      ...this.info.globalState.metadata,
      ignore: ['Ecephys'],
      required: {
        Subject: {
          age: true,
          date_of_birth: true
        },
      },
    })

    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Metadata</h1>
      </div>
      <div class="guided--section">
       ${this.form}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-metadata-page') || customElements.define('nwbguide-guided-metadata-page',  GuidedMetadataPage);
