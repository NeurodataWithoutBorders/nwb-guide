import { html } from "lit";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import { Button } from "../../Button.js";

import { run } from "../guided-mode/options/utils.js";
import { JSONSchemaInput } from "../../JSONSchemaInput.js";
import { Modal } from "../../Modal";
import { getSharedPath, truncateFilePaths } from "../../preview/NWBFilePreview.js";
import { InspectorList } from "../../preview/inspector/InspectorList";

export class InspectPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        title: "NWB Inspector Report",
        subtitle: "This page allows you to inspect NWB files using the NWB Inspector.",
    };

    showReport = async (value) => {
        if (!value) {
            const message = "Please provide filesystem entries to inspect.";
            onThrow(message);
            throw new Error(message);
        }

        const result = await run(
            "inspect",
            { paths: value },
            { title: "Inspecting selected filesystem entries." }
        ).catch((e) => {
            this.notify(e.message, "error");
            throw e;
        });

        if (!result.length) return this.notify("No messages received from the NWB Inspector");

        const items = truncateFilePaths(result, getSharedPath(result.map((o) => o.file_path)));

        const list = new InspectorList({ items });
        list.style.padding = "25px";

        const modal = new Modal({
            header: value.length === 1 ? value : `Selected Filesystem Entries`,
        });
        modal.append(list);
        document.body.append(modal);

        modal.toggle(true);
    };

    input = new JSONSchemaInput({
        path: ["filesystem_paths"],
        info: {
            type: "array",
            items: {
                format: ["file", "directory"],
                multiple: true,
            },
        },
        onThrow,
    });

    render() {
        const button = new Button({
            label: "Start Inspection",
            onClick: async () => this.showReport(this.input.value),
        });

        const urlFilePath = new URL(document.location).searchParams.get("file");

        if (urlFilePath) {
            this.showReport(urlFilePath);
            this.input.value = urlFilePath;
        }

        return html`
            ${this.input}
            <br />
            ${button}
        `;
    }
}

customElements.get("nwbguide-inspect-page") || customElements.define("nwbguide-inspect-page", InspectPage);
