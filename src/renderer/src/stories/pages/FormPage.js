import { html } from "lit";
import { JSONSchemaForm } from "../JSONSchemaForm.js";
import { Page } from "./Page.js";
import { validateOnChange } from "../../validation/index.js";
import { onThrow } from "../../errors";
import { merge } from "./utils.js";

export function schemaToPages(schema, globalStatePath, options, transformationCallback = (info) => info) {
    return Object.entries(schema.properties)
        .filter(([_, value]) => value.properties)
        .map(([key, value]) => {
            const optionsCopy = { ...options };

            if (optionsCopy.required && optionsCopy.required[key])
                optionsCopy.required = {
                    [key]: optionsCopy.required[key],
                };
            else delete optionsCopy.required; // Only bring requirements from the current page

            const page = new GuidedFormPage(
                transformationCallback({
                    label: key,
                    key,
                    section: this.info.section,
                    globalStatePath,
                    formOptions: {
                        ...optionsCopy,
                        schema: { properties: { [key]: value } },
                    },
                })
            );

            delete schema.properties[key];

            if (optionsCopy.ignore && optionsCopy.ignore.includes(key)) return null;
            return page;
        })
        .filter((page) => page);
}

export class GuidedFormPage extends Page {
    constructor(...args) {
        super(...args);
        if (!this.info.globalStatePath) this.info.globalStatePath = [];
        if (!this.info.formOptions) this.info.formOptions = {};
        if (!this.info.formOptions.schema) this.info.formOptions.schema = {};
        if (!this.info.formOptions.results) this.info.formOptions.results = {};
    }

    beforeSave = () => {
        // Merge results before saving
        if (this.info.globalStatePath) {
            const parent = this.info.globalStatePath.reduce(
                (acc, key) => acc[key] ?? (acc[key] = {}),
                this.info.globalState
            );
            parent[this.info.key] = this.localState[this.info.key];
        }
    };

    footer = {
        onNext: async () => {
            await this.save(); // Save in case validation fails
            await this.form.validate(); // Validate the results of the form
            this.to(1);
        },
    };

    render() {
        const key = this.info.key;
        const temp = this.info.globalStatePath
            ? this.info.globalStatePath.reduce((acc, key) => acc[key] ?? (acc[key] = {}), this.info.globalState)
            : {};

        const results = (this.localState = merge({ [key]: temp[key] ?? (temp[key] = {}) }, {})); // Keep a local copy of the results

        const form = (this.form = new JSONSchemaForm({
            ...this.info.formOptions,
            results,
            onUpdate: () => (this.unsavedUpdates = true),
            validateOnChange,
            onThrow,
        }));

        form.style.width = "100%";

        return html` <div class="guided--section">${form}</div> `;
    }
}

customElements.get("nwbguide-guided-form-page") || customElements.define("nwbguide-guided-form-page", GuidedFormPage);
