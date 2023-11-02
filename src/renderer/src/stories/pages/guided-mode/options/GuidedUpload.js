import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { run } from "./utils.js";
import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";
import Swal from "sweetalert2";
import dandiUploadSchema from "../../../../../../../schemas/dandi-upload.schema";
import { dandisetInfoContent, uploadToDandi } from "../../uploads/UploadsPage.js";
import { InfoBox } from "../../../InfoBox.js";
import { until } from "lit/directives/until.js";
import { onServerOpen } from "../../../../server";
import { baseUrl } from "../../../../globals.js";

export class GuidedUploadPage extends Page {
    constructor(...args) {
        super(...args);
    }

    form;

    beforeSave = () => {
        const globalState = this.info.globalState;
        const isNewDandiset = globalState.upload?.dandiset_id !== this.localState.dandiset_id;
        merge({ upload: this.localState }, globalState); // Merge the local and global states
        if (isNewDandiset) delete globalState.upload.results; // Clear the preview results entirely if a new Dandiset
    };

    header = {
        subtitle: "Settings to upload your conversion to the DANDI Archive",
    };

    footer = {
        next: "Upload Project",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            await this.form.validate(); // Will throw an error in the callback

            const globalState = this.info.globalState;
            const globalUploadInfo = globalState.upload;

            // Catch if Dandiset is already uploaded
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

            globalUploadInfo.results = await uploadToDandi.call(this, {
                ...globalUploadInfo.info,
                project: globalState.project.name,
            });

            this.to(1);
        },
    };

    render() {
        const state = (this.localState = merge(this.info.globalState.upload ?? { info: {} }, {}));

        const promise = onServerOpen(async () => {
            await fetch(new URL("cpus", baseUrl))
                .then((res) => res.json())
                .then(({ physical, logical }) => {
                    dandiUploadSchema.properties.number_of_jobs.max = physical;
                    dandiUploadSchema.properties.number_of_threads.max = logical / physical;
                })
                .catch(() => {});

            return (this.form = new JSONSchemaForm({
                schema: dandiUploadSchema,
                results: state.info,
                onUpdate: () => (this.unsavedUpdates = true),
                onThrow,
            }));
        });

        return html`${new InfoBox({
                header: "How do I create a Dandiset?",
                content: dandisetInfoContent,
            })}<br /><br />${until(promise, html`Loading form contents...`)} `;
    }
}

customElements.get("nwbguide-guided-upload-page") ||
    customElements.define("nwbguide-guided-upload-page", GuidedUploadPage);
