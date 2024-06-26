import { html } from "lit";
import { global, hasEntry, rename } from "../../../../progress/index.js";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { validateOnChange } from "../../../../validation/index.js";

import projectGeneralSchema from "../../../../../../../schemas/json/project/general.json" assert { type: "json" };
import projectGlobalSchema from "../../../../../../../schemas/json/project/globals.json" assert { type: "json" };
import { onThrow } from "../../../../errors";

import { merge } from "../../../../../utils/data";
import { header } from "../../../../../utils/text";

const projectMetadataSchema = merge(projectGlobalSchema, projectGeneralSchema);

const skipError = (message) => message.includes("requires") && message.includes("name");

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

            this.dismiss(); // Dismiss all notifications

            await this.form.validate().catch((error) => {
                if (skipError(error.message)) return;
                throw error;
            });

            // Check validity of project name
            const name = this.state.name;
            if (!name) {
                if (this.#nameNotification) this.dismiss(this.#nameNotification); // Dismiss previous custom notification
                this.#nameNotification = this.notify("Please enter a project name.", "error", 3000);
                return;
            }

            if (!name) return;

            // Check if name is already used
            // Update existing progress file
            if (globalState.initialized) {
                try {
                    const res = rename(name, globalState.name);
                    if (typeof res === "string") this.notify(res);
                    if (res === false) return;
                } catch (error) {
                    this.notify(error, "error");
                    throw error;
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

            return this.to(1);
        },
    };

    updateForm = () => {
        // Properly clone the schema to produce multiple pages from the project metadata schema
        const schema = { ...projectMetadataSchema };
        schema.properties = { ...schema.properties };

        const globalState = this.info.globalState;
        if (!globalState.project) globalState.project = {};
        this.state = merge(global.data, structuredClone(globalState.project));

        this.form = new JSONSchemaForm({
            schema,
            results: this.state,
            validateEmptyValues: false,
            dialogOptions: {
                properties: ["createDirectory"],
            },
            onOverride: (name) => {
                this.notify(`<b>${header(name)}</b> has been overridden with a global value.`, "warning", 3000);
            },
            validateOnChange: async (...args) => {
                const results = await validateOnChange.call(this.form, ...args);
                if (!results && args[0] === "name") this.#nameNotification && this.dismiss(this.#nameNotification);
                return results;
            },
            onUpdate: () => (this.unsavedUpdates = true),
            onThrow: function (message) {
                if (skipError(message)) return;
                onThrow(message);
            },
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
