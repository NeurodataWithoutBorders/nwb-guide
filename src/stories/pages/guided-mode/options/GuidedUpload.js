

import { html } from 'lit';
import { Page } from '../../Page.js';

export class GuidedUploadPage extends Page {

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
        <h1 class="guided--text-sub-step">Upload Location</h1>
      </div>
      <div class="guided--section">
       Coming soon...
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-upload-page') || customElements.define('nwbguide-guided-upload-page',  GuidedUploadPage);
