import { html } from "lit";

import Swal from "sweetalert2";
import { notyf, baseUrl, notify } from "../../../../globals.js";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { InstanceManager } from "../../../InstanceManager.js";
import { ManagedPage } from "./ManagedPage.js";

export class GuidedSourceDataPage extends ManagedPage {
    constructor(...args) {
        super(...args);
    }

    footer = {
        onNext: async () => {
            this.save(); // Save in case the conversion fails
            for (let { form } of this.forms) await form.validate(); // Will throw an error in the callback

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

            // const previousResults = this.info.globalState.metadata.results

            this.save(); // Save in case the metadata request fails

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
                    }).then((res) => res.json());

                    Swal.close();

                    if (result.message) {
                        const message = "Failed to get metadata with current source data. Please try again.";
                        this.notify(message, "error");
                        throw new Error(`Failed to get metadata for source data provided: ${result.message}`);
                    }

                    console.log(result.results.Ecephys.Electrodes, result.schema.properties.Ecephys);

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

        const form = new JSONSchemaForm({
            identifier: instanceId,
            mode: "accordion",
            schema: this.info.globalState.schema.source_data,
            results: info.source_data,
            ignore: ["verbose"],
            onlyRequired: true,
            onStatusChange: (state) => this.manager.updateState(instanceId, state),
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
            header: "Source Data",
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

        return html`
            <div id="guided-mode-starting-container" class="guided--main-tab">
                <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
                    <div class="title">
                        <h1 class="guided--text-sub-step">Source Data</h1>
                    </div>
                    <div class="guided--section">${this.manager}</div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-sourcedata-page") ||
    customElements.define("nwbguide-guided-sourcedata-page", GuidedSourceDataPage);
