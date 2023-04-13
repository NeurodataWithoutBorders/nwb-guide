

import { html } from 'lit';
import { JSONSchemaForm } from '../JSONSchemaForm.js';
import { Page } from './Page.js';
import { validateOnChange } from '../../validation/index.js';


export function schemaToPages (schema, sharedGlobalState, options) {
   return Object.entries(schema.properties)
    .filter(([_, value]) => value.properties)
    .map(([key, value]) => {
            
            sharedGlobalState[key] = sharedGlobalState[key] ?? {} // Create global state object if it doesn't exist

            const page = new GuidedFormPage({ 
                label: key, 
                section: this.info.section,
                formOptions: {
                    ...options,
                    schema: { properties: { [key]: value } },
                    results: { [key]: sharedGlobalState[key] },
                }
            })
    
            delete schema.properties[key]

            return page
    })
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

    return html`${form}`;
  }
};

customElements.get('nwbguide-guided-form-page') || customElements.define('nwbguide-guided-form-page',  GuidedFormPage);
