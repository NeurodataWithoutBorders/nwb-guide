

import { html } from 'lit';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { Page } from '../../Page.js';

import Swal from 'sweetalert2'
import { notyf, baseUrl } from '../../../../globals.js';

export class GuidedConversionTypePage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    next: false
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
    if (!conversionGlobalState) conversionGlobalState = this.info.globalState.conversion = {info: {}, results: null}

    const form = new JSONSchemaForm({
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
    convertButton.textContent = 'Convert'
    convertButton.addEventListener('click', async () => {

        // TODO: Insert validation here...
        const valid = true
        if (!valid) throw new Error('Invalid input')

        Swal.fire({
          title: "Running conversion",
          html: "Please wait...",
          allowEscapeKey: false,
          allowOutsideClick: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
          didOpen: () => {
            Swal.showLoading();
          },
        })


        this.info.globalState.conversion.results = null

        this.save() // Save in case the conversion fails

        const results = await fetch(`${baseUrl}/neuroconv/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...this.info.globalState.conversion.info,

            // Override with the lastest source data and metadata information
            source_data: this.info.globalState.source.results,
            metadata: this.info.globalState.metadata.results
          })
        }).then((res) => res.json())


        Swal.close();

        if (results.message) {
          const message = results.message.includes('already exists') ? "File already exists. Please specify another location to store the conversion results" : "Conversion failed with current metadata. Please try again."
          notyf.open({
            type: "error",
            message,
          });
          throw new Error(`Conversion failed with current metadata: ${results.message}`)
        }

        this.info.globalState.conversion.results = results

        this.onTransition(1)
    })

    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Conversion Options</h1>
      </div>
      <div class="guided--section">
      ${form}
      <br>
      ${convertButton}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-conversion-type-page') || customElements.define('nwbguide-guided-conversion-type-page',  GuidedConversionTypePage);
