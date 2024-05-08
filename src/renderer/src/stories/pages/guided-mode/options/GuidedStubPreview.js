import { html } from "lit";
import { Page } from "../../Page.js";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../assets/folder_open.svg?raw";

import { electron } from "../../../../electron/index.js";
import { NWBFilePreview, getSharedPath } from "../../../preview/NWBFilePreview.js";
const { ipcRenderer } = electron;

export const getStubArray = (stubs) =>
    Object.values(stubs)
        .map((item) => Object.values(item))
        .flat();

export class GuidedStubPreviewPage extends Page {
    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
    }

    header = {
        subtitle: `Preview file contents on truncated files using the Neurosift application`,
        controls: () =>
            html`<nwb-button
                size="small"
                @click=${() => {
                    if (ipcRenderer)
                        ipcRenderer.send(
                            "showItemInFolder",
                            getSharedPath(getStubArray(this.info.globalState.preview.stubs).map((item) => item.file))
                        );
                }}
                >${unsafeSVG(folderOpenSVG)}</nwb-button
            >`,
    };

    // NOTE: We may want to trigger this whenever (1) this page is visited AND (2) data has been changed.
    footer = {
        next: "Run Conversion",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails
            return this.to(1); // Will trigger conversion if necessary
        },
    };

    render() {
        const { preview, project } = this.info.globalState;

        return preview.stubs
            ? new NWBFilePreview({ project: project.name, files: preview.stubs })
            : html`<p style="text-align: center;">Your conversion preview failed. Please try again.</p>`;
    }
}

customElements.get("nwbguide-guided-stub-review-page") ||
    customElements.define("nwbguide-guided-stub-review-page", GuidedStubPreviewPage);
