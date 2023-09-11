import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { run } from "./utils.js";
import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";
import Swal from "sweetalert2";
import dandiUploadSchema from "../../../../../../../schemas/json/dandi/upload.json";
import { uploadToDandi } from "../../uploads/UploadsPage.js";

export class GuidedUploadPage extends Page {
    constructor(...args) {
        super(...args);
    }

    form;

    beforeSave = () => {
        const globalState = this.info.globalState;
        const isNewDandiset = globalState.upload.dandiset_id !== this.localState.dandiset_id;
        merge({ upload: this.localState }, globalState); // Merge the local and global states
        if (isNewDandiset) delete globalState.upload.results; // Clear the preview results entirely if a new dandiset
    };

    footer = {
        next: "Upload Project",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            await this.form.validate(); // Will throw an error in the callback

            const globalState = this.info.globalState;
            const globalUploadInfo = globalState.upload;

            // Catch if dandiset is already uploaded
            if ("results" in globalUploadInfo) {
                const result = await Swal.fire({
                    title: "This pipeline has already uploaded to DANDI",
                    html: "Would you like to reupload the lastest files?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "Continue with Reupload",
                    cancelButtonText: "Skip Upload",
                });

                if (!result || !result.isConfirmed) return this.to(1);
            }

            const results = await uploadToDandi.call(this, {
                ...globalUploadInfo.info,
                project: globalState.project.name,
            });

            globalUploadInfo.results = results; // Save the preview results

            this.unsavedUpdates = true; // Ensure that this saves automatically

            this.to(1);
        },
    };

    render() {
        const state = (this.localState = merge(this.info.globalState.upload ?? { info: {}, results: null }, {}));

        this.form = new JSONSchemaForm({
            schema: dandiUploadSchema,
            results: state.info,
            onUpdate: () => (this.unsavedUpdates = true),
            onThrow,
        });

        return html` ${this.form} `;
    }
}

customElements.get("nwbguide-guided-upload-page") ||
    customElements.define("nwbguide-guided-upload-page", GuidedUploadPage);
