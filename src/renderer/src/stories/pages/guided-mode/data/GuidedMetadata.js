import { JSONSchemaForm } from "../../../JSONSchemaForm.js";

import { InstanceManager } from "../../../InstanceManager.js";
import { ManagedPage } from "./ManagedPage.js";
import { Modal } from "../../../Modal";

import { validateOnChange } from "../../../../validation/index.js";
import { resolveGlobalOverrides, resolveResults } from "./utils.js";
import Swal from "sweetalert2";
import { SimpleTable } from "../../../SimpleTable.js";
import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";
import { NWBFilePreview } from "../../../preview/NWBFilePreview.js";
import { header } from "../../../forms/utils";

import { createGlobalFormModal } from "../../../forms/GlobalFormModal";
import { Button } from "../../../Button.js";
import { globalSchema } from "../../../../../../../schemas/base-metadata.schema";

import globalIcon from '../../../assets/global.svg?raw'


const propsToIgnore = [
    "Ophys", // Always ignore ophys metadata (for now)
    "Icephys", // Always ignore icephys metadata (for now)
    "Behavior", // Always ignore behavior metadata (for now)
    new RegExp("ndx-.+"), // Ignore all ndx extensions
    "subject_id",
    "session_id",
];

import { preprocessMetadataSchema } from "../../../../../../../schemas/base-metadata.schema";

const getInfoFromId = (key) => {
    let [subject, session] = key.split("/");
    if (subject.startsWith("sub-")) subject = subject.slice(4);
    if (session.startsWith("ses-")) session = session.slice(4);

    return { subject, session };
};

export class GuidedMetadataPage extends ManagedPage {
    constructor(...args) {
        super(...args);
    }

    beforeSave = () => {
        merge(this.localState.results, this.info.globalState.results);
    };

    form;

    header = {
        controls: [
            new Button({
                icon: globalIcon,
                label: "Edit Global Metadata",
                onClick: () => {
                    this.#globalModal.form.results = merge(this.info.globalState.project, {});
                    this.#globalModal.open = true;
                },
            }),
        ],
        subtitle: "Edit all metadata for this conversion at the session level",
    };

    footer = {
        next: "Run Conversion Preview",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            for (let { form } of this.forms) await form.validate(); // Will throw an error in the callback

            // Preview a single random conversion
            delete this.info.globalState.preview; // Clear the preview results

            const stubs = await this.runConversions({ stub_test: true }, undefined, {
                title: "Running stub conversion on all sessions...",
            });

            // Save the preview results
            this.info.globalState.preview = {
                stubs,
            };

            this.unsavedUpdates = true;

            this.to(1);
        },
    };

    #globalModal = null;

    connectedCallback() {
        super.connectedCallback();

        const modal = (this.#globalModal = createGlobalFormModal.call(this, {
            header: "Global Metadata",
            propsToRemove: [...propsToIgnore],
            schema: globalSchema, // Provide HARDCODED global schema for metadata properties (not automatically abstracting across sessions)...
            hasInstances: true,
            mergeFunction: function (globalResolved, globals) {
                merge(globalResolved, globals);
                return resolveGlobalOverrides(this.subject, globals);
            },
            validateOnChange,
        }));
        document.body.append(modal);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#globalModal.remove();
    }

    createForm = ({ subject, session, info }) => {
        // const results = createResults({ subject, info }, this.info.globalState);

        const { globalState } = this.info;

        const results = info.metadata; // Edited form info

        // Define the appropriate global metadata to fill empty values in the form
        const aggregateGlobalMetadata = resolveGlobalOverrides(subject, globalState);

        // Define the correct instance identifier
        const instanceId = `sub-${subject}/ses-${session}`;

        // Ignore specific metadata in the form by removing their schema value
        const schema = globalState.schema.metadata[subject][session];
        delete schema.description;
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

        resolveResults(subject, session, globalState);

        // Create the form
        const form = new JSONSchemaForm({
            identifier: instanceId,
            mode: "accordion",
            schema: preprocessMetadataSchema(schema),
            results,
            globals: aggregateGlobalMetadata,

            ignore: propsToIgnore,
            onOverride: (name) => {
                this.notify(`<b>${header(name)}</b> has been overriden with a global value.`, "warning", 3000);
            },

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

            onUpdate: () => {
                this.unsavedUpdates = true;
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

        this.localState = { results: merge(this.info.globalState.results, {}) };

        this.forms = this.mapSessions(this.createForm, this.localState);

        let instances = {};
        this.forms.forEach(({ subject, session, form }) => {
            if (!instances[`sub-${subject}`]) instances[`sub-${subject}`] = {};
            instances[`sub-${subject}`][`ses-${session}`] = form;
        });

        this.manager = new InstanceManager({
            header: "Sessions",
            instanceType: "Session",
            instances,

            controls: [
                {
                    name: "Preview",
                    primary: true,
                    onClick: async (key, el) => {
                        const { subject, session } = getInfoFromId(key);

                        const results = await this.runConversions(
                            { stub_test: true },
                            [
                                {
                                    subject,
                                    session,
                                    globalState: merge(this.localState, merge(this.info.globalState, {})),
                                },
                            ],
                            { title: "Running conversion preview" }
                        ).catch(() => {});

                        if (!results) return;

                        const modal = new Modal({
                            header: `Conversion Preview: ${key}`,
                            open: true,
                            onClose: () => modal.remove(),
                            width: "100%",
                            height: "100%",
                        });

                        const { project } = this.info.globalState;

                        modal.append(new NWBFilePreview({ project: project.name, files: results, inspect: true }));
                        document.body.append(modal);
                    },
                },

                // Only save the currently selected session
                {
                    name: "Save",
                    onClick: async (id) => {
                        const ogCallback = this.beforeSave;
                        this.beforeSave = () => {
                            const { subject, session } = getInfoFromId(id);

                            merge(
                                this.localState.results[subject][session],
                                this.info.globalState.results[subject][session]
                            );

                            this.notify(`Session ${id} metadata saved!`);
                        };
                        await this.save();
                        this.beforeSave = ogCallback;
                    },
                },
            ],
        });

        return this.manager;
    }
}

customElements.get("nwbguide-guided-metadata-page") ||
    customElements.define("nwbguide-guided-metadata-page", GuidedMetadataPage);
