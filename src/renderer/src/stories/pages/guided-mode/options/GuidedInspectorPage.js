import { html } from "lit";
import { Page } from "../../Page.js";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../assets/folder_open.svg?raw";

import { electron } from "../../../../electron/index.js";
import { getSharedPath, removeFilePaths, truncateFilePaths } from "../../../preview/NWBFilePreview.js";
const { shell } = electron;
import { until } from "lit/directives/until.js";
import { run } from "./utils.js";
import { InspectorList } from "../../../preview/inspector/InspectorList.js";
import { getStubArray } from "./GuidedStubPreview.js";
import { InstanceManager } from "../../../InstanceManager.js";
import { path as nodePath } from "../../../../electron";
import { getMessageType } from "../../../../validation/index.js";

import { InfoBox } from "../../../InfoBox";
import { Button } from "../../../Button";

import { download } from "../../inspect/utils.js";

const filter = (list, toFilter) => {
    return list.filter((item) => {
        return Object.entries(toFilter)
            .map(([key, strOrArray]) => {
                return Array.isArray(strOrArray)
                    ? strOrArray.map((str) => item[key].includes(str))
                    : item[key].includes(strOrArray);
            })
            .flat()
            .every(Boolean);
    });
};

const emptyMessage = "No issues detected in these files!";

export class GuidedInspectorPage extends Page {
    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
        Object.assign(this.style, {
            display: "flex",
            flexDirection: "column",
        });
    }

    headerButtons = [
        new Button({
            label: "JSON",
            primary: true,
        }),

        new Button({
            label: "Text",
            primary: true,
        }),
    ];

    header = {
        subtitle: `The NWB Inspector has scanned your files for adherence to <a target="_blank" href="https://nwbinspector.readthedocs.io/en/dev/best_practices/best_practices_index.html">best practices</a>.`,
        controls: () => [
            ...this.headerButtons,
            html`<nwb-button
                size="small"
                @click=${() =>
                    shell
                        ? shell.showItemInFolder(
                              getSharedPath(getStubArray(this.info.globalState.preview.stubs).map(({ file }) => file))
                          )
                        : ""}
                >${unsafeSVG(folderOpenSVG)}</nwb-button
            >`,
        ],
    };

    // NOTE: We may want to trigger this whenever (1) this page is visited AND (2) data has been changed.
    footer = {
        next: "Preview Files",
    };

    getStatus = (list) => {
        return list.reduce((acc, messageInfo) => {
            const res = getMessageType(messageInfo);
            if (acc === "error") return acc;
            else return res;
        }, "valid");
    };

    updated() {
        const [downloadJSONButton, downloadTextButton] = this.headerButtons;

        downloadJSONButton.onClick = () =>
            download("nwb-inspector-report.json", {
                header: this.report.header,
                messages: this.report.messages,
            });

        downloadTextButton.onClick = () => download("nwb-inspector-report.txt", this.report.text);
    }

    render() {
        const { globalState } = this.info;
        const { stubs, inspector } = globalState.preview;

        const options = {}; // NOTE: Currently options are handled on the Python end until exposed to the user
        const title = "Inspecting your file";

        const fileArr = Object.entries(stubs)
            .map(([subject, v]) =>
                Object.entries(v).map(([session, info]) => {
                    return { subject, session, info };
                })
            )
            .flat();
        return html` ${new InfoBox({
                header: "How do I fix these suggestions?",
                content: html`We suggest editing the Global Metadata on the <b>previous page</b> to fix any issues
                    shared across files.`,
            })}

            <br />

            ${until(
                (async () => {
                    if (fileArr.length <= 1) {
                        this.report = inspector;

                        if (!this.report) {
                            const result = await run(
                                "inspect_file",
                                { nwbfile_path: fileArr[0].info.file, ...options },
                                { title }
                            );

                            this.report = globalState.preview.inspector = {
                                ...result,
                                messages: removeFilePaths(result.messages),
                            };
                        }

                        if (!inspector) await this.save();

                        const items = this.report.messages;

                        return new InspectorList({ items, emptyMessage });
                    }

                    const path = getSharedPath(fileArr.map(({ info }) => info.file));

                    this.report = inspector;
                    if (!this.report) {
                        const result = await run("inspect_folder", { path, ...options }, { title: title + "s" });
                        this.report = globalState.preview.inspector = {
                            ...result,
                            messages: truncateFilePaths(result.messages, path),
                        };
                    }

                    if (!inspector) await this.save();

                    const messages = this.report.messages;
                    const items = truncateFilePaths(messages, path);

                    const _instances = fileArr.map(({ subject, session, info }) => {
                        const file_path = [`sub-${subject}`, `sub-${subject}_ses-${session}`];
                        const filtered = removeFilePaths(filter(items, { file_path }));

                        const display = () => new InspectorList({ items: filtered, emptyMessage });
                        display.status = this.getStatus(filtered);

                        return {
                            subject,
                            session,
                            display,
                        };
                    });

                    const instances = _instances.reduce((acc, { subject, session, display }) => {
                        const subLabel = `sub-${subject}`;
                        if (!acc[`sub-${subject}`]) acc[subLabel] = {};
                        acc[subLabel][`ses-${session}`] = display;
                        return acc;
                    }, {});

                    Object.keys(instances).forEach((subLabel) => {
                        const subItems = filter(items, { file_path: `${subLabel}${nodePath.sep}${subLabel}_ses-` }); // NOTE: This will not run on web-only now
                        const path = getSharedPath(subItems.map((item) => item.file_path));
                        const filtered = truncateFilePaths(subItems, path);

                        const display = () => new InspectorList({ items: filtered, emptyMessage });
                        display.status = this.getStatus(filtered);

                        instances[subLabel] = {
                            ["All Files"]: display,
                            ...instances[subLabel],
                        };
                    });

                    const allDisplay = () => new InspectorList({ items, emptyMessage });
                    allDisplay.status = this.getStatus(items);

                    const allInstances = {
                        ["All Files"]: allDisplay,
                        ...instances,
                    };

                    const manager = new InstanceManager({
                        instances: allInstances,
                    });

                    return manager;
                })(),
                "Loading inspector report..."
            )}`;
    }
}

customElements.get("nwbguide-guided-inspector-page") ||
    customElements.define("nwbguide-guided-inspector-page", GuidedInspectorPage);
