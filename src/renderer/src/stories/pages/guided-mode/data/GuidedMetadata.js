import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";

import { InstanceManager } from "../../../InstanceManager.js";
import { ManagedPage } from "./ManagedPage.js";
import { Modal } from "../../../Modal";

import { validateOnChange } from "../../../../validation/index.js";
import { createResults } from "./utils.js";

export class GuidedMetadataPage extends ManagedPage {
    constructor(...args) {
        super(...args);
    }

    form;
    footer = {
        onNext: async () => {
            this.save();
            for (let { form } of this.forms) await form.validate(); // Will throw an error in the callback
            this.onTransition(1);
        },
    };

    createForm = ({ subject, session, info }) => {
        const results = createResults({ subject, info }, this.info.globalState);

        const instanceId = `sub-${subject}/ses-${session}`;

        const schema = this.info.globalState.schema.metadata[subject][session];

        // NOTE: This was a correction for differences in the expected values to be passed back to neuroconv
        // delete schema.properties.Ecephys.properties.Electrodes
        // delete results['Ecephys']['Electrodes']

        const form = new JSONSchemaForm({
            identifier: instanceId,
            mode: "accordion",
            schema,
            results,
            ignore: ["Ecephys", "source_script", "source_script_file_name"],
            conditionalRequirements: [
                {
                    name: "Subject Age",
                    properties: [
                        ["Subject", "age"],
                        ["Subject", "date_of_birth"],
                    ],
                },
            ],
            validateOnChange,
            onlyRequired: false,
            onStatusChange: (state) => this.manager.updateState(`sub-${subject}/ses-${session}`, state),
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
            header: "File Metadata",
            instanceType: "Session",
            instances,

            controls: [
                {
                    name: "Preview",
                    onClick: async (key, el) => {
                        let [subject, session] = key.split("/");
                        if (subject.startsWith("sub-")) subject = subject.slice(4);
                        if (session.startsWith("ses-")) session = session.slice(4);

                        const [{ file, result }] = await this.runConversions(
                            { stub_test: true },
                            [{ subject, session }],
                            { title: "Running conversion preview" }
                        ).catch((e) => this.notify(e.message, "error"));

                        const modal = new Modal({
                            header: file,
                            open: true,
                            onClose: () => modal.remove(),
                        });

                        modal.insertAdjacentHTML("beforeend", `<pre>${result}</pre>`);
                        document.body.appendChild(modal);
                    },
                },
            ],
        });

        return this.manager;
    }
}

customElements.get("nwbguide-guided-metadata-page") ||
    customElements.define("nwbguide-guided-metadata-page", GuidedMetadataPage);
