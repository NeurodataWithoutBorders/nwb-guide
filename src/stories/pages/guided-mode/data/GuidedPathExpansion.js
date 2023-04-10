

import { html } from 'lit';
import { Page } from '../../Page.js';

// For Multi-Select Form
import { baseUrl, notyf } from '../../../../globals.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { OptionalSection } from '../../../OptionalSection.js';

export class GuidedPathExpansionPage extends Page {

  constructor(...args) {
    super(...args)

  }

  footer = {
    onNext: async () => {

      this.save() // Save in case the request fails

      const hidden = this.optional.hidden

      if (!this.optional.toggled) {
        const message = "Please select a path expansion option."
        notyf.open({
          type: "error",
          message,
        });
        throw new Error(message)
      }

      // Force single subject/session
      if (hidden) {
        const source_data = {}
        for (let key in this.info.globalState.interfaces) source_data[key] =  {}

        this.info.globalState.results = {
          [this.altInfo.subject_id]: {
            [this.altInfo.session_id]: {
               source_data,
               metadata: {
                NWBFile: {
                  session_id: this.altInfo.session_id,
                },
                Subject: {
                  subject_id: this.altInfo.subject_id,
                }
              },
            }
          }
        }
      } 
      
      // Otherwise use path expansion
      else if (!hidden && hidden !== undefined) {

        const structure = this.info.globalState.structure.results

        const results = await fetch(`${baseUrl}/neuroconv/locate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(structure)
        }).then((res) => res.json())

        const subjects = Object.keys(results)
        if (subjects.length === 0) {
          const message = "No subjects found with the current configuration. Please try again."
          notyf.open({
            type: "error",
            message,
          })
          throw message
        }

        // Save an overall results object organized by subject and session
        this.info.globalState.results = results
      }

      this.onTransition(1)
    }
  }

  altInfo  = {
    subject_id: '001',
    session_id: '1',
  }

  altForm = new JSONSchemaForm({
    results: this.altInfo,
    schema: {
      type: 'object',
      properties: {
        subject_id: {
          type: 'string',
          description: 'Enter a subject ID.',
        },  
        session_id: {
          type: 'string',
          description: 'Enter a session ID.',
        },
      },
      required: ['subject_id', 'session_id']
    }
  })

  optional = new OptionalSection({
    title: 'Would you like to locate data programmatically?',
    description: 'Locate data using a format string. This will be used to automatically detect source data for multiple subjects and sessions.',
    altContent: this.altForm,
  })
  

  render() {

    let structureGlobalState = this.info.globalState.structure
    if (!structureGlobalState) structureGlobalState = this.info.globalState.structure = { results: {} }

   const baseSchema = {
      properties: {
        folder: {
          type: 'string',
          format: 'directory',
          description: 'Enter the base directory of your data.',
        },

        // Transposed from Metadata (manual entry)
        file_path: {
          type: "string",
          description: 'Enter a format string to locate data.',
          placeholder: "{subject_id}_{session_id}_{task_name}/{subject_id}_{session_id}_{task_name}_imec0/{subject_id}_{session_id}_{task_name}_t0.imec0.ap.bin"},
          // {subject_id}_{session_id}_{task_name}/{subject_id}_{session_id}_{task_name}_imec0/{subject_id}_{session_id}_{task_name}_t0.imec0.ap.bin

      },
      required: ['base_directory', 'format_string']
    }

    // Require properties for all sources
    const generatedSchema = {type: 'object', properties: {}}
    for (let key in this.info.globalState.interfaces) generatedSchema.properties[key] = { type: 'object', ...baseSchema }
    structureGlobalState.schema = generatedSchema

    this.optional.requestUpdate()

    const form = this.form = new JSONSchemaForm({
      ...structureGlobalState
    })
    
    

    this.optional.innerHTML = ''
    this.optional.insertAdjacentElement('afterbegin', form)

    form.style.width = '100%'


    return html`
        <div class="guided--panel" id="guided-new-dataset-info" style="flex-grow: 1">
        <div class="title">
          <h1 class="guided--text-sub-step">Locate Data</h1>
        </div>
        <div class="guided--section">
         ${this.optional}
        </div>
      </div>
    </div>
    `;
  }
};

customElements.get('nwbguide-guided-pathexpansion-page') || customElements.define('nwbguide-guided-pathexpansion-page',  GuidedPathExpansionPage);
