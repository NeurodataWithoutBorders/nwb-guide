import { html } from "lit";
import { Page } from "../../Page.js";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../assets/folder_open.svg?raw";

import { electron } from "../../../../electron/index.js";
import { Neurosift, getURLFromFilePath } from "../../../Neurosift.js";
const { shell } = electron;

export class GuidedStubPreviewPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        subtitle: () => this.info.globalState.preview,
        controls: () =>
            html`<nwb-button
                size="small"
                @click=${() => (shell ? shell.showItemInFolder(this.info.globalState.preview) : "")}
                >${unsafeSVG(folderOpenSVG)}</nwb-button
            >`,
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
        const { project, preview } = this.info.globalState;
        
        return preview ? new Neurosift({ url: getURLFromFilePath(preview, project.name)}) : html`<p style="text-align: center;">Your conversion preview failed. Please try again.</p>`;
    }
}

customElements.get("nwbguide-guided-stub-review-page") ||
    customElements.define("nwbguide-guided-stub-review-page", GuidedStubPreviewPage);
