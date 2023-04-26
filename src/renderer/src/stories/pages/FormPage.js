

import { html } from 'lit';
import { JSONSchemaForm } from '../JSONSchemaForm.js';
import { Page } from './Page.js';
import { validateOnChange } from '../../validation/index.js';


export function schemaToPages (schema, sharedGlobalState, options) {
   return Object.entries(schema.properties)
    .filter(([_, value]) => value.properties)
    .map(([key, value]) => {

            sharedGlobalState[key] = sharedGlobalState[key] ?? {} // Create global state object if it doesn't exist

            const optionsCopy = { ...options }
            if (optionsCopy.required && optionsCopy.required[key]) optionsCopy.required = { [key] : optionsCopy.required[key] } // Only bring requirements from the current page
            else delete optionsCopy.required

            const page = new GuidedFormPage({
                label: key,
                section: this.info.section,
                formOptions: {
                    ...optionsCopy,
                    schema: { properties: { [key]: value } },
                    results: { [key]: sharedGlobalState[key] },
                }
            })

            delete schema.properties[key]

            if (optionsCopy.ignore && optionsCopy.ignore.includes(key)) return null
            return page
    }).filter(page => page)
}

export class GuidedFormPage extends Page {

  constructor(...args) {
    super(...args)
    if (!this.info.formOptions) this.info.formOptions = {}
    if (!this.info.formOptions.schema) this.info.formOptions.schema = {}
    if (!this.info.formOptions.results) this.info.formOptions.results = {}
  }

  footer = {
    onNext: async () => {

        await this.form.validate()

        this.onTransition(1)
  }
}

  render() {

    const form = this.form = new JSONSchemaForm({
      ...this.info.formOptions,
      validateOnChange
    })

    form.style.width = '100%'

    return html`
    <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
    data-parent-tab-name="Dataset Structure"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Data Formats</h1>
      </div>
      <div class="guided--section">${form}</div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-form-page') || customElements.define('nwbguide-guided-form-page',  GuidedFormPage);
