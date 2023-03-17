

import { html } from 'lit';
import { Page } from '../../Page.js';

export class GuidedMetadataPage extends Page {

  constructor(...args) {
    super(...args)
  }


  render() {
    
    const recieved = this.info.metadata
    const metadata =  recieved ? Object.entries(recieved) : []
    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Metadata</h1>
      </div>
      <div class="guided--section">
       ${metadata.length ? metadata.map(([name, value]) => html`<h3>${name}</h3><pre>${JSON.stringify(value, null, 2)}</pre>`) : html`<p>No metadata</p>`}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-metadata-page') || customElements.define('nwbguide-guided-metadata-page',  GuidedMetadataPage);
