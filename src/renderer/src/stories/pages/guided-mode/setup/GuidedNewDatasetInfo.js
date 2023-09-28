import { html } from "lit";
import { global, hasEntry, rename } from "../../../../progress/index.js";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { validateOnChange } from "../../../../validation/index.js";

import projectGeneralSchema from "../../../../../../../schemas/json/project/general.json" assert { type: "json" };
import projectGlobalSchema from "../../../../../../../schemas/json/project/globals.json" assert { type: "json" };
import projectNWBFileSchema from "../../../../../../../schemas/json/project/nwbfile.json" assert { type: "json" };
import projectSubjectSchema from "../../../../../../../schemas/json/project/subject.json" assert { type: "json" };
import { merge } from "../../utils.js";

const projectMetadataSchema = merge(projectGlobalSchema, projectGeneralSchema);
merge(projectNWBFileSchema, projectMetadataSchema);
merge(projectSubjectSchema, projectMetadataSchema);

import { schemaToPages } from "../../FormPage.js";

import { onThrow } from "../../../../errors";

export class GuidedNewDatasetPage extends Page {
    constructor(...args) {
        super(...args);
        this.updateForm(); // Register nested pages on creation—not just with data
    }

    state = {};

    #nameNotification;

    header = {
        subtitle: "Enter a name for this pipeline and specify the base folders to save all outputs to",
    };

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
                    const res = rename(name, globalState.name);
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
                        "An existing project already exists with that name. Please choose a different name.",
                        "error"
                    );
                    return;
                }
            }

            globalState.initialized = true;
            Object.assign(globalState, this.state);

            this.to(1);
        },
    };

    updateForm = () => {
        let projectGlobalState = this.info.globalState.project;
        if (!projectGlobalState) projectGlobalState = this.info.globalState.project = {};

        // Properly clone the schema to produce multiple pages from the project metadata schema
        const schema = { ...projectMetadataSchema };
        schema.properties = { ...schema.properties };

        this.state = merge(global.data.output_locations, structuredClone(this.info.globalState.project));

        const pages = schemaToPages.call(this, schema, ["project"], { validateEmptyValues: false }, (info) => {
            info.title = `${info.label} Global Metadata`;
            return info;
        });
        console.log(pages);

        pages.forEach((page) => {
            page.header = {
                subtitle: `Enter any ${page.info.label}-level metadata that can serve as the common default across each experiment session`,
            };
            this.addPage(page.info.label, page);
        });

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
