

import { html } from 'lit';
import { Page } from '../../Page.js';

// For Multi-Select Form
import "../../../multiselect/MultiSelectForm.js";
import globals from '../../../../../scripts/globals.js';
import { Search } from '../../../Search.js';
const { port } = globals;

export class GuidedStructurePage extends Page {

  constructor(...args) {
    super(...args)
  }

  search = new Search()

  updated(){
    const list = (this.shadowRoot ?? this).querySelector("ul");
    this.search.onSelect = (key, value) => {
      console.log("Selected", key, value);
      const li = document.createElement("li");
      li.innerHTML = `${value.name.slice(0, -9)} - ${value.name}`;
      list.appendChild(li);
    }

    const base = `http://127.0.0.1:${port}`;
    fetch(`${base}/neuroconv`).then((res) => res.json()).then(json => {
      this.search.options = Object.entries(json).map(([key, value]) => {
        return {
          label: value.name,
          keywords: [value.modality, value.technique],
          value: value
          // keywords: value.keywords
        }
      })
      // this.search.options = json;
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
        <ul>
        </ul>
        ${this.search}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-structure-page') || customElements.define('nwbguide-guided-structure-page',  GuidedStructurePage);
