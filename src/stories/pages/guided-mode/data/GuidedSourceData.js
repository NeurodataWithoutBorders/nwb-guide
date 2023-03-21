

import { html } from 'lit';
import { Page } from '../../Page.js';

import globals from '../../../../../scripts/globals.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
const { port, notyf } = globals;

const base = `http://127.0.0.1:${port}`;

export class GuidedSourceDataPage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    onNext: async () => {
      // TODO: Insert validation here...
      const valid = true
      if (!valid) throw new Error('Invalid input')

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

      let metadataInfo = this.info.globalState.metadata
      if (!metadataInfo) metadataInfo = this.info.globalState.metadata = {results: {}, schema: {}}

      const schema = await fetch(`${base}/neuroconv/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.info.globalState.source.results)
      }).then((res) => res.json())


      Swal.close();

      if (schema.message) {
        const message = "Failed to get metadata with current source data. Please try again."
        notyf.open({
          type: "error",
          message,
        });
        throw new Error(`Failed to get metadata for source data provided: ${schema.message}`)
      }

      metadataInfo.schema = schema

      this.onTransition(1)
    }
  }

  render() {

    const form = new JSONSchemaForm({
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
        ${form}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-sourcedata-page') || customElements.define('nwbguide-guided-sourcedata-page',  GuidedSourceDataPage);
