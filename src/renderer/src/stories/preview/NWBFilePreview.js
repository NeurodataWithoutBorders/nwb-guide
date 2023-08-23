import { LitElement, css, html } from "lit";
import { InspectorList } from "./inspector/InspectorList";
import { Neurosift, getURLFromFilePath } from "./Neurosift";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { run } from "../pages/guided-mode/options/utils";
import { until } from "lit/directives/until.js";

export class NWBFilePreview extends LitElement {
    static get styles() {
        return css`
            iframe {
                width: 100%;
                height: 100%;
                border: 0;
            }
        `;
    }

    constructor({ project, files = [] }) {
        super();
        this.project = project;
        this.files = files;
    }

    render() {
        const filepath = this.files[0].file;
        console.log(filepath, this.files[0]);

        return html`<div style="display: flex; height: 100%;">
            <div style="flex-grow: 1;">
                ${navigator.onLine
                    ? new Neurosift({ url: getURLFromFilePath(filepath, this.project) })
                    : html`<div style="padding: 0px 25px;">
                          ${until(
                              (async () => unsafeHTML(await run("html", { nwbfile_path: filepath })))(),
                              "<small>Loading HTML representation...</small>"
                          )}
                      </div>`}
            </div>
            <div style="padding-left: 20px; display: flex; flex-direction: column;">
                <h3 style="padding: 10px; margin: 0; background: black; color: white;">Inspector Report</h3>
                ${until(
                    (async () => {
                        const list = new InspectorList({
                            items: await run("inspect_nwbfile", {
                                nwbfile_path: filepath,
                                ignore: ["check_description"],
                            }),
                            listStyles: { maxWidth: "350px" },
                        });
                        list.style.padding = "10px";
                        return list;
                    })(),
                    html`<small style="padding: 10px 25px;">Loading inspector report...</small>`
                )}
            </div>
        </div>`;
    }
}

customElements.get("nwb-file-preview") || customElements.define("nwb-file-preview", NWBFilePreview);
