

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

      // const previousResults = this.info.globalState.metadata.results

      this.save() // Save in case the metadata request fails

      await Promise.all(this.mapSessions(async ({ subject, session, info }) => {

        // NOTE: This clears all user-defined results
        const result = await fetch(`${baseUrl}/neuroconv/metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_data: info.source_data,
            interfaces: this.info.globalState.interfaces,
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

        // Merge metadata results with the generated info
        this.merge('metadata', result.results, info)

        // Mirror structure with metadata schema
        const schema = this.info.globalState.schema
        if (!schema.metadata) schema.metadata = {}
        if (!schema.metadata[subject]) schema.metadata[subject] = {}
        schema.metadata[subject][session] = result.schema
      }))

      this.onTransition(1)
    }
  }

  render() {

    const forms = this.mapSessions(({ subject, session, info }) => {
      const form = new JSONSchemaForm({
        schema: this.info.globalState.schema.source_data,
        results: info.source_data,
        ignore: ['verbose'],
        onlyRequired: true,
      })

      return html`
        <h2 class="guided--text-sub-step">Subject: ${subject} - Session: ${session}</h2>
        ${form}
      `
    })

    // const form = new JSONSchemaForm({
    //   ...this.info.globalState.source,
    //   ignore: ['verbose'],
    //   onlyRequired: true,
    // })

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
        ${forms}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-sourcedata-page') || customElements.define('nwbguide-guided-sourcedata-page',  GuidedSourceDataPage);
