

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

  // Merge project-wide data into metadata
  populateWithProjectMetadata(info){
    const toMerge = Object.entries(this.info.globalState.project).filter(([_, value]) => value && typeof value === 'object')
    toMerge.forEach(([key, value]) => {
      let internalMetadata = info[key]
      if (!info[key]) internalMetadata = info[key] = {}
      for (let key in value) {
        if (!(key in internalMetadata)) internalMetadata[key] = value[key] // Prioritize existing results (cannot override with new information...)
      }
    })

    return info
  }

  render() {

    const forms = this.mapSessions(({subject, session, info }) => {

      const results = this.populateWithProjectMetadata(info.metadata)

      const form = new JSONSchemaForm({
        schema: this.info.globalState.schema.metadata[subject][session],
        results,
        ignore: ['Ecephys', 'source_script', 'source_script_file_name'],
        onlyRequired: false,
      })

      return html`
        <h2 class="guided--text-sub-step">Subject: ${subject} - Session: ${session}</h2>
        ${form}
      `
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
       ${forms}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-metadata-page') || customElements.define('nwbguide-guided-metadata-page',  GuidedMetadataPage);
