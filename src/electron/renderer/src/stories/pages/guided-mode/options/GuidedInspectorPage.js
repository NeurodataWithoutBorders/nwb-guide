import { html } from "lit";
import { Page } from "../../Page.js";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import folderOpenSVG from "../../../assets/folder_open.svg?raw";

import { electron } from "../../../../electron/index.js";
import { getSharedPath, removeFilePaths, truncateFilePaths } from "../../../preview/NWBFilePreview.js";
const { ipcRenderer } = electron;
import { until } from "lit/directives/until.js";
import { run } from "./utils";
import { InspectorList, InspectorLegend } from "../../../preview/inspector/InspectorList.js";
import { getStubArray } from "./GuidedStubPreview.js";
import { InstanceManager } from "../../../InstanceManager.js";
import { getMessageType } from "../../../../validation/index.js";

import { Button } from "../../../Button.js";

import { download } from "../../inspect/utils.js";
import { createProgressPopup } from "../../../utils/progress.js";
import { resolve } from "../../../../promises";

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
            display: "grid",
            gridTemplateRows: "calc(100% - 120px) 1fr",
            rowGap: "10px",
        });
    }

    workflow = {
        multiple_sessions: {},
    };

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
                @click=${() => {
                    if (ipcRenderer)
                        ipcRenderer.send(
                            "showItemInFolder",
                            getSharedPath(getStubArray(this.info.globalState.preview.stubs).map(({ file }) => file))
                        );
                }}
                >${unsafeSVG(folderOpenSVG)}</nwb-button
            >`,
        ],
    };

    // NOTE: We may want to trigger this whenever (1) this page is visited AND (2) data has been changed.
    footer = {};

    #toggleRendered;
    #rendered;
    #updateRendered = (force) =>
        force || this.#rendered === true
            ? (this.#rendered = new Promise(
                  (resolve) => (this.#toggleRendered = () => resolve((this.#rendered = true)))
              ))
            : this.#rendered;

    get rendered() {
        return resolve(this.#rendered, () => true);
    }

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
        this.#updateRendered(true);

        const { globalState } = this.info;
        const { stubs, inspector } = globalState.preview;

        const legendProps = { multiple: this.workflow.multiple_sessions.value };

        const options = {}; // NOTE: Currently options are handled on the Python end until exposed to the user
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
                        this.report = inspector;

                        if (!this.report) {
                            const result = await run(
                                "inspect_file",
                                { nwbfile_path: fileArr[0].info.file, ...options },
                                { title }
                            ).catch((error) => {
                                this.notify(error.message, "error");
                                return null;
                            });

                            if (!result) return "Failed to generate inspector report.";

                            this.report = globalState.preview.inspector = {
                                ...result,
                                messages: removeFilePaths(result.messages),
                            };
                        }

                        if (!inspector) await this.save();

                        const items = this.report.messages;

                        const list = new InspectorList({ items, emptyMessage });

                        Object.assign(list.style, {
                            height: "100%",
                        });

                        return html`${list}${new InspectorLegend(legendProps)}`;
                    }

                    const path = getSharedPath(fileArr.map(({ info }) => info.file));

                    this.report = inspector;
                    if (!this.report) {
                        const swalOpts = await createProgressPopup({ title: `${title}s` });

                        const { close: closeProgressPopup } = swalOpts;

                        const result = await run(
                            "inspect_folder",
                            { path, ...options, request_id: swalOpts.id },
                            swalOpts
                        ).catch((error) => {
                            this.notify(error.message, "error");
                            closeProgressPopup();
                            return null;
                        });

                        if (!result) return "Failed to generate inspector report.";

                        closeProgressPopup();

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
                        // const subItems = filter(items, { file_path: `${subLabel}${nodePath.sep}${subLabel}_ses-` }); // NOTE: This will not run on web-only now
                        const subItems = filter(items, { file_path: `${subLabel}_ses-` }); // NOTE: This will not run on web-only now
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

                    return html`${manager}${new InspectorLegend(legendProps)}`;
                })().finally(() => {
                    this.#toggleRendered();
                }),
                "Loading inspector report..."
            )}
        `;
    }
}

customElements.get("nwbguide-guided-inspector-page") ||
    customElements.define("nwbguide-guided-inspector-page", GuidedInspectorPage);
