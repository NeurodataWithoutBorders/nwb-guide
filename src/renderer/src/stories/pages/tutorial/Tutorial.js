import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

import { JSONSchemaForm } from "../../JSONSchemaForm.js";
import { Page } from "../Page.js";
import tutorialSchema from "../../../../../../schemas/json/tutorial.schema.json" assert { type: "json" };

import { run } from "../guided-mode/options/utils.js";
import "../../Button.js";
import { InfoBox } from "../../InfoBox.js";
import { hasEntry, get, save, remove, resume, global } from "../../../progress/index.js";

import { electron } from "../../../electron/index.js";

import { InspectorListItem } from "../../preview/inspector/InspectorList";

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
        const entry = entryExists ? get(tutorialPipelineName) : {};

        return html`
            <div style="display: flex; align-items: end; justify-content: space-between; margin-bottom: 5px;">
                <h1 style="margin: 0;">Tutorial Data Generation</h1>
            </div>
            <p>
                This page allows you to generate a dataset with multiple subjects and sessions so you can practice using
                NWB GUIDE before converting your own datasets.
            </p>

            <hr />

            ${hasEntry(tutorialPipelineName)
                ? html`<div>
                      <p>
                          A dataset has been generated for you at
                          <small
                              ><code
                                  ><a @click=${() => shell?.showItemInFolder(entry.project.initialized)}
                                      >${entry.project.initialized}</a
                                  ></code
                              ></small
                          >
                          and preloaded into the <b>${tutorialPipelineName}</b> conversion pipeline.
                      </p>

                      <p>Try to fill out as much metadata as you can while going through this tutorial. Be creative!</p>

                      <p>
                          Don't worry about providing incorrect information. We'll let you know if something will break
                          the conversion.
                      </p>

                      <p>
                          And remember,
                          <b>the more you provide Global Metadata, the less you'll have to specify later.</b>
                      </p>

                      <div>
                          ${new InspectorListItem({
                              message: html` <h4 style="margin: 0;">A Final Note on DANDI Upload</h4>
                                  <small
                                      >When you reach the Upload page, make sure to provide a Dandiset ID on the
                                      <b>DANDI Staging server</b> — just so we don't overrun the main server with test
                                      data.</small
                                  >`,
                              type: "warning",
                          })}
                      </div>

                      <p>Let's get started with your first conversion on the NWB GUIDE!</p>

                      <nwb-button
                          primary
                          size="small"
                          @click=${() => {
                              resume.call(this, tutorialPipelineName);
                          }}
                          >${"page-before-exit" in entry ? "Resume" : "Begin"} Conversion</nwb-button
                      >

                      <nwb-button
                          size="small"
                          @click=${async () => {
                              const hasBeenDeleted = await remove(tutorialPipelineName);
                              if (hasBeenDeleted) this.requestUpdate();
                          }}
                          >Delete Pipeline</nwb-button
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
                  `}
        `;
    }
}

customElements.get("nwb-tutorial-page") || customElements.define("nwb-tutorial-page", TutorialPage);
