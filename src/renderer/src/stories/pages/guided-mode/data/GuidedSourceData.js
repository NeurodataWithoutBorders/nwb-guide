import { html } from "lit";

import Swal from "sweetalert2";
import { isStorybook } from "../../../../dependencies/globals.js";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { InstanceManager } from "../../../InstanceManager.js";
import { ManagedPage } from "./ManagedPage.js";
import { baseUrl } from "../../../../globals.js";
import { onThrow } from "../../../../errors";
import getSourceDataSchema from "../../../../../../../schemas/source-data.schema";

export class GuidedSourceDataPage extends ManagedPage {
    constructor(...args) {
        super(...args);
    }

    footer = {
        onNext: async () => {
            this.save(); // Save in case the conversion fails
            for (let { form } of this.forms) await form.validate(); // Will throw an error in the callback

            // const previousResults = this.info.globalState.metadata.results

            this.save(); // Save in case the metadata request fails

            let stillFireSwal = false;
            const fireSwal = () => {
                Swal.fire({
                    title: "Getting metadata for source data",
                    html: "Please wait...",
                    allowEscapeKey: false,
                    allowOutsideClick: false,
                    heightAuto: false,
                    backdrop: "rgba(0,0,0, 0.4)",
                    timerProgressBar: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                });
            };

            setTimeout(() => {
                if (stillFireSwal) fireSwal();
            });

            await Promise.all(
                this.mapSessions(async ({ subject, session, info }) => {
                    // NOTE: This clears all user-defined results
                    const result = await fetch(`${baseUrl}/neuroconv/metadata`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            source_data: info.source_data,
                            interfaces: this.info.globalState.interfaces,
                        }),
                    })
                        .then((res) => res.json())
                        .catch((e) => {
                            Swal.close();
                            stillFireSwal = false;
                            this.notify(`<b>Critical Error:</b> ${e.message}`, "error", 4000);
                            throw e;
                        });

                    Swal.close();

                    if (isStorybook) return;

                    if (result.message) {
                        const message = "Failed to get metadata with current source data. Please try again.";
                        this.notify(message, "error");
                        throw result;
                    }

                    // Merge metadata results with the generated info
                    this.merge("metadata", result.results, info);

                    // Mirror structure with metadata schema
                    const schema = this.info.globalState.schema;
                    if (!schema.metadata) schema.metadata = {};
                    if (!schema.metadata[subject]) schema.metadata[subject] = {};
                    schema.metadata[subject][session] = result.schema;
                })
            );

            this.onTransition(1);
        },
    };

    createForm = ({ subject, session, info }) => {
        const instanceId = `sub-${subject}/ses-${session}`;

        const schema = this.info.globalState.schema.source_data;

        const form = new JSONSchemaForm({
            identifier: instanceId,
            mode: "accordion",
            schema: getSourceDataSchema(schema),
            results: info.source_data,
            ignore: [
                "verbose",
                "es_key",
                "exclude_shanks",
                "load_sync_channel",
                "stream_id", // NOTE: May be desired for other interfaces
            ],
            // onlyRequired: true,
            onStatusChange: (state) => this.manager.updateState(instanceId, state),
            onThrow,
        });

        return {
            subject,
            session,
            form,
        };
    };

    render() {
        this.forms = this.mapSessions(this.createForm);

        let instances = {};
        this.forms.forEach(({ subject, session, form }) => {
            if (!instances[`sub-${subject}`]) instances[`sub-${subject}`] = {};
            instances[`sub-${subject}`][`ses-${session}`] = form;
        });

        this.manager = new InstanceManager({
            header: "Sessions",
            // instanceType: 'Session',
            instances,
            // onAdded: (path) => {

            //   let details = this.getDetails(path)

            //   const info = this.addSession(details)

            //   const form = this.createForm({
            //     ...details,
            //     info
            //   })

            //   this.forms.push(form)

            //   return {
            //     key: `sub-${details.subject}/ses-${details.session}`,
            //     value: form.form
            //   }
            // },
            // onRemoved: (_, path) => {
            //   let details = this.getDetails(path)
            //   this.removeSession(details)
            // }
        });

        return this.manager;
    }
}

customElements.get("nwbguide-guided-sourcedata-page") ||
    customElements.define("nwbguide-guided-sourcedata-page", GuidedSourceDataPage);
