import { html } from "lit";
import { until } from "lit/directives/until.js";

import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";

const folderPathKey = "filesystem_paths";
import dandiUploadSchema from "../../../../schemas/dandi-upload.schema";
import dandiStandaloneSchema from "../../../../schemas/json/dandi/standalone.json" assert { type: "json" };

const dandiSchema = merge(dandiStandaloneSchema, merge(dandiUploadSchema, {}, { clone: true }), { arrays: true });

import { Button } from "../../Button.js";
import { global } from "../../../progress/index.js";
import { merge } from "../utils.js";

import { run } from "../guided-mode/options/utils.js";
import { Modal } from "../../Modal";
import { DandiResults } from "../../DandiResults.js";

import dandiGlobalSchema from "../../../../schemas/json/dandi/global.json" assert { type: "json" };
import { JSONSchemaInput } from "../../JSONSchemaInput.js";
import { header } from "../../forms/utils";

import { validateDANDIApiKey } from "../../../validation/dandi";
import { InfoBox } from "../../InfoBox.js";

import { baseUrl, onServerOpen } from "../../../server/globals";

export const isStaging = (id) => parseInt(id) >= 100000;

export const dandisetInfoContent = html`<span>
        You can create a new Dandiset on the <a href="http://dandiarchive.org" target="_blank">main DANDI archive</a>.
        This Dandiset can be fully public or embargoed according to NIH policy. When you create a Dandiset, a permanent
        ID is automatically assigned to it.
    </span>
    <hr />
    <small
        >To prevent the production server from being inundated with test Dandisets, we encourage developers to develop
        against the <a href="http://gui-staging.dandiarchive.org" target="_blank">development server</a>. Note that the
        development server should not be used to stage your data. All data are uploaded as draft and can be adjusted
        before publishing on the production server. The development server is primarily used by users learning to use
        DANDI or by developers.</small
    > `;

export async function uploadToDandi(info, type = "project" in info ? "project" : "") {
    const { dandiset_id } = info;

    const staging = isStaging(dandiset_id); // Automatically detect staging IDs

    const whichAPIKey = staging ? "staging_api_key" : "main_api_key";
    const DANDI = global.data.DANDI;
    let api_key = DANDI?.api_keys?.[whichAPIKey];

    const errors = await validateDANDIApiKey(api_key, staging);

    const isInvalid = !errors || errors.length;

    if (isInvalid) {
        const modal = new Modal({
            header: `${api_key ? "Update" : "Provide"} your ${header(whichAPIKey)}`,
            open: true,
        });

        const input = new JSONSchemaInput({
            path: [whichAPIKey],
            info: dandiGlobalSchema.properties.api_keys.properties[whichAPIKey],
        });

        input.style.padding = "25px";

        modal.append(input);

        let notification;

        const notify = (message, type) => {
            if (notification) this.dismiss(notification);
            return (notification = this.notify(message, type));
        };

        modal.onClose = async () => notify("The updated DANDI API key was not set", "error");

        api_key = await new Promise((resolve) => {
            const button = new Button({
                label: "Save",
                primary: true,
                onClick: async () => {
                    const value = input.value;
                    if (value) {
                        const errors = await validateDANDIApiKey(input.value, staging);
                        if (!errors || !errors.length) {
                            modal.remove();

                            merge(
                                {
                                    DANDI: {
                                        api_keys: {
                                            [whichAPIKey]: value,
                                        },
                                    },
                                },
                                global.data
                            );

                            global.save();
                            resolve(value);
                        } else {
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
        });
    }

    const result = await run(
        type ? `upload/${type}` : "upload",
        {
            ...info,
            staging,
            api_key,
        },
        { title: "Uploading your files to DANDI" }
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

        const promise = onServerOpen(async () => {
            await fetch(new URL("cpus", baseUrl))
                .then((res) => res.json())
                .then(({ physical, logical }) => {
                    const { number_of_jobs, number_of_threads } = dandiSchema.properties;
                    number_of_jobs.max = number_of_jobs.default = physical;
                    number_of_threads.max = number_of_threads.default = logical / physical;
                })
                .catch(() => {});

            // NOTE: API Keys and Dandiset IDs persist across selected project
            return (this.form = new JSONSchemaForm({
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
            }));
        });

        return html`
            ${new InfoBox({
                header: "How do I create a Dandiset?",
                content: dandisetInfoContent,
            })}
            <br />
            <br />
            ${until(
                promise.then((form) => {
                    return html`
                        ${form}
                        <hr />
                        ${button}
                    `;
                }),
                html`<p>Waiting to connect to the Flask server...</p>
                    <p />`
            )}
            <br />
            <br />
        `;
    }
}

customElements.get("nwbguide-uploads-page") || customElements.define("nwbguide-uploads-page", UploadsPage);
