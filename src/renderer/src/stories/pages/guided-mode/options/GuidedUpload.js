import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { run } from "./utils.js";
import { onThrow } from "../../../../errors";

export class GuidedUploadPage extends Page {
    constructor(...args) {
        super(...args);
    }

    form;

    footer = {
        onNext: async () => {
            delete this.info.globalState.upload.results; // Clear the preview results

            this.save(); // Save in case the conversion fails
            await this.form.validate(); // Will throw an error in the callback

            const info = { ...this.info.globalState.upload.info };
            info.project = this.info.globalState.project.name;
            info.staging = parseInt(info.dandiset_id) >= 100000; // Automatically detect staging IDs

            const results = await run("upload", info, { title: "Uploading to DANDI" }).catch((e) => {
                this.notify(e.message, "error")
                throw e
            });

            this.info.globalState.upload.results = results; // Save the preview results

            this.onTransition(1);
        },
    };

    render() {
        const schema = {
            properties: {
                api_key: {
                    type: "string",
                    format: "password",
                },
                dandiset_id: {
                    type: "string",
                },
                cleanup: {
                    type: "boolean",
                    default: false,
                },
            },
            required: ["api_key", "dandiset_id"],
        };

        let uploadGlobalState = this.info.globalState.upload;
        if (!uploadGlobalState) uploadGlobalState = this.info.globalState.upload = { info: {}, results: null };

        this.form = new JSONSchemaForm({
            schema,
            results: uploadGlobalState.info,
            // dialogType: 'showSaveDialog',
            dialogOptions: {
                properties: ["createDirectory"],
                // filters: [
                //   { name: 'NWB File', extensions: ['nwb'] }
                // ]
            },
            onThrow,
        });

        return html` ${this.form} `;
    }
}

customElements.get("nwbguide-guided-upload-page") ||
    customElements.define("nwbguide-guided-upload-page", GuidedUploadPage);
