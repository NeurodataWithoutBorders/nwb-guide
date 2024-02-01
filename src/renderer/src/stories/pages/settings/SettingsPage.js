import { html } from "lit";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import { onThrow } from "../../../errors";
import dandiGlobalSchema from "../../../../../../schemas/json/dandi/global.json";
import projectGlobalSchema from "../../../../../../schemas/json/project/globals.json" assert { type: "json" };
import developerGlobalSchema from "../../../../../../schemas/json/developer/globals.json" assert { type: "json" };

import { validateDANDIApiKey } from "../../../validation/dandi";

import { Button } from "../../Button.js";
import { global, remove, save } from "../../../progress/index.js";
import { merge, setUndefinedIfNotDeclared } from "../utils.js";

import { notyf } from "../../../dependencies/globals.js";
import { SERVER_FILE_PATH, fs, path, port } from "../../../electron/index.js";

import saveSVG from "../../assets/save.svg?raw";

import { header } from "../../forms/utils";

import testingSuiteYaml from "../../../../../../guide_testing_suite.yml";

const propertiesToTransform = ["folder_path", "file_path"];

function saveNewPipelineFromYaml(name, sourceData, rootFolder) {
    const subjectId = "mouse1";
    const sessions = ["session1"];

    const resolvedSourceData = structuredClone(sourceData);
    Object.values(resolvedSourceData).forEach((info) => {
        propertiesToTransform.forEach((property) => {
            if (info[property]) {
                const fullPath = path.join(rootFolder, info[property]);
                if (fs.existsSync(fullPath)) info[property] = fullPath;
                else throw new Error("Source data not available for this pipeline.");
            }
        });
    });

    const updatedName = header(name);

    remove(updatedName, true);

    save({
        info: {
            globalState: {
                project: {
                    name: updatedName,
                    initialized: true,
                },

                // provide data for all supported interfaces
                interfaces: Object.keys(resolvedSourceData).reduce((acc, key) => {
                    acc[key] = `${key}`;
                    return acc;
                }, {}),

                structure: {
                    keep_existing_data: true,
                    state: false,
                },

                results: {
                    [subjectId]: sessions.reduce((acc, sessionId) => {
                        acc[subjectId] = {
                            metadata: {
                                Subject: {
                                    subject_id: subjectId,
                                },
                                NWBFile: {
                                    session_id: sessionId,
                                },
                            },
                            source_data: resolvedSourceData,
                        };
                        return acc;
                    }, {}),
                },

                subjects: {
                    [subjectId]: {
                        sessions: sessions,
                        sex: "M",
                        species: "Mus musculus",
                        age: "P30D",
                    },
                },
            },
        },
    });
}

const schema = merge(
    projectGlobalSchema,
    {
        properties: {
            DANDI: {
                title: "DANDI Settings",
                ...dandiGlobalSchema,
            },
            developer: {
                title: "Developer Settings",
                ...developerGlobalSchema,
            },
        },
        required: ["DANDI", "developer"],
    },
    {
        arrays: true,
    }
);

export class SettingsPage extends Page {
    header = {
        title: "App Settings",
        subtitle: "This page allows you to set global settings for the GUIDE.",
        controls: [
            new Button({
                icon: saveSVG,
                onClick: async () => {
                    if (!this.unsavedUpdates) return this.#openNotyf("All changes were already saved", "success");
                    this.save();
                },
            }),
        ],
    };

    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
    }

    #notification;

    #openNotyf = (message, type) => {
        if (this.#notification) notyf.dismiss(this.#notification);
        return (this.#notification = this.notify(message, type));
    };

    beforeSave = async () => {
        const { resolved } = this.form;
        setUndefinedIfNotDeclared(schema.properties, resolved);

        merge(resolved, global.data);

        global.save(); // Save the changes, even if invalid on the form
        this.#openNotyf(`Global settings changes saved.`, "success");
    };

    render() {
        this.localState = structuredClone(global.data);

        // NOTE: API Keys and Dandiset IDs persist across selected project
        this.form = new JSONSchemaForm({
            results: this.localState,
            schema,
            onUpdate: () => (this.unsavedUpdates = true),
            validateOnChange: async (name, parent) => {
                const value = parent[name];
                if (name.includes("api_key")) return await validateDANDIApiKey(value, name.includes("staging"));
                return true;
            },
            onThrow,
        });

        const generatePipelineButton = new Button({
            label: "Generate Test Pipelines",
            onClick: async () => {
                const { testing_data_folder } = this.form.results.developer ?? {};

                if (!testing_data_folder)
                    return this.#openNotyf(
                        `Please specify a testing data folder in the Developer section before attempting to generate pipelines.`,
                        "error"
                    );

                const { pipelines = {} } = testingSuiteYaml;

                const pipelineNames = Object.keys(pipelines);

                const resolved = pipelineNames.reverse().map((name) => {
                    try {
                        saveNewPipelineFromYaml(name, pipelines[name], testing_data_folder);
                        return true;
                    } catch (e) {
                        console.error(e);
                        return name;
                    }
                });

                const nSuccessful = resolved.reduce((acc, v) => (acc += v === true ? 1 : 0), 0);
                const nFailed = resolved.length - nSuccessful;

                if (nFailed) {
                    const failDisplay =
                        nFailed === 1
                            ? `the <b>${resolved.find((v) => typeof v === "string")}</b> pipeline`
                            : `${nFailed} pipelines`;
                    this.#openNotyf(
                        `<h4 style="margin-bottom: 0;">Generated ${nSuccessful} test pipelines.</h4><small>Could not find source data for ${failDisplay}.`,
                        "warning"
                    );
                } else if (nSuccessful) this.#openNotyf(`Generated ${nSuccessful} test pipelines.`, "success");
                else
                    this.#openNotyf(
                        `<h4 style="margin-bottom: 0;">Pipeline Generation Failed</h4><small>Could not find source data for any pipelines.</small>`,
                        "error"
                    );
            },
        });

        setTimeout(() => {
            const testFolderInput = this.form.getFormElement(["developer", "testing_data_folder"]);
            testFolderInput.after(generatePipelineButton);
        }, 100);

        return html`
            <p><b>Server Port:</b> ${port}</p>
            <p><b>Server File Location:</b> ${SERVER_FILE_PATH}</p>
            <hr />
            <br />
            ${this.form}
        `;
    }
}

customElements.get("nwbguide-settings-page") || customElements.define("nwbguide-settings-page", SettingsPage);