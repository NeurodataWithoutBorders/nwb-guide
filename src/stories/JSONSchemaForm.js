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

    console.log(schema, this.results)

    entries.forEach(([name]) => {
      if (!this.results[name]) this.results[name] = {} // Regisiter new interfaces in results
    }) // Register interfaces

    for (let propertyName in this.results) {
      if (!schema.properties[propertyName]) delete this.results[propertyName] // delete extraneous property names
    }


    const filesystemQueries = ['file', 'directory']
    return html`
    <div>
    <h2>${schema.title}</h2>
    <p>${schema.description}</p>
    ${
      entries.length === 0 ? html`<p>No interfaces selected</p>` : entries.map(([name, subSchema]) => {

        // Filter non-required properties
        const requiredProperties = Object.entries(subSchema.properties ?? {}).filter(([_, property]) => subSchema.required?.includes(_))

        if (requiredProperties.length === 0) return ''

      return html`
      <div style="margin-bottom: 25px;">
        <h3 style="padding-bottom: 0px; margin: 0;">${name}</h3>
        ${requiredProperties.map(([propertyName, property]) => {

          const isRequired = subSchema.required?.includes(propertyName) // Distinguish required properties

          return html`
          <div>
            <h4 style="margin-bottom: 0; margin-top: 10px;">${propertyName} ${isRequired ? html`<span style="color: red">*</span>` : ``}</h4>
            ${(() => {
              
              // Handle  string formats
              if (property.type === 'string') {

                // Handle file and directory formats
                if (filesystemQueries.includes(property.format)) return dialog ? html`<button style="margin-right: 15px;" @click=${async (ev) => {

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
  
                }}>Get ${property.format[0].toUpperCase() + property.format.slice(1)}</button><small>${this.results[name][propertyName] ?? ''}</small>` : html`<p>Cannot get absolute file path on web distribution</p>`

                // Handle long string formats
                else if (property.format === 'long') return html`<textarea .value="${this.results[name][propertyName]}" @input=${(ev) => this.results[name][propertyName] = ev.target.value}></textarea>`

                // Handle date formats
                else if (property.format === 'date-time') return html`<input type="datetime-local" .value="${this.results[name][propertyName]}" @input=${(ev) => this.results[name][propertyName] = ev.target.value} />`
                
                // Handle other string formats
                else {
                  const type = property.format === 'date-time' ? "datetime-local" : property.format ?? 'text'
                  console.log('String type', name, propertyName, type)
                  return html`<input type="${type}" .value="${this.results[name][propertyName]}" @input=${(ev) => this.results[name][propertyName] = ev.target.value} />`
                }
              }


            // Default case
            return html`<p>type not supported (${property.type} | ${property.format ?? '–'}) </p>`
            })()}
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
