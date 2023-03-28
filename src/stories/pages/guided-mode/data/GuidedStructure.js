

import { html } from 'lit';
import { Page } from '../../Page.js';

// For Multi-Select Form
import "../../../multiselect/MultiSelectForm.js";
import { baseUrl } from '../../../../globals.js';
import { Search } from '../../../Search.js';

export class GuidedStructurePage extends Page {

  constructor(...args) {
    super(...args)

    // Handle Search Bar Interactions
    this.search.onSelect = this.#addListItem
  }

  #selected = {}

  #addListItem = (key, value) => {
    const name = value.name ?? value
    const li = document.createElement("li");
      const keyEl = document.createElement("span");

      let resolvedKey = name.slice(0, -9); const originalValue = resolvedKey;

      // Ensure no duplicate keys
      let i = 0
      while (resolvedKey in this.#selected) {
        i++
        resolvedKey = `${originalValue}_${i}`
      }

      keyEl.innerText = resolvedKey // Cut off "Interface"
      keyEl.contentEditable = true
      li.appendChild(keyEl)

      const sepEl = document.createElement("span");
      sepEl.innerText = " - ";
      li.appendChild(sepEl)

      const valueEl = document.createElement("span");
      valueEl.innerText = name
      li.appendChild(valueEl)
      this.list.appendChild(li);

      this.#selected[resolvedKey] = name
  }

  search = new Search({
    showAllWhenEmpty: true,
  })

  list = document.createElement('ul')

  footer = {
    onNext: async () => {

      const selected = this.#selected[resolvedKey]
      const interfaces = Object.keys(selected);

      this.save() // Save in case the schema request fails

      const schema = (interfaces.length === 0) ? {} : await fetch(`${baseUrl}/neuroconv/schema?interfaces=${interfaces.join(',')}`).then((res) => res.json())

      let sourceInfo = this.info.globalState.source
      if (!sourceInfo) sourceInfo = this.info.globalState.source = {results: {}, schema: {}}

      sourceInfo.schema = schema
      sourceInfo.interfaces = selected


      this.onTransition(1)
    }
  }

  async updated(){
    const selected = this.info.globalState.source?.interfaces
    this.search.options = await fetch(`${baseUrl}/neuroconv`).then((res) => res.json()).then(json => Object.entries(json).map(([key, value]) => {
      return {
        label: value.name,
        keywords: [value.modality, value.technique],
        value: value
        // keywords: value.keywords
      }
    })).catch(e => console.error(e));

    for (const [key, value] of Object.entries(selected || {})) this.#addListItem(key, value) // Add previously selected items
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
        ${this.list}
        ${this.search}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-structure-page') || customElements.define('nwbguide-guided-structure-page',  GuidedStructurePage);
