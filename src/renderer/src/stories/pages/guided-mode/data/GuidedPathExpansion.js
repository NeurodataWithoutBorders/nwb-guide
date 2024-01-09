import { html } from "lit";
import { Page } from "../../Page.js";

// For Multi-Select Form
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { OptionalSection } from "../../../OptionalSection.js";
import { run } from "../options/utils.js";
import { onThrow } from "../../../../errors";

import pathExpansionSchema from "../../../../../../../schemas/json/path-expansion.schema.json" assert { type: "json" };
import { InfoBox } from "../../../InfoBox.js";
import { merge } from "../../utils.js";
import { CodeBlock } from "../../../CodeBlock.js";
import { List } from "../../../List";
import { fs } from "../../../../electron/index.js";
import { joinPath } from "../../../../globals.js";

const exampleFileStructure = `mylab/
    ¦   Subjects/
    ¦   +-- NR_0017/
    ¦   ¦   +-- 2022-03-22/
    ¦   ¦   ¦   +-- 001/
    ¦   ¦   ¦   ¦   +-- raw_video_data/
    ¦   ¦   ¦   ¦   ¦   +-- _leftCamera.raw.6252a2f0-c10f-4e49-b085-75749ba29c35.mp4
    ¦   ¦   ¦   ¦   ¦   +-- ...
    ¦   ¦   ¦   ¦   +-- ...
    ¦   +-- NR_0019/
    ¦   ¦   +-- 2022-04-29/
    ¦   ¦   ¦   +-- 001/
    ¦   ¦   ¦   ¦   +-- raw_video_data/
    ¦   ¦   ¦   ¦   ¦   +-- _leftCamera.raw.9041b63e-02e2-480e-aaa7-4f6b776a647f.mp4
    ¦   ¦   ¦   ¦   ¦   +-- ...
    ¦   ¦   ¦   ¦   +-- ...
    ¦   ...`;

const exampleFormatPath =
    "Subjects/{subject_id}/{session_start_time:%Y-%m-%d}/{session_id}/raw_video_data/leftCamera.raw.{}.mp4";

const infoBox = new InfoBox({
    header: "How do I use a Python format string to locate my files?",
    content: html`
        <div>
            <p>
                Consider a dataset of that includes video recordings from three cameras, stored in the following
                directory structure.
            </p>
            ${new CodeBlock({ text: exampleFileStructure })}

            <p>
                Using <code>mylab</code> as the base directory, the correct format string to extract the subject ID,
                session start time, and session number would be:
            </p>
            ${new CodeBlock({ text: exampleFormatPath })}

            <hr />

            <p>
                The above example applies all of the supported f-string variables, which are used to extract information
                into the resulting metadata:
            </p>
            ${new List({
                items: [
                    {
                        value: "subject_id",
                    },
                    {
                        value: "session_id",
                    },
                    {
                        value: "session_start_time",
                    },
                ],
                editable: false,
            })}

            <p>Wildcard patterns are specified by blank braces / non-standard variables.</p>

            <small
                >For complete documentation of the path expansion feature of NeuroConv, visit the
                <a href="https://neuroconv.readthedocs.io/en/main/user_guide/expand_path.html" target="_blank"
                    >path expansion documentation</a
                >
                page.
            </small>
        </div>
    `,
});

function getFiles(dir) {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    let entries = [];
    for (const dirent of dirents) {
        const res = joinPath(dir, dirent.name);
        if (dirent.isDirectory()) entries.push(...getFiles(res));
        else entries.push(res);
    }

    return entries;
}

export class GuidedPathExpansionPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        subtitle: "Automatic source data detection for multiple subjects / sessions",
    };

    beforeSave = async () => {
        const keepExistingData = this.dataManagementForm.resolved.keep_existing_data;
        this.localState.keep_existing_data = keepExistingData;

        const globalState = this.info.globalState;
        merge({ structure: this.localState }, globalState); // Merge the actual entries into the structure

        const hidden = this.optional.hidden;
        globalState.structure.state = !hidden;

        if (hidden) {
            // Force single subject/session if not keeping existing data
            if (!keepExistingData || !globalState.results) {
                const existingMetadata =
                    globalState.results?.[this.altInfo.subject_id]?.[this.altInfo.session_id]?.metadata;

                const existingSourceData =
                    globalState.results?.[this.altInfo.subject_id]?.[this.altInfo.session_id]?.source_data;

                const source_data = {};
                for (let key in globalState.interfaces) {
                    const existing = existingSourceData?.[key];
                    if (existing) source_data[key] = existing ?? {};
                }

                globalState.results = {
                    [this.altInfo.subject_id]: {
                        [this.altInfo.session_id]: {
                            source_data,
                            metadata: {
                                NWBFile: {
                                    session_id: this.altInfo.session_id,
                                    ...(existingMetadata?.NWBFile ?? {}),
                                },
                                Subject: {
                                    subject_id: this.altInfo.subject_id,
                                    ...(existingMetadata?.Subject ?? {}),
                                },
                            },
                        },
                    },
                };
            }
        }

        // Otherwise use path expansion to merge into existing subjects
        else if (!hidden && hidden !== undefined) {
            const structure = globalState.structure.results;

            await this.form.validate();

            const finalStructure = {};
            for (let key in structure) {
                const entry = { ...structure[key] };
                const fstring = entry.format_string_path;
                if (!fstring) continue;
                if (fstring.split(".").length > 1) entry.file_path = fstring;
                else entry.folder_path = fstring;
                delete entry.format_string_path;
                finalStructure[key] = entry;
            }

            const results = await run(`locate`, finalStructure, { title: "Locating Data" }).catch((e) => {
                this.notify(e.message, "error");
                throw e;
            });

            const subjects = Object.keys(results);
            if (subjects.length === 0) {
                const message = "No subjects found with the current configuration. Please try again.";
                this.notify(message, "error");
                throw message;
            }

            // Save an overall results object organized by subject and session
            merge({ results }, globalState);

            const globalResults = globalState.results;

            if (!keepExistingData) {
                for (let sub in globalResults) {
                    const subRef = results[sub];
                    if (!subRef) delete globalResults[sub]; // Delete removed subjects
                    else {
                        for (let ses in globalResults[sub]) {
                            const sesRef = subRef[ses];

                            if (!sesRef) delete globalResults[sub][ses]; // Delete removed sessions
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
            }
        }
    };

    footer = {
        next: "Populate Subject Details",
        onNext: async () => {
            await this.save(); // Save in case the request fails

            if (!this.optional.toggled) {
                const message = "Please select an option.";
                this.notify(message, "error");
                throw new Error(message);
            }

            this.to(1);
        },
    };

    altInfo = {
        subject_id: "001",
        session_id: "1",
    };

    // altForm = new JSONSchemaForm({
    //   results: this.altInfo,
    //   schema: {
    //     type: 'object',
    //     properties: {
    //       subject_id: {
    //         type: 'string',
    //         description: 'Enter a subject ID.',
    //       },
    //       session_id: {
    //         type: 'string',
    //         description: 'Enter a session ID.',
    //       },
    //     },
    //     required: ['subject_id', 'session_id']
    //   }
    // })

    localState = {};

    render() {
        this.optional = new OptionalSection({
            header: "Will you locate your files programmatically?",
            description: infoBox,
            onChange: () => (this.unsavedUpdates = "conversions"),
            // altContent: this.altForm,
        });

        const structureState = (this.localState = merge(this.info.globalState.structure, {
            results: {},
            keep_existing_data: true,
        }));

        const state = structureState.state;

        this.optional.state = state;
        if (state === undefined) infoBox.open = true; // Open the info box if no option has been selected

        // Require properties for all sources
        const generatedSchema = { type: "object", properties: {}, additionalProperties: false };
        for (let key in this.info.globalState.interfaces)
            generatedSchema.properties[key] = { type: "object", ...pathExpansionSchema };
        structureState.schema = generatedSchema;

        this.optional.requestUpdate();

        const form = (this.form = new JSONSchemaForm({
            ...structureState,
            onThrow,
            validateEmptyValues: false,

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

                        const interfaceName = parentPath.slice(-1)[0];

                        const results = await run(`locate`, { [interfaceName]: entry }, { swal: false }).catch((e) => {
                            this.notify(e.message, "error");
                            throw e;
                        });

                        const resolved = [];

                        for (let sub in results) {
                            for (let ses in results[sub]) {
                                const source_data = results[sub][ses].source_data[interfaceName];
                                const path = source_data.file_path ?? source_data.folder_path;
                                resolved.push(path.slice(base_directory.length + 1));
                            }
                        }

                        return [
                            {
                                message: html` <h4 style="margin: 0;">Source Files Found</h4>
                                    <small>${base_directory}</small>
                                    <small
                                        >${new List({
                                            items: resolved.map((path) => {
                                                return { value: path };
                                            }),
                                            emptyMessage: "N/A",
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

        this.optional.innerHTML = "";

        this.optional.style.paddingTop = "10px";

        this.dataManagementForm = new JSONSchemaForm({
            results: { keep_existing_data: structureState.keep_existing_data },
            onUpdate: () => (this.unsavedUpdates = "conversions"),
            schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    keep_existing_data: {
                        type: "boolean",
                        description: "Maintain data for subjects / sessions that are not located.",
                    },
                },
            },
        });

        this.optional.append(form);

        form.style.width = "100%";

        return html`${this.dataManagementForm}${this.optional}`;
    }
}

customElements.get("nwbguide-guided-pathexpansion-page") ||
    customElements.define("nwbguide-guided-pathexpansion-page", GuidedPathExpansionPage);
