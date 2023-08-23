import { html } from "lit";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import dandiUploadSchema from "../../../../../../schemas/json/dandi/upload.json";
import dandiStandaloneSchema from "../../../../../../schemas/json/dandi/standalone.json";
const dandiSchema = merge(dandiStandaloneSchema, dandiUploadSchema, { arrays: true })

import { Button } from "../../Button.js";
import { global } from "../../../progress.js";
import { merge } from "../utils.js";

import { run } from "../guided-mode/options/utils.js";
import { notyf } from "../../../dependencies/globals.js";
import Swal from "sweetalert2";

export async function uploadToDandi(info) {

    if (!('api_key' in (global.data.DANDI ?? {}))) {
        await Swal.fire({
            title: "Your DANDI API key is not configured.",
            html: "Edit your settings to include this value.",
            icon: "warning",
            confirmButtonText: "Go to Settings",
        });

        return this.to('settings');
    }
    
    info.staging = parseInt(info.dandiset_id) >= 100000; // Automatically detect staging IDs
    info.api_key = global.data.DANDI.api_key

    return await run("upload", info, { title: "Uploading to DANDI" }).catch((e) => {
        this.notify(e.message, "error");
        throw e;
    });
}

export class UploadsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    getCustomFolderInfo = (folder) => {
        return { upload: { info: { nwb_folder_path: folder } } };
    };

    render() {
        const globalState = (global.data.uploads = global.data.uploads ?? {});
        const defaultButtonMessage = "Upload Files";

        const button = new Button({
            label: defaultButtonMessage,
            onClick: async () => {
                await this.form.validate(); // Will throw an error in the callback
                const results = await uploadToDandi.call(this, { ... global.data.uploads })
                if (results) notyf.open({
                    type: 'success',
                    message: `${info.nwb_folder_path} successfully uploaded to Dandiset ${info.dandiset_id}`
                })
            },
        });


        const folderPathKey = 'nwb_folder_path'
        // NOTE: API Keys and Dandiset IDs persist across selected project
        this.form = new JSONSchemaForm({
            results: globalState,
            schema: dandiSchema,
            onUpdate: ([ id ], value) => {
                // if (id === folderPathKey) {
                //     for (let key in dandiSchema.properties) {
                //         const input = this.form.getInput([ key ])
                //         if (key !== folderPathKey) input.updateData('') // Clear the results of the form
                //     }
                // }

                global.save()
            },
            onThrow,
        });

        return html`
            <div style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 10px;">
                <h1 style="margin: 0;">DANDI Uploads</h1>
            </div>
            <p>This page allows you to upload folders with NWB files to the DANDI Archive.</p>
            <hr />

            <div>
                ${this.form}
                <hr />
                ${button}
            </div>
        `;
    }
}

customElements.get("nwbguide-uploads-page") || customElements.define("nwbguide-uploads-page", UploadsPage);
