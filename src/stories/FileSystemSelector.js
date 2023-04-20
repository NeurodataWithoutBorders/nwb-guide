import { LitElement, css, html } from 'lit';

import { remote } from '../electron/index'
const { dialog } = remote

const componentCSS = css`

    * {
      box-sizing: border-box;
    }

    :host {
      display: inline-block;
      width: 100%;
    }

    button {
      background: WhiteSmoke;
      border: 1px solid #c3c3c3;
      border-radius: 4px;
      padding: 25px;
      width: 100%;
      color: dimgray;
      cursor: pointer;
      overflow-wrap: break-word;
      text-align: center;
      transition: background 0.5s;
    }

    small {
      color: silver;
    }

    :host(.active) button {
      background: Gainsboro;
    }

`

document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

export class FilesystemSelector extends LitElement {


  static get styles() {
    return componentCSS
  }

  static get properties() {
    return {
      value: { type: String, reflect: true }
    };
  }

  constructor (props = {}) {
    super()
    if (props.onSelect) this.onSelect = props.onSelect
    if (props.onChange) this.onChange = props.onChange
    this.type = props.type ?? 'file'
    this.value = props.value ?? ''
    this.dialogOptions = props.dialogOptions ?? {}
    this.onChange = props.onChange ?? (() => {})
    this.dialogType = props.dialogType ?? 'showOpenDialog'

    this.addEventListener('change', () => this.onChange(this.value))
  }

  onSelect = () => {}
  onChange = () => {}

  display = document.createElement('small')

  #useElectronDialog = async (type) => {

    const options = { ...this.dialogOptions }
    options.properties = [type === 'file' ? 'openFile' : 'openDirectory', 'noResolveAliases', ...options.properties ?? []]
    this.classList.add('active')
    const result = await dialog[this.dialogType](options);
    this.classList.remove('active')
    if (result.canceled) throw new Error('No file selected')
    return result
  }

  #handleFile = async (path) => {
    if (!path) throw new Error('Unable to parse file path')
    this.value = path
    const event = new Event('change'); // Create a new change event
    this.dispatchEvent(event)
    this.onSelect(path)
  }


  render() {

    return html`
    <button @click=${async () => {
      if (dialog) {
        const file = await this.#useElectronDialog(this.type)
        const path = file.filePath ?? file.filePaths?.[0]
        this.#handleFile(path)
      } else {
        let handles = (this.type === 'directory') ? await window.showDirectoryPicker() :  await window.showOpenFilePicker();
        this.#handleFile((handles[0] ?? handles).name)
      }
      }}

      @dragenter=${() => {
        this.classList.add('active')
      }}

      @dragleave=${() => {
        this.classList.remove('active')
      }}

      @drop=${async (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.classList.remove('active')

        let pathArr = [];
        for (const f of event.dataTransfer.files) pathArr.push(f.path)
        if (pathArr.length > 1) console.error('Only one file can be registered at a time')
        this.#handleFile(pathArr[0])
      }}


      >${this.value || `Drop a ${this.type} here, or click to choose a ${this.type}`}
      ${dialog ? '' : html`<br><small>Cannot get full ${this.type} path on web distribution</small>`}
      </button>
    `
  }
};

customElements.get('nwb-filesystem-selector') || customElements.define('nwb-filesystem-selector',  FilesystemSelector);
