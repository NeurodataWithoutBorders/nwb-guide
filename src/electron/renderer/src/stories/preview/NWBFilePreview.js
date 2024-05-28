import { LitElement, css, html } from "lit";
import { InspectorList } from "./inspector/InspectorList";
import { Neurosift, getURLFromFilePath } from "./Neurosift";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { run } from "../pages/guided-mode/options/utils";
import { until } from "lit/directives/until.js";
import { InstanceManager } from "../InstanceManager";
import { path } from "../../electron";
import { FullScreenToggle } from "../FullScreenToggle";

export function getSharedPath(array) {
    array = array.map((str) => str.replace(/\\/g, "/")); // Convert to Mac-style path
    const mapped = array.map((str) => str.split("/"));
    let shared = mapped.shift();
    mapped.forEach((arr, i) => {
        for (let j in arr) {
            if (arr[j] !== shared[j]) {
                shared = shared.slice(0, j);
                break;
            }
        }
    });

    return shared ? path.normalize(shared.join("/")) : ""; // Convert back to OS-specific path
}

export function truncateFilePaths(items, basepath) {
    return items.map((item) => {
        item = { ...item };
        item.file_path = item.file_path
            .replace(`${basepath}/`, "") // Mac
            .replace(`${basepath}\\`, ""); // Windows
        return item;
    });
}

export const removeFilePaths = (items) => {
    return items.map((item) => {
        const copy = { ...item };
        delete copy.file_path;
        return copy;
    });
};

class NWBPreviewInstance extends LitElement {
    constructor({ file }, project) {
        super();
        this.file = file;
        this.project = project;

        window.addEventListener("online", () => this.requestUpdate());
        window.addEventListener("offline", () => this.requestUpdate());
    }

    render() {
        const isOnline = navigator.onLine;

        return isOnline
            ? new Neurosift({
                  url: getURLFromFilePath(this.file, this.project),
                  fullscreen: false,
              })
            : until(
                  (async () => {
                      const htmlRep = await run("neuroconv/html", { nwbfile_path: this.file }, { swal: false });
                      return unsafeHTML(htmlRep);
                  })(),
                  html`<small>Loading HTML representation...</small>`
              );
    }
}

customElements.get("nwb-preview-instance") || customElements.define("nwb-preview-instance", NWBPreviewInstance);

export class NWBFilePreview extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
                height: 100%;
                background: white;
                position: relative;
            }

            iframe {
                width: 100%;
                height: 100%;
                border: 0;
            }

            #inspect {
                display: flex;
                flex-direction: column;
                border-left: 1px solid gray;
                box-shadow: -5px 0 5px -5px rgba(0, 0, 0, 0.5);
                z-index: 1;
            }
        `;
    }

    constructor({ files = {}, project, inspect = false }) {
        super();
        this.project = project;
        this.files = files;
        this.inspect = inspect;
    }

    createInstance = ({ subject, session, info }) => {
        return {
            subject,
            session,
            display: () => new NWBPreviewInstance(info, this.project),
        };
    };

    render() {
        const fileArr = Object.entries(this.files)
            .map(([subject, v]) =>
                Object.entries(v).map(([session, info]) => {
                    return { subject, session, info };
                })
            )
            .flat();

        const onlyFirstFile = fileArr.length <= 1;

        return html` ${new FullScreenToggle({ target: this })}
            <div style="display: flex; height: 100%;">
                <div style="flex-grow: 1;">
                    ${(() => {
                        if (onlyFirstFile) return new NWBPreviewInstance(fileArr[0].info, this.project);
                        else {
                            const _instances = fileArr.map(this.createInstance);

                            const instances = _instances.reduce((acc, { subject, session, display }) => {
                                if (!acc[`sub-${subject}`]) acc[`sub-${subject}`] = {};
                                acc[`sub-${subject}`][`ses-${session}`] = display;
                                return acc;
                            }, {});

                            return new InstanceManager({ instances });
                        }
                    })()}
                </div>
                ${this.inspect
                    ? html`<div id="inspect">
                          <h3 style="padding: 10px; margin: 0; background: black; color: white;">Inspector Report</h3>
                          ${until(
                              (async () => {
                                  const options = {}; // NOTE: Currently options are handled on the Python end until exposed to the user

                                  const title = "Inspecting your file";

                                  const report = onlyFirstFile
                                      ? await run(
                                            "neuroconv/inspect_file",
                                            { nwbfile_path: fileArr[0].info.file, ...options },
                                            { title }
                                        ) // Inspect the first file
                                      : await run(
                                            "neuroconv/inspect_folder",
                                            { path, ...options },
                                            { title: title + "s" }
                                        ); // Inspect the folder

                                  const result = onlyFirstFile
                                      ? {
                                            ...report,
                                            messages: removeFilePaths(report.messages),
                                        }
                                      : {
                                            ...report,
                                            messages: truncateFilePaths(
                                                report.messages,
                                                getSharedPath(fileArr.map(({ info }) => info.file))
                                            ),
                                        };

                                  const items = result.messages;

                                  const list = new InspectorList({
                                      items: items,
                                      listStyles: { minWidth: "300px", maxWidth: "350px" },
                                      emptyMessage: "No issues found.",
                                  });
                                  list.style.padding = "10px";
                                  return list;
                              })(),
                              html`<small style="padding: 10px 25px;">Loading inspector report...</small>`
                          )}
                      </div>`
                    : ""}
            </div>`;
    }
}

customElements.get("nwb-file-preview") || customElements.define("nwb-file-preview", NWBFilePreview);
