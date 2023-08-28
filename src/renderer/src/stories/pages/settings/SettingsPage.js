import { html } from "lit";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import dandiGlobalSchema from "../../../../../../schemas/json/dandi/global.json";
import projectGlobalSchema from "../../../../../../schemas/json/project/globals.json" assert { type: "json" };

import { Button } from "../../Button.js";
import { global } from "../../../progress.js";
import { merge } from "../utils.js";

import { notyf } from "../../../dependencies/globals.js";

export class SettingsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    beforeSave = () => {
        merge(this.form.resolved, global.data, { objects: false }); 

        global.save(); // Save the changes, even if invalid on the form
        notyf.open({
            type: "success",
            message: "Global settings changes saved",
        });
    }

    render() {
        this.localState = merge(global.data, {});

        const button = new Button({
            label: "Save Changes",
            onClick: async () => {
               if (!this.unsavedUpdates) return;
               this.save()
            },
        });

        // NOTE: API Keys and Dandiset IDs persist across selected project
        this.form = new JSONSchemaForm({
            results: this.localState,
            schema: {
                properties: {
                    output_locations: projectGlobalSchema,
                    DANDI: dandiGlobalSchema,
                },
            },
            mode: "accordion",
            onUpdate: () => this.unsavedUpdates = true,
            onThrow,
        });

        return html`
            <div style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 10px;">
                <h1 style="margin: 0;">NWB GUIDE Settings</h1>
            </div>
            <p>This page allows you to set global settings for the NWB GUIDE.</p>
            <hr />

            <div>
                ${this.form}
                <hr />
                ${button}
            </div>
        `;
    }
}

customElements.get("nwbguide-settings-page") || customElements.define("nwbguide-settings-page", SettingsPage);
