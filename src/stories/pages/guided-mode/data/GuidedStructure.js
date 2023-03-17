

import { html } from 'lit';
import { Page } from '../../Page.js';

// For Multi-Select Form
import "../../../multiselect/MultiSelectForm.js";
import globals from '../../../../../scripts/globals.js';
const { port } = globals;

export class GuidedStructurePage extends Page {

  constructor(...args) {
    super(...args)
  }

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
    const multiselectEl = (this.shadowRoot ?? this).querySelector("#neuroconv-define-formats");
    const base = `http://127.0.0.1:${port}`;
    fetch(`${base}/neuroconv`).then((res) => res.json()).then(json => {
        multiselectEl.setAttribute("options", JSON.stringify(json))
    });
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
