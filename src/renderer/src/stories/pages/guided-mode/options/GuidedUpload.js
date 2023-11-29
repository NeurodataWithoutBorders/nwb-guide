import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";
import Swal from "sweetalert2";
import dandiUploadSchema, { ready, regenerateDandisets } from "../../../../../../../schemas/dandi-upload.schema";
import { createDandiset, uploadToDandi } from "../../uploads/UploadsPage.js";
import { until } from "lit/directives/until.js";

import { Button } from "../../../Button.js";

import keyIcon from "../../../assets/key.svg?raw";

import { validate, willCreate } from "../../uploads/utils";
import { global } from "../../../../progress/index.js";

import dandiGlobalSchema from "../../../../../../../schemas/json/dandi/global.json";
import { createFormModal } from "../../../forms/GlobalFormModal";
import { validateDANDIApiKey } from "../../../../validation/dandi";

export class GuidedUploadPage extends Page {
    constructor(...args) {
        super(...args);
    }

    form;

    beforeSave = () => {
        const globalState = this.info.globalState;
        const isNewDandiset = globalState.upload?.dandiset !== this.localState.dandiset;
        merge({ upload: this.localState }, globalState); // Merge the local and global states
        if (isNewDandiset) delete globalState.upload.results; // Clear the preview results entirely if a new Dandiset
    };

    header = {
        subtitle: "Settings to upload your conversion to the DANDI Archive",
        controls: [
            new Button({
                icon: keyIcon,
                label: "API Keys",
                onClick: () => {
                    this.#globalModal.form.results = structuredClone(global.data.DANDI.api_keys);
                    this.#globalModal.open = true;
                },
            }),
        ],
    };

    #globalModal = null;

    connectedCallback() {
        super.connectedCallback();

        const modal = (this.#globalModal = createFormModal.call(this, {
            header: "DANDI API Keys",
            schema: dandiGlobalSchema.properties.api_keys,
            onSave: async (form) => {
                const apiKeys = form.resolved;
                merge(apiKeys, global.data.DANDI.api_keys);
                global.save();
                await regenerateDandisets();
                const input = this.form.getInput(["dandiset "]);
                input.requestUpdate();
            },
            validateOnChange: async (name, parent) => {
                const value = parent[name];
                if (name.includes("api_key")) return await validateDANDIApiKey(value, name.includes("staging"));
            },
        }));
        document.body.append(modal);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#globalModal.remove();
    }

    footer = {
        next: "Upload Project",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            const globalState = this.info.globalState;
            const globalUploadInfo = globalState.upload;

            await this.form.validate(); // Will throw an error in the callback

            const possibleTitle = globalUploadInfo.info.dandiset;
            if (willCreate(globalUploadInfo.info.dandiset)) {
                await createDandiset.call(this, { title: possibleTitle });
                await this.save();
            }

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
        const state = (this.localState = structuredClone(this.info.globalState.upload ?? { info: {} }));

        const promise = ready.cpus
            .then(() => ready.dandisets)
            .then(() => {
                return (this.form = new JSONSchemaForm({
                    schema: dandiUploadSchema,
                    results: state.info,
                    onUpdate: () => (this.unsavedUpdates = true),
                    onThrow,
                    validateOnChange: validate,
                }));
            })
            .catch((e) => html`<p>${e}</p>`);

        return html`${until(promise, html`Loading form contents...`)} `;
    }
}

customElements.get("nwbguide-guided-upload-page") ||
    customElements.define("nwbguide-guided-upload-page", GuidedUploadPage);
