

import { html } from 'lit';
import { Page } from '../../Page.js';

// For Multi-Select Form
import { baseUrl, notyf } from '../../../../globals.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';

export class GuidedPathExpansionPage extends Page {

  constructor(...args) {
    super(...args)

  }

  footer = {
    onNext: async () => {

      this.save() // Save in case the schema request fails

      const results = await fetch(`${baseUrl}/neuroconv/autodetect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.info.globalState.structure.results)
      }).then((res) => res.json())

      const subjects = Object.keys(results)
      if (subjects.length === 0) {
        const message = "No subjects found with the current configuration. Please try again."
        notyf.open({
          type: "error",
          message,
        })
        throw message
      }

      const first_subject = Object.keys(results)[0]
      const first_session = Object.keys(results[first_subject])[0]
      const interfaces_info = results[first_subject][first_session]

      // Funnel down to one subject + session until we have a mechanism for representing all of them
      this.info.globalState.source.results = interfaces_info.source_data
      this.info.globalState.metadata.results = interfaces_info.metadata 

      this.onTransition(1)
    }
  }

  async updated(){

}

  render() {

    let structureGlobalState = this.info.globalState.structure
    if (!structureGlobalState) structureGlobalState = this.info.globalState.structure = {
      results: {},
    }

   const baseSchema = {
      properties: {
        folder: {
          type: 'string',
          format: 'directory',
          description: 'Enter the base directory of your source data.',
        },

        // Transposed from Metadata (manual entry)
        file_path: {
          type: "string",
          description: 'Enter a format string to autodetect source data.',
          placeholder: "{subject_id}_{session_id}_{task_name}/{subject_id}_{session_id}_{task_name}_imec0/{subject_id}_{session_id}_{task_name}_t0.imec0.ap.bin"},
          // {subject_id}_{session_id}_{task_name}/{subject_id}_{session_id}_{task_name}_imec0/{subject_id}_{session_id}_{task_name}_t0.imec0.ap.bin

      },
      required: ['base_directory', 'format_string']
    }

    // Require properties for all sources
    const generatedSchema = {type: 'object', properties: {}}
    for (let key in this.info.globalState.source.interfaces) generatedSchema.properties[key] = { type: 'object', ...baseSchema }
    structureGlobalState.schema = generatedSchema

    const form = this.form = new JSONSchemaForm({
      ...structureGlobalState
    })

    form.style.width = '100%'


    return html`
        <div class="guided--panel" id="guided-new-dataset-info" style="flex-grow: 1">
        <div class="title">
          <h1 class="guided--text-sub-step">Source Data Autodetection</h1>
        </div>
        <div class="guided--section">
         ${form}
        </div>
      </div>
    </div>
    `;
  }
};

customElements.get('nwbguide-guided-pathexpansion-page') || customElements.define('nwbguide-guided-pathexpansion-page',  GuidedPathExpansionPage);
