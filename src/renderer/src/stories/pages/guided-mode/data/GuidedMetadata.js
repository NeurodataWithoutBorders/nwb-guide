import { JSONSchemaForm, getSchema } from "../../../JSONSchemaForm.js";

import { InstanceManager } from "../../../InstanceManager.js";
import { ManagedPage } from "./ManagedPage.js";
import { Modal } from "../../../Modal";

import { validateOnChange } from "../../../../validation/index.js";
import {
    resolveGlobalOverrides,
    resolveMetadata,
    getInfoFromId,
    drillSchemaProperties,
    resolveFromPath,
} from "./utils.js";

import Swal from "sweetalert2";
import { SimpleTable } from "../../../SimpleTable";
import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";
import { NWBFilePreview } from "../../../preview/NWBFilePreview.js";
import { header, tempPropertyKey } from "../../../forms/utils";

import { createGlobalFormModal } from "../../../forms/GlobalFormModal";
import { Button } from "../../../Button.js";

import globalIcon from "../../../assets/global.svg?raw";

const parentTableRenderConfig = {
    Electrodes: (metadata) => {
        metadata.schema.description = "Download, modify, and re-upload data to change the electrode information.";
        return true;
    },
    Units: (metadata) => {
        metadata.truncated = true;
        metadata.schema.description = "Update unit information directly on your source data.";
        return true;
    },
};

function getAggregateRequirements(path) {
    const electrodeSchema = getSchema(path, this.schema);
    return Object.values(electrodeSchema.properties).reduce((set, schema) => {
        schema.items.required.forEach((item) => set.add(item));
        return set;
    }, new Set());
}

const tableRenderConfig = {
    "*": (metadata) => new SimpleTable(metadata),
    ElectrodeColumns: function (metadata) {
        const aggregateRequirements = getAggregateRequirements.call(this, ["Ecephys", "Electrodes"]);

        return new SimpleTable({
            ...metadata,
            editable: {
                name: (value) => !aggregateRequirements.has(value),
                data_type: (_, row) => !aggregateRequirements.has(row.name),
                __row_remove: (_, row) => !aggregateRequirements.has(row.name),
            },
        });
    },
    UnitColumns: function (metadata) {
        metadata.editable = false;
        metadata.schema.description = "Update unit information directly on your source data.";

        return true;

        // const aggregateRequirements = getAggregateRequirements.call(this, ["Ecephys", "Units"]);
        //
        // return new SimpleTable({
        //     ...metadata,
        //     contextOptions: {
        //         row: {
        //             add: false,
        //             remove: false,
        //         },
        //     },
        //     editable: {
        //         name: (value) => !aggregateRequirements.has(value),
        //         data_type: (_, row) => !aggregateRequirements.has(row.name),
        //     },
        // });
    },
};

const imagingPlaneKey = "imaging_plane";
const propsToIgnore = {
    Ophys: {
        "*": {
            starting_time: true,
            rate: true,
            conversion: true,
            offset: true,
            unit: true,
            control: true,
            comments: true,
            control_description: true,
        },
        ImagingPlane: {
            [imagingPlaneKey]: true,
            manifold: true,
        },
        TwoPhotonSeries: {
            [imagingPlaneKey]: true,
            format: true,
            starting_frame: true,
            control: true,
            control_description: true,
            comments: true,
            resolution: true,
            dimension: true,
            device: true,
        },
    },
    Ecephys: {
        ElectricalSeries: true,
        ElectricalSeriesLF: true,
        ElectricalSeriesAP: true,
        Units: {
            "*": {
                UnitColumns: {
                    "*": {
                        data_type: true, // Do not show data_type
                    },
                },
            },
        },
    },
    Icephys: true, // Always ignore icephys metadata (for now)
    Behavior: true, // Always ignore behavior metadata (for now)
    "ndx-dandi-icephys": true,
    Subject: {
        subject_id: true,
    },
    NWBFile: {
        session_id: true,
        source_script: true,
        source_script_file_name: true,
    },
};

import { preprocessMetadataSchema } from "../../../../../../../schemas/base-metadata.schema";
import {
    createTable,
    getEditableItems,
    isPatternProperties,
    isAdditionalProperties,
} from "../../../JSONSchemaInput.js";
import { html } from "lit";

export class GuidedMetadataPage extends ManagedPage {
    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
    }

    beforeSave = () => {
        merge(this.localState.results, this.info.globalState.results);
    };

    form;

    #globalButton = new Button({
        icon: globalIcon,
        label: "Edit Global Metadata",
        onClick: () => {
            this.#globalModal.form.results = structuredClone(this.info.globalState.project);
            this.#globalModal.open = true;
        },
    });

    workflow = {
        multiple_sessions: {
            elements: [this.#globalButton],
        },
    };

    header = {
        controls: [this.#globalButton],
        subtitle: "Edit all metadata for this conversion at the session level",
    };

    footer = {
        onNext: async () => {
            await this.save(); // Save in case the conversion fails
            for (let { form } of this.forms) await form.validate(); // Will throw an error in the callback
            return this.to(1); // Will trigger preview conversion if necessary
        },
    };

    #globalModal = null;

    connectedCallback() {
        super.connectedCallback();

        // Provide HARDCODED global schema for metadata properties (not automatically abstracting across sessions)...
        const schema = preprocessMetadataSchema(undefined, true);

        const toRemove = structuredClone(propsToIgnore);
        toRemove.Subject = true // Do not edit subject defaults
        
        const modal = (this.#globalModal = createGlobalFormModal.call(this, {
            header: "Global Metadata",
            propsToRemove: toRemove,
            schema,
            hasInstances: true,
            mergeFunction: function (globalResolved, globals) {
                merge(globalResolved, globals);
                return resolveGlobalOverrides(this.subject, globals);
            },
            formProps: {
                validateOnChange,
            },
        }));
        document.body.append(modal);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#globalModal) this.#globalModal.remove();
    }

    createForm = ({ subject, session, info }) => {
        const hasMultipleSessions = this.workflow.multiple_sessions.value;

        // const results = createResults({ subject, info }, this.info.globalState);

        const { globalState } = this.info;

        const results = info.metadata; // Edited form info

        // Define the appropriate global metadata to fill empty values in the form
        const aggregateGlobalMetadata = resolveGlobalOverrides(subject, globalState, hasMultipleSessions);

        // Define the correct instance identifier
        const instanceId = `sub-${subject}/ses-${session}`;

        // Ignore specific metadata in the form by removing their schema value
        const schema = preprocessMetadataSchema(globalState.schema.metadata[subject][session]);
        delete schema.description;

        const ephys = schema.properties.Ecephys;

        resolveMetadata(subject, session, globalState);

        const additionalPropertiesToRetitle = ["Ophys.ImageSegmentation"];

        const patternPropsToRetitle = ["Ophys.Fluorescence", "Ophys.DfOverF", "Ophys.SegmentationImages"];

        const ophys = schema.properties.Ophys;
        if (ophys) {
            drillSchemaProperties(
                schema,
                (path, schema, target, isPatternProperties, parentSchema) => {
                    if (path[0] === "Ophys") {
                        const name = path.slice(-1)[0];

                        if (isPatternProperties)
                            return (schema.minItems = schema.maxItems =
                                Object.values(resolveFromPath(path, results)).length);

                        if (schema.type === "array") {
                            if (name !== "Device" && target) {
                                // Set most Ophys tables to have minItems / maxItems equal (i.e. no editing possible)
                                if (name in target) schema.minItems = schema.maxItems = target[name].length;
                                // Remove Ophys property requirement if left initially undefined
                                else {
                                    target[name] = []; // Initialize empty array
                                    if (parentSchema.required.includes(name))
                                        parentSchema.required = parentSchema.required.filter((n) => n !== name);
                                }
                            }
                        }
                    }
                },
                results
            );
        }

        console.log("schema", structuredClone(schema), structuredClone(results));

        // Create the form
        const form = new JSONSchemaForm({
            identifier: instanceId,
            schema,
            results,
            globals: aggregateGlobalMetadata,

            ignore: propsToIgnore,
            onOverride: (name) => {
                this.notify(`<b>${header(name)}</b> has been overridden with a global value.`, "warning", 3000);
            },

            transformErrors: (error) => {
                // JSON Schema Exceptions
                if (error.message.includes('does not conform to the "date-time" format.')) return false;
                if (error.message.includes('not allowed to have the additional property "Ecephys".')) return false; // NOTE: Remove after including Ecephys metadata
            },

            groups: [
                {
                    name: "Subject Age",
                    properties: [
                        ["Subject", "age"],
                        ["Subject", "date_of_birth"],
                    ],
                    validate: true,
                },
                {
                    name: "Institutional Info",
                    properties: [
                        ["NWBFile", "institution"],
                        ["NWBFile", "lab"],
                    ],
                },
            ],

            // deferLoading: true,
            onLoaded: () => {
                this.#nLoaded++;
                this.#checkAllLoaded();
            },

            onUpdate: () => (this.unsavedUpdates = "conversions"),

            validateOnChange,
            onlyRequired: false,
            onStatusChange: (state) => this.manager.updateState(`sub-${subject}/ses-${session}`, state),

            renderCustomHTML: function (name, inputSchema, localPath, { onUpdate, onThrow }) {
                if (name === "TwoPhotonSeries" && (!this.value || !this.value.length)) return null;
                if (name === "Device" && (!this.value || !this.value.length)) return null;
                if (name === "ElectrodeGroup" && (!this.value || !this.value.length)) return null;

                const isAdditional = isAdditionalProperties(this.pattern);
                const isPattern = isPatternProperties(this.pattern);

                if (isAdditional || isPattern) {
                    // One table with nested tables for each property
                    const data = getEditableItems(this.value, this.pattern, { name, schema: this.schema }).reduce(
                        (acc, { key, value }) => {
                            acc[key] = value;
                            return acc;
                        },
                        {}
                    );

                    const nProps = Object.keys(data).length;

                    const schemaCopy = { ...inputSchema };

                    if (additionalPropertiesToRetitle.includes(this.form.base.join("."))) {
                        inputSchema.title = "";

                        return Object.entries(data).map(([name, value]) => {
                            const mockInput = {
                                schema: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        additionalProperties: true,
                                    },
                                },
                                renderTable: this.renderTable,
                                value,
                                form: {
                                    ignore: this.form.ignore,
                                },
                            };

                            const table = createTable.call(mockInput, [...localPath], {
                                onUpdate: (localPath, value) => {
                                    onUpdate([name, ...localPath], value, true, {
                                        willTimeout: false,
                                        onError: (e) => e,
                                        onWarning: (e) => e,
                                    });
                                },
                                onThrow: onThrow,
                            });

                            return html`
                                <div style="width: 100%;">
                                    <h3>${header(name)}</h3>
                                    ${table}
                                </div>
                            `;
                        });
                    }

                    if (patternPropsToRetitle.includes(this.form.base.join("."))) {
                        inputSchema.title = "Plane Metadata<hr>";

                        return Object.entries(data)
                            .map(([name, value]) => {
                                const createNestedTable = (value, pattern, schema) => {
                                    const mockInput = {
                                        schema: {
                                            type: "object",
                                            items: schema,

                                            // Transfer a subset of item schema values
                                            minItems: schema.minItems,
                                            maxItems: schema.maxItems,
                                        },

                                        renderTable: this.renderTable,
                                        value,
                                        pattern: pattern,
                                        form: {
                                            ignore: this.form.ignore,
                                        },
                                    };

                                    return html`
                                        <div style="width: 100%;">
                                            ${nProps > 1 ? html`<h3>${header(name)}</h3>` : ""}
                                            ${createTable.call(mockInput, [...localPath], {
                                                overrides: {
                                                    schema: {
                                                        items: {
                                                            order: ["name", "description"],
                                                            additionalProperties: false,
                                                        },
                                                    },
                                                    ignore: {
                                                        [tempPropertyKey]: true,
                                                    },
                                                },
                                                onUpdate: (localPath, value) =>
                                                    onUpdate([name, ...localPath], value, true, {
                                                        willTimeout: false,
                                                        onError: (e) => e,
                                                        onWarning: (e) => e,
                                                    }),
                                                onThrow: onThrow,
                                            })}
                                        </div>
                                    `;
                                };

                                if (isAdditional) {
                                    const data = value.reduce((acc, item) => {
                                        const name = item.name;
                                        acc[name] = item;
                                        return acc;
                                    }, {});

                                    return createNestedTable(data, undefined, {
                                        type: "object",
                                        items: {
                                            type: "object",
                                            additionalProperties: true,
                                        },
                                    });
                                }

                                return Object.entries(schemaCopy.patternProperties).map(([pattern, schema]) => {
                                    return createNestedTable(value, pattern, schema);
                                });
                            })
                            .flat();
                    }
                }
            },

            renderTable: function (name, metadata, fullPath) {
                const updatedSchema = structuredClone(metadata.schema);
                metadata.schema = updatedSchema;

                const parentName = fullPath[fullPath.length - 1];

                const tableConfig =
                    tableRenderConfig[name] ?? parentTableRenderConfig[parentName] ?? tableRenderConfig["*"] ?? true;
                if (typeof tableConfig === "function")
                    return tableConfig.call(form, metadata, [...fullPath, name], this);
                else return tableConfig;
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

        this.localState = { results: structuredClone(this.info.globalState.results ?? {}) };

        this.forms = this.mapSessions(this.createForm, this.localState.results);

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
                    onClick: async (key) => {
                        const { subject, session } = getInfoFromId(key);

                        const results = await this.runConversions(
                            { stub_test: true },
                            [
                                {
                                    subject,
                                    session,
                                    globalState: merge(this.localState, structuredClone(this.info.globalState)),
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

                            const local = this.localState.results[subject][session];
                            const global = this.info.globalState.results[subject][session];

                            merge(local, global);

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
