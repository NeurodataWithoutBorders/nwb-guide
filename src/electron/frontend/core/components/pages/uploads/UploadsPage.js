import { html } from "lit";
import { until } from "lit/directives/until.js";

import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";

const folderPathKey = "filesystem_paths";
import dandiUploadSchema, {
    addDandiset,
    ready,
    regenerateDandisets,
} from "../../../../../../schemas/dandi-upload.schema";
import dandiStandaloneSchema from "../../../../../../schemas/json/dandi/standalone.json";
const dandiSchema = merge(dandiUploadSchema, structuredClone(dandiStandaloneSchema), { arrays: "append" });

import dandiCreateSchema from "../../../../../../schemas/json/dandi/create.json" assert { type: "json" };

import { Button } from "../../Button.js";
import { global } from "../../../progress/index.js";
import { merge } from "../../../../utils/data";

import { run } from "../../../../utils/run";
import { Modal } from "../../Modal";
import { DandiResults } from "../../DandiResults.js";

import dandiGlobalSchema from "../../../../../../schemas/json/dandi/global.json";
import { validateDANDIApiKey } from "../../../validation/dandi";

import * as dandi from "dandi";

import keyIcon from "../../../../assets/icons/key.svg?raw";

import {
    AWARD_VALIDATION_FAIL_MESSAGE,
    awardNumberValidator,
    isStaging,
    validate,
    getAPIKey,
} from "../../../../utils/upload";

import { createFormModal } from "../../GlobalFormModal";

export function createDandiset(results = {}) {
    let notification;

    const notify = (message, type) => {
        if (notification) this.dismiss(notification);
        return (notification = this.notify(message, type));
    };

    const modal = new Modal({
        header: "Create a Dandiset",
        onClose: () => modal.remove(),
    });

    const content = document.createElement("div");
    Object.assign(content.style, {
        padding: "25px",
    });

    const updateNIHInput = (state) => {
        const nihInput = form.getFormElement(["nih_award_number"]);

        const isEmbargoed = !!state;

        // Show the NIH input if embargo is set
        if (isEmbargoed) nihInput.removeAttribute("hidden");
        else nihInput.setAttribute("hidden", "");

        // Make the NIH input required if embargo is set
        nihInput.required = isEmbargoed;
    };

    const form = new JSONSchemaForm({
        schema: dandiCreateSchema,
        results,
        validateEmptyValues: false, // Only show errors after submission

        validateOnChange: async (name, parent) => {
            const value = parent[name];

            if (name === "embargo_status") return updateNIHInput(value);

            if (name === "nih_award_number") {
                if (value)
                    return awardNumberValidator(value) || [{ type: "error", message: AWARD_VALIDATION_FAIL_MESSAGE }];
                else if (parent["embargo_status"])
                    return [
                        {
                            type: "error",
                            message: "You must provide an NIH Award Number to embargo your data.",
                        },
                    ];
            }
        },
        groups: [
            {
                name: "Embargo your Data",
                properties: [["embargo_status"], ["nih_award_number"]],
                link: true,
            },
        ],
    });

    content.append(form);
    modal.append(content);

    modal.onClose = async () => notify("Dandiset was not created.", "error");

    const promise = new Promise((resolve) => {
        const button = new Button({
            label: "Create",
            primary: true,
            onClick: async () => {
                await form.validate().catch(() => {
                    const message = "Please fill out all required fields";
                    notify("Dandiset was not set", "error");
                    throw message;
                });

                const uploadToMain = form.resolved.archive === "main";
                const staging = !uploadToMain;

                const api_key = await getAPIKey.call(this, staging);

                const api = new dandi.API({
                    token: api_key,
                    type: staging ? "staging" : undefined,
                });

                await api.authorize();

                const metadata = {
                    description: form.resolved.description,
                    license: [form.resolved.license],
                };

                if (form.resolved.nih_award_number) {
                    metadata.contributor = [
                        {
                            name: "National Institutes of Health (NIH)",
                            roleName: ["dcite:Funder"],
                            schemaKey: "Organization",
                            awardNumber: form.resolved.nih_award_number,
                        },
                    ];
                }

                const res = await api.create(form.resolved.title, metadata, form.resolved.embargo_status);

                const id = res.identifier;

                notify(`Dandiset <b>${id}</b> was created`, "success");

                await addDandiset(res);

                const input = this.form.getFormElement(["dandiset"]);
                input.updateData(id);
                input.requestUpdate();

                this.save();

                resolve(res);
            },
        });

        modal.footer = button;

        modal.open = true;

        document.body.append(modal);
    }).finally(() => {
        modal.remove();
    });

    return {
        modal,
        done: promise,
    };
}

export async function uploadToDandi(info, type = "project" in info ? "project" : "") {
    const { dandiset } = info;

    const dandiset_id = dandiset;

    const staging = isStaging(dandiset_id); // Automatically detect staging IDs

    const api_key = await getAPIKey.call(this, staging);

    const payload = {
        dandiset_id,
        ...info.additional_settings,
        staging,
        api_key,
    };

    if (info.project) payload.project = info.project;
    else payload.filesystem_paths = info.filesystem_paths;

    const result = await run(type ? `neuroconv/upload/${type}` : "neuroconv/upload", payload, {
        title: "Uploading your files to DANDI",
    }).catch((error) => {
        this.notify(error.message, "error");
        throw error;
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
        title: "NWB File Uploads",
        subtitle: "Upload folders and individual NWB files to the DANDI Archive.",
        controls: [
            new Button({
                icon: keyIcon,
                label: "API Keys",
                onClick: () => {
                    document.body.append(this.#globalModal);
                    this.#globalModal.form.results = structuredClone(global.data.DANDI?.api_keys ?? {});
                    this.#globalModal.open = true;
                },
            }),
        ],
    };

    constructor(...args) {
        super(...args);
    }

    #globalModal = null;

    #saveNotification;
    connectedCallback() {
        super.connectedCallback();

        const modal = (this.#globalModal = createFormModal.call(this, {
            header: "DANDI API Keys",
            schema: dandiGlobalSchema.properties.api_keys,
            onSave: async (form) => {
                if (this.#saveNotification) this.dismiss(this.#saveNotification);

                const apiKeys = form.resolved;
                if (!Object.keys(apiKeys).length) {
                    this.#saveNotification = this.notify("No API keys were provided", "error");
                    return null;
                }

                const globalDandiData = global.data.DANDI ?? (global.data.DANDI = {});
                if (!globalDandiData.api_keys) globalDandiData.api_keys = {};
                merge(apiKeys, globalDandiData.api_keys);

                global.save();
                regenerateDandisets().then(() => {
                    const input = this.form.getFormElement(["dandiset"]);
                    input.requestUpdate();
                });
            },
            formProps: {
                validateOnChange: async (name, parent) => {
                    const value = parent[name];
                    if (name.includes("api_key")) return await validateDANDIApiKey(value, name.includes("staging"));
                },
            },
        }));
        document.body.append(modal);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#globalModal) this.#globalModal.remove();
    }

    render() {
        const globalState = (global.data.uploads = global.data.uploads ?? {});
        const defaultButtonMessage = "Upload Files";

        const button = new Button({
            label: defaultButtonMessage,
            onClick: async () => {
                await this.form.validate(); // Will throw an error in the callback

                const results = await uploadToDandi.call(this, {
                    ...global.data.uploads,
                });
                global.data.uploads = {};
                global.save();

                const modal = new Modal({
                    open: true,
                    onClose: () => modal.remove(),
                });
                modal.header = "DANDI Upload Summary";
                const summary = new DandiResults({
                    id: globalState.dandiset,
                    files: {
                        subject: results.map((file) => {
                            return { file };
                        }),
                    },
                });
                summary.style.padding = "25px";
                modal.append(summary);

                document.body.append(modal);

                this.requestUpdate();
            },
        });

        const promise = ready.cpus
            .then(() => ready.dandisets)
            .then(() => {
                // NOTE: API Keys and Dandiset IDs persist across selected project
                return (this.form = new JSONSchemaForm({
                    results: globalState,
                    schema: dandiSchema,
                    validateEmptyValues: false,
                    controls: {
                        dandiset: [
                            new Button({
                                label: "Create New Dandiset",
                                buttonStyles: {
                                    width: "max-content",
                                },
                                onClick: () => {
                                    const { modal, done } = createDandiset.call(this, {
                                        title: this.form.resolved.dandiset,
                                    });

                                    done.then(() => this.requestUpdate());

                                    return modal;
                                },
                            }),
                        ],
                    },
                    sort: ([k1]) => {
                        if (k1 === folderPathKey) return -1;
                    },
                    onUpdate: ([id]) => {
                        if (id === folderPathKey) {
                            const keysToUpdate = ["dandiset"];
                            keysToUpdate.forEach((k) => {
                                const input = this.form.getFormElement([k]);
                                if (input.value) input.updateData("");
                            });
                        }

                        global.save();
                    },

                    onThrow,

                    transformErrors: (error) => {
                        if (error.message === "Filesystem Paths is a required property.")
                            error.message = "Please select at least one file or folder to upload.";
                    },

                    validateOnChange: (...args) => validate.call(this, ...args),
                }));
            })
            .catch((error) => html`<p>${error}</p>`);

        // Confirm that one api key exists
        promise.then(() => {
            const api_keys = global.data.DANDI?.api_keys;
            if (!api_keys || !Object.keys(api_keys).length) this.#globalModal.open = true;
        });

        return html`
            ${until(
                promise.then((form) => {
                    return html`
                        ${form}
                        <hr />
                        ${button}
                    `;
                }),
                html`<p>Loading form contents...</p>
                    <p />`
            )}
        `;
    }
}

customElements.get("nwbguide-uploads-page") || customElements.define("nwbguide-uploads-page", UploadsPage);
