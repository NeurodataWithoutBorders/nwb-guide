

import { html } from 'lit';
import { Page } from '../../Page.js';

import Swal from 'sweetalert2'
import { notyf, baseUrl } from '../../../../globals.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';

export class GuidedSourceDataPage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    onNext: async () => {

      this.save() // Save in case the conversion fails
      this.form.validate() // Will throw an error in the callback

      Swal.fire({
        title: "Getting metadata for source data",
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

      // NOTE: This clears all user-defined results
      const result = await fetch(`${baseUrl}/neuroconv/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_data: this.info.globalState.source.results,
          interfaces: this.info.globalState.source.interfaces,
        })
      }).then((res) => res.json())


      Swal.close();

      if (result.message) {
        const message = "Failed to get metadata with current source data. Please try again."
        notyf.open({
          type: "error",
          message,
        });
        throw new Error(`Failed to get metadata for source data provided: ${result.message}`)
      }

      this.info.globalState.metadata = result

      this.onTransition(1)
    }
  }

  render() {

    this.form = new JSONSchemaForm({
      ...this.info.globalState.source,
      ignore: ['verbose'],
      onlyRequired: true,
    })

    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Source Data</h1>
      </div>
      <div class="guided--section">
        ${this.form}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-sourcedata-page') || customElements.define('nwbguide-guided-sourcedata-page',  GuidedSourceDataPage);
