import { html } from "lit";
import { Page } from "../../Page.js";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import folderOpenSVG from "../../../assets/folder_open.svg?raw";

import { electron } from "../../../../electron/index.js";
import { Neurosift, getURLFromFilePath } from "../../../Neurosift.js";
import { InspectorList } from "../../../inspector/InspectorList.js";
const { shell } = electron;

export class GuidedStubPreviewPage extends Page {
    constructor(...args) {
        super(...args);
        window.addEventListener("online", () => this.requestUpdate());
        window.addEventListener("offline", () => this.requestUpdate());
    }

    header = {
        subtitle: () => this.info.globalState.preview.file,
        controls: () =>
            html`<nwb-button
                size="small"
                @click=${() => (shell ? shell.showItemInFolder(this.info.globalState.preview.file) : "")}
                >${unsafeSVG(folderOpenSVG)}</nwb-button
            >`,
    };

    // NOTE: We may want to trigger this whenever (1) this page is visited AND (2) data has been changed.
    footer = {
        next: "Run Conversion",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails
            delete this.info.globalState.conversion;
            this.info.globalState.conversion = await this.runConversions({}, true, {
                title: "Running all conversions",
            });
            this.to(1);
        },
    };

    render() {
        const { project, preview } = this.info.globalState;

        return preview
            ? html`<div style="display: flex; height: 100%;">
                  <div style="flex-grow: 1;">
                      ${navigator.onLine
                          ? new Neurosift({ url: getURLFromFilePath(preview.file, project.name) })
                          : html`<div style="padding: 0px 25px;">${unsafeHTML(preview.html)}</div>`}
                  </div>
                  <div style="padding-left: 20px; display: flex; flex-direction: column;">
                      <h3 style="padding: 10px; margin: 0; background: black; color: white;">Inspector Report</h3>
                      ${(() => {
                          const list = new InspectorList({ items: preview.report, listStyles: { maxWidth: "350px" } });
                          list.style.padding = "10px";
                          return list;
                      })()}
                  </div>
              </div>`
            : html`<p style="text-align: center;">Your conversion preview failed. Please try again.</p>`;
    }
}

customElements.get("nwbguide-guided-stub-review-page") ||
    customElements.define("nwbguide-guided-stub-review-page", GuidedStubPreviewPage);
