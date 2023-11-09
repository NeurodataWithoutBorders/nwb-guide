import { html } from "lit";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import dandiGlobalSchema from "../../../../../../schemas/json/dandi/global.json";
import projectGlobalSchema from "../../../../../../schemas/json/project/globals.json" assert { type: "json" };

import { validateDANDIApiKey } from "../../../validation/dandi";

const schema = {
    properties: {
        output_locations: projectGlobalSchema,
        DANDI: dandiGlobalSchema,
    },
};

import { Button } from "../../Button.js";
import { global } from "../../../progress/index.js";
import { merge, setUndefinedIfNotDeclared } from "../utils.js";

import { notyf } from "../../../dependencies/globals.js";
import { SERVER_FILE_PATH, port } from "../../../electron/index.js";

import saveSVG from "../../assets/save.svg?raw";

export class SettingsPage extends Page {
    header = {
        title: "App Settings",
        subtitle: "This page allows you to set global settings for the GUIDE.",
        controls: [
            new Button({
                icon: saveSVG,
                onClick: async () => {
                    if (!this.unsavedUpdates) return this.#openNotyf("All changes were already saved", "success");
                    this.save();
                },
            }),
        ],
    };

    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
    }

    #notification;

    #openNotyf = (message, type) => {
        if (this.#notification) notyf.dismiss(this.#notification);
        return (this.#notification = this.notify(message, type));
    };

    beforeSave = async () => {
        const { resolved } = this.form;
        setUndefinedIfNotDeclared(schema.properties, resolved);

        merge(resolved, global.data);

        global.save(); // Save the changes, even if invalid on the form
        this.#openNotyf(`Global settings changes saved.`, "success");
    };

    render() {
        
        this.localState = structuredClone(global.data);

        // NOTE: API Keys and Dandiset IDs persist across selected project
        this.form = new JSONSchemaForm({
            results: this.localState,
            schema,
            onUpdate: () => (this.unsavedUpdates = true),
            validateOnChange: async (name, parent) => {
                const value = parent[name];
                if (name.includes("api_key")) return await validateDANDIApiKey(value, name.includes("staging"));
                return true;
            },
            onThrow,
        });

        return html`
            <p><b>Server Port:</b> ${port}</p>
            <p><b>Server File Location:</b> ${SERVER_FILE_PATH}</p>
            ${this.form}
        `;
    }
}

customElements.get("nwbguide-settings-page") || customElements.define("nwbguide-settings-page", SettingsPage);
