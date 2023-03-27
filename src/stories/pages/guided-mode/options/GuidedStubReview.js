

import { html } from 'lit';
import { Page } from '../../Page.js';
import { runConversion } from './utils.js';

export class GuidedStubReviewPage extends Page {

  constructor(...args) {
    super(...args)
  }

  footer = {
    next: false
  }

  render() {

    const convertButton = document.createElement('nwb-button')
    convertButton.textContent = 'Run Full Conversion'
    convertButton.addEventListener('click', async () => {

        // TODO: Insert validation here...
        const valid = true
        if (!valid) throw new Error('Invalid input')

        this.info.globalState.conversion.results = null

        this.save()

        const results = await runConversion({
          ...this.info.globalState.conversion.info,
          overwrite: true,

          // Override with the lastest source data and metadata information
          source_data: this.info.globalState.source.results,
          metadata: this.info.globalState.metadata.results
        })

        this.info.globalState.conversion.results = results

        this.onTransition(1)
    })

    return html`
  <div
    id="guided-mode-starting-container"
    class="guided--main-tab"
  >
    <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
      <div class="title">
        <h1 class="guided--text-sub-step">Conversion Preview</h1>
      </div>
      <div class="guided--section">
      ${this.info.globalState.preview ? html`<pre>${this.info.globalState.preview}</pre>`: html`<p>Your conversion preview failed. Please try again.</p>`}
      <br>
      ${convertButton}
      </div>
  </div>
    `;
  }
};

customElements.get('nwbguide-guided-stub-review-page') || customElements.define('nwbguide-guided-stub-review-page',  GuidedStubReviewPage);
