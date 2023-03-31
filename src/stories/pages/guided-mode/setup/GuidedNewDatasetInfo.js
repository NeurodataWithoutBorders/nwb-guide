

import { html } from 'lit';
import { baseUrl, notyf } from '../../../../globals.js';
import { hasEntry, update } from '../../../../progress.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { Page } from '../../Page.js';

export class GuidedNewDatasetPage extends Page {

  constructor(...args) {
    super(...args)
  }

  state = {}

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
  }

  footer = {
    onNext: async () => {

      const globalState = this.info.globalState.project

      // Check validity of project name
      const name = this.state.name
      if (!name) {
        const message = "Please enter a project name."
        notyf.open({
          type: "error",
          message: message,
          duration: 7000,
        });
      }

      this.form.validate()

      if (!name) return

      // Check if name is already used
      // Update existing progress file
      if (globalState.initialized) await update(name, globalState.name)
      else {
        const has = await hasEntry(name)
        if (has) {
          const message = "An existing progress file already exists with that name. Please choose a different name."
          notyf.open({
            type: "error",
            message: message,
            duration: 7000,
          });
          return
        }
    }

    globalState.initialized = true
    Object.assign(globalState, this.state)

    this.onTransition(1)
  }
}

  render() {

    let projectGlobalState = this.info.globalState.project
    if (!projectGlobalState) projectGlobalState = this.info.globalState.project = {}

    Object.assign(this.state, projectGlobalState) // Initialize state with global state

    const schema = {
      properties: {
        name: {
          type: 'string',
          description: 'Enter the name of your project.',
          placeholder: "Enter project name here"
        },

        // Transposed from Metadata (manual entry)
        NWBFile: {
          type: "object",
          properties: {

              institution: {
                type: 'string',
                description: 'Enter the name of your institution.',
                placeholder: "Enter institution name here"
              },
              lab: {
                type: 'string',
                description: 'Enter the name of your lab.',
                placeholder: "Enter lab name here"
              },
              experimenter: {
                type: 'array',
                description: 'Enter the names of the experimenters.',
                placeholder: "Enter experimenter name heres",
                items: {
                  type: 'string',
                },
              },

            related_publications: {
              type: 'array',
              description: 'Enter DOIs of relevant publications.',
              placeholder: "Enter publication DOIs here",
              items: {
                type: 'string',
              }
            },

            experiment_description: {
              type: 'string',
              format: 'long',
              description: 'Enter a description of the experiment.',
              placeholder: "Enter experiment description here"
            },

            keywords: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Enter keywords for the experiment.',
              placeholder: "Enter experiment keywords here"
            },

            protocol: {
              type: 'string',
              description: 'Enter a description of the protocol.',
              placeholder: "Enter protocol description here"
            },
            surgery: {
              type: 'string',
              description: 'Enter a description of the surgery.',
              placeholder: "Enter surgery description here"
            },
            virus: {
              type: 'string',
              description: 'Enter a description of the virus.',
              placeholder: "Enter virus description here"
            },
            stimulus_notes: {
              type: 'string',
              description: 'Enter a description of the stimulus.',
              placeholder: "Enter stimulus description here"
            },
          }
      },

        Subject: {
          type: 'object',
          properties: {
            species: {
              type: 'string',
              description: 'Enter a common species for your subjects.',
              placeholder: "Enter species here"
            },
            description: {
              type: 'string',
              description: 'Enter a common description for your subjects.',
              placeholder: "Enter subject description here"
            },
            genotype: {
              type: 'string',
              description: 'Enter a common genotype for your subjects.',
              placeholder: "Enter genotype here"
            },
            strain: {
              type: 'string',
              description: 'Enter a common strain for your subjects.',
              placeholder: "Enter strain here"
            },
            sex: {
              type: 'string',
              description: 'Enter a common sex for your subjects.',
              placeholder: "Enter sex here"
            }
          }
        }


      },
      required: ['name']
    }

    const noCheck = [
      'name',
      'description', 'genotype', 'strain',
      'lab', 'protocol', 'surgery', 'virus', 'stimulus_notes'
    ]

    const form = this.form = new JSONSchemaForm({
      schema,
      results: this.state,
      validateOnChange: async (name, parent, path) => {

        const message = { parent }

        if (noCheck.includes(name)) return
        else if (name === 'related_publications') message.function = 'check_doi_publications'
        else if (name === 'experimenter') message.function = 'check_experimenter_form'
        else if (path.slice(-1)[0] === 'Subject') {
          message.function = 'check_subject_' + name
          if (name === 'species') message.function += '_form'
        }
        else message.function = 'check_' + name

        const res = await fetch(`${baseUrl}/neuroconv/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        }).then(res => res.json())

        if (res?.message) return [  { message: res.message } ] // Some of the requests end in errors
        return res
      }
    })

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
