import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import tutorialSchema from "../../../../../../schemas/json/tutorial.schema.json" assert { type: "json" };

import { run } from "../guided-mode/options/utils.js";
import "../../Button.js";
import { InfoBox } from "../../InfoBox.js";
import { hasEntry, get, save, remove, resume, global } from "../../../progress.js";

import { electron } from "../../../electron/index.js";

import restartSVG from "../../assets/restart.svg?raw";
import folderOpenSVG from "../../assets/folder_open.svg?raw";

const { shell } = electron;

const tutorialPipelineName = "NWB GUIDE Tutorial Data";

export class TutorialPage extends Page {
    constructor(...args) {
        super(...args);
    }

    render() {
        const state = (global.data.tutorial = global.data.tutorial ?? {});

        const form = new JSONSchemaForm({
            schema: tutorialSchema,
            dialogOptions: {
                properties: ["createDirectory"],
            },
            results: state,
            onUpdate: () => global.save(),
        });

        form.style.width = "100%";

        const entryExists = hasEntry(tutorialPipelineName);

        return html` <div style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 10px;">
                <h1 style="margin: 0;">Tutorial Data Generation</h1>

                <div>
                    ${entryExists
                        ? html` <nwb-button
                                  size="small"
                                  @click=${() => {
                                      if (shell) {
                                          const entry = get(tutorialPipelineName);
                                          shell.showItemInFolder(entry.project.initialized);
                                      }
                                  }}
                                  >${unsafeSVG(folderOpenSVG)}</nwb-button
                              >

                              <nwb-button
                                  size="small"
                                  @click=${async () => {
                                      const hasBeenDeleted = await remove(tutorialPipelineName);
                                      if (hasBeenDeleted) this.requestUpdate();
                                  }}
                                  >${unsafeSVG(restartSVG)}</nwb-button
                              >`
                        : ""}
                </div>
            </div>
            <p>
                This page allows you to generate a dataset with multiple subjects and sessions so you can practice using
                NWB GUIDE before converting your own datasets.
            </p>

            <hr />

            ${hasEntry(tutorialPipelineName)
                ? html`<div>
                      Data has been preloaded into the <b>${tutorialPipelineName}</b> pipeline, which can be accessed
                      via the <a @click=${() => this.to("guided")}>Guided Mode</a> conversion list.

                      <br /><br />

                      <nwb-button
                          primary
                          size="small"
                          @click=${() => {
                              resume.call(this, tutorialPipelineName);
                          }}
                          >Open Conversion Pipeline</nwb-button
                      >
                  </div>`
                : html`
                      ${new InfoBox({
                          header: "How to download test data",
                          content: html`Please refer to the
                              <a
                                  href="https://neuroconv.readthedocs.io/en/main/developer_guide/testing_suite.html#testing-on-example-data"
                                  target="_blank"
                                  >example data documentation</a
                              >
                              on the NeuroConv documentation site to learn how to download this dataset using DataLad.`,
                      })}

                      <br /><br />

                      ${form}

                      <nwb-button
                          @click=${async () => {
                              await form.validate(); // Will throw an error in the callback

                              const { output_directory } = await run("generate_dataset", state, {
                                  title: "Generating tutorial data",
                              }).catch((e) => {
                                  this.notify(e.message, "error");
                                  throw e;
                              });

                              this.notify("Tutorial data successfully generated!");
                              if (shell) shell.showItemInFolder(output_directory);

                              //   Limit the data structures included in the tutorial
                              const dataStructureResults = {
                                  PhySorting: {
                                      base_directory: output_directory,
                                      format_string_path:
                                          "{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_phy",
                                  },
                                  SpikeGLXRecording: {
                                      base_directory: output_directory,
                                      format_string_path:
                                          "{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_g0/{subject_id}_{session_id}_g0_imec0/{subject_id}_{session_id}_g0_t0.imec0.ap.bin",
                                  },
                              };

                              save({
                                  info: {
                                      globalState: {
                                          project: {
                                              name: tutorialPipelineName,
                                              initialized: output_directory, // Declare where all the data is here
                                          },

                                          // provide data for all supported interfaces
                                          interfaces: Object.keys(dataStructureResults).reduce((acc, key) => {
                                              acc[key] = `${key}Interface`;
                                              return acc;
                                          }, {}),

                                          // Manually fill out the structure of supported data interfaces
                                          structure: {
                                              results: dataStructureResults,
                                              state: true,
                                          },
                                      },
                                  },
                              });

                              this.requestUpdate(); // Re-render
                          }}
                          >Generate Dataset</nwb-button
                      >
                  `}`;
    }
}

customElements.get("nwb-tutorial-page") || customElements.define("nwb-tutorial-page", TutorialPage);
