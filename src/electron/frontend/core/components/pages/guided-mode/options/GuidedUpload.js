import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { onThrow } from "../../../../errors";
import { merge } from "../../../../../utils/data";
import Swal from "sweetalert2";
import dandiUploadSchema, { ready, regenerateDandisets } from "../../../../../../../schemas/dandi-upload.schema";
import { createDandiset, uploadToDandi } from "../../uploads/UploadsPage.js";
import { until } from "lit/directives/until.js";

import { Button } from "../../../Button.js";

import keyIcon from "../../../../../assets/icons/key.svg?raw";

import { validate } from "../../../../../utils/upload";
import { global } from "../../../../progress/index.js";

import dandiGlobalSchema from "../../../../../../../schemas/json/dandi/global.json";
import { createFormModal } from "../../../forms/GlobalFormModal";
import { validateDANDIApiKey } from "../../../../validation/dandi";
import { resolve } from "../../../../promises";

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
        subtitle: "Configure your upload to the DANDI Archive",
        controls: [
            new Button({
                icon: keyIcon,
                label: "API Keys",
                onClick: () => {
                    document.body.append(this.globalModal);
                    this.globalModal.form.results = structuredClone(global.data.DANDI?.api_keys ?? {});
                    this.globalModal.open = true;
                },
            }),
        ],
    };

    workflow = {
        upload_to_dandi: {
            condition: (v) => v === false,
            skip: true,
        },
    };

    globalModal = null;
    #saveNotification;

    connectedCallback() {
        super.connectedCallback();

        this.globalModal = createFormModal.call(this, {
            header: "DANDI API Keys",
            schema: dandiGlobalSchema.properties.api_keys,
            onClose: () => this.globalModal.remove(),
            onSave: async (form) => {
                const apiKeys = form.resolved;

                if (this.#saveNotification) this.dismiss(this.#saveNotification);

                if (!Object.keys(apiKeys).length) {
                    this.#saveNotification = this.notify("No API keys were provided", "error");
                    return null;
                }

                // Ensure values exist
                const globalDandiData = global.data.DANDI ?? (global.data.DANDI = {});
                if (!globalDandiData.api_keys) globalDandiData.api_keys = {};
                merge(apiKeys, globalDandiData.api_keys);

                global.save();
                await regenerateDandisets();
                const input = this.form.getFormElement(["dandiset"]);
                input.requestUpdate();
            },
            formProps: {
                validateOnChange: async (name, parent) => {
                    const value = parent[name];
                    if (name.includes("api_key")) return await validateDANDIApiKey(value, name.includes("staging"));
                },
            },
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.globalModal) this.globalModal.remove();
    }

    footer = {
        next: "Upload",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            const globalState = this.info.globalState;
            const globalUploadInfo = globalState.upload;

            await this.form.validate(); // Will throw an error in the callback

            // Catch if Dandiset is already uploaded
            if ("results" in globalUploadInfo) {
                const result = await Swal.fire({
                    title: "This pipeline has already uploaded to DANDI",
                    html: "Would you like to reupload the latest files?",
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

            this.unsavedUpdates = true;

            return this.to(1);
        },
    };

    #toggleRendered;
    #rendered;
    #updateRendered = (force) =>
        force || this.#rendered === true
            ? (this.#rendered = new Promise(
                  (resolve) => (this.#toggleRendered = () => resolve((this.#rendered = true)))
              ))
            : this.#rendered;

    get rendered() {
        return resolve(this.#rendered, () => true);
    }

    async updated() {
        await this.rendered;
    }

    render() {
        this.#updateRendered(true);

        const state = (this.localState = structuredClone(this.info.globalState.upload ?? { info: {} }));

        const promise = ready.cpus
            .then(() => ready.dandisets)
            .then(() => {
                return (this.form = new JSONSchemaForm({
                    schema: dandiUploadSchema,
                    results: state.info,
                    controls: {
                        dandiset: [
                            new Button({
                                label: "Create New Dandiset",
                                buttonStyles: {
                                    width: "max-content",
                                },
                                onClick: () => {
                                    const result = createDandiset.call(this, { title: this.form.resolved.dandiset });
                                    const { modal, done } = result;
                                    done.then(() => this.requestUpdate());
                                    return modal;
                                },
                            }),
                        ],
                    },
                    onUpdate: () => (this.unsavedUpdates = true),
                    onThrow,
                    validateOnChange: (...args) => validate.call(this, ...args),
                }));
            })
            .catch((error) => html`<p>${error}</p>`);

        // Confirm that one api key exists
        promise.then(() => {
            const api_keys = global.data.DANDI?.api_keys;
            if (!api_keys || !Object.keys(api_keys).length) this.header.controls[0].onClick(); // Add modal and open it
        });

        const untilResult = until(promise, html`Loading form contents...`);

        promise.then(() => {
            this.#toggleRendered();
        });

        return untilResult;
    }
}

customElements.get("nwbguide-guided-upload-page") ||
    customElements.define("nwbguide-guided-upload-page", GuidedUploadPage);
