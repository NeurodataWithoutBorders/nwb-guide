import { html } from "lit";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import { Button } from "../../Button.js";

import { run } from "../guided-mode/options/utils.js";
import { JSONSchemaInput } from "../../JSONSchemaInput.js";
import { Modal } from "../../Modal";
import { getSharedPath, truncateFilePaths } from "../../preview/NWBFilePreview.js";
import { InspectorList, InspectorLegend } from "../../preview/inspector/InspectorList.js";
import { download } from "./utils.js";

export class InspectPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        title: "NWB File Validation",
        subtitle: "Inspect NWB files using the NWB Inspector.",
    };

    inspect = async (paths, kwargs = {}, options = {}) => {
        const result = await run(
            "inspect",
            { paths, ...kwargs },
            { title: "Inspecting selected filesystem entries.", ...options }
        ).catch((error) => {
            this.notify(error.message, "error");
            throw error;
        });

        if (typeof result === "string") return result;

        const { messages } = result;

        if (!messages.length) return this.notify("No messages received from the NWB Inspector");

        return result;
    };

    showReport = async (value) => {
        if (!value) {
            const message = "Please provide filesystem entries to inspect.";
            onThrow(message);
            throw new Error(message);
        }

        const legend = new InspectorLegend();

        const result = await this.inspect(value);

        const messages = result.messages;

        const items = truncateFilePaths(messages, getSharedPath(messages.map((item) => item.file_path)));
        
        const list = new InspectorList({ items });

        // const buttons = document.createElement('div')
        // buttons.style.display = 'flex'
        // buttons.style.gap = '10px'

        const downloadJSONButton = new Button({
            label: "JSON",
            primary: true,
            onClick: () =>
                download("nwb-inspector-report.json", {
                    header: result.header,
                    messages: result.messages,
                }),
        });

        const downloadTextButton = new Button({
            label: "Text",
            primary: true,
            onClick: async () => {
                download("nwb-inspector-report.txt", result.text);
            },
        });

        const modal = new Modal({
            header: value.length === 1 ? value : `Selected Filesystem Entries`,
            controls: [downloadJSONButton, downloadTextButton],
            footer: legend,
        });

        const container = document.createElement("div");
        Object.assign(container.style, {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "20px",
        });

        container.append(list);

        modal.append(container);
        document.body.append(modal);

        modal.toggle(true);
    };

    input = new JSONSchemaInput({
        path: ["filesystem_paths"],
        schema: {
            type: "array",
            items: {
                type: "string",
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
