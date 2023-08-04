import { html } from "lit";
import { hasEntry, update } from "../../../../progress.js";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { validateOnChange } from "../../../../validation/index.js";

import projectMetadataSchema from "../../../../../../../schemas/json/project-metadata.schema.json" assert { type: "json" };
import { schemaToPages } from "../../FormPage.js";

import { onThrow } from "../../../../errors";

export class GuidedNewDatasetPage extends Page {
    constructor(...args) {
        super(...args);
        this.updateForm(); // Register nested pages on creation—not just with data
    }

    state = {};

    #nameNotification;

    footer = {
        onNext: async () => {
            const globalState = this.info.globalState.project;

            // Check validity of project name
            const name = this.state.name;
            if (!name) {
                if (this.#nameNotification) this.dismiss(this.#nameNotification); // Dismiss previous custom notification
                this.#nameNotification = this.notify("Please enter a project name.", "error");
                return;
            }

            this.dismiss(); // Dismiss all notifications

            await this.form.validate();

            if (!name) return;

            // Check if name is already used
            // Update existing progress file
            if (globalState.initialized) {
                try {
                    const res = update(name, globalState.name);
                    if (typeof res === "string") this.notify(res);
                    if (res === false) return;
                } catch (e) {
                    this.notify(e, "error");
                    throw e;
                }
            } else {
                const has = await hasEntry(name);
                if (has) {
                    this.notify(
                        "An existing progress file already exists with that name. Please choose a different name.",
                        "error"
                    );
                    return;
                }
            }

            globalState.initialized = true;
            Object.assign(globalState, this.state);

            this.onTransition(1);
        },
    };

    updateForm = () => {
        let projectGlobalState = this.info.globalState.project;
        if (!projectGlobalState) projectGlobalState = this.info.globalState.project = {};

        // Properly clone the schema to produce multiple pages from the project metadata schema
        const schema = { ...projectMetadataSchema };
        schema.properties = { ...schema.properties };

        this.state = structuredClone(this.info.globalState.project);

        const pages = schemaToPages.call(this, schema, ["project"], { validateEmptyValues: false }, (info) => {
            info.title = `${info.label} Global Metadata`;
            return info;
        });

        pages.forEach((page) => this.addPage(page.info.label, page));

        this.form = new JSONSchemaForm({
            schema,
            results: this.state,
            validateEmptyValues: false,
            dialogOptions: {
                properties: ["createDirectory"],
            },
            validateOnChange,
            onUpdate: () => (this.unsavedUpdates = true),
            onThrow,
        });

        return this.form;
    };

    render() {
        this.state = {}; // Clear local state on each render

        const form = this.updateForm();
        form.style.width = "100%";

        return html` ${form} `;
    }
}

customElements.get("nwbguide-guided-newdataset-page") ||
    customElements.define("nwbguide-guided-newdataset-page", GuidedNewDatasetPage);
