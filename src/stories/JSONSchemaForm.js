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

    p {
      margin: 0 0 1em;
      line-height: 1.4285em;
    }

    .guided--form-label {
      display: block;
      width: 100%;
      margin: 1.45rem 0 0.45rem 0;
      color: black;
      font-weight: 600;
    }

    .guided--form-label {
      font-size: 1.2em !important;
    }
    .guided--form-label.centered {
      text-align: center;
    }

    .guided--form-label.header {
      font-size: 1.5em !important;
    }

.guided--input {
  width: 100%;
  height: 38px;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 100%;
  font-weight: normal;
  border: 1px solid var(--color-border);
  transition: border-color 150ms ease-in-out 0s;
  outline: none;
  color: rgb(33, 49, 60);
  background-color: rgb(255, 255, 255);
}

.guided--input:read-only,
.guided--input:disabled {
  color: dimgray;
  pointer-events: none;
}
.guided--input::placeholder {
  opacity: 0.5;
}

.guided--text-area {
  height: 5em;
  resize: none;
  font-family: unset;
}
.guided--text-area-tall {
  height: 15em;
}
.guided--input:hover {
  box-shadow: rgb(231 238 236) 0px 0px 0px 2px;
}
.guided--input:focus {
  outline: 0;
  box-shadow: var(--color-light-green) 0px 0px 0px 1px;
}

.guided--text-input-instructions {
  font-size: 13px;
  width: 100%;
  padding-top: 4px;
  color: dimgray !important;
}

hr {
  margin: 1em 0 1.5em 0;
}

pre {
  white-space: pre-wrap;       /* Since CSS 2.1 */
  white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
  white-space: -pre-wrap;      /* Opera 4-6 */
  white-space: -o-pre-wrap;    /* Opera 7 */
  word-wrap: break-word;       /* Internet Explorer 5.5+ */
  font-family: unset;
  color: DimGray;
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

  #capitalize = (str) => str[0].toUpperCase() + str.slice(1)

  #parseStringToHeader = (headerStr) => {
    return headerStr.split('_').filter(str => !!str).map(this.#capitalize).join(' ')
  }

  #renderInteractiveElement = (name, info, parent, isRequired) => {

    // Handle string (and related) formats / types
    const isArray = info.type === 'array'

    const hasItemsRef = 'items' in info && '$ref' in info.items
    const isStringArray = isArray && (info.items?.type === 'string' || (!('items' in info) || (!('type' in info.items) && !hasItemsRef))) // Default to a string type

    return html`
    <div>
      <label class="guided--form-label">${this.#parseStringToHeader(name)} ${isRequired ? html`<span style="color: red">*</span>` : ``}</label>
      ${(() => {

        if (info.type === 'boolean') {
          return html`<input type="checkbox" @change=${(ev) => this.#updateParent(name, ev.target.checked, parent)} ?checked=${parent[name] ?? false} />`
        }

        else if (info.type === 'string' || (isStringArray && !hasItemsRef) || info.type === 'number') {

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
            this.#updateParent(name, path, parent)
            button.nextSibling.innerText = path

          }}>Get ${info.format[0].toUpperCase() + info.format.slice(1)}</button><small>${parent[name] ?? ''}</small>` : html`<p>Cannot get absolute file path on web distribution</p>`

          // Handle long string formats
          else if (info.format === 'long' || isArray) return html`<textarea
          class="guided--input guided--text-area"
            type="text"
            placeholder="${info.placeholder ?? ''}"
            style="height: 7.5em; padding-bottom: 20px"
            maxlength="255"
          .value="${isStringArray ? (parent[name] ? parent[name].join('\n') : '') : (parent[name] ?? '')}"
          @input=${(ev) => {
            this.#updateParent(name, (isStringArray) ? ev.target.value.split('\n').map(str => str.trim()) : ev.target.value, parent)
          }}></textarea>`

          // Handle date formats
          else if (info.format === 'date-time') return html`<input type="datetime-local" .value="${parent[name] ?? ''}" @input=${(ev) => this.#updateParent(name, ev.target.value, parent)} />`

          // Handle other string formats
          else {
            const type = info.format === 'date-time' ? "datetime-local" : info.format ?? (info.type ==='string' ? 'text' : info.type)
            return html`
            <input
              class="guided--input"
              type="${type}"
              placeholder="${info.placeholder ?? ''}"
              .value="${parent[name] ?? ''}"

              @input=${(ev) => this.#updateParent(name, ev.target.value, parent)}
            />
            `
          }
        }


      // Print out the immutable default value
      return html`<pre>${info.default ? JSON.stringify(info.default, null, 2) : 'No default value'}</pre>`
      })()}
      ${info.description ? html`<p class="guided--text-input-instructions">${this.#capitalize(info.description)}${info.description.slice(-1)[0] === '.' ? '' : '.'}${isStringArray ? html`<span style="color: #202020;"> Separate on new lines.</span>` : ''}</p>` : ''}
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

  #getRenderable = (schema = {}, depth) => {
    const entries = Object.entries(schema.properties ?? {})
    return entries.filter(([key]) => !this.ignore.includes(key) && (!this.onlyRequired || depth === 0 || schema.required?.includes(key)))
  }

  #render = (schema, results, depth = 0) => {

    // Filter non-required properties (if specified) and render the sub-schema
    const renderable = this.#getRenderable(schema, depth)

    return renderable.length === 0 ?
      html`<p>No properties to render</p>` :
      renderable.map(([name, info]) => {

      // Directly render the interactive property element
      if (!info.properties) return this.#renderInteractiveElement(name, info, results, schema.required?.includes(name))

      // Render properties in the sub-schema
      return html`
    <div style="margin-top: 25px;">
      <label class="guided--form-label header">${this.#parseStringToHeader(name)}</label>
      <hr/>
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
    ${false ? html`<h2>${schema.title}</h2>` : ''}
    ${false ? html`<p>${schema.description}</p>` : ''}
    ${this.#render(schema, this.results)}
    </div>
    `;
  }
};

customElements.get('nwb-jsonschema-form') || customElements.define('nwb-jsonschema-form',  JSONSchemaForm);
