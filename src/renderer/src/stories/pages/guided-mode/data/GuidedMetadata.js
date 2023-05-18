import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";

import { InstanceManager } from "../../../InstanceManager.js";
import { ManagedPage } from "./ManagedPage.js";
import { Modal } from "../../../Modal";

import { validateOnChange } from "../../../../validation/index.js";
import { createResults } from "./utils.js";
import Swal from "sweetalert2";
import { Table } from "../../../Table.js";

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

        const schema = this.info.globalState.schema.metadata[subject][session]; // TODO: Order the Electrodes schema properties differently once present
        delete schema.properties.NWBFile.properties.source_script;
        delete schema.properties.NWBFile.properties.source_script_file_name;

        const ecephysProps = schema.properties.Ecephys.properties;
        Object.keys(ecephysProps).forEach((k) => {
            if (k.match(/ElectricalSeries.*/)) delete ecephysProps[k];
        });

        const form = new JSONSchemaForm({
            identifier: instanceId,
            mode: "accordion",
            schema,
            results,

            conditionalRequirements: [
                {
                    name: "Subject Age",
                    properties: [
                        ["Subject", "age"],
                        ["Subject", "date_of_birth"],
                    ],
                },
            ],

            deferLoading: true,
            onLoaded: () => {
                this.#nLoaded++;
                this.#checkAllLoaded();
            },
            validateOnChange,
            onlyRequired: false,
            onStatusChange: (state) => this.manager.updateState(`sub-${subject}/ses-${session}`, state),

            renderTable: (name, metadata, path) => {
                if (name !== "ElectrodeColumns" && name !== "Electrodes") return new Table(metadata); // Use Handsontable if table is small enough
            },
        });

        return {
            subject,
            session,
            form,
        };
    };

    #nLoaded = 0;
    #loaded = false;

    #checkAllLoaded = () => {
        if (this.#nLoaded === this.forms.length) this.#onLoaded();
    };

    #onLoaded = () => {
        this.#loaded = true;
        Swal.close();
    };

    #resetLoadState() {
        this.#loaded = false;
        this.#nLoaded = 0;
    }

    render() {
        this.#resetLoadState(); // Reset on each render

        // Swal.fire({
        //     title: "Waiting for your metadata to render",
        //     html: "Please wait...",
        //     allowEscapeKey: false,
        //     allowOutsideClick: false,
        //     heightAuto: false,
        //     backdrop: "rgba(0,0,0, 0.4)",
        //     timerProgressBar: false,
        //     didOpen: () => {
        //         if (this.#loaded) return false;
        //         Swal.showLoading();
        //         this.forms.forEach(o => o.form.load()) // Wait until Swal is active to check load status for tables
        //     },
        // });

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

                        const [{ file, result }] = await this.runConversions({ stub_test: true }, [
                            { subject, session },
                        ]).catch((e) => {
                            this.notify(e.message, "error");
                            throw e;
                        });

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
