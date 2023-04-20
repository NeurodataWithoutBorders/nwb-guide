

import { html } from 'lit';
import { hasEntry, update } from '../../../../progress.js';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { Page } from '../../Page.js';
import { validateOnChange } from '../../../../validation/index.js';

export class GuidedNewDatasetPage extends Page {

  constructor(...args) {
    super(...args)
  }

  state = {}

  #nameNotification

  footer = {
    onNext: async () => {

      const globalState = this.info.globalState.project

      // Check validity of project name
      const name = this.state.name
      if (!name) {
        if (this.#nameNotification) this.dismiss(this.#nameNotification) // Dismiss previous custom notification
        this.#nameNotification = this.notify("Please enter a project name.", 'error')
        return
      }

      this.dismiss() // Dismiss all notifications

      await this.form.validate()

      if (!name) return

      // Check if name is already used
      // Update existing progress file
      if (globalState.initialized) {
          const res = await update(name, globalState.name).then(res => {
          if (typeof res === 'string') this.notify(res)
          return (res !== false)
        }).catch(e => this.notify(e, 'error'))
        if (!res) return
      }
      else {
        const has = await hasEntry(name)
        if (has) {
          this.notify("An existing progress file already exists with that name. Please choose a different name.", 'error')
          return
        }
    }

    globalState.initialized = true
    Object.assign(globalState, this.state)

    this.onTransition(1)
  }
}

  render() {

    this.state = {} // Clear local state on each render

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
              enum: ["M", "F", "U", "O"],
              description: 'Enter a common sex for your subjects.',
              placeholder: "Enter sex here"
            }
          }
        }


      },
      required: ['name']
    }

    const form = this.form = new JSONSchemaForm({
      schema,
      results: this.state,
      validateEmptyValues: false,
      validateOnChange,
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
