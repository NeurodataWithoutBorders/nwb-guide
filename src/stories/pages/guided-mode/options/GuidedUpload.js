

import { html } from 'lit';
import { JSONSchemaForm } from '../../../JSONSchemaForm.js';
import { Page } from '../../Page.js';
import { run } from './utils.js';

export class GuidedUploadPage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    onNext: async () => {


       // TODO: Insert validation here...
       const valid = true
       if (!valid) throw new Error('Invalid input')

       delete this.info.globalState.upload.results // Clear the preview results

       this.save() // Save in case the conversion fails

       const results = await run('upload', this.info.globalState.upload.info, {
        title: 'Uploading to DANDI',
      })

       this.info.globalState.upload.results = results // Save the preview results

      this.onTransition(1)
    }
  }

  render() {

    const schema = {
      properties: {
        api_key: {
          type: 'string',
        },
        dandiset_id: {
          type: 'string',
        },
        nwb_folder_path: {
          type: 'string',
          format: 'directory'
        },
        dandiset_folder_path: {
          type: 'string',
          format: 'directory'
        },
        staging: {
          type: 'boolean',
          default: true // Defualt to staging for now
        },
        cleanup: {
          type: 'boolean',
          default: false
        }

      },
      required: ['api_key', 'dandiset_id', 'nwb_folder_path']
    }

    let uploadGlobalState = this.info.globalState.upload
    if (!uploadGlobalState) uploadGlobalState = this.info.globalState.upload = {info: {}, results: null}

    const form = new JSONSchemaForm({
      schema,
      results: uploadGlobalState.info,
      // dialogType: 'showSaveDialog',
      dialogOptions: {
        properties: [ 'createDirectory' ],
        // filters: [
        //   { name: 'NWB File', extensions: ['nwb'] }
        // ]
      }
    })

    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">DANDI Upload Details</h1>
      </div>
      <div class="guided--section">
      <h3>NWB File Path</h3>
      ${form}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-upload-page') || customElements.define('nwbguide-guided-upload-page',  GuidedUploadPage);
