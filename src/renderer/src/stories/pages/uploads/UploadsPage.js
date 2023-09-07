import { html } from "lit";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import dandiUploadSchema from "../../../../../../schemas/json/dandi/upload.json";
import dandiStandaloneSchema from "../../../../../../schemas/json/dandi/standalone.json";
const dandiSchema = merge(dandiStandaloneSchema, merge(dandiUploadSchema, {}), { arrays: true });

import { Button } from "../../Button.js";
import { global } from "../../../progress/index.js";
import { merge } from "../utils.js";

import { run } from "../guided-mode/options/utils.js";
import { notyf } from "../../../dependencies/globals.js";
import Swal from "sweetalert2";
import { Modal } from "../../Modal";
import { DandiResults } from "../../DandiResults.js";

export const isStaging = (id) => parseInt(id) >= 100000

export async function uploadToDandi(info) {

    const api_key = global.data.DANDI?.api_key
    if (!api_key) {
        await Swal.fire({
            title: "Your DANDI API key is not configured.",
            html: "Edit your settings to include this value.",
            icon: "warning",
            confirmButtonText: "Go to Settings",
        });

        return this.to("settings");
    }

    return await run("upload/folder", {
        ...info, 
        staging: isStaging(info.dandiset_id), // Automatically detect staging IDs
        api_key
    }, { title: "Uploading to DANDI" }).catch((e) => {
        this.notify(e.message, "error");
        throw e;
    });
}

export class UploadsPage extends Page {
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
                const results = await uploadToDandi.call(this, { ...globalState });

                if (results)
                    notyf.open({
                        type: "success",
                        message: `${globalState.nwb_folder_path} successfully uploaded to Dandiset ${globalState.dandiset_id}`,
                    });

                global.data.uploads = {};
                global.save();

                const modal = new Modal({ open: true })
                modal.header = "DANDI Upload Summary"
                const summary = new DandiResults({ id: globalState.dandiset_id })
                summary.style.padding = '25px'
                modal.append(summary)
            
                document.body.append(modal)

                this.requestUpdate();
            },
        });

        const folderPathKey = "nwb_folder_path";
        // NOTE: API Keys and Dandiset IDs persist across selected project
        this.form = new JSONSchemaForm({
            results: globalState,
            schema: dandiSchema,
            sort: ([k1]) => {
                if (k1 === "nwb_folder_path") return -1;
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
