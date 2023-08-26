import { html } from "lit";
import { Page } from "../../Page.js";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../assets/folder_open.svg?raw";

import { electron } from "../../../../electron/index.js";
import { getSharedPath } from "../../../preview/NWBFilePreview.js";
const { shell } = electron;
import { until } from "lit/directives/until.js";
import { run } from "./utils.js";
import { InspectorList } from "../../../preview/inspector/InspectorList.js";
import { getStubArray } from "./GuidedStubPreview.js";
import { InstanceManager } from "../../../InstanceManager.js";

const removeFilePaths = (arr) => {
    return arr.map((o) => {
        const copy = {...o}
        delete copy.file_path;
        return copy;
    })
}
function truncateFilePaths(items, basepath) {
    return items.map((o) => {
        o = {...o}
        o.file_path = o.file_path
                        .replace(`${basepath}/`, "") // Mac
                        .replace(`${basepath}\\`, ""); // Windows
        return o;
    })
}

const filter = (list, toFilter) => {
    return list.filter(o => {
        return Object.entries(toFilter).map(([key, strOrArray]) => {
            return (Array.isArray(strOrArray)) ? strOrArray.map(str => o[key].includes(str)) : o[key].includes(strOrArray)
        }).flat().every(Boolean)
    })
}

export class GuidedInspectorPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        subtitle: () => `${getStubArray(this.info.globalState.preview.stubs).length} Files`,
        controls: () =>
            html`<nwb-button
                size="small"
                @click=${() =>
                    shell
                        ? shell.showItemInFolder(
                              getSharedPath(getStubArray(this.info.globalState.preview.stubs).map((o) => o.file))
                          )
                        : ""}
                >${unsafeSVG(folderOpenSVG)}</nwb-button
            >`,
    };

    // NOTE: We may want to trigger this whenever (1) this page is visited AND (2) data has been changed.
    footer = {
        next: "Preview Files"
    };

    render() {
        const { globalState } = this.info
        const { stubs, inspector } = globalState.preview

        const opts = {}; // NOTE: Currently options are handled on the Python end until exposed to the user
        const title = "Inspecting your file";

        const fileArr = Object.entries(stubs)
        .map(([subject, v]) =>
            Object.entries(v).map(([session, info]) => {
                return { subject, session, info };
            })
        )
        .flat();
        return html`
                ${until(
                    (async () => {
                if (fileArr.length <= 1) {
                        const items = inspector ?? removeFilePaths(this.unsavedUpdates = globalState.preview.inspector = await run("inspect_file", { nwbfile_path: fileArr[0].info.file, ...opts }, { title }))
                        return new InspectorList({ items })
                } 

            const items = await (async () => {
                const path = getSharedPath(fileArr.map((o) => o.info.file));
                const report = inspector ?? (this.unsavedUpdates = globalState.preview.inspector = await run("inspect_folder", { path, ...opts }, { title: title + "s" }));
                return truncateFilePaths(report, path);
            })();

            const _instances = fileArr.map(({ subject , session, info }) => {

                const display = () => {
                    const filtered = removeFilePaths(filter(items, { file_path: [`sub-${subject}`, `sub-${subject}_ses-${session}`]}))
                    return new InspectorList({ items: filtered })
                }

                return {
                    subject, 
                    session, 
                    display
                }
            });

            const instances = _instances.reduce((acc, { subject, session, display }) => {
                if (!acc[`sub-${subject}`]) acc[`sub-${subject}`] = {};
                acc[`sub-${subject}`][`ses-${session}`] = display;
                return acc;
            }, {});

            Object.keys(instances).forEach((subLabel) => {
                instances[subLabel] = {
                    ['All Files']: () => {
                        const subItems = filter(items, { file_path: `${subLabel}/${subLabel}_ses-`})
                        const path = getSharedPath(subItems.map((o) => o.file_path));
                        return new InspectorList({ items: truncateFilePaths(subItems, path)})
                    },
                    ...instances[subLabel]
                }
            })

            return new InstanceManager({ 
                instances: {
                    ['All Files']: () => new InspectorList({ items }),
                    ...instances
                } 
            });
        })(), '')}`
    }
}

customElements.get("nwbguide-guided-inspector-page") ||
    customElements.define("nwbguide-guided-inspector-page", GuidedInspectorPage);
