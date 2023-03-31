

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


    const metadataResults = this.info.globalState.metadata.results

    // Merge project-wide data into metadata
    const toMerge = Object.entries(this.info.globalState.project).filter(([_, value]) => value && typeof value === 'object')
    toMerge.forEach(([key, value]) => {
      let internalMetadata = metadataResults[key]
      if (!metadataResults[key]) internalMetadata = metadataResults[key] = {}
      for (let key in value) {
        if (!(key in internalMetadata)) internalMetadata[key] = value[key] // Prioritize existing results (cannot override with new information...)
      }
    })

    this.form = new JSONSchemaForm({
      ...this.info.globalState.metadata,
      ignore: ['Ecephys', 'source_script', 'source_script_file_name'],
      required: {
        NWBFile: {
          session_start_time: true
        },
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
        <h1 class="guided--text-sub-step">NWB File Metadata</h1>
      </div>
      <div class="guided--section">
       ${this.form}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-metadata-page') || customElements.define('nwbguide-guided-metadata-page',  GuidedMetadataPage);
