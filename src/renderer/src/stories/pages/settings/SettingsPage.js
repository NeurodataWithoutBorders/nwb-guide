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

import { homeDirectory, notyf, testDataFolderPath } from "../../../dependencies/globals.js";
import { SERVER_FILE_PATH, electron, path, port, fs, onUpdateAvailable, onUpdateProgress, registerUpdateProgress } from "../../../electron/index.js";

import saveSVG from "../../assets/save.svg?raw";
import folderSVG from "../../assets/folder_open.svg?raw";
import deleteSVG from "../../assets/delete.svg?raw";
import generateSVG from "../../assets/restart.svg?raw";
import downloadSVG from "../../assets/download.svg?raw";
import infoSVG from "../../assets/info.svg?raw";

import { header } from "../../forms/utils";

import testingSuiteYaml from "../../../../../../guide_testing_suite.yml";
import { run } from "../guided-mode/options/utils.js";
import { joinPath } from "../../../globals.js";
import { Modal } from "../../Modal";
import { ProgressBar } from "../../ProgressBar";

const DATA_OUTPUT_PATH = joinPath(testDataFolderPath, "single_session_data");
const DATASET_OUTPUT_PATH = joinPath(testDataFolderPath, "multi_session_dataset");

const propertiesToTransform = ["folder_path", "file_path", "config_file_path"];

const deleteIfExists = (path) => (fs.existsSync(path) ? fs.rmSync(path, { recursive: true }) : "");

function saveNewPipelineFromYaml(name, info, rootFolder) {
    const subject_id = "mouse1";
    const sessions = ["session1"];
    const session_id = sessions[0];

    info = structuredClone(info); // Copy info

    const hasMultipleSessions = sessions.length > 1;

    const resolvedInterfaces = info.interfaces ?? info;

    Object.values(resolvedInterfaces).forEach((info) => {
        propertiesToTransform.forEach((property) => {
            if (info[property]) {
                const fullPath = path.join(rootFolder, info[property]);
                if (fs.existsSync(fullPath)) info[property] = fullPath;
                else throw new Error("Source data not available for this pipeline.");
            }
        });
    });

    const resolvedMetadata = {
        NWBFile: { session_id },
        Subject: { subject_id },
    };

    resolvedMetadata.__generated = structuredClone(info.interfaces ? info.metadata ?? {} : {});

    const resolvedInfo = {
        source_data: resolvedInterfaces,
        metadata: resolvedMetadata,
    };

    const updatedName = header(name);

    remove(updatedName, true);

    const workflowInfo = {
        multiple_sessions: hasMultipleSessions,
    };

    if (!workflowInfo.multiple_sessions) {
        workflowInfo.subject_id = subject_id;
        workflowInfo.session_id = session_id;
    }

    save({
        info: {
            globalState: {
                project: {
                    name: updatedName,
                    initialized: true,
                    workflow: workflowInfo,
                },

                // provide data for all supported interfaces
                interfaces: Object.keys(resolvedInterfaces).reduce((acc, key) => {
                    acc[key] = `${key}`;
                    return acc;
                }, {}),

                structure: {},

                results: {
                    [subject_id]: sessions.reduce((acc, sessionId) => {
                        acc[session_id] = resolvedInfo;
                        return acc;
                    }, {}),
                },

                subjects: {
                    [subject_id]: {
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
        arrays: "append",
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

    deleteTestData = () => {
        deleteIfExists(DATA_OUTPUT_PATH);
        deleteIfExists(DATASET_OUTPUT_PATH);
    };

    generateTestData = async () => {
        if (!fs.existsSync(DATA_OUTPUT_PATH)) {
            await run(
                "generate",
                {
                    output_path: DATA_OUTPUT_PATH,
                },
                {
                    title: "Generating test data",
                    html: "<small>This will take several minutes to complete.</small>",
                    base: "data",
                }
            ).catch((error) => {
                this.notify(error.message, "error");
                throw error;
            });
        }

        await run(
            "generate/dataset",
            {
                input_path: DATA_OUTPUT_PATH,
                output_path: DATASET_OUTPUT_PATH,
            },
            {
                title: "Generating test dataset",
                base: "data",
            }
        ).catch((error) => {
            this.notify(error.message, "error");
            throw error;
        });

        const sanitizedOutputPath = DATASET_OUTPUT_PATH.replace(homeDirectory, "~");

        this.notify(`Test dataset successfully generated at ${sanitizedOutputPath}!`);

        return DATASET_OUTPUT_PATH;
    };

    beforeSave = async () => {
        const { resolved } = this.form;
        setUndefinedIfNotDeclared(schema.properties, resolved);

        merge(resolved, global.data);

        global.save(); // Save the changes, even if invalid on the form
        this.#openNotyf(`Global settings changes saved.`, "success");
    };


    #releaseNotesModal;


    // Populate the Update Available display
    updated() {
        
        const updateDiv = this.querySelector('#update-available')

        if (updateDiv.innerHTML) return // Only populate once

        onUpdateAvailable(( updateInfo ) => {

            const container = document.createElement('div')
            container.classList.add('update-container')

            const mainUpdateInfo = document.createElement('div')

            const infoIcon = document.createElement('slot')
            infoIcon.innerHTML = infoSVG

            infoIcon.onclick = () => {
                if (this.#releaseNotesModal) return this.#releaseNotesModal.open = true

                const modal = this.#releaseNotesModal = new Modal({ header: `Release Notes` })

                const releaseNotes = document.createElement('div')
                releaseNotes.style.padding = '25px'
                releaseNotes.innerHTML = updateInfo.releaseNotes
                modal.append(releaseNotes)

                document.body.append(modal)

                modal.open = true
            }

            const controls = document.createElement('div')
            controls.classList.add('controls')
            const downloadButton = new Button({
                icon: downloadSVG,
                label: `Update`,
                size: 'extra-small',
                onClick: () => electron.ipcRenderer.send('download-update')
            })

            controls.append(downloadButton)


            const header = document.createElement('div')
            header.classList.add('header')

            const title = document.createElement('h4')
            title.innerText = `NWB GUIDE ${updateInfo.version}`
            header.append(title, infoIcon)
            
            const description = document.createElement('span')
            description.innerText = `A new version of the application is available.`
            
            mainUpdateInfo.append(header, description)

            container.append(mainUpdateInfo, controls)

            let progressBarEl;
            onUpdateProgress(( progress ) => {
                if (!progressBarEl) {
                    progressBarEl = new ProgressBar()
                    const hr = document.createElement('hr')
                    updateDiv.append(hr, progressBarEl)
                }
                progressBarEl.format = {
                    prefix: `Download Progress for NWB GUIDE ${updateInfo.version}`,
                    ...progress
                }
            })
            updateDiv.append(container)
            
        })
    }

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
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <p><b>Server Port:</b> ${port}</p>
                    <p><b>Server File Location:</b> ${SERVER_FILE_PATH}</p>
                </div>
                <div>
                    <p style="font-weight: bold;">Test Dataset</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${fs.existsSync(DATASET_OUTPUT_PATH) && fs.existsSync(DATA_OUTPUT_PATH)
                            ? [
                                  new Button({
                                      icon: deleteSVG,
                                      label: "Delete",
                                      size: "small",
                                      onClick: async () => {
                                          this.deleteTestData();
                                          this.notify(`Test dataset successfully deleted from your system.`);
                                          this.requestUpdate();
                                      },
                                  }),

                                  new Button({
                                      icon: folderSVG,
                                      label: "Open",
                                      size: "small",
                                      onClick: async () => {
                                          if (electron.ipcRenderer) {
                                              if (fs.existsSync(DATASET_OUTPUT_PATH))
                                                  electron.ipcRenderer.send("showItemInFolder", DATASET_OUTPUT_PATH);
                                              else {
                                                  this.notify("The test dataset no longer exists!", "warning");
                                                  this.requestUpdate();
                                              }
                                          }
                                      },
                                  }),
                              ]
                            : new Button({
                                  label: "Generate",
                                  icon: generateSVG,
                                  size: "small",
                                  onClick: async () => {
                                      const output_path = await this.generateTestData();
                                      if (electron.ipcRenderer)
                                          electron.ipcRenderer.send("showItemInFolder", output_path);
                                      this.requestUpdate();
                                  },
                              })}
                    </div>
                </div>
            </div>
            <div id="update-available"></div>
            <hr />
            <br />
            ${this.form}
        `;
    }
}

customElements.get("nwbguide-settings-page") || customElements.define("nwbguide-settings-page", SettingsPage);
