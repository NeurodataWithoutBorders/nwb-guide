import { LitElement, css, html } from 'lit';

import electronImports from '../electron/index'
const { dialog } = electronImports.remote ?? {};

const componentCSS = `

    * {
      box-sizing: border-box;
    }

    :host {
      display: inline-block;
    }

`

export class JSONSchemaForm extends LitElement {


  static get styles() {
    return css([componentCSS])
  }

  static get properties() {
    return {
      schema: { type: Object, reflect: false },
      results: { type: Object, reflect: false },
    };
  }

  constructor (props = {}) {
    super()
    this.schema = props.schema ?? {}
    this.results = props.results ?? {}
  }

  attributeChangedCallback(changedProperties, oldValue, newValue) {
    super.attributeChangedCallback(changedProperties, oldValue, newValue)
    if (changedProperties === 'options') this.requestUpdate()
  }

  #useElectronDialog = async (type) => {
    const result = await dialog.showOpenDialog({ properties: [type === 'file' ? 'openFile' : 'openDirectory'] });
    if (result.canceled) throw new Error('No file selected')
    return result
  }

//   NOTE: We can move these into their own components in the future
  async updated(){

  }

  render() {

    const schema = this.schema ?? {}
    const entries = Object.entries(schema.properties ?? {})

    this.result = {}
    entries.forEach(([name]) => {
      if (!this.results[name]) this.results[name] = {}
    }) // Register interfaces


    const filesystemQueries = ['file', 'directory']
    return html`
    <div>
    <h2>${schema.title}</h2>
    <p>${schema.description}</p>
    ${
      entries.length === 0 ? html`<p>No interfaces selected</p>` : entries.map(([name, subSchema]) => {
      return html`
      <div style="margin-bottom: 25px;">
        <h3 style="padding-bottom: 0px; margin: 0;">${name}</h3>
        ${Object.entries(subSchema.properties ?? {}).map(([propertyName, property]) => {
          return html`
          <div>
            <h4 style="margin-bottom: 0; margin-top: 10px;">${propertyName} ${subSchema.required?.includes(propertyName) ? html`<span style="color: red">*</span>` : ``}</h4>
            ${filesystemQueries.includes(property.format) ? (dialog ? html`<button style="margin-right: 15px;" @click=${async (ev) => {

                // NOTE: We can get the file, but we can't know the path unless we use Electron
                // const [fileHandle] = await window.showOpenFilePicker();
                // const file = await fileHandle.getFile();
                // console.log(fileHandle, file)
                // const contents = await file.text();
                // console.log(contents)
                const button = ev.target
                const file = await this.#useElectronDialog(property.format)
                const path = file.filePaths[0]
                this.results[name][propertyName] = path
                button.nextSibling.innerText = path

            }}>Get ${property.format[0].toUpperCase() + property.format.slice(1)}</button><small>${this.results[name][propertyName] ?? ''}</small>` : html`<p>Cannot get absolute file path on web distribution</p>`) : html`<p>type not supported (${property.type} | ${property.format ?? 'N/A' } </p>`}
          </div>
          `
        })}
      </div>
      `})
    }
    </div>
    `;
  }
};

customElements.get('nwb-jsonschema-form') || customElements.define('nwb-jsonschema-form',  JSONSchemaForm);
