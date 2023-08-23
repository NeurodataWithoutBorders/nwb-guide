import { LitElement, css, html } from "lit";
import { InspectorList } from "./inspector/InspectorList";
import { Neurosift, getURLFromFilePath } from "./Neurosift";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { run } from "../pages/guided-mode/options/utils";
import { until } from "lit/directives/until.js";
import { InstanceManager } from "../InstanceManager";

function sharedPath(array) {
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

    return shared.join("/");
}

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
            ? new Neurosift({ url: getURLFromFilePath(this.file, this.project) })
            : until(
                  (async () => {
                      const htmlRep = await run("html", { nwbfile_path: this.file });
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
            iframe {
                width: 100%;
                height: 100%;
                border: 0;
            }
        `;
    }

    constructor({ files = {}, project }) {
        super();
        this.project = project;
        this.files = files;
    }

    createInstance = ({ subject, session, info }) => {
        return {
            subject,
            session,
            display: new NWBPreviewInstance(info, this.project),
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

        return html`<div style="display: flex; height: 100%;">
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

                        return new InstanceManager({
                            header: "Sessions",
                            instanceType: "Session",
                            instances,
                            // renderInstance: (_, value) => {
                            //     console.log('RENDERING', value)
                            //     return value.content ?? value;
                            // }
                        });
                    }
                })()}
            </div>
            <div style="padding-left: 20px; display: flex; flex-direction: column;">
                <h3 style="padding: 10px; margin: 0; background: black; color: white;">Inspector Report</h3>
                ${until(
                    (async () => {
                        const opts = { ignore: ["check_description"] };

                        const title = 'Inspecting your file'

                        const items = onlyFirstFile
                            ? await run("inspect_nwbfile", { nwbfile_path: fileArr[0].info.file, ...opts }, { title }) // Inspect the first file
                            : await (async () => {
                                  const path = sharedPath(fileArr.map((o) => o.info.file));
                                  return (await run("inspect", { path, ...opts }, { title: title + 's' })).map((o) => {
                                      o.file_path = o.file_path.replace(`${path}/`, "");
                                      return o;
                                  });
                              })();

                        const list = new InspectorList({
                            items: items,
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
