import { html } from "lit";
import { Page } from "../../Page.js";

// For Multi-Select Form
import { JSONSchemaForm, getSchema } from "../../../JSONSchemaForm.js";
import { run } from "../options/utils.js";
import { onThrow } from "../../../../errors";

import pathExpansionSchema from "../../../../../../../schemas/json/path-expansion.schema.json" assert { type: "json" };
import { merge } from "../../utils";
import { List } from "../../../List";
import { fs } from "../../../../../utils/electron.js";
import { Button } from "../../../Button.js";
import { Modal } from "../../../Modal";
import { header } from "../../../forms/utils";

import autocompleteIcon from "../../../../../assets/icons/inspect.svg?raw";

const propOrder = ["path", "subject_id", "session_id"];

export async function autocompleteFormatString(path) {
    let notification;

    const interfaceName = path[0];

    const { base_directory } = path.reduce((acc, key) => acc[key] ?? {}, this.form.resolved);

    const schema = getSchema(path, this.info.globalState.schema.source_data);

    const isFile = "file_path" in schema.properties;
    const pathType = isFile ? "file" : "directory";

    const description = isFile ? schema.properties.file_path.description : schema.properties.folder_path.description;

    const notify = (message, type) => {
        if (notification) this.dismiss(notification);
        return (notification = this.notify(message, type));
    };

    if (!base_directory) {
        const message = `Please fill out the <b>base directory</b> for ${header(path[0])} before attempting auto-completion.`;
        notify(message, "error");
        throw new Error(message);
    }

    const modal = new Modal({
        header: `${interfaceName} — Autocomplete Format String`,
    });

    const content = document.createElement("div");
    Object.assign(content.style, {
        padding: "25px",
    });

    const form = new JSONSchemaForm({
        validateEmptyValues: false,
        schema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    title: `Example ${isFile ? "File" : "Folder"}`,
                    format: pathType,
                    description: description ?? `Provide an example ${pathType} for the selected interface`,
                },
                subject_id: {
                    type: "string",
                    description: "The subject ID in the above entry",
                },
                session_id: {
                    type: "string",
                    description: "The session ID in the above entry",
                },
            },
            required: propOrder,
            order: propOrder,
        },
        validateOnChange: async (name, parent) => {
            const value = parent[name];

            if (name === "path") {
                const toUpdate = ["subject_id", "session_id"];
                toUpdate.forEach((key) => form.getFormElement([key]).requestUpdate());

                if (value) {
                    if (fs.lstatSync(value).isSymbolicLink())
                        return [
                            {
                                type: "error",
                                message: "This feature does not support symbolic links. Please provide a valid path.",
                            },
                        ];

                    if (base_directory) {
                        if (!value.includes(base_directory))
                            return [
                                {
                                    type: "error",
                                    message:
                                        "The provided path must include the base directory.<br><small>This is likely due to the target being contained in a symlink, which is unsupported by this feature.</small>",
                                },
                            ];
                    }

                    const errors = [];
                    for (let key in parent) {
                        if (key === name) continue;
                        if (!value.includes(parent[key]))
                            errors.push({
                                type: "error",
                                message: `${header(name)} not found in the updated path.`,
                            });
                    }
                }
            } else {
                if (!parent.path) return;
                if (!value) return;

                if (!parent.path.includes(value))
                    return [
                        {
                            type: "error",
                            message: `${header(name)} not found in the provided path.`,
                        },
                    ];
            }
        },
    });

    content.append(form);
    modal.append(content);

    modal.onClose = async () => notify("Format String Path was not completed.", "error");

    return new Promise((resolve) => {
        const button = new Button({
            label: "Submit",
            primary: true,
            onClick: async () => {
                await form.validate().catch((e) => {
                    notify(e.message, "error");
                    throw e;
                });

                const results = await run("neuroconv/locate/autocomplete", {
                    base_directory,
                    additional_metadata: {},
                    ...form.results,
                });
                const input = this.form.getFormElement([...path, "format_string_path"]);
                input.updateData(results.format_string);
                this.save();
                resolve(results.format_string);
            },
        });

        modal.footer = button;

        modal.open = true;

        document.body.append(modal);
    }).finally(() => {
        modal.remove();
    });
}

export class GuidedPathExpansionPage extends Page {
    #notification;

    constructor(...args) {
        super(...args);
    }

    header = {
        subtitle: "Automatic source data detection for multiple subjects / sessions",
    };

    #initialize = () => (this.localState = merge(this.info.globalState.structure, { results: {} }));

    workflow = {
        subject_id: {},
        session_id: {},
        base_directory: {},
        locate_data: {
            skip: () => {
                this.#initialize();
                const globalState = this.info.globalState;
                merge({ structure: this.localState }, globalState); // Merge the actual entries into the structure

                // Force single subject/session if not keeping existing data
                // if (!globalState.results) {

                const subject_id = this.workflow.subject_id.value;
                const session_id = this.workflow.session_id.value;

                // Map existing results to new subject information (if available)
                const existingResults = Object.values(Object.values(globalState.results ?? {})[0] ?? {})[0] ?? {};

                const existingMetadata = existingResults.metadata ?? {};
                const existingSourceData = existingResults.source_data;

                const source_data = {};
                for (let key in globalState.interfaces) {
                    const existing = existingSourceData?.[key];
                    if (existing) source_data[key] = existing ?? {};
                }

                const sub_id = subject_id ?? "";
                const ses_id = session_id ?? "";

                // Skip if results already exist without manual IDs
                if ((!subject_id || !session_id) && globalState.results) return;
                // Otherwise reset the results to the new subject/session
                else {
                    globalState.results = {};

                    globalState.results[sub_id] = {};

                    const metadata = structuredClone(existingMetadata);
                    if (!metadata.NWBFile) metadata.NWBFile = {};
                    if (!metadata.Subject) metadata.Subject = {};
                    metadata.NWBFile.session_id = ses_id;
                    metadata.Subject.subject_id = sub_id;

                    globalState.results[sub_id][ses_id] = { source_data, metadata };
                }

                this.save({}, false); // Ensure this structure is saved
            },
        },
    };

    beforeSave = async ( ) => {
        const globalState = this.info.globalState;
        merge({ structure: this.localState }, globalState); // Merge the actual entries into the structure

        const structure = globalState.structure.results;

        await this.form.validate();

        const globalBaseDirectory = this.workflow.base_directory.value;

        const finalStructure = {};
        for (let key in structure) {
            const entry = { ...structure[key] };
            const fstring = entry.format_string_path;
            if (!fstring) continue;
            if (fstring.split(".").length > 1) entry.file_path = fstring;
            else entry.folder_path = fstring;
            delete entry.format_string_path;

            if (!entry.base_directory && globalBaseDirectory) entry.base_directory = globalBaseDirectory;

            finalStructure[key] = entry;
        }

        if (Object.keys(finalStructure).length === 0) {
            const message =
                "Please configure at least one interface. <br/><small>Otherwise, revisit <b>Pipeline Workflow</b> to update your configuration.</small>";
            this.#notification = this.notify(message, "error");
            throw message;
        }

        const results = await run(`neuroconv/locate`, finalStructure, {
            title: "Locating Data",
        }).catch((error) => {
            this.notify(error.message, "error");
            throw error;
        });

        const subjects = Object.keys(results);
        if (subjects.length === 0) {
            if (this.#notification) this.dismiss(this.#notification);
            const message = "No subjects found with the current configuration. Please try again.";
            this.#notification = this.notify(message, "error");
            throw message;
        }

        // globalState.results = {} // Clear existing results

        // Save an overall results object organized by subject and session
        merge({ results }, globalState);

        const globalResults = globalState.results;

        for (let sub in globalResults) {
            const subRef = results[sub];
            if (!subRef)
                delete globalResults[sub]; // Delete removed subjects
            else {
                for (let ses in globalResults[sub]) {
                    const sesRef = subRef[ses];

                    if (!sesRef)
                        delete globalResults[sub][ses]; // Delete removed sessions
                    else {
                        const globalSesRef = globalResults[sub][ses];

                        for (let name in globalSesRef.source_data) {
                            if (!sesRef.source_data[name]) delete globalSesRef.source_data[name]; // Delete removed interfaces
                        }
                    }
                }

                if (Object.keys(globalResults[sub]).length === 0) delete globalResults[sub]; // Delete empty subjects
            }
        }
    };

    footer = {
        onNext: async () => {
            await this.save(); // Save in case the request fails

            await this.form.validate();

            return this.to(1);
        },
    };

    localState = {};

    render() {
        const structureState = this.#initialize();

        // Require properties for all sources
        const generatedSchema = {
            type: "object",
            properties: {},
            additionalProperties: false,
        };
        const controls = {};

        const baseDirectory = this.workflow.base_directory.value;
        const globals = (structureState.globals = {});

        for (let key in this.info.globalState.interfaces) {
            generatedSchema.properties[key] = {
                type: "object",
                ...pathExpansionSchema,
            };

            if (baseDirectory) globals[key] = { base_directory: baseDirectory };

            controls[key] = {
                format_string_path: [
                    new Button({
                        label: "Autocomplete",
                        icon: autocompleteIcon,
                        buttonStyles: {
                            width: "max-content",
                        },
                        onClick: async () => autocompleteFormatString.call(this, [key]),
                    }),
                ],
            };
        }
        structureState.schema = generatedSchema;

        const form = (this.form = new JSONSchemaForm({
            ...structureState,
            onThrow,
            validateEmptyValues: null,

            controls,

            // NOTE: These are custom coupled form inputs
            onUpdate: (path, value) => {
                this.unsavedUpdates = "conversions";

                const parentPath = [...path];
                const name = parentPath.pop();

                if (name === "base_directory") {
                    form.getFormElement([...parentPath, "base_directory"]).value = value; // Update value pre-emptively
                    const input = form.getFormElement([...parentPath, "format_string_path"]);
                    if (input.value) input.updateData(input.value, true);
                }
            },
            validateOnChange: async (name, parent, parentPath) => {
                const value = parent[name];

                const interfaceName = parentPath.slice(-1)[0];

                if (fs) {
                    const baseDir = form.getFormElement([...parentPath, "base_directory"]);
                    if (name === "format_string_path") {
                        if (value && baseDir && !baseDir.value) {
                            return [
                                {
                                    message: html`A base directory must be provided to locate your files.`,
                                    type: "error",
                                },
                            ];
                        }

                        const base_directory = [...parentPath, "base_directory"].reduce(
                            (acc, key) => acc[key],
                            this.form.resolved
                        );

                        if (!base_directory) return true; // Do not calculate if base is not found

                        const entry = { base_directory };

                        if (value.split(".").length > 1) entry.file_path = value;
                        else entry.folder_path = value;

                        const results = await run(
                            `neuroconv/locate`,
                            { [interfaceName]: entry },
                            { swal: false }
                        ).catch((error) => {
                            this.notify(error.message, "error");
                            throw error;
                        });

                        const resolved = [];

                        for (let sub in results) {
                            for (let ses in results[sub]) {
                                const source_data = results[sub][ses].source_data[interfaceName];
                                const path = source_data.file_path ?? source_data.folder_path;
                                resolved.push(path.slice(base_directory.length + 1));
                            }
                        }

                        if (resolved.length === 0)
                            return [
                                {
                                    message: html`No source files found using the provided information.`,
                                    type: "warning",
                                },
                            ];

                        return [
                            {
                                message: html`
                                    <h4 style="margin: 0;"><span style="margin-right: 7px;">✅</span>Source Files Found for ${interfaceName}</h4>
                                    <small>${base_directory}</small>
                                    <small
                                        >${new List({
                                            items: resolved.map((path) => {
                                                return { value: path };
                                            }),
                                            editable: false,
                                        })}</small
                                    >`,
                                type: "info",
                            },
                        ];
                    }
                }
            },
        }));

        form.style.width = "100%";

        return form;
    }
}

customElements.get("nwbguide-guided-pathexpansion-page") ||
    customElements.define("nwbguide-guided-pathexpansion-page", GuidedPathExpansionPage);
