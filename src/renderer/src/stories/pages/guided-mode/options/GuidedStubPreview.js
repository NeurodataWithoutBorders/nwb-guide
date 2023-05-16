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
            <div id="guided-mode-starting-container" class="guided--main-tab">
                <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
                    <div class="title">
                        <h1 class="guided--text-sub-step">Conversion Preview</h1>
                    </div>
                    <div class="guided--section">
                        ${this.info.globalState.preview
                            ? this.info.globalState.preview.map(
                                  (preview) =>
                                      html`<h2 class="guided--text-sub-step">${preview.file}</h2>
                                          <pre>${preview.result}</pre>`
                              )
                            : html`<p>Your conversion preview failed. Please try again.</p>`}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-stub-review-page") ||
    customElements.define("nwbguide-guided-stub-review-page", GuidedStubPreviewPage);
