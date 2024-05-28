import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../../../assets/icons/folder_open.svg?raw";

import { Page } from "../../Page.js";
import { getStubArray } from "../options/GuidedStubPreview.js";
import { getSharedPath } from "../../../preview/NWBFilePreview.js";

import { electron, path } from "../../../../electron/index.js";
const { ipcRenderer } = electron;

export class GuidedResultsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        controls: () =>
            html`<nwb-button
                size="small"
                @click=${() => {
                    if (ipcRenderer) ipcRenderer.send("showItemInFolder", this.#sharedPath());
                }}
                >${unsafeSVG(folderOpenSVG)}</nwb-button
            >`,
    };

    footer = {};

    #sharedPath = () => {
        const { conversion } = this.info.globalState;
        if (!conversion) return "";
        return getSharedPath(getStubArray(conversion).map((item) => item.file));
    };

    updated() {
        this.save(); // Save the current state
    }

    render() {
        const { conversion } = this.info.globalState;

        if (!conversion)
            return html`<div style="text-align: center;"><p>Your conversion failed. Please try again.</p></div>`;

        return html`
            <p>Your data was successfully converted to NWB!</p>
            <ol style="margin: 10px 0px; padding-top: 0;">
                ${getStubArray(conversion)
                    .map(({ file }) => file.split(path.sep).slice(-1)[0])
                    .sort()
                    .map((id) => html`<li>${id}</li>`)}
            </ol>
        `;
    }
}

customElements.get("nwbguide-guided-results-page") ||
    customElements.define("nwbguide-guided-results-page", GuidedResultsPage);
