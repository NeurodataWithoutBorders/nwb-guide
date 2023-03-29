

import { html } from 'lit';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { Page } from '../../Page.js';

import { runConversion } from './utils.js';

export class GuidedConversionOptionsPage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    next: 'Run Conversion Preview',
    onNext: async () => {
      this.save() // Save in case the conversion fails
      this.form.validate() // Will throw an error in the callback
      
      delete this.info.globalState.preview // Clear the preview results

      const results = await runConversion({
        ...this.info.globalState.conversion.info,
        stub_test: true,
        overwrite: true,

        // Override with the lastest source data and metadata information
        source_data: this.info.globalState.source.results,
        metadata: this.info.globalState.metadata.results
      })

      this.info.globalState.preview = results // Save the preview results

      this.onTransition(1)
    }
  }

  render() {

    const schema = {
      properties: {
        nwbfile_path: {
          type: 'string',
          format: 'file'
        }
      },
      required: ['nwbfile_path']
    }

    let conversionGlobalState = this.info.globalState.conversion
    if (!conversionGlobalState) {
      conversionGlobalState = this.info.globalState.conversion = {info: {
        override: true // We assume override is true because the native NWB file dialog will not allow the user to select an existing file (unless they approve the overwrite)
      }, results: null}
    }

    this.form = new JSONSchemaForm({
      schema,
      results: conversionGlobalState.info,
      dialogType: 'showSaveDialog',
      dialogOptions: {
        properties: [ 'createDirectory' ],
        defaultPath: 'converted.nwb',
        filters: [
          { name: 'NWB File', extensions: ['nwb'] }
        ]
      }
    })


    const convertButton = document.createElement('nwb-button')
    convertButton.textContent = 'Run Conversion Preview'
    convertButton.addEventListener('click', this.footer.onNext)

    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Conversion Details</h1>
      </div>
      <div class="guided--section">
      <h3>NWB File Path</h3>
      ${this.form}
      <br>
      ${convertButton}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-conversion-options-page') || customElements.define('nwbguide-guided-conversion-options-page',  GuidedConversionOptionsPage);
