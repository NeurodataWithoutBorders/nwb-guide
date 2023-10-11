import { html } from "lit";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import { JSONSchemaInput } from "../../JSONSchemaInput.js";
import { Neurosift } from "../../preview/Neurosift.js";
import { baseUrl } from "../../../globals.js";

export class PreviewPage extends Page {
    constructor(...args) {
        super(...args);
    }

    updatePath = async (path) => {
        if (path) {
            const result = await fetch(`${baseUrl}/files/${path}`, { method: "POST" }).then((res) => res.text());
            if (result) this.neurosift.url = result;
        } else this.neurosift.url = undefined;
    };

    neurosift = new Neurosift();

    input = new JSONSchemaInput({
        path: ["file_path"],
        info: {
            type: "string",
            format: "file",
            description:
                "Please provide a file path that you'd like to visualize using Neurosift. The NWB GUIDE will serve this file and access the appropriate URL automatically.",
        },
        onUpdate: this.updatePath,
        onThrow,
    });

    render() {
        const urlFilePath = new URL(document.location).searchParams.get("file");

        if (urlFilePath) {
            this.updatePath(urlFilePath);
            this.input.value = urlFilePath;
        }

        return html`
            <div
                style="display: grid; width: 100%; height: 100%; grid-template-rows: min-content min-content 1fr; gap: 10px;"
            >
                <div>
                    <div style="display: flex; align-items: end; justify-content: space-between;">
                        <h1 style="margin: 0;">Neurosift File Visualization</h1>
                    </div>
                    <p>Explore your NWB file using Neurosift</p>
                    <hr />
                </div>
                ${this.input} ${this.neurosift}
            </div>
        `;
    }
}

customElements.get("nwbguide-preview-page") || customElements.define("nwbguide-preview-page", PreviewPage);
