

import { html } from 'lit';
import { hasEntry, update } from '../../../../progress.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { notify } from '../../../../globals.js';
import { Page } from '../../Page.js';
import { validateOnChange } from '../../../../validation/index.js';

import projectMetadataSchema from './project-metadata.schema.json' assert { type: 'json' };
import { schemaToPages } from '../../FormPage.js';

export class GuidedNewDatasetPage extends Page {

  constructor(...args) {
    super(...args)
    this.updateForm() // Register nested pages on creation—not just with data
  }

  state = {}

  footer = {
    onNext: async () => {

      const globalState = this.info.globalState.project

      // Check validity of project name
      const name = this.state.name
      if (!name) {
        notify("Please enter a project name.", 'error')
        return
      }

      await this.form.validate()

      if (!name) return

      // Check if name is already used
      // Update existing progress file
      if (globalState.initialized) {
          const res = await update(name, globalState.name).then(res => {
          if (typeof res === 'string') notify(res)
          return (res !== false)
        }).catch(e => notify(e, 'error'))
        if (!res) return
      }
      else {
        const has = await hasEntry(name)
        if (has) {
          notify("An existing progress file already exists with that name. Please choose a different name.", 'error')
          return
        }
    }

    globalState.initialized = true
    Object.assign(globalState, this.state)

    this.onTransition(1)
  }
}

updateForm = () => {

  let projectGlobalState = this.info.globalState.project
  if (!projectGlobalState) projectGlobalState = this.info.globalState.project = {}

   // Properly clone the schema to produce multiple pages from the project metadata schema
   const schema = { ...projectMetadataSchema }
   schema.properties = {...schema.properties}

   const pages = schemaToPages.call(this, schema, projectGlobalState, { validateEmptyValues: false })

   pages.forEach(page => this.addPage(page.info.label, page))

   this.form = new JSONSchemaForm({
     schema,
     results: this.state,
     validateEmptyValues: false,
     validateOnChange
   })

   return this.form
}

  render() {

    this.state = {} // Clear local state on each render

    const form = this.updateForm()
    form.style.width = '100%'

    return html`
        <div class="guided--panel" id="guided-new-dataset-info" style="flex-grow: 1">
        <div class="title">
          <h1 class="guided--text-sub-step">Project Setup</h1>
        </div>
        <div class="guided--section">
         ${form}
        </div>
      </div>
    </div>
    `;
  }
};

customElements.get('nwbguide-guided-newdataset-page') || customElements.define('nwbguide-guided-newdataset-page',  GuidedNewDatasetPage);
