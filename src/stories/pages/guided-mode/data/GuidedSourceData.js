

import { html } from 'lit';
import { Page } from '../../Page.js';
import electronImports from '../../../../electron/index'
const { dialog } = electronImports.remote ?? {};

import globals from '../../../../../scripts/globals.js';
const { port, notyf } = globals;

const base = `http://127.0.0.1:${port}`;

export class GuidedSourceDataPage extends Page {

  constructor(...args) {
    super(...args)
  }

  result = {}

  #useElectronDialog = async (type) => {
    const result = await dialog.showOpenDialog({ properties: [type === 'file' ? 'openFile' : 'openDirectory'] });
    if (result.canceled) throw new Error('No file selected')
    return result
  }

  footer = {
    onNext: async () => {
      // TODO: Insert validation here...
      const valid = true
      if (!valid) throw new Error('Invalid input')

      // TODO: Create the endpoint to handle this
      // const metadata = this.result 
      const metadata = this.info.globalState.metadata = await fetch(`${base}/neuroconv/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.result)
      }).then((res) => res.json())

      if (metadata.message) {
        const message = "Failed to get metadata with current source data. Please try again."
        notyf.open({
          type: "error",
          message,
        });
        throw new Error(`Failed to get metadata for source data provided: ${metadata.message}`)
      }

      this.onTransition(1)
    }
  }

  render() {

    const schema = this.info.globalState.schema
    const entries = Object.entries(schema?.properties ?? {})

    this.result = {}
    entries.forEach(([name]) => this.result[name] = {}) // Register interfaces

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
        <div>
        <h2>${schema?.title}</h2>
        <p>${schema?.description}</p>
        ${
          entries.length === 0 ? html`<p>No interfaces selected</p>` : entries.map(([name, subSchema]) => {
          return html`
          <div style="margin-bottom: 25px;">
            <h3 style="padding-bottom: 0px; margin: 0;">${name}</h3>
            ${Object.entries(subSchema.properties ?? {}).map(([propertyName, property]) => {
              return html`
              <div>
                <h4 style="margin-bottom: 0; margin-top: 10px;">${propertyName} ${subSchema.required.includes(propertyName) ? html`<span style="color: red">*</span>` : ``}</h4>
                ${property.format ? (dialog ? html`<button style="margin-right: 15px;" @click=${async (ev) => {

                    // NOTE: We can get the file, but we can't know the path unless we use Electron
                    // const [fileHandle] = await window.showOpenFilePicker();
                    // const file = await fileHandle.getFile();
                    // console.log(fileHandle, file)
                    // const contents = await file.text();
                    // console.log(contents)
                    const button = ev.target
                    const file = await this.#useElectronDialog(property.format)
                    const path = file.filePaths[0]
                    this.result[name][propertyName] = path
                    button.nextSibling.innerText = path

                }}>Get ${property.format[0].toUpperCase() + property.format.slice(1)}</button><small></small>` : html`<p>Cannot get absolute file path on web distribution</p>`) : html`<p>${property.type} type not supported.</p>`}
              </div>
              `
            })}
          </div>
          `})
        }
        </div>
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-sourcedata-page') || customElements.define('nwbguide-guided-sourcedata-page',  GuidedSourceDataPage);
