import { html } from "lit";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import { Button } from "../../Button.js";

import { run } from "../../../../utils/run";
import { Modal } from "../../Modal";
import { getSharedPath, truncateFilePaths } from "../../NWBFilePreview.js";
import { InspectorList, InspectorLegend } from "../../InspectorList.js";
import { download } from "../../../../utils/download";

import { createProgressPopup } from "../../../../utils/popups";

import { ready } from "../../../../../../schemas/dandi-upload.schema";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";

export class InspectPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        title: "NWB File Validation",
        subtitle: "Inspect NWB files using the NWB Inspector.",
    };

    inspect = async (paths, kwargs = {}, options = {}) => {
        const swalOpts = await createProgressPopup({
            title: "Inspecting selected filesystem entries.",
            ...options,
        });

        const { close: closeProgressPopup } = swalOpts;
        const result = await run("neuroconv/inspect", { request_id: swalOpts.id, paths, ...kwargs }, swalOpts).catch(
            async (error) => {
                this.notify(error.message, "error");
                await closeProgressPopup();
                throw error;
            }
        );

        console.log(result);

        closeProgressPopup();

        if (typeof result === "string") return result;

        const { messages } = result;

        if (!messages.length) return this.notify("No messages received from the NWB Inspector");

        return result;
    };

    #modal;

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#modal) this.#modal.remove();
    }

    showReport = async (value) => {
        if (!value) {
            const message = "Please provide filesystem entries to inspect.";
            onThrow(message);
            throw new Error(message);
        }

        const legend = new InspectorLegend();

        const kwargs = {};
        const nJobs = this.form.inputs["n_jobs"].value;
        if (nJobs) kwargs.n_jobs = nJobs;

        const result = await this.inspect(value, kwargs);

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

        this.#modal = new Modal({
            header: value.length === 1 ? value : `Selected Filesystem Entries`,
            controls: [downloadJSONButton, downloadTextButton],
            footer: legend,
            onClose: () => this.#modal.remove(),
        });

        const container = document.createElement("div");
        Object.assign(container.style, {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "20px",
        });

        container.append(list);

        this.#modal.append(container);
        document.body.append(this.#modal);
        this.#modal.toggle(true);
    };

    form = new JSONSchemaForm({
        schema: {
            properties: {
                filesystem_paths: {
                    title: false,
                    type: "array",
                    items: {
                        type: "string",
                        format: ["file-path", "directory-path"],
                        multiple: true,
                    },
                },
                n_jobs: {
                    type: "number",
                    title: "Job Count",
                    description: "Number of parallel jobs to run. Leave blank to use all available cores.",
                    min: 1,
                    step: 1,
                },
            },
        },
        showLabel: true,
        onThrow,
    });

    updated() {
        const urlFilePath = new URL(document.location).searchParams.get("file");

        if (urlFilePath) {
            this.showReport(urlFilePath);
            this.form.inputs["filesystem_paths"].value = urlFilePath;
        }

        ready.cpus.then(({ number_of_jobs }) => {
            const nJobsInput = this.form.inputs["n_jobs"];
            nJobsInput.schema.max = number_of_jobs.max;
        });
    }

    render() {
        const button = new Button({
            label: "Start Inspection",
            onClick: async () => this.showReport(this.form.inputs["filesystem_paths"].value),
        });

        return html`
            ${this.form}
            <br /><br />
            ${button}
        `;
    }
}

customElements.get("nwbguide-inspect-page") || customElements.define("nwbguide-inspect-page", InspectPage);
