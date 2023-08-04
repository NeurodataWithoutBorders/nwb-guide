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
        subtitle: () => this.info.globalState.preview.file,
        controls: () => html`<nwb-button size="small" @click=${() => (shell ? shell.showItemInFolder(this.info.globalState.preview.file) : "")}
            >${unsafeSVG(folderOpenSVG)}</nwb-button
        >`
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
