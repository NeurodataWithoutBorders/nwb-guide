import { JSONSchemaForm } from "../../../JSONSchemaForm.js";

import { InstanceManager } from "../../../InstanceManager.js";
import { ManagedPage } from "./ManagedPage.js";
import { Modal } from "../../../Modal";

import { validateOnChange } from "../../../../validation/index.js";
import { createResults } from "./utils.js";
import Swal from "sweetalert2";
import { SimpleTable } from "../../../SimpleTable.js";
import { onThrow } from "../../../../errors";

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

        // Ignore specific metadata in the form by removing their schema value
        const schema = this.info.globalState.schema.metadata[subject][session];
        delete schema.properties.NWBFile.properties.source_script;
        delete schema.properties.NWBFile.properties.source_script_file_name;

        // Only include a select group of Ecephys metadata here
        if ("Ecephys" in schema.properties) {
            const toInclude = ["Device", "ElectrodeGroup", "Electrodes", "ElectrodeColumns", "definitions"];
            const ecephysProps = schema.properties.Ecephys.properties;
            Object.keys(ecephysProps).forEach((k) => (!toInclude.includes(k) ? delete ecephysProps[k] : ""));

            // Change rendering order for electrode table columns
            const ogElectrodeItemSchema = ecephysProps["Electrodes"].items.properties;
            const order = ["channel_name", "group_name", "shank_electrode_number"];
            const sortedProps = Object.keys(ogElectrodeItemSchema).sort((a, b) => {
                const iA = order.indexOf(a);
                if (iA === -1) return 1;
                const iB = order.indexOf(b);
                if (iB === -1) return -1;
                return iA - iB;
            });

            const newElectrodeItemSchema = (ecephysProps["Electrodes"].items.properties = {});
            sortedProps.forEach((k) => (newElectrodeItemSchema[k] = ogElectrodeItemSchema[k]));
        }

        // Create the form
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

            // deferLoading: true,
            onLoaded: () => {
                this.#nLoaded++;
                this.#checkAllLoaded();
            },
            validateOnChange,
            onlyRequired: false,
            onStatusChange: (state) => this.manager.updateState(`sub-${subject}/ses-${session}`, state),

            renderTable: (name, metadata, path) => {
                // NOTE: Handsontable will occasionally have a context menu that doesn't actually trigger any behaviors
                if (name !== "Electrodes") return new SimpleTable(metadata);
                // if (name !== "ElectrodeColumns" && name !== "Electrodes") return new Table(metadata);
            },
            onThrow,
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
