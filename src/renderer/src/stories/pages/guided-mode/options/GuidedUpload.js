import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { run } from "./utils.js";
import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";

export class GuidedUploadPage extends Page {
    constructor(...args) {
        super(...args);
    }

    form;

    beforeSave = () => {
        const globalState = this.info.globalState;
        merge({ upload: this.localState }, globalState); // Merge the local and global states
        delete globalState.upload.results; // Clear the preview results
    };

    footer = {
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            await this.form.validate(); // Will throw an error in the callback

            const globalState = this.info.globalState;
            const globalUploadInfo = globalState.upload;

            const info = { ...globalUploadInfo.info };
            info.project = globalState.project.name;
            info.staging = globalUploadInfo.info.staging = parseInt(info.dandiset_id) >= 100000; // Automatically detect staging IDs

            const results = await run("upload", info, { title: "Uploading to DANDI" }).catch((e) => {
                this.notify(e.message, "error");
                throw e;
            });

            globalUploadInfo.results = results; // Save the preview results

            this.unsavedUpdates = true; // Ensure that this saves automatically

            this.to(1);
        },
    };

    render() {
        const state = (this.localState = merge(this.info.globalState.upload ?? { info: {}, results: null }, {}));

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

        this.form = new JSONSchemaForm({
            schema,
            results: state.info,
            // dialogType: 'showSaveDialog',
            dialogOptions: {
                properties: ["createDirectory"],
                // filters: [
                //   { name: 'NWB File', extensions: ['nwb'] }
                // ]
            },
            onUpdate: () => (this.unsavedUpdates = true),
            onThrow,
        });

        return html` ${this.form} `;
    }
}

customElements.get("nwbguide-guided-upload-page") ||
    customElements.define("nwbguide-guided-upload-page", GuidedUploadPage);
