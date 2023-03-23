

import { html } from 'lit';
import { Page } from '../../Page.js';

// For Multi-Select Form
import "../../../multiselect/MultiSelectForm.js";
import globals from '../../../../../scripts/globals.js';
const { port } = globals;

const base = `http://127.0.0.1:${port}`;

export class GuidedStructurePage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    onNext: async () => {
      const selected = this.select.selected
      const interfaces = Object.entries(this.select.selected).filter(([_, v]) => v).map(([k, _]) => k);

      this.save() // Save in case the schema request fails

      const schema = (interfaces.length === 0) ? {} : await fetch(`${base}/neuroconv/schema?interfaces=${interfaces.join(',')}`).then((res) => res.json())

      let sourceInfo = this.info.globalState.source
      if (!sourceInfo) sourceInfo = this.info.globalState.source = {results: {}, schema: {}}

      sourceInfo.schema = schema
      sourceInfo.interfaces = selected


      this.onTransition(1)
    }
  }

  updated(){
    const selected = this.info.globalState.source?.interfaces
    this.select = (this.shadowRoot ?? this).querySelector("#neuroconv-define-formats");
    fetch(`${base}/neuroconv`).then((res) => res.json()).then(json => {
      this.select.setAttribute("options", JSON.stringify(json))
      if (selected) this.select.selected = selected
    }).catch(e => console.error(e));
  }

  render() {
    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
    data-parent-tab-name="Dataset Structure"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Define your Data Formats</h1>
      </div>
      <div class="guided--section">
        <nwb-multiselect-form
          id="neuroconv-define-formats"
        ></nwb-multiselect-form>
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-structure-page') || customElements.define('nwbguide-guided-structure-page',  GuidedStructurePage);
