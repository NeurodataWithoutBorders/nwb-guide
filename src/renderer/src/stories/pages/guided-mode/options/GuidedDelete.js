import { html } from "lit";
import { Page } from "../../Page.js";

export class GuidedDeleteFilesPage extends Page {
    constructor(...args) {
        super(...args);
    }

    render() {
        return html`
            <h1 class="guided--text-sub-step">Delete Intermediate Files</h1>
            <hr />
            <div class="guided--section">Coming soon...</div>
        `;
    }
}

customElements.get("nwbguide-guided-deletefiles-page") ||
    customElements.define("nwbguide-guided-deletefiles-page", GuidedDeleteFilesPage);
