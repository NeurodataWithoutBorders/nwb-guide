

import { html } from 'lit';
import { Page } from '../../Page.js';

export class GuidedSourceDataPage extends Page {

  constructor(...args) {
    super(...args)
  }

  
  render() {
    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Source Data</h1>
      </div>
      <div class="guided--section">
       Coming soon...
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-sourcedata-page') || customElements.define('nwbguide-guided-sourcedata-page',  GuidedSourceDataPage);
