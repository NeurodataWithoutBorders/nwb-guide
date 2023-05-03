import { LitElement, css, html } from 'lit';
import { notify } from '../globals';
import { FilesystemSelector } from './FileSystemSelector';
import { Accordion } from './Accordion';

import { capitalize, header } from './forms/utils'
import { Table } from './Table';

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

    .form-section:first-child .guided--form-label {
      margin-top: 0;
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
      padding: 20px;
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
      mode: { type: String, reflect: true },
      schema: { type: Object, reflect: false },
      results: { type: Object, reflect: false },
      ignore: { type: Array, reflect: false },
      required: { type: Object, reflect: false},
      dialogType: { type: String, reflect: false },
      dialogOptions: { type: Object, reflect: false }
    };
  }

  #base = []
  #nestedForms = {}
  #nErrors = 0
  #nWarnings = 0

  constructor (props = {}) {
    super()

    this.identifier = props.identifier
    this.mode = props.mode ?? 'default'
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

    if (props.onStatusChange) this.onStatusChange = props.onStatusChange

    if (props.base) this.#base = props.base
  }

  #requirements = {}

  attributeChangedCallback(changedProperties, oldValue, newValue) {
    super.attributeChangedCallback(changedProperties, oldValue, newValue)
    if (changedProperties === 'options') this.requestUpdate()
  }

  #updateParent(name, value, parent) {
    if (!value) delete parent[name]
    else parent[name] = value
  }


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
    const nChildren = container.children.length
    container.innerHTML = ''

    // Track errors and warnings
    if (type === 'errors') this.#nErrors -= nChildren
    if (type === 'warnings') this.#nWarnings -= nChildren
  }

  status;
  #checkStatus = () => {
    let newStatus = 'valid'
    const nestedStatus = Object.values(this.#nestedForms).map(f => f.status)
    if (nestedStatus.includes('error')) newStatus = 'error'
    else if (this.#nErrors) newStatus = 'error'
    else if (nestedStatus.includes('warning')) newStatus = 'warning'
    else if (this.#nWarnings) newStatus = 'warning'

    if (newStatus !== this.status) this.onStatusChange(this.status = newStatus)
  }


  validate = async () => {

    // Check if any required inputs are missing
    const invalidInputs = await this.#validateRequirements(this.results, this.#requirements) // get missing required paths
    const isValid = !invalidInputs.length

    // Print out a detailed error message if any inputs are missing
    let message = isValid ? '' : `${invalidInputs.length} required inputs are not specified properly.`


    // Check if all inputs are valid
    const flaggedInputs = this.shadowRoot.querySelectorAll('.invalid')
    if (flaggedInputs.length) {
      flaggedInputs[0].focus()
      if (!message) message = `${flaggedInputs.length} invalid form values.`
      message += ` Please check the highlighted fields.`
    }


    if (message) {
      notify(this.identifier ?  `<b>[${this.identifier}]</b>: ${message}` : message, 'error', 7000)
      throw new Error(message)
    }

    for (let key in this.#nestedForms) await this.#nestedForms[key].validate() // Validate nested forms too

    // NOTE: Ensure user is aware of any warnings before moving on
    // const activeWarnings = Array.from(this.shadowRoot.querySelectorAll('.warnings')).map(input => Array.from(input.children)).filter(input => input.length)

    // if (this.#nWarnings) {
    //   const warningText = activeWarnings.reduce((acc, children) => [...acc, ...children.map(el => el.innerText)], [])
    //   const result = await Swal.fire({
    //     title: `Are you sure you would like to submit your metadata with ${this.#nWarnings} warnings?`,
    //     html: `<small><ol style="text-align: left;">${warningText.map(v => `<li>${v}</li>`).join('')}</ol></small>`,
    //     icon: "warning",
    //     heightAuto: false,
    //     showCancelButton: true,
    //     confirmButtonColor: "#3085d6",
    //     cancelButtonColor: "#d33",
    //     confirmButtonText: "Complete Metadata Entry",
    //     cancelButtonText: "Cancel",
    //     focusCancel: true,
    //   });

    //   if (!result.isConfirmed) throw new Error('User cancelled metadata submission')
    // }

    return true

  }

  #get = (path) => {
    path = path.slice(this.#base.length) // Correct for base path
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

  #getSchema(path, schema = this.schema) {
    if (typeof path === 'string') path = path.split('.')
    if (this.#base.length) {
      const base = this.#base.slice(-1)[0]
      const indexOf = path.indexOf(base)
      if (indexOf !== -1) path = path.slice(indexOf + 1)
    }

    const resolved = path.reduce((acc, curr) => acc = acc[curr], schema)
    if (resolved['$ref']) return this.#getSchema(resolved['$ref'].split('/').slice(1)) // NOTE: This assumes reference to the root of the schema
    
    return resolved
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

        // Handle updates when no longer required
        else return false
      }
     }

    return html`
    <div id=${fullPath.join('-')} class="form-section ${(isRequired || isConditional) ? 'required' : ''} ${isConditional ? 'conditional' : ''}">
      <label class="guided--form-label">${header(name)}</label>
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
          if (this.#filesystemQueries.includes(info.format)) {
            const el = new FilesystemSelector({
              type: info.format,
              value: parent[name],
              onSelect: (filePath) => this.#updateParent(name, filePath, parent),
              onChange: (filePath) => this.#validateOnChange(name, parent, el, path),
              dialogOptions: this.dialogOptions,
              dialogType: this.dialogType
            })
            return el
          }

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

        if (info.type === 'array') {
          const itemSchema = this.#getSchema('items', info)
          if (itemSchema.type === 'object') {
            return new Table({
              schema: itemSchema,
              data: parent[name],
            })
          }
        // {
        //   return html`
        //   <div class="guided--array">
        //     <div class="guided--array-items">
        //       ${parent[name]?.map((item, i) => html`
        //         <div class="guided--array-item">  
        //           ${JSON.stringify(item, null, 2)}
        //           <button class="guided--array-item-remove" @click=${() => {
        //             const newArray = [...parent[name]]
        //             newArray.splice(i, 1)
        //             this.#updateParent(name, newArray, parent)
        //           }}>Remove</button>
        //         </div>
        //       `)}
        //     </div>
        //     <button class="guided--array-add" @click=${() => {
        //       const newArray = [...parent[name] ?? []]
        //       newArray.push(info.items.default ?? '')
        //       this.#updateParent(name, newArray, parent)
        //     }}>Add</button>
        //   </div>
        //   `
        // }
        }



      // Print out the immutable default value
      return html`<pre>${info.default ? JSON.stringify(info.default, null, 2) : 'No default value'}</pre>`
      })()}
      ${info.description ? html`<p class="guided--text-input-instructions">${capitalize(info.description)}${info.description.slice(-1)[0] === '.' ? '' : '.'}${isStringArray ? html`<span style="color: #202020;"> Separate on new lines.</span>` : ''}</p>` : ''}
      <div class="errors"></div>
      <div class="warnings"></div>
    </div>
    `
  }

  #filesystemQueries = ['file', 'directory']

  #validateRequirements = async (results, requirements, parent) => {

    let invalid = []

    for (let name in requirements) {
      let isRequired = requirements[name]
      if (typeof isRequired === 'function') isRequired = await isRequired.call(this.results)
      if (isRequired) {
        let path = parent ? `${parent}-${name}` : name
        if (typeof isRequired === 'object' && !Array.isArray(isRequired)) invalid.push(...await this.#validateRequirements(results[name], isRequired, path))
        else if (!results[name]) invalid.push(path)
      }
    }

    return invalid
  }

  // Checks missing required properties and throws an error if any are found
  onInvalid = () => {}

  #registerDefaultProperties = (properties = {}, results) => {
    for (let name in properties) {
      const info = properties[name]
      const props = info.properties

      if (!results[name]){
        if (props) results[name] = {} // Regisiter new interfaces in results
        if (info.default) results[name] = info.default
      }
      
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
  onStatusChange = () => {}

  #getLink = (args) => {
    if (typeof args === 'string') args = args.split('-')
    return this.conditionalRequirements.find((linked) =>linked.properties.find((link) => link.join('-') === args.join('-')))
  }

  #applyToLinkedProperties = (fn, args) => {
    const links = this.#getLink(args)?.properties
    if (!links) return []
    return Promise.all(links.map((link) => {
      const linkEl =this.shadowRoot.getElementById(`${link.join('-')}`)
      return fn(link, linkEl)
    }).flat())
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
    path = path.slice(this.#base.length) // Remove base path
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

    const hasLinks = this.#getLink(fullPath)
    if (hasLinks) {
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
    } else {
      // For non-links, throw a basic requirement error if the property is required
      if (!errors.length && isRequired && !parent[name]) {
        errors.push({ message: `${name} is a required property.`, type: 'error', missing: true}) // Throw at least a basic error if the property is required
      }
    }

    // Clear old errors and warnings
    this.#clearMessages(fullPath, 'errors')
    this.#clearMessages(fullPath, 'warnings')

    // Track errors and warnings
    this.#nErrors += errors.length
    this.#nWarnings += warnings.length
    this.#checkStatus()

    // Show aggregated errors and warnings (if any)
    warnings.forEach((info) => this.#addMessage(fullPath, info.message, 'warnings'))

    if ((valid === true || valid == undefined || !valid.find(o => o.type === 'error')) && errors.length === 0) {
      element.classList.remove('invalid')

      const linkEl = this.#getLinkElement(fullPath)
      if (linkEl) linkEl.classList.remove('required', 'conditional')

      await this.#applyToLinkedProperties((path, element) => {
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
        if (!info.properties) {
          if (name === 'definitions') return '' // Skip definitions
          return this.#renderInteractiveElement(name, info, results, required, path)
        }

        const hasMany = renderable.length > 1 // How many siblings?

        if (this.mode === 'accordion' && hasMany) {

          const headerName = header(name)

          this.#nestedForms[name] = new JSONSchemaForm({
            identifier: this.identifier,
            schema: info,
            results: results[name],
            required: required[name], // Scoped to the sub-schema
            ignore: this.ignore,
            dialogOptions: this.dialogOptions,
            dialogType: this.dialogType,
            onlyRequired: this.onlyRequired,
            showLevelOverride: this.showLevelOverride,
            conditionalRequirements: this.conditionalRequirements,
            validateOnChange: (...args) => this.validateOnChange(...args),
            validateEmptyValues: this.validateEmptyValues,
            onStatusChange: (status) => {
              accordion.setSectionStatus(headerName, status)
              this.#checkStatus()
            }, // Forward status changes to the parent form
            onInvalid: (...args) => this.onInvalid(...args),
            base: [...path, name]
          })


          const accordion = new Accordion({
            sections: {
              [headerName]: {
                subtitle: `${Object.keys(info.properties).length} fields`,
                content: this.#nestedForms[name] //generateForm
              }
            }
          })

          return accordion
        }

        // Render properties in the sub-schema
        const rendered = this.#render(info, results[name], required[name], [...path, name])
        return (hasMany || path.length > 1) ? html`
          <div style="margin-top: 40px;">
            <label class="guided--form-label header">${header(name)}</label>
            <hr/>
            ${rendered}
          </div>
        ` : rendered
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
    const fileInputs = Array.from(this.shadowRoot.querySelectorAll('nwb-filesystem-selector') ?? [])
    const allInputs = [...inputs, ...fileInputs]
    const filtered = filter ? allInputs.filter(filter) : allInputs
    filtered.forEach(input => input.dispatchEvent(new Event('change')))
  }

  async updated() {
    this.#checkAllInputs((this.validateEmptyValues) ? undefined : (el) => (el.value ?? el.checked) !== '') // Check all inputs with non-empty values on render
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
    ${this.#render(schema, this.results, this.#requirements, this.#base)}
    </div>
    `;
  }
};

customElements.get('nwb-jsonschema-form') || customElements.define('nwb-jsonschema-form',  JSONSchemaForm);
