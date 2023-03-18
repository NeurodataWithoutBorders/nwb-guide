import { LitElement, css, html } from 'lit';

// Adapted from https://web.dev/building-a-multi-select-component/

const componentCSS = `

    * {
      box-sizing: border-box;
    }

    :host {
      display: inline-block;
    }

    :host > div {
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      padding: 25px;
      display: inline-block;
    }

    form {
        display: grid;
        gap: 2ch;
    }

    @media (pointer: coarse) {
        select[multiple] {
            display: block;
        }
    }

    fieldset {
        padding: 2ch;
        border: 1px solid gray;

        & > div + div {
            margin-block-start: 2ch;
        }
    }

    legend {
        font-weight: bold;
    }

    fieldset > div {
        display: flex;
        gap: 2ch;
        align-items: baseline;
    }
`

export class MultiSelectForm extends LitElement {


  static get styles() {
    return css([componentCSS])
  }

  static get properties() {
    return {
      options: { type: Object, reflect: true },
      selected: { type: Object, reflect: false },
    };
  }

  constructor (props = {}) {
    super()
    this.options = props.options ?? {}
    this.selected = props.selected ?? {}
  }

  attributeChangedCallback(changedProperties, oldValue, newValue) {
    super.attributeChangedCallback(changedProperties, oldValue, newValue)
    if (changedProperties === 'options') this.requestUpdate()
  }

//   NOTE: We can move these into their own components in the future
  async updated(){

    const dataFormatsForm = (this.shadowRoot ?? this).querySelector("#neuroconv-data-formats-form");
    dataFormatsForm.innerHTML = '' // Clear the form

    const formats = this.options

    if (formats.message) {
      throw new Error(formats.message);
    }

    // Currently supports two levels of fields
    let modalities = {};
    for (let className in formats) {
      const format = formats[className];
      const name = format.name ?? className;

      let modality = modalities[format.modality];
      if (!modality) {
        const fieldset = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = format.modality;
        fieldset.appendChild(legend);
        dataFormatsForm.appendChild(fieldset);

        modality = modalities[format.modality] = {
          form: fieldset,
          techniques: {},
        };
      }

      // Place in technique or modality div
      const technique = format.technique;
      let targetInfo = modality;
      if (technique) {

        targetInfo = modality.techniques[technique]
        if (!targetInfo) {
          const fieldset = document.createElement("fieldset");
          const legend = document.createElement("legend");
          legend.textContent = technique;
          fieldset.appendChild(legend);
          modality.form.appendChild(fieldset);

          targetInfo = modality.techniques[technique] = {
            form: fieldset,
          };
        }
      }

      const form = targetInfo.form;
      const div = document.createElement("div");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = name;
      input.name = name;
      div.appendChild(input);
      const label = document.createElement("label");

      if (this.selected[name]) input.checked = true;
      
      input.onchange = (ev) => {
        this.selected[name] = input.checked
      }
      label.for = name;
      label.textContent = name;
      div.appendChild(label);
      form.appendChild(div);
    }
  }

  render() {
    return html`
      <div>
          <form id="neuroconv-data-formats-form">
          <slot></slot>
          </form>
      </div>
    `;
  }
};

customElements.get('nwb-multiselect-form') || customElements.define('nwb-multiselect-form',  MultiSelectForm);
