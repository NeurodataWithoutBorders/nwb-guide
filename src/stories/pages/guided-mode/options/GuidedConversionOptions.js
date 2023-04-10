

import { html } from 'lit';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { Page } from '../../Page.js';

export class GuidedConversionOptionsPage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    next: false
  }

  render() {

    const schema = {
      properties: {
        output_folder: {
          type: 'string',
          format: 'directory'
        }
      },
      required: ['output_folder']
    }

    let conversionGlobalState = this.info.globalState.conversion
    if (!conversionGlobalState) {
      conversionGlobalState = this.info.globalState.conversion = {info: {
        override: true // We assume override is true because the native NWB file dialog will not allow the user to select an existing file (unless they approve the overwrite)
      }, results: null}
    }

    const form = new JSONSchemaForm({
      schema,
      results: conversionGlobalState.info,
      dialogType: 'showOpenDialog',
      dialogOptions: {
        properties: [ 'openDirectory', 'createDirectory' ],
      }
    })


    const convertButton = document.createElement('nwb-button')
    convertButton.textContent = 'Run Conversion Preview'
    convertButton.addEventListener('click', async () => {

        // TODO: Insert validation here...
        const valid = true
        if (!valid) throw new Error('Invalid input')

        delete this.info.globalState.preview // Clear the preview results

        this.save() // Save in case the conversion fails

        const results = await this.runConversions({ stub_test: true })


        this.info.globalState.preview = results // Save the preview results

        this.onTransition(1)
    })

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
      ${form}
      <br>
      ${convertButton}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-conversion-options-page') || customElements.define('nwbguide-guided-conversion-options-page',  GuidedConversionOptionsPage);
