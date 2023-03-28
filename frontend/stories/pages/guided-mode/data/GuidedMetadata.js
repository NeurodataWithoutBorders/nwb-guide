

import { html } from 'lit';
import { Page } from '../../Page.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';

export class GuidedMetadataPage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    onNext: async () => {
      // TODO: Insert validation here...
      const valid = true
      if (!valid) throw new Error('Invalid metadata')

      this.onTransition(1)
    }
  }


  render() {

    const form = new JSONSchemaForm({
      ...this.info.globalState.metadata,
      ignore: ['Ecephys'],
      onlyRequired: false,
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
       ${form}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-metadata-page') || customElements.define('nwbguide-guided-metadata-page',  GuidedMetadataPage);
