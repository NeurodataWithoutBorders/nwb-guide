import { html } from "lit";
import { Page } from "../../Page.js";

export class GuidedResultsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    render() {
        return html`
        <div class="title">
            <h1 class="guided--text-sub-step">Conversion Results</h1>
        </div>
        <div style="text-align: center;">
            ${this.info.globalState.conversion
                ? html`<p>Your conversion was successful!</p>`
                : html`<p>Your conversion failed. Please try again.</p>`}
        </div>
        `;
    }
}

customElements.get("nwbguide-guided-results-page") ||
    customElements.define("nwbguide-guided-results-page", GuidedResultsPage);
