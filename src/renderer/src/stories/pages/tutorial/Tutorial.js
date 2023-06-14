import { html } from "lit";
import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import tutorialSchema from "../../../../../../schemas/json/tutorial.schema.json" assert { type: "json" };
import { run } from "../guided-mode/options/utils.js";
import "../../Button.js";
import { InfoBox } from "../../InfoBox.js";
import { hasEntry, get, save } from "../../../progress.js";

import { electron } from "../../../electron/index.js";

const { shell } = electron;

const tutorialPipelineName = "NWB GUIDE Tutorial Data";

export class TutorialPage extends Page {
    constructor(...args) {
        super(...args);
    }

    state = {};

    render() {
        this.state = {}; // Clear local state on each render

        const form = new JSONSchemaForm({
            schema: tutorialSchema,
            dialogOptions: {
                properties: ["createDirectory"],
            },
            results: this.state,
        });

        form.style.width = "100%";

        return html` <h1>Tutorial Data Generation</h1>
            <p>
                This page allows you to generate a dataset with multiple subjects and sessions so you can practice using
                NWB GUIDE before converting your own datasets.
            </p>

            <hr />

            ${hasEntry(tutorialPipelineName)
                ? html`<div>
                      Data has been preloaded into the <b>${tutorialPipelineName}</b> project on the
                      <a @click=${() => this.onTransition("guided")}>Guided Mode</a> conversion list.

                      <br /><br />
                      <nwb-button
                          @click=${() => {
                              if (shell) {
                                  const entry = get(tutorialPipelineName);
                                  shell.showItemInFolder(entry.project.initialized);
                              }
                          }}
                          >Open Dataset Location</nwb-button
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

                              const { output_directory } = await run("generate_dataset", this.state, {
                                  title: "Generating tutorial data",
                              }).catch((e) => {
                                  this.notify(e.message, "error");
                                  throw e;
                              });

                              this.state.output_directory_path = output_directory;

                              this.notify("Tutorial data successfully generated!");
                              if (shell) shell.showItemInFolder(output_directory);

                              save({
                                  info: {
                                      globalState: {
                                          project: {
                                              name: tutorialPipelineName,
                                              initialized: output_directory, // Declare where all the data is here
                                          },

                                          interfaces: {
                                              PhySorting: "PhySortingInterface",
                                              SpikeGLXRecording: "SpikeGLXRecordingInterface",
                                          },

                                          structure: {
                                              results: {
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
                                              },
                                              state: true,
                                          },
                                      },
                                  },
                              });

                              this.requestUpdate(); // Re-render
                          }}
                          >Generate data</nwb-button
                      >
                  `}`;
    }
}

customElements.get("nwb-tutorial-page") || customElements.define("nwb-tutorial-page", TutorialPage);
