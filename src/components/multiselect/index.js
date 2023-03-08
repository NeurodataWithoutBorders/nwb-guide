import { LitElement, css, html } from 'lit';

// Adapted from https://web.dev/building-a-multi-select-component/

const componentCSS = `
    form {
        display: grid;
        gap: 2ch;
        max-inline-size: 30ch;
    }

    @media (pointer: coarse) {
        select[multiple] {
            display: block;
        }
    }

    fieldset {
        padding: 2ch;

        & > div + div {
            margin-block-start: 2ch;
        }
    }

    fieldset > div {
        display: flex;
        gap: 2ch;
        align-items: baseline;
    }
`

export class MultiSelectForm extends LitElement {

  header = 'Multi-Select Form'
  options = {}

  static get styles() {
    return css([componentCSS])
  }

  static get properties() {
    return {
      header: { type: String, reflect: true },
      options: { type: Object, reflect: true }
    };
  }

  constructor (props) {
    super()
    Object.assign(this, props)
  } 

  attributeChangedCallback(changedProperties, oldValue, newValue) {
    super.attributeChangedCallback(changedProperties, oldValue, newValue)
    if (changedProperties === 'options' || changedProperties === 'header') this.requestUpdate()
  }


//   NOTE: We can move these into their own components in the future
  async updated(){

    const dataFormatsForm = (this.shadowRoot ?? this).querySelector("#neuroconv-data-formats-form");

    const formats = this.options 
  
    if (formats.message) {
      throw new Error(formats.message);
    }
  
    // Currently supports two levels of fields
    let modalities = {};
    for (let name in formats) {
      const format = formats[name];
  
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
        if (!modality.techniques[technique]) {
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
      label.for = name;
      label.textContent = name;
      div.appendChild(label);
      form.appendChild(div);
    }
  }

  render() {
    return html`
        <h2>${this.header}</h2>
        <form id="neuroconv-data-formats-form">
        </form>
    `;
  }
};

customElements.get('nwb-multiselect-form') || customElements.define('nwb-multiselect-form',  MultiSelectForm);