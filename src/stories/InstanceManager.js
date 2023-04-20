

import { LitElement, css, html } from 'lit';
import './Button';
import { notify } from '../globals';

export class InstanceManager extends LitElement {

  static get styles() {
    return css`

      * {
        box-sizing: border-box;
      }

      :host {
        width: 100%;
        display: flex;
        background: white;
        height: 400px;
      }

      :host > div {
        display: grid;
        grid-template-columns: fit-content(0) 1fr;
        grid-template-rows: minmax(0, 1fr);
        width: 100%;
      }


      :host > div > div {
        border: 1px solid #c3c3c3;
      }

      #add-new-button {
        box-sizing: border-box;
        padding: 0px 5px;
        width: 100%;
      }

      #instance-sidebar {
        width: 200px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      #instance-sidebar > * {
        padding: 15px;
      }

      #instance-header {
        background: #e5e5e5;
        border-bottom: 1px solid #c3c3c3;
      }

      #instance-list {
        list-style: none;
        padding: 5px;
        margin: 0;
        overflow-x: hidden;
        overflow-y: auto;
        height: 100%;
      }

      .item {
        padding: 5px;
        transition: background 0.5s;
        display: flex;
        align-items: center;
      }

      .item > * {
        margin-right: 10px;
      }

      .item > *:last-child {
        margin-right: 0;
      }

      .item > span {
        padding: 10px;
        cursor: pointer;
        width: 100%;
        display: block;
        text-align: center;
        font-weight: bold;
        border-radius: 8px;
        border: 1px solid transparent;
      }

      .item[selected] > span, span:hover {
        background: #ececec;
        border: 1px solid #c3c3c3;
      }

      #instance-display {
        padding: 25px;
        border-left: 0;
        overflow-y: scroll;
        overflow-x: hidden;
        height: 100%;
      }

      #content {
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      input {
        width: 100%;
      }

      .item#new-info {
        align-items: unset;
      }


      #new-manager *[hidden]{
        display: none;
      }

      #new-manager {
        height: 125px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1;
      }

      .controls {
        padding: 10px;
        border-bottom: 1px solid gainsboro;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
    `
  }

  constructor (props = {}) {
    super()
    this.instances = props.instances ?? {}
    this.header = props.header ?? 'Instances'
    this.instanceType = props.instanceType ?? 'Instance'
    if (props.renderInstance) this.renderInstance = props.renderInstance
    if (props.onAdded) this.onAdded = props.onAdded
    if (props.onRemoved) this.onRemoved = props.onRemoved
    this.add = props.add ?? true
    this.controls = props.controls ?? []
  }

  renderInstance = (_, value) => value
  onAdded = () => {}
  onRemoved = () => {}

  toggleInput = (force) => {
    const newInfoDiv = this.shadowRoot.querySelector('#new-info')
    if (force === true) {
      newInfoDiv.hidden = false
    } else if (force === false) {
      newInfoDiv.hidden = true
    } else {
      newInfoDiv.hidden = !newInfoDiv.hidden
    }

    if (!newInfoDiv.hidden) {
      const input = this.shadowRoot.querySelector('#new-info input')
      input.focus()

      const mousePress = (e) => {
        if (!e.composedPath().includes(newInfoDiv)) {
          this.#onKeyDone()
          document.removeEventListener('pointerdown', mousePress)
        }
      }
      document.addEventListener('pointerdown', mousePress)
    }
  }

  #onKeyDone = () => {
    const button = this.shadowRoot.querySelector('#add-new-button')
    button.parentNode.hidden = false
    this.toggleInput(false)
  }


  #mapCategoryToInstances = (base, category) => {
    let instances = {}
    Object.entries(category).forEach(([key, value]) => {
      const newKey  = `${base}/${key}`
      if (typeof value === 'object' && !(value instanceof HTMLElement)) instances = {...this.#mapCategoryToInstances(value)}
      else instances[newKey] = value
    })
    return instances
  }

  #selected;

  // Correct bug where multiple instances are selected
  updated = () => {
    const selected = Array.from(this.shadowRoot.querySelectorAll('[selected]'))
    if (selected.length > 0) selected.slice(1).forEach((el) => {
      const instance = el.getAttribute('data-instance')
      el.removeAttribute('selected')
      this.shadowRoot.querySelector(`div[data-instance="${instance}"]`).setAttribute('hidden', '')
    })

  }

  render() {
    let instances = {}

    Object.entries(this.instances).forEach(([key, value]) =>{
      const isCategory =  typeof value === 'object' && !(value instanceof HTMLElement)
      if (isCategory) instances = {...instances, ...this.#mapCategoryToInstances(key, value)}
      else instances[key] = value
    })

    const isSelected = Object.keys(instances).map((key, i) => this.#selected ? key === this.#selected : i === 0)

    return html`
    <div>
      <div id="instance-sidebar">
        <div id="instance-header">
          <h2>${this.header}</h2>
        </div>
        <ul id="instance-list">
        ${Object.keys(instances).map((key, i) => html`
          <li class="item" ?selected=${isSelected[i] === true} data-instance="${key}">
            <span @click="${() => {

              this.#selected = key
              const sidebarInstances = Array.from(this.shadowRoot.querySelectorAll('li[data-instance]'))
              const instances = Array.from(this.shadowRoot.querySelectorAll('div[data-instance]'))
              const sidebarElement = sidebarInstances.find(el => el.getAttribute('data-instance') === key)
              const element = instances.find(el => el.getAttribute('data-instance') === key)
              if (element) {
                sidebarElement.setAttribute('selected', '')
                element.hidden = false
                instances.forEach(el => {
                  if (el !== element) el.hidden = true
                })

                sidebarInstances.forEach(el => {
                  if (el !== sidebarElement) el.removeAttribute('selected')
                })
              }
            }}">${key}</span>
            <nwb-button
              size="small"
              primary
              color="gray"
              @click=${(ev) => {
                const parent = ev.target.parentNode
                const name = parent.getAttribute('data-instance')
                const ogPath = name.split('/')
                const path = [...ogPath]
                let target = this.instances
                const key = path.pop()
                target = path.reduce((acc, cur) => acc[cur], target)
                this.onRemoved(target[key], ogPath)
                delete target[key]

                if (parent.hasAttribute('selected')) {
                  const previous = parent.previousElementSibling?.getAttribute('data-instance')
                  if (previous) this.#selected = previous
                  else {
                    const next = parent.nextElementSibling?.getAttribute('data-instance')
                    if (next) this.#selected = next
                    else this.#selected = undefined
                  }
                }

                // parent.remove()
                // const instance = this.shadowRoot.querySelector(`div[data-instance="${name}"]`)
                // instance.remove()

                this.requestUpdate()
              }}

              .buttonStyles=${{
                padding: '7px'
              }}
            >x</nwb-button>
          </li>
        `)}
      </ul>
      ${this.add ? html`<div id="new-manager">
        <div id="new-info" class="item" hidden>
          <input></input>
          <nwb-button size="small" primary @click=${() => {
            const input = this.shadowRoot.querySelector('#new-info input')

            if (input.value) {
              try {
                const path = input.value.split('/')
                const res = this.onAdded(path)

                let resolvedPath = res?.key ? res.key.split('/') : path
                let resolvedValue = res instanceof HTMLElement ? res : res?.value ?? null

                let key = resolvedPath.pop()

                let target = this.instances
                resolvedPath.forEach(key => target = target[key] = target[key] ?? {})
                target[key] = resolvedValue

                this.#onKeyDone()
                this.requestUpdate()
              } catch (e) {
                notify(e.message, 'error')
              }
              input.value = ''
            }
          }}>Add</nwb-button>
        </div>
        <div class="item">
          <nwb-button
            id="add-new-button"
            @click=${(ev) => {
              ev.target.parentNode.hidden = true
              this.toggleInput(true)
            }}

            icon="+"
            .buttonStyles=${{
              width: '100%'
            }}>Add ${this.instanceType}</nwb-button>
        </div>
      </div>` : ''}
      </div>
      <div id="content">
      ${this.controls.length ? html`<div class="controls">${this.controls.map((o) => {
        return html`<nwb-button
          size="small"
          icon=${o.icon}
          @click=${function() {
            const el = this.shadowRoot.querySelector('#instance-display > div:not([hidden])')
            o.onClick.call(this, el.getAttribute('data-instance'), el)
          }}
        >${o.name}</nwb-button>`
      })}</div>` : ``}

        <div id="instance-display">
        ${Object.entries(instances).map(([key, o], i) => html`
          <div data-instance="${key}" ?hidden=${isSelected[i] === false}>
              ${this.renderInstance(key, o)}
          </div>
        `)}
        </div>
      </div>
    </div>
    `;
  }
};

customElements.get('nwb-instance-manager') || customElements.define('nwb-instance-manager',  InstanceManager);
