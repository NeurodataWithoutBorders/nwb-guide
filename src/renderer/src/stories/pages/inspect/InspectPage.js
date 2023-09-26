import { html } from "lit";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import { Button } from "../../Button.js";

import { run } from "../guided-mode/options/utils.js";
import { JSONSchemaInput } from "../../JSONSchemaInput.js";
import { Modal } from "../../Modal";
import { truncateFilePaths } from "../../preview/NWBFilePreview.js";
import { InspectorList } from "../../preview/inspector/InspectorList.js";

export class InspectPage extends Page {
    constructor(...args) {
        super(...args);
    }

    showReport = async (value) => {
        if (!value) {
            const message = "Please provide a folder to inspect.";
            onThrow(message);
            throw new Error(message);
        }

        const items = truncateFilePaths(
            await run("inspect_folder", { path: value }, { title: "Inspecting your files" }).catch((e) => {
                this.notify(e.message, "error");
                throw e;
            }),
            value
        );

        const list = new InspectorList({ items });
        list.style.padding = "25px";

        const modal = new Modal({
            header: value,
        });
        modal.append(list);
        document.body.append(modal);

        modal.toggle(true);
    };

    input = new JSONSchemaInput({
        path: ["folder_path"],
        info: {
            type: "string",
            format: "directory",
        },
        onThrow,
    });

    render() {
        const button = new Button({
            label: "Inspect Files",
            onClick: async () => this.showReport(this.input.value),
        });

        const urlFilePath = new URL(document.location).searchParams.get("file");

        if (urlFilePath) {
            this.showReport(urlFilePath);
            this.input.value = urlFilePath;
        }

        return html`
            <div style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 10px;">
                <h1 style="margin: 0;">NWB Inspector Report</h1>
            </div>
            <p>This page allows you to inspect NWB files using the NWB Inspector.</p>
            <hr />

            <div>
                ${this.input}
                <br />
                ${button}
            </div>
        `;
    }
}

customElements.get("nwbguide-inspect-page") || customElements.define("nwbguide-inspect-page", InspectPage);
