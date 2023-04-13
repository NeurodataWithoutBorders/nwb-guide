

import { html } from 'lit';
import { Page } from '../../Page.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';

import { validateOnChange } from '../../../../validation/index.js';


export class GuidedMetadataPage extends Page {

  constructor(...args) {
    super(...args)
  }

  form;

  footer = {
    onNext: async () => {
      this.save()
      await Promise.all(this.forms.map(({ form }) => form.validate())) // Will throw an error in the callback
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

    this.forms = this.mapSessions(({subject, session, info }) => {

      const results = this.populateWithProjectMetadata(info.metadata)

      const form = new JSONSchemaForm({
        schema: this.info.globalState.schema.metadata[subject][session],
        results,
        ignore: ['Ecephys', 'source_script', 'source_script_file_name'],
        validateOnChange,
        onlyRequired: false,
      })

      return {
        subject,
        session,
        form
      }
    })

    const formsToRender = this.forms.map(info => {
      return html`
        <h2 class="guided--text-sub-step">Subject: ${info.subject} - Session: ${info.session}</h2>
        ${info.form}
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
       ${formsToRender}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-metadata-page') || customElements.define('nwbguide-guided-metadata-page',  GuidedMetadataPage);
