import { LitElement, html } from "lit";
import { openProgressSwal, runConversion } from "./guided-mode/options/utils.js";
import { get, save } from "../../progress/index.js";
import { dismissNotification, notify } from "../../dependencies/globals.js";
import { randomizeElements, mapSessions, merge } from "./utils.js";

import { ProgressBar } from "../ProgressBar";
import { resolveMetadata } from "./guided-mode/data/utils.js";
import Swal from "sweetalert2";

export class Page extends LitElement {
    // static get styles() {
    //     return useGlobalStyles(
    //         componentCSS,
    //         (sheet) => sheet.href && sheet.href.includes("bootstrap"),
    //         this.shadowRoot
    //     );
    // }

    info = { globalState: {} };

    constructor(info = {}) {
        super();
        Object.assign(this.info, info);
    }

    createRenderRoot() {
        return this;
    }

    query = (input) => {
        return (this.shadowRoot ?? this).querySelector(input);
    };

    onSet = () => {}; // User-defined function

    set = (info, rerender = true) => {
        if (info) {
            Object.assign(this.info, info);
            this.onSet();
            if (rerender) this.requestUpdate();
        }
    };

    #notifications = [];

    dismiss = (notification) => {
        if (notification) dismissNotification(notification);
        else {
            this.#notifications.forEach((notification) => dismissNotification(notification));
            this.#notifications = [];
        }
    };

    notify = (...args) => {
        const ref = notify(...args);
        this.#notifications.push(ref);
        return ref;
    };

    to = async (transition) => {
        // Otherwise note unsaved updates if present
        if (
            this.unsavedUpdates ||
            ("states" in this.info &&
                transition === 1 && // Only ensure save for standard forward progression
                !this.info.states.saved)
        ) {
            if (transition === 1)
                await this.save(); // Save before a single forward transition
            else {
                await Swal.fire({
                    title: "You have unsaved data on this page.",
                    text: "Would you like to save your changes?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "Save and Continue",
                    cancelButtonText: "Ignore Changes",
                }).then(async (result) => {
                    if (result && result.isConfirmed) await this.save();
                });
            }
        }

        return await this.onTransition(transition);
    };

    onTransition = () => {}; // User-defined function
    updatePages = () => {}; // User-defined function
    beforeSave = () => {}; // User-defined function

    save = async (overrides, runBeforeSave = true) => {
        if (runBeforeSave) await this.beforeSave();
        save(this, overrides);
        if ("states" in this.info) this.info.states.saved = true;
        this.unsavedUpdates = false;
    };

    load = (datasetNameToResume = new URLSearchParams(window.location.search).get("project")) =>
        (this.info.globalState = get(datasetNameToResume));

    addSession({ subject, session, info }) {
        if (!this.info.globalState.results[subject]) this.info.globalState.results[subject] = {};
        if (this.info.globalState.results[subject][session])
            throw new Error(`Session ${subject}/${session} already exists.`);
        info = this.info.globalState.results[subject][session] = info ?? {};
        if (!info.metadata) info.metadata = {};
        if (!info.source_data) info.source_data = {};
        return info;
    }

    removeSession({ subject, session }) {
        delete this.info.globalState.results[subject][session];
    }

    mapSessions = (callback, data = this.info.globalState.results) => mapSessions(callback, data);

    async convert({ preview } = {}) {
        const key = preview ? "preview" : "conversion";

        delete this.info.globalState[key]; // Clear the preview results

        if (preview) {
            const stubs = await this.runConversions({ stub_test: true }, undefined, {
                title: "Running stub conversion on all sessions...",
            });
            this.info.globalState[key] = { stubs };
        } else {
            this.info.globalState[key] = await this.runConversions({}, true, { title: "Running all conversions" });
        }

        this.unsavedUpdates = true;

        // Indicate conversion has run successfully
        const { desyncedData } = this.info.globalState;
        if (desyncedData) {
            delete desyncedData[key];
            if (Object.keys(desyncedData).length === 0) delete this.info.globalState.desyncedData;
        }
    }

    async runConversions(conversionOptions = {}, toRun, options = {}) {
        let original = toRun;
        if (!Array.isArray(toRun)) toRun = this.mapSessions();

        // Filter the sessions to run
        if (typeof original === "number")
            toRun = randomizeElements(toRun, original); // Grab a random set of sessions
        else if (typeof original === "string") toRun = toRun.filter(({ subject }) => subject === original);
        else if (typeof original === "function") toRun = toRun.filter(original);

        const results = {};

        if (!("showCancelButton" in options)) {
            options.showCancelButton = true;
            options.customClass = { actions: "swal-conversion-actions" };
        }

        const cancelController = new AbortController();

        const popup = await openProgressSwal({ title: `Running conversion`, ...options }, (result) => {
            if (!result.isConfirmed) cancelController.abort();
        });

        const isMultiple = toRun.length > 1;

        let elements = {};
        popup.hideLoading();
        const element = popup.getHtmlContainer();
        element.innerText = "";
        Object.assign(element.style, {
            textAlign: "left",
            display: "block",
        });

        const progressBar = new ProgressBar();
        elements.progress = progressBar;
        element.append(progressBar);
        element.insertAdjacentHTML(
            "beforeend",
            `<small><small><b>Note:</b> This may take a while to complete...</small></small><hr style="margin-bottom: 0;">`
        );

        let completed = 0;
        elements.progress.value = { b: completed, tsize: toRun.length };

        for (let info of toRun) {
            const { subject, session, globalState = this.info.globalState } = info;
            const file = `sub-${subject}/sub-${subject}_ses-${session}.nwb`;

            const { conversion_output_folder, name, SourceData, alignment } = globalState.project;

            const sessionResults = globalState.results[subject][session];

            const sourceDataCopy = structuredClone(sessionResults.source_data);

            // Resolve the correct session info from all of the metadata for this conversion
            const sessionInfo = {
                ...sessionResults,
                metadata: resolveMetadata(subject, session, globalState),
                source_data: merge(SourceData, sourceDataCopy),
            };

            const result = await runConversion(
                {
                    output_folder: conversionOptions.stub_test ? undefined : conversion_output_folder,
                    project_name: name,
                    nwbfile_path: file,
                    overwrite: true, // We assume override is true because the native NWB file dialog will not allow the user to select an existing file (unless they approve the overwrite)
                    ...sessionInfo, // source_data and metadata are passed in here
                    ...conversionOptions, // Any additional conversion options override the defaults

                    interfaces: globalState.interfaces,
                    alignment
                },
                { swal: popup, fetch: { signal: cancelController.signal }, ...options }
            ).catch((error) => {
                let message = error.message;

                if (message.includes("The user aborted a request.")) {
                    this.notify("Conversion was cancelled.", "warning");
                    throw error;
                }

                this.notify(message, "error");
                popup.close();
                throw error;
            });

            completed++;
            if (isMultiple) {
                const progressInfo = { b: completed, bsize: 1, tsize: toRun.length };
                elements.progress.value = progressInfo;
            }

            const subRef = results[subject] ?? (results[subject] = {});
            subRef[session] = result;
        }

        popup.close();
        element.style.textAlign = ""; // Clear style update

        return results;
    }

    //   NOTE: Until the shadow DOM is supported in Storybook, we can't use this render function how we'd intend to.
    addPage = (id, subpage) => {
        if (!this.info.pages) this.info.pages = {};
        this.info.pages[id] = subpage;
        this.updatePages();
    };

    checkSyncState = async (info = this.info, sync = info.sync) => {
        if (!sync) return;

        const { desyncedData } = info.globalState;
        if (desyncedData) {
            return Promise.all(
                sync.map((k) => {
                    if (desyncedData[k]) {
                        if (k === "conversion") return this.convert();
                        else if (k === "preview") return this.convert({ preview: true });
                    }
                })
            );
        }
    };

    updateSections = () => {
        const dashboard = document.querySelector("nwb-dashboard");
        dashboard.updateSections({ sidebar: true, main: true }, this.info.globalState);
    };

    #unsaved = false;
    get unsavedUpdates() {
        return this.#unsaved;
    }

    set unsavedUpdates(value) {
        this.#unsaved = !!value;
        if (value === "conversions") this.info.globalState.desyncedData = { preview: true, conversion: true };
    }

    // NOTE: Make sure you call this explicitly if a child class overwrites this AND data is updated
    updated() {
        this.unsavedUpdates = false;
    }

    render() {
        return html`<slot></slot>`;
    }
}

customElements.get("nwbguide-page") || customElements.define("nwbguide-page", Page);
