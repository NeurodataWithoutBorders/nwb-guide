import { html } from "lit";
import { Page } from "../../Page.js";

import { UnsafeComponent } from "../../Unsafe.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../assets/folder_open.svg?raw";

import { electron } from "../../../../electron/index.js";
const { shell } = electron;

export class GuidedStubPreviewPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        content: () => {
            const info = this.info.globalState.preview;

            return html`
                <div style="display: flex; flex: 1 1 0px; justify-content: space-between; align-items: end;">
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <h1 class="title" style="margin: 0; padding: 0;">Conversion Preview</h1>
                        <small style="color: gray;">${info.file}</small>
                    </div>
                    <div style="padding-left: 25px">
                        <nwb-button size="small" @click=${() => (shell ? shell.showItemInFolder(info.file) : "")}
                            >${unsafeSVG(folderOpenSVG)}</nwb-button
                        >
                    </div>
                </div>
            `;
        },
    };

    footer = {
        next: "Run Conversion",
        onNext: async () => {
            this.save(); // Save in case the conversion fails

            delete this.info.globalState.conversion;
            this.info.globalState.conversion = await this.runConversions({}, true, {
                title: "Running all conversions",
            });
            this.onTransition(1);
        },
    };

    render() {
        const info = this.info.globalState.preview;

        return html`
            <div>
                ${info
                    ? new UnsafeComponent(info.html)
                    : html`<p style="text-align: center;">Your conversion preview failed. Please try again.</p>`}
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-stub-review-page") ||
    customElements.define("nwbguide-guided-stub-review-page", GuidedStubPreviewPage);
