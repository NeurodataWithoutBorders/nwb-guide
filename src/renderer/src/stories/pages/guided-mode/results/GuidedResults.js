import { html } from "lit";
import { Page } from "../../Page.js";

export class GuidedResultsPage extends Page {
  constructor(...args) {
    super(...args);
  }

  render() {
    return html`
      <div id="guided-mode-starting-container" class="guided--main-tab">
        <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
          <div class="title">
            <h1 class="guided--text-sub-step">Conversion Results</h1>
          </div>
          <div class="guided--section">
            ${this.info.globalState.conversion
              ? html`<p>Your conversion was successful!</p>`
              : html`<p>Your conversion failed. Please try again.</p>`}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.get("nwbguide-guided-results-page") ||
  customElements.define("nwbguide-guided-results-page", GuidedResultsPage);
