

import { html } from 'lit';
import { Page } from '../Page.js';

export class GuidedHeader extends Page {

  constructor () {
    super()
  }

  updated(){

  }

  render() {
    return html`
    <header id="guided-header-div" class="guided--header">
    <div class="guided--progression-tab-container">
      <div
        class="guided--progression-tab guided--progression-tab-triangle selected-tab"
        id="prepare-dataset-progression-tab"
      >
        <div class="guided--progression-tab-content">
          <span class="dot">1</span>
          <div class="guided--progression-tab-labels">
            <h1 class="guided--progression-tab-label-main">Structure dataset</h1>
          </div>
        </div>
      </div>
      <div
        class="guided--progression-tab guided--progression-tab-triangle"
        id="prepare-dataset-metadata-progression-tab"
      >
        <div class="guided--progression-tab-content">
          <span class="dot">2</span>
          <div class="guided--progression-tab-labels">
            <h1 class="guided--progression-tab-label-main">Provide metadata</h1>
          </div>
        </div>
      </div>
      <div
        class="guided--progression-tab guided--progression-tab-triangle"
        id="prepare-pennsieve-metadata-progression-tab"
      >
        <div class="guided--progression-tab-content">
          <span class="dot">3</span>
          <div class="guided--progression-tab-labels">
            <h1 class="guided--progression-tab-label-main">Pennsieve metadata</h1>
          </div>
        </div>
      </div>
      <div class="guided--progression-tab" id="disseminate-dataset-progression-tab">
        <div class="guided--progression-tab-content">
          <span class="dot">4</span>
          <div class="guided--progression-tab-labels">
            <h1 class="guided--progression-tab-label-main">Generate dataset</h1>
          </div>
        </div>
      </div>
    </div>
    </header>
    `;
  }
};

customElements.get('nwbguide-guided-header') || customElements.define('nwbguide-guided-header',  GuidedHeader);