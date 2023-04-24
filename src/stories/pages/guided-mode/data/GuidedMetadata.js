

import { html } from 'lit';
import { Page } from '../../Page.js';

import { validateOnChange } from '../../../../validation/index.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';


export class GuidedMetadataPage extends Page {

  constructor(...args) {
    super(...args)
  }

  form;
  footer = {
    onNext: async () => {
      this.save()
      await this.form.validate() // Will throw an error in the callback
      this.onTransition(1)
    }
  }

  render() {


    const results = this.info.globalState.metadata.results

    // Merge project-wide data into metadata
    const toMerge = Object.entries(this.info.globalState.project).filter(([_, value]) => value && typeof value === 'object')
    toMerge.forEach(([key, value]) => {
      let internalMetadata = results[key]
      if (!results[key]) internalMetadata = results[key] = {}
      for (let key in value) {
        if (!(key in internalMetadata)) internalMetadata[key] = value[key] // Prioritize existing results (cannot override with new information...)
      }
    })

    // Properly clone the schema to produce multiple pages from the project metadata schema
    const schema = { ...this.info.globalState.metadata.schema }
    schema.properties = {...schema.properties}

    this.form = new JSONSchemaForm({
      schema,
      results,
      ignore: ['Ecephys', 'source_script', 'source_script_file_name'],
      conditionalRequirements: [
        {
          name: 'Subject Age',
          properties: [['Subject', 'age'], ['Subject', 'date_of_birth']]
        }
      ],
      validateOnChange,
      required: {
        NWBFile: {
          session_start_time: true
        },
      }
    })

    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="guided--section">
       ${this.form}
      </div>
  </div>
    `;

  }
};

customElements.get('nwbguide-guided-metadata-page') || customElements.define('nwbguide-guided-metadata-page',  GuidedMetadataPage);
