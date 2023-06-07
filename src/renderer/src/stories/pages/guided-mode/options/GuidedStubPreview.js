import { html } from "lit";
import { Page } from "../../Page.js";

export class GuidedStubPreviewPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {
        next: "Run Conversion",
        onNext: async () => {
            this.save(); // Save in case the conversion fails
            delete this.info.globalState.conversion.results;
            this.info.globalState.conversion.results = await this.runConversions({}, true, {
                title: "Running all conversions",
            });
            this.onTransition(1);
        },
    };

    render() {
        return html`
            <div>
                ${this.info.globalState.preview
                    ? this.info.globalState.preview.map(
                          (preview) =>
                              html`<h2 class="guided--text-sub-step">${preview.file}</h2>
                                  <pre>${preview.result}</pre>`
                      )
                    : html`<p style="text-align: center;">Your conversion preview failed. Please try again.</p>`}
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-stub-review-page") ||
    customElements.define("nwbguide-guided-stub-review-page", GuidedStubPreviewPage);
