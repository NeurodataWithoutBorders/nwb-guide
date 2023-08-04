import { html } from "lit";
import { Page } from "../../Page.js";

// For Multi-Select Form
import { notyf } from "../../../../dependencies/globals.js";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { OptionalSection } from "../../../OptionalSection.js";
import { run } from "../options/utils.js";
import { onThrow } from "../../../../errors";

import pathExpansionSchema from "../../../../../../../schemas/json/path-expansion.schema.json" assert { type: "json" };
import { InfoBox } from "../../../InfoBox.js";

export class GuidedPathExpansionPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {
        onNext: async () => {
            this.save(); // Save in case the request fails

            const hidden = this.optional.hidden;
            this.info.globalState.structure.state = !hidden;

            if (!this.optional.toggled) {
                const message = "Please select a path expansion option.";
                notyf.open({
                    type: "error",
                    message,
                });
                throw new Error(message);
            }

            // Force single subject/session
            if (hidden) {
                const source_data = {};
                for (let key in this.info.globalState.interfaces) source_data[key] = {};

                const existingMetadata =
                    this.info.globalState.results?.[this.altInfo.subject_id]?.[this.altInfo.session_id]?.metadata;

                this.info.globalState.results = {
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

            // Otherwise use path expansion to merge into existing subjects
            else if (!hidden && hidden !== undefined) {
                const structure = this.info.globalState.structure.results;

                const finalStructure = {};
                for (let key in structure) {
                    const entry = { ...structure[key] };
                    const fstring = entry.format_string_path;
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
                    notyf.open({
                        type: "error",
                        message,
                    });
                    throw message;
                }

                // Save an overall results object organized by subject and session
                this.merge("results", results);

                // // NOTE: Current behavior is to ONLY add new results, not remove old ones
                // // If we'd like, we could label sessions as user-defined so they never clear

                // // Remove previous results that are no longer present
                // const globalResults = this.info.globalState.results
                // for (let sub in globalResults) {
                //   for (let ses in globalResults[sub]) {
                //     if (!results[sub]?.[ses]) delete globalResults[sub]?.[ses]
                //   }
                //   if (Object.keys(globalResults[sub]).length === 0) delete globalResults[sub]
                // }
            }

            this.onTransition(1);
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

    optional = new OptionalSection({
        header: "Would you like to locate data programmatically?",
        description: html`<p>Automatically detect source data for multiple subjects and sessions.</p>`,
        // altContent: this.altForm,
    });

    render() {
        let structureGlobalState = this.info.globalState.structure;
        if (!structureGlobalState) structureGlobalState = this.info.globalState.structure = { results: {} };

        const state = this.info.globalState.structure.state;
        if (state !== undefined) this.optional.state = state;

        // Require properties for all sources
        const generatedSchema = { type: "object", properties: {} };
        for (let key in this.info.globalState.interfaces)
            generatedSchema.properties[key] = { type: "object", ...pathExpansionSchema };
        structureGlobalState.schema = generatedSchema;

        this.optional.requestUpdate();

        const form = (this.form = new JSONSchemaForm({
            ...structureGlobalState,
            onThrow,
            onUpdate: () => (this.unsavedUpdates = true),
        }));

        const pathExpansionInfoBox = new InfoBox({
            header: "How do I use a Python format string for path expansion?",
            content: html`For complete documentation of the path expansion feature of neuroconv, visit the
                <a href="https://neuroconv.readthedocs.io/en/main/user_guide/expand_path.html" target="_blank"
                    >Path Expansion documentation</a
                >
                page.`,
        });

        pathExpansionInfoBox.style.margin = "10px 0px";

        this.optional.innerHTML = "";
        this.optional.append(pathExpansionInfoBox, form);

        form.style.width = "100%";

        return this.optional;
    }
}

customElements.get("nwbguide-guided-pathexpansion-page") ||
    customElements.define("nwbguide-guided-pathexpansion-page", GuidedPathExpansionPage);
