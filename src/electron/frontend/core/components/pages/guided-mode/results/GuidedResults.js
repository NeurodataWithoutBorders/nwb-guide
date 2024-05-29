import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../../../assets/icons/folder_open.svg?raw";

import { Page } from "../../Page.js";
import { getStubArray } from "../options/GuidedStubPreview.js";
import { getSharedPath } from "../../../preview/NWBFilePreview.js";

import { electron, path } from "../../../../../utils/electron.js";

import manualActionsJSON from "../../../../../../../schemas/json/manual_actions.json";

import { CodeBlock } from "../../../CodeBlock.js";

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

        // Show a snippet for how to open the NWB file
        return html`
            <p>Your data was successfully converted to NWB!</p>
            <ol style="margin: 10px 0px; padding-top: 0;">
                ${getStubArray(conversion)
                    .map(({ file }) => file.split(path.sep).slice(-1)[0])
                    .sort()
                    .map((id) => html`<li>${id}</li>`)}
            </ol>
            <h4>But what about my other data?</h4>
            <p>
                The GUIDE still can't do everything. You may need to manually adjust the NWB file to ensure it contains
                all the necessary data. <br><br>
                
                For example, to append to the file using PyNWB you would start with:
            </p>
            ${new CodeBlock({
                text: `from pynwb import NWBHDF5IO, NWBFile

nwbfile_path= "${this.#sharedPath()}"

# Open the file
with NWBHDF5IO(path=nwbfile_path, mode="r+") as io:
    nwbfile = io.read()

    # Then adjust the file as needed

    # ...
`,
            })}
            <h5>Related Documentation</h5>
            <div
                style="display: flex; gap: 10px; margin-top: 15px; padding-bottom: 5px; margin-bottom: 10px; overflow: auto;"
            >
                ${manualActionsJSON.map(
                    ({ name, description, url }) => html`
                        <div style="min-width: 300px; padding: 20px; background-color: #f0f0f0; border-radius: 5px;">
                            <h4 style="margin-bottom: 5px;">
                                <a href=${url} target="_blank" style="text-decoration: none;">${name}</a>
                            </h4>
                            <small>${description}</small>
                        </div>
                    `
                )}
            </div>
            <p>
                For more information, please refer to the
                <a href="https://pynwb.readthedocs.io/en/stable/" target="_blank">PyNWB</a> and
                <a href="https://neurodatawithoutborders.github.io/matnwb/" target="_blank">MatNWB</a> documentation.
            </p>
        `;
    }
}

customElements.get("nwbguide-guided-results-page") ||
    customElements.define("nwbguide-guided-results-page", GuidedResultsPage);
