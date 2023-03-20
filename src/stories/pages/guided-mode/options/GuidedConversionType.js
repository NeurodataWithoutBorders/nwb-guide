

import { html } from 'lit';
import { Page } from '../../Page.js';

export class GuidedConversionTypePage extends Page {

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
        <h1 class="guided--text-sub-step">Conversion Type</h1>
      </div>
      <div class="guided--section">
       Coming soon...
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-conversion-type-page') || customElements.define('nwbguide-guided-conversion-type-page',  GuidedConversionTypePage);
