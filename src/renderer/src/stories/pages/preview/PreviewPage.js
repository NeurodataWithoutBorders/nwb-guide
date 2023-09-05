import { html } from "lit";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import { Button } from "../../Button.js";

import { run } from "../guided-mode/options/utils.js";
import { JSONSchemaInput } from "../../JSONSchemaInput.js";
import { Modal } from "../../Modal";
import { truncateFilePaths } from "../../preview/NWBFilePreview.js";
import { InspectorList } from "../../preview/inspector/InspectorList.js";
import { Neurosift } from "../../preview/Neurosift.js";
import { baseUrl } from "../../../globals.js";


export class PreviewPage extends Page {
    constructor(...args) {
        super(...args);
    }

    render() {

        const neurosift = new Neurosift()

        this.input = new JSONSchemaInput({
            path: ['file_path'],
            info: {
                type: 'string',
                format: 'file'
            },
            onUpdate: async (path) => {

                const result = await fetch(`${baseUrl}/files/${path}`, { method: "POST" }).then((res) => res.text());
            
                if (result) neurosift.url = result
            },
            onThrow,
        });

        return html`
            <div style="display: grid; height: 100%; grid-template-rows: min-content min-content 1fr; gap: 10px;">
                <div>
                    <div style="display: flex; align-items: end; justify-content: space-between;">
                        <h1 style="margin: 0;">NWB File Preview</h1>
                    </div>
                    <p>Use Neurosift to preview of your NWB file.</p>
                    <hr />
                </div>
                ${this.input}
                ${neurosift}
            </div>
        `;
    }
}

customElements.get("nwbguide-preview-page") || customElements.define("nwbguide-preview-page", PreviewPage);
