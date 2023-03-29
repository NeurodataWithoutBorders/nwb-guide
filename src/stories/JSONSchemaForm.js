import { LitElement, css, html } from 'lit';

import { remote } from '../electron/index'
const { dialog } = remote

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
      ignore: { type: Array, reflect: false },
      onlyRequired: { type: Boolean, reflect: false },
      dialogType: { type: String, reflect: false },
      dialogOptions: { type: Object, reflect: false }
    };
  }

  constructor (props = {}) {
    super()
    this.schema = props.schema ?? {}
    this.results = props.results ?? {}
    this.ignore = props.ignore ?? []
    this.onlyRequired = props.onlyRequired ?? false
    this.dialogOptions = props.dialogOptions ?? {}
    this.dialogType = props.dialogType ?? 'showOpenDialog'
  }

  attributeChangedCallback(changedProperties, oldValue, newValue) {
    super.attributeChangedCallback(changedProperties, oldValue, newValue)
    if (changedProperties === 'options') this.requestUpdate()
  }

  #useElectronDialog = async (type) => {

    const options = { ...this.dialogOptions }
    options.properties = [type === 'file' ? 'openFile' : 'openDirectory', 'noResolveAliases', ...options.properties ?? []]
    const result = await dialog[this.dialogType](options);
    if (result.canceled) throw new Error('No file selected')
    return result
  }

//   NOTE: We can move these into their own components in the future
  async updated(){

  }

  #updateParent(name, value, parent) {
    if (!value) delete parent[name]
    else parent[name] = value
  }

  #renderInteractiveElement = (name, info, parent, isRequired) => {

    return html`
    <div>
      <h4 style="margin-bottom: 0; margin-top: 10px;">${name} ${isRequired ? html`<span style="color: red">*</span>` : ``}</h4>
      ${(() => {

        // Handle  string formats
        if (info.type === 'string') {

          // Handle file and directory formats
          if (this.#filesystemQueries.includes(info.format)) return dialog ? html`<button style="margin-right: 15px;" @click=${async (ev) => {

            // NOTE: We can get the file, but we can't know the path unless we use Electron
            // const [fileHandle] = await window.showOpenFilePicker();
            // const file = await fileHandle.getFile();
            // console.log(fileHandle, file)
            // const contents = await file.text();
            // console.log(contents)
            const button = ev.target
            const file = await this.#useElectronDialog(info.format)
            const path = file.filePath ?? file.filePaths?.[0]
            if (!path) throw new Error('Unable to parse file path')
            parent[name] = path
            button.nextSibling.innerText = path

          }}>Get ${info.format[0].toUpperCase() + info.format.slice(1)}</button><small>${parent[name] ?? ''}</small>` : html`<p>Cannot get absolute file path on web distribution</p>`

          // Handle long string formats
          else if (info.format === 'long') return html`<textarea .value="${parent[name] ?? ''}" @input=${(ev) => this.#updateParent(name, ev.target.value, parent)}></textarea>`

          // Handle date formats
          else if (info.format === 'date-time') return html`<input type="datetime-local" .value="${parent[name] ?? ''}" @input=${(ev) => this.#updateParent(name, ev.target.value, parent)} />`

          // Handle other string formats
          else {
            const type = info.format === 'date-time' ? "datetime-local" : info.format ?? 'text'
            return html`<input type="${type}" .value="${parent[name] ?? ''}" @input=${(ev) => this.#updateParent(name, ev.target.value, parent)} />`
          }
        }


      // Default case
      return html`<p>type not supported (${info.type} | ${info.format ?? '–'}) </p>`
      })()}
    </div>
    `
  }

  #filesystemQueries = ['file', 'directory']

  #registerDefaultProperties = (properties = {}, results) => {
    for (let name in properties) {
      const info = properties[name]
      const props = info.properties
      if (props && !results[name]) results[name] = {} // Regisiter new interfaces in results
      else if (info.default) results[name] = info.default

      if (props) {
        Object.entries(props).forEach(([key, value]) => {
          if (!(key in results[name])) {
            if ('default' in value) results[name][key] = value.default
            else if (value.properties) {
              const results = results[name][key] = {}
              this.#registerDefaultProperties(value.properties, results)
            }
          }
        })
      }
    }
  }

  #deleteExtraneousResults = (results, schema) => {
    for (let name in results) {
      if (!schema.properties || !(name in schema.properties)) delete results[name]
      else if (results[name] && typeof results[name] === 'object' && !Array.isArray(results[name])) this.#deleteExtraneousResults(results[name], schema.properties[name])
    }
  }

  #getRenderable = (schema = {}) => {
    const entries = Object.entries(schema.properties ?? {})
    return entries.filter(([key]) => (!this.ignore.includes(name) && !this.ignore.includes(key)) && (!this.onlyRequired || schema.required?.includes(key)))
  }

  #render = (schema, results, depth = 0) => {

    // Filter non-required properties (if specified) and render the sub-schema
    const renderable = depth ? this.#getRenderable(schema, depth) : Object.entries(schema.properties ?? {})


    return renderable.length === 0 ?
      html`<p>No properties to render</p>` :
      renderable.map(([name, info]) => {

      // Directly render the interactive property element
      if (!info.properties) return this.#renderInteractiveElement(name, info, results, schema.required?.includes(name))

      // Render properties in the sub-schema
      return html`
    <div style="margin-bottom: 25px;">
      <h3 style="padding-bottom: 0px; margin: 0;">${name}</h3>
      ${this.#render(info, results[name], depth + 1)}
    </div>
    `})
  }

  render() {

    const schema = this.schema ?? {}

    // Register default properties
    this.#registerDefaultProperties(schema.properties, this.results)

    // Delete extraneous results
    this.#deleteExtraneousResults(this.results, this.schema)

    return html`
    <div>
    ${schema.title ? html`<h2>${schema.title}</h2>` : ''}
    ${schema.description ? html`<p>${schema.description}</p>` : ''}
    ${this.#render(schema, this.results)}
    </div>
    `;
  }
};

customElements.get('nwb-jsonschema-form') || customElements.define('nwb-jsonschema-form',  JSONSchemaForm);
