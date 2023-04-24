import { LitElement, css, html } from 'lit';
import { notify } from '../globals';
import { FilesystemSelector } from './FileSystemSelector';
import Swal from 'sweetalert2';

const componentCSS = `

    * {
      box-sizing: border-box;
    }

    :host {
      display: inline-block;
      width:100%;
    }

    p {
      margin: 0 0 1em;
      line-height: 1.4285em;
    }

    .invalid {
      background: rgb(255, 229, 228) !important;
    }

    .errors {
      color: #9d0b0b;
    }

    .errors > * {
      padding: 25px;
      background: #f8d7da;
      border: 1px solid #f5c2c7;
      border-radius: 4px;
      margin: 0 0 1em;
    }

    .warnings {
      color: #856404;
    }

    .warnings > * {
      padding: 25px;
      background: #fff3cd;
      border: 1px solid #ffeeba;
      border-radius: 4px;
      margin: 0 0 1em;
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

    .link {
      margin-top: 20px;
      border: 1px solid black;
      border-radius: 4px;
      position: relative;
    }

    .link > div {
      padding: 0px 10px;
    }

    .link::before {
      box-sizing: border-box;
      display: block;
      width: 100%;
      color: white;
      background: black;
      padding: 10px;
      content: ''attr(data-name)'';
      font-weight: bold;
    }

    .link.required::after {
      box-sizing: border-box;
      display: block;
      width: 10px;
      height: 10px;
      background: #ff3d64;
      border-radius: 50%;
      position: absolute;
      top: 0;
      right: 0;
      content: '';
      margin: 15px;
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

  .required label:after {
    content: " *";
    color: #ff0033;
  }

  .required.conditional label:after {
    color: transparent;
  }
`

document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

export class JSONSchemaForm extends LitElement {


  static get styles() {
    return css([componentCSS])
  }

  static get properties() {
    return {
      schema: { type: Object, reflect: false },
      results: { type: Object, reflect: false },
      ignore: { type: Array, reflect: false },
      required: { type: Object, reflect: false},
      dialogType: { type: String, reflect: false },
      dialogOptions: { type: Object, reflect: false }
    };
  }

  constructor (props = {}) {
    super()
    this.schema = props.schema ?? {}
    this.results = props.results ?? {}
    this.ignore = props.ignore ?? []
    this.required = props.required ?? {}
    this.dialogOptions = props.dialogOptions ?? {}
    this.dialogType = props.dialogType ?? 'showOpenDialog'

    this.onlyRequired = props.onlyRequired ?? false
    this.showLevelOverride = props.showLevelOverride ?? false

    this.conditionalRequirements = props.conditionalRequirements ?? [] // NOTE: We assume properties only belong to one conditional requirement group

    this.validateEmptyValues = props.validateEmptyValues ?? true
    if (props.onInvalid) this.onInvalid = props.onInvalid
    if (props.validateOnChange) this.validateOnChange = props.validateOnChange
  }

  #requirements = {}

  attributeChangedCallback(changedProperties, oldValue, newValue) {
    super.attributeChangedCallback(changedProperties, oldValue, newValue)
    if (changedProperties === 'options') this.requestUpdate()
  }

  #handleFile = async (filePath, parent, name) => {
    parent[name] = filePath
  }

  #updateParent(name, value, parent) {
    if (!value) delete parent[name]
    else parent[name] = value
  }

  #capitalize = (str) => str[0].toUpperCase() + str.slice(1)


  #addMessage = (name, message, type) => {
    if (Array.isArray(name)) name = name.join('-') // Convert array to string
    const container = this.shadowRoot.querySelector(`#${name} .${type}`)
    const p = document.createElement('p')
    p.innerText = message
    container.appendChild(p)
  }

  #clearMessages = (fullPath, type) => {
    if (Array.isArray(fullPath)) fullPath = fullPath.join('-') // Convert array to string
    const container = this.shadowRoot.querySelector(`#${fullPath} .${type}`)
    container.innerHTML = ''
  }

  validate = async () => {

    // Check if any required inputs are missing
    const invalidInputs = await this.getMissingRequiredPaths()
    const isValid = !invalidInputs.required.length && !invalidInputs.conditional.length

    // Clear any existing messages
    const allRequirements = [...invalidInputs.required, ...invalidInputs.conditional]
    allRequirements.forEach(name => this.#clearMessages(name, 'errors'))

    // Print out a detailed error message if any inputs are missing
    let message = '';
    if (!isValid) {
      message += `<b>${invalidInputs.required.length} required inputs`
      if (!invalidInputs.required.length) message = `${invalidInputs.conditional.length} conditionally required inputs`
      else if (invalidInputs.conditional.length) message += ` and ${invalidInputs.conditional.length} conditionally required inputs`
      message += ' are not specified properly.</b>'
    }

    // Check if all inputs are valid
    const flaggedInputs = this.shadowRoot.querySelectorAll('.invalid')
    if (flaggedInputs.length) {
      flaggedInputs[0].focus()
      if (!message) message = `${flaggedInputs.length} invalid form values.`
      message += ` Please check the highlighted fields.`
    }


    if (message) {
      notify(message, 'error', 7000)
      throw new Error('Invalid form values')
    }

    // Ensure user is aware of any warnings before moving on
    const activeWarnings = Array.from(this.shadowRoot.querySelectorAll('.warnings')).map(input => Array.from(input.children)).filter(input => input.length)
    const nWarnings = activeWarnings.reduce((acc, curr) => acc = acc + curr.length, 0)

    if (nWarnings) {
      const warningText = activeWarnings.reduce((acc, children) => [...acc, ...children.map(el => el.innerText)], [])
      const result = await Swal.fire({
        title: `Are you sure you would like to submit your metadata with ${nWarnings} warnings?`,
        html: `<small><ol style="text-align: left;">${warningText.map(v => `<li>${v}</li>`).join('')}</ol></small>`,
        icon: "warning",
        heightAuto: false,
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Complete Metadata Entry",
        cancelButtonText: "Cancel",
        focusCancel: true,
      });

      if (!result.isConfirmed) throw new Error('User cancelled metadata submission')
    }

    return true

  }

  #parseStringToHeader = (headerStr) => {
    return headerStr.split('_').filter(str => !!str).map(this.#capitalize).join(' ')
  }

  #get = (path) => {
    return path.reduce((acc, curr) => acc = acc[curr], this.results)
  }


  #checkRequiredAfterChange = async (fullPath) => {
     const path = [...fullPath]
      const name = path.pop()
      const parent = this.#get(path)
      const element = this.shadowRoot.querySelector(`#${fullPath.join('-')} .guided--input`)
      const isValid = await this.#validateOnChange(name, parent, element, path, false)
      if (!isValid) return true
  }

  #renderInteractiveElement = (name, info, parent, required, path = []) => {

    let isRequired = required[name]

    const isArray = info.type === 'array' // Handle string (and related) formats / types

    const hasItemsRef = 'items' in info && '$ref' in info.items
    const isStringArray = isArray && (info.items?.type === 'string' || (!('items' in info) || (!('type' in info.items) && !hasItemsRef))) // Default to a string type

    const fullPath = [...path, name]
    const isConditional = this.#getLink(fullPath) || typeof isRequired === 'function' // Check the two possible ways of determining if a field is conditional

    if (isConditional && !isRequired) isRequired = required[name] = async () => {

      const isRequiredAfterChange = await this.#checkRequiredAfterChange(fullPath)
      if (isRequiredAfterChange) return true // Check self
      else {
        const linkResults = await this.#applyToLinkedProperties(this.#checkRequiredAfterChange, fullPath) // Check links
        if (linkResults.includes(true)) return true
        else return false
      }
     }

    return html`
    <div id=${fullPath.join('-')} class="${(isRequired || isConditional) ? 'required' : ''} ${isConditional ? 'conditional' : ''}">
      <label class="guided--form-label">${this.#parseStringToHeader(name)}</label>
      ${(() => {

        // Basic enumeration of properties on a select element
        if (info.enum) {
          return html`
          <select class="guided--input schema-input"
            @input=${(ev) => this.#updateParent(name, info.enum[ev.target.value], parent)}
            @change=${(ev) => this.#validateOnChange(name, parent, ev.target, path)}
          >
          <option disabled selected value>Select an option</option>
            ${info.enum.map((item, i) => html`<option value=${i} ?selected=${parent[name] === item}>${item}</option>`)}
          </select>
          `
        }

        else if (info.type === 'boolean') {
          return html`<input
          type="checkbox"
          class="schema-input"
          @input=${(ev) => this.#updateParent(name, ev.target.checked, parent)}
          ?checked=${parent[name] ?? false}
          @change=${(ev) => this.#validateOnChange(name, parent, ev.target, path)}
          />`
        }

        else if (info.type === 'string' || (isStringArray && !hasItemsRef) || info.type === 'number') {

          // Handle file and directory formats
          if (this.#filesystemQueries.includes(info.format)) return new FilesystemSelector({
            type: info.format,
            value: parent[name],
            onSelect: (filePath) => this.#handleFile(filePath, parent, name),
            dialogOptions: this.dialogOptions,
            dialogType: this.dialogType
          })

          // Handle long string formats
          else if (info.format === 'long' || isArray) return html`<textarea
            class="guided--input guided--text-area schema-input"
            type="text"
            placeholder="${info.placeholder ?? ''}"
            style="height: 7.5em; padding-bottom: 20px"
            maxlength="255"
            .value="${isStringArray ? (parent[name] ? parent[name].join('\n') : '') : (parent[name] ?? '')}"
            @input=${(ev) => {
              this.#updateParent(name, (isStringArray) ? ev.target.value.split('\n').map(str => str.trim()) : ev.target.value, parent)
            }}
            @change=${(ev) => this.#validateOnChange(name, parent, ev.target, path)}
          ></textarea>`

          // Handle other string formats
          else {
            const type = info.format === 'date-time' ? "datetime-local" : info.format ?? (info.type ==='string' ? 'text' : info.type)
            return html`
            <input
              class="guided--input schema-input"
              type="${type}"
              placeholder="${info.placeholder ?? ''}"
              .value="${parent[name] ?? ''}"

              @input=${(ev) => this.#updateParent(name, ev.target.value, parent)}
              @change=${(ev) => this.#validateOnChange(name, parent, ev.target, path)}
            />
            `
          }
        }


      // Print out the immutable default value
      return html`<pre>${info.default ? JSON.stringify(info.default, null, 2) : 'No default value'}</pre>`
      })()}
      ${info.description ? html`<p class="guided--text-input-instructions">${this.#capitalize(info.description)}${info.description.slice(-1)[0] === '.' ? '' : '.'}${isStringArray ? html`<span style="color: #202020;"> Separate on new lines.</span>` : ''}</p>` : ''}
      <div class="errors"></div>
      <div class="warnings"></div>
    </div>
    `
  }

  #filesystemQueries = ['file', 'directory']

  #validateRequirements = async (results, requirements, parent) => {

    let invalid = {
      required: [],
      conditional: []
    }

    for (let name in requirements) {
      let isRequired = requirements[name]
      const isFunction = typeof isRequired === 'function'
      if (isFunction) isRequired = await isRequired.call(this.results)
      if (isRequired) {
        let path = parent ? `${parent}-${name}` : name
        if (typeof isRequired === 'object' && !Array.isArray(isRequired)) {
          const subInvalid = await this.#validateRequirements(results[name], isRequired, path)
          for (let type in subInvalid) {
            if (subInvalid[type].length) invalid[type].push(...subInvalid[type])
          }
        }

        else if (!results[name]) invalid[isFunction ? 'conditional' : 'required'].push(path)
      }
    }
    return invalid
  }

  getMissingRequiredPaths = async () => {
    let requirements = this.#requirements
    let results = this.results
    return await this.#validateRequirements(results, requirements)
  }

  // Checks missing required properties and throws an error if any are found
  onInvalid = () => {}

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

  #getRenderable = (schema = {}, required, path) => {
    const entries = Object.entries(schema.properties ?? {})

    return entries.filter(([key]) => {

      if (this.ignore.includes(key)) return false
      if (this.showLevelOverride >= path.length) return true
      if (required[key]) return true
      if (this.#getLink([...path, key])) return true
      if (!this.onlyRequired) return true
      return false

    })
  }

  validateOnChange = () => {}

  #getLink = (args) => {
    if (typeof args === 'string') args = args.split('-')
    return this.conditionalRequirements.find((linked) =>linked.properties.find((link) => link.join('-') === args.join('-')))
  }

  #applyToLinkedProperties = (fn, args) => {
    const links = this.#getLink(args)?.properties
    if (!links) return []
    return Promise.all(links.map((link) => fn(link, this.shadowRoot.getElementById(`${link.join('-')}`))).flat())
  }

  // Check if all links are not required anymore
  #isLinkResolved = async (pathArr) => {
    return (await this.#applyToLinkedProperties((link) => {
      const isRequired = this.#isRequired(link)
      if (typeof isRequired === 'function') return !isRequired.call(this.results)
      else return !isRequired
    }, pathArr)).reduce((a, b) => a && b, true)
  }

  #isRequired = (path) => {
    if (typeof path === 'string') path = path.split('-')
    return path.reduce((obj, key) => obj && obj[key], this.#requirements)
  }

  #getLinkElement = (path) => {
    const link = this.#getLink(path)
    if (!link) return
    return this.shadowRoot.querySelector(`[data-name="${link.name}"]`)
  }

  #validateOnChange = async (name, parent, element, path = [], checkLinks = true) => {

    const valid = (!this.validateEmptyValues && !(name in parent)) ? true : await this.validateOnChange(name, parent, path)

    const fullPath = [...path, name]
    const isRequired = this.#isRequired(fullPath)
    let warnings = Array.isArray(valid) ? valid.filter((info) => info.type === 'warning' && (!isRequired || !info.missing)) : []
    const errors = Array.isArray(valid) ? valid?.filter((info) => info.type === 'error' || (isRequired && info.missing)) : []

    if (checkLinks) {
      const isLinkResolved = await this.#isLinkResolved(fullPath)
      if (!isLinkResolved) {
        errors.push(...warnings) // Move warnings to errors if the element is linked
        warnings = []

        // Clear old errors and warnings on linked properties
        this.#applyToLinkedProperties((path) => {
          this.#clearMessages(path, 'errors')
          this.#clearMessages(path, 'warnings')
        }, fullPath)
      }
    }

    // Clear old errors and warnings
    this.#clearMessages(fullPath, 'errors')
    this.#clearMessages(fullPath, 'warnings')

    // Show aggregated errors and warnings (if any)
    warnings.forEach((info) => this.#addMessage(fullPath, info.message, 'warnings'))

    if (valid === true || valid == undefined || errors.length === 0) {

      element.classList.remove('invalid')

      const linkEl = this.#getLinkElement(fullPath)
      if (linkEl) linkEl.classList.remove('required', 'conditional')

      await this.#applyToLinkedProperties((name, element) => {
        element.classList.remove('required', 'conditional') // Links manage their own error and validity states, but only one needs to be valid
      }, fullPath)

      return true

    } else {

      // Add new invalid classes and errors
      element.classList.add('invalid')

      const linkEl = this.#getLinkElement(fullPath)
      if (linkEl) linkEl.classList.add('required', 'conditional')

      // Only add the conditional class for linked elements
      await this.#applyToLinkedProperties((name, element) => element.classList.add('required', 'conditional'), [...path, name])

      errors.forEach((info) => this.#addMessage(fullPath, info.message, 'errors'))

      return false
    }
  }

  #render =(schema, results, required = {}, path = []) => {

    let isLink = Symbol('isLink')
    // Filter non-required properties (if specified) and render the sub-schema
    const renderable = this.#getRenderable(schema, required, path)

    // // Filter non-required properties (if specified) and render the sub-schema
    // const renderable = path.length ? this.#getRenderable(schema, required) : Object.entries(schema.properties ?? {})

    if (renderable.length === 0) return html`<p>No properties to render</p>`

    let renderableWithLinks = renderable.reduce((acc, [name, info]) => {
      const link = this.#getLink([...path, name])
      if (link) {
        if (!acc.find(([_, info]) => info === link)) {
          const entry = [link.name, link]
          entry[isLink] = true
          acc.push(entry)
        }
      } else acc.push([name, info])

      return acc
    }, [])


    const sorted = renderableWithLinks

      // Sort alphabetically
      .sort(([name], [name2])=> {
        if (name.toLowerCase() < name2.toLowerCase()) {
          return -1;
        }
        if (name.toLowerCase() > name2.toLowerCase()) {
          return 1;
        }
        return 0;
      })

      // Sort required properties to the top
      .sort((e1, e2) => {
        const [ name ] = e1
        const [ name2 ] = e2

        if (required[name] && !required[name2]) return -1 // first required
        if (!required[name] && required[name2]) return 1 // second required

        if (e1[isLink] && !e2[isLink]) return -1 // first link
        if (!e1[isLink] && e2[isLink]) return 1 // second link

        return 0 // Both required
      })

       // Prioritise properties without other properties (e.g. name over NWBFile)
      .sort((e1, e2) => {
        const [ _, info ] = e1
        const [ __, info2 ] = e2

        if (e1[isLink] || e2[isLink]) return 0

        if (info2.properties) return -1
        else if (info.properties) return 1
        else return 0
      })


    let rendered = sorted.map((entry) => {

      const [name, info] = entry

      // Render linked properties
      if (entry[isLink]) {
        const linkedProperties = info.properties.map(path => {
          const pathCopy = [...path]
          const name = pathCopy.pop()
          return this.#renderInteractiveElement(name, schema.properties[name], results, required, pathCopy)
        })
        return html`
        <div class="link" data-name="${info.name}">
          <div>
            ${linkedProperties}
          </div>
        </div>
        `
      }

        // Directly render the interactive property element
        if (!info.properties) return this.#renderInteractiveElement(name, info, results, required, path)

        // Render properties in the sub-schema
        return html`
      <div style="margin-top: 40px;">
        <label class="guided--form-label header">${this.#parseStringToHeader(name)}</label>
        <hr/>
        ${this.#render(info, results[name],  required[name], [...path, name])}
      </div>
      `
    })

    return rendered
  }

  #registerRequirements = (schema, requirements = {}, acc=this.#requirements) => {
    if (!schema) return
    if (schema.required) schema.required.forEach(key => acc[key] = true)
    for (let key in requirements) acc[key] = requirements[key] // Overwrite standard requirements with custom requirements
    if (schema.properties){
        Object.entries(schema.properties).forEach(([key, value]) => {
        if (value.properties) {
          let nextAccumulator = acc[key]
          if (!nextAccumulator || typeof nextAccumulator !== 'object') nextAccumulator = acc[key] = {}
          this.#registerRequirements(value, requirements[key], nextAccumulator)
        }
      })
    }
  }

  // NOTE: This ignores the file selector button
  #checkAllInputs = (filter) => {
    const inputs = Array.from(this.shadowRoot.querySelectorAll('.schema-input'))
    const filtered = filter ? inputs.filter(filter) : inputs
    filtered.forEach(input => {
      const event = new Event('change'); // Create a new change event
      input.dispatchEvent(event); // Manually trigger the change event
    })
  }

  async updated() {
    this.#checkAllInputs((this.validateEmptyValues) ? undefined : (el) => el.value !== '') // Check all inputs with non-empty values on render
  }

  render() {


    const schema = this.schema ?? {}

    // Register default properties
    this.#registerDefaultProperties(schema.properties, this.results)

    // Delete extraneous results
    this.#deleteExtraneousResults(this.results, this.schema)

    this.#registerRequirements(this.schema, this.required)

    return html`
    <div>
    ${false ? html`<h2>${schema.title}</h2>` : ''}
    ${false ? html`<p>${schema.description}</p>` : ''}
    ${this.#render(schema, this.results, this.#requirements)}
    </div>
    `;
  }
};

customElements.get('nwb-jsonschema-form') || customElements.define('nwb-jsonschema-form',  JSONSchemaForm);
