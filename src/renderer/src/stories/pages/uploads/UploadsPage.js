import { html } from "lit";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";

const folderPathKey = "filesystem_paths";
import dandiUploadSchema from "../../../../../../schemas/json/dandi/upload.json";
import dandiStandaloneSchema from "../../../../../../schemas/json/dandi/standalone.json";
const dandiSchema = merge(dandiStandaloneSchema, merge(dandiUploadSchema, {}), { arrays: true });

import { Button } from "../../Button.js";
import { global } from "../../../progress/index.js";
import { merge } from "../utils.js";

import { run } from "../guided-mode/options/utils.js";
import { Modal } from "../../Modal";
import { DandiResults } from "../../DandiResults.js";

import dandiGlobalSchema from "../../../../../../schemas/json/dandi/global.json";
import { JSONSchemaInput } from "../../JSONSchemaInput.js";
import { header } from "../../forms/utils";

import { validateDANDIApiKey } from "../../../validation/dandi";



export const isStaging = (id) => parseInt(id) >= 100000;

export async function uploadToDandi(info, type = "project" in info ? "project" : "") {
    const { dandiset_id } = info;

    const staging = isStaging(dandiset_id); // Automatically detect staging IDs

    const whichAPIKey = staging ? "staging_api_key" : "main_api_key";
    let api_key = global.data.DANDI?.api_keys?.[whichAPIKey];

    if (!api_key) {


        const modal = new Modal({ 
            header: `Provide your ${header(whichAPIKey)}`,
            open: true 
        });

        const input = new JSONSchemaInput({
            path: [whichAPIKey],
            info: dandiGlobalSchema.properties.api_keys.properties[whichAPIKey]
        })

        input.style.padding = "25px";


        modal.append(input);

        let notification;

        const notify = (message, type) => {
            if (notification) this.dismiss(notification);
            return (notification = this.notify(message, type));
        };

        modal.onClose = async () => notify("Your DANDI API key was not set", "error");


        api_key = await new Promise((resolve) => {
            const button = new Button({
                label: "Save",
                primary: true,
                onClick: async () => {
                    const value = input.value;
                    if (value) {
                        
                        const errors = await validateDANDIApiKey(input.value, staging);
                        if (!errors || !errors.length) {
                            modal.remove()
                            global.data.DANDI.api_keys[whichAPIKey] = value;
                            global.save();
                            resolve(value)
                        }
                        else {
                            notify(errors[0].message, "error");
                            return false;
                        }

                    } else {
                        notify("Your DANDI API key was not set", "error");
                    }
                },
            });

            modal.footer = button;

            document.body.append(modal);

        })

    }

    const result = await run(
        type ? `upload/${type}` : "upload",
        {
            ...info,
            staging,
            api_key,
        },
        { title: "Uploading to DANDI" }
    ).catch((e) => {
        this.notify(e.message, "error");
        throw e;
    });

    if (result)
        this.notify(
            `${
                info.project ?? `${info[folderPathKey].length} filesystem entries`
            } successfully uploaded to Dandiset ${dandiset_id}`,
            "success"
        );

    return result;
}

export class UploadsPage extends Page {
    header = {
        title: "DANDI Uploads",
        subtitle: "This page allows you to upload folders with NWB files to the DANDI Archive.",
    };

    constructor(...args) {
        super(...args);
    }

    render() {
        const globalState = (global.data.uploads = global.data.uploads ?? {});
        const defaultButtonMessage = "Upload Files";

        const button = new Button({
            label: defaultButtonMessage,
            onClick: async () => {
                await this.form.validate(); // Will throw an error in the callback
                await uploadToDandi.call(this, { ...global.data.uploads });
                global.data.uploads = {};
                global.save();

                const modal = new Modal({ open: true });
                modal.header = "DANDI Upload Summary";
                const summary = new DandiResults({ id: globalState.dandiset_id });
                summary.style.padding = "25px";
                modal.append(summary);

                document.body.append(modal);

                this.requestUpdate();
            },
        });

        // NOTE: API Keys and Dandiset IDs persist across selected project
        this.form = new JSONSchemaForm({
            results: globalState,
            schema: dandiSchema,
            sort: ([k1]) => {
                if (k1 === folderPathKey) return -1;
            },
            onUpdate: ([id]) => {
                if (id === folderPathKey) {
                    for (let key in dandiSchema.properties) {
                        const input = this.form.getInput([key]);
                        if (key !== folderPathKey && input.value) input.updateData(""); // Clear the results of the form
                    }
                }

                global.save();
            },
            onThrow,
        });

        return html`
            ${this.form}
            <hr />
            ${button}
        `;
    }
}

customElements.get("nwbguide-uploads-page") || customElements.define("nwbguide-uploads-page", UploadsPage);
