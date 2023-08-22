import { LitElement, html } from "lit";
import { openProgressSwal, runConversion } from "./guided-mode/options/utils.js";
import { get, save } from "../../progress.js";
import { dismissNotification, notify } from "../../dependencies/globals.js";
import { merge, randomizeElements, mapSessions } from "./utils.js";

import { ProgressBar } from "../ProgressBar";
import { resolveResults } from "./guided-mode/data/utils.js";
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

        this.style.height = "100%";
        this.style.color = "black";
    }

    createRenderRoot() {
        return this;
    }

    query = (input) => {
        return (this.shadowRoot ?? this).querySelector(input);
    };

    onSet = () => {}; // User-defined function

    set = (info) => {
        if (info) {
            Object.assign(this.info, info);
            this.onSet();
            this.requestUpdate();
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
        const note = notify(...args);
        this.#notifications.push(note);
    };

    to = async (transition) => {
        this.beforeTransition();

        // Otherwise note unsaved updates if present
        if (this.unsavedUpdates) {
            if (transition === 1) await this.save(); // Save before a single forward transition
            else {
                Swal.fire({
                    title: "You have unsaved data on this page.",
                    text: "Would you like to save your changes?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "Save and Continue",
                    cancelButtonText: "Ignore Changes",
                }).then(async (result) => {
                    if (result && result.isConfirmed) await this.save();
                    this.onTransition(transition);
                });

                return;
            }
        }

        this.onTransition(transition);
    };

    onTransition = () => {}; // User-defined function
    updatePages = () => {}; // User-defined function
    beforeSave = () => {}; // User-defined function
    beforeTransition = () => {}; // User-defined function

    save = async (overrides, runBeforeSave = true) => {
        if (runBeforeSave) await this.beforeSave();
        save(this, overrides);
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

    mapSessions = (callback, data = this.info.globalState) => mapSessions(callback, data);

    async runConversions(conversionOptions = {}, toRun, options = {}) {
        let original = toRun;
        if (!Array.isArray(toRun)) toRun = this.mapSessions();

        // Filter the sessions to run
        if (typeof original === "number") toRun = randomizeElements(toRun, original); // Grab a random set of sessions
        else if (typeof original === "string") toRun = toRun.filter(({ subject }) => subject === original);
        else if (typeof original === "function") toRun = toRun.filter(original);

        const results = {};

        const popup = await openProgressSwal({ title: `Running conversion`, ...options });

        const isMultiple = toRun.length > 1;

        let elements = {};
        // if (isMultiple) {
        popup.hideLoading();
        const element = popup.getHtmlContainer();
        element.innerText = "";

        const progressBar = new ProgressBar();
        elements.progress = progressBar;
        element.append(progressBar);
        // }

        let completed = 0;
        elements.progress.value = { b: completed, tsize: toRun.length };

        for (let info of toRun) {
            const { subject, session, globalState = this.info.globalState } = info;
            const file = `sub-${subject}/sub-${subject}_ses-${session}.nwb`;

            const { conversion_output_folder, stub_output_folder, name } = globalState.project;

            // Resolve the correct session info from all of the metadata for this conversion
            const sessionInfo = {
                ...globalState.results[subject][session],
                metadata: resolveResults(subject, session, globalState),
            };

            const result = await runConversion(
                {
                    output_folder: conversionOptions.stub_test ? stub_output_folder : conversion_output_folder,
                    project_name: name,
                    nwbfile_path: file,
                    overwrite: true, // We assume override is true because the native NWB file dialog will not allow the user to select an existing file (unless they approve the overwrite)
                    ...sessionInfo, // source_data and metadata are passed in here
                    ...conversionOptions, // Any additional conversion options override the defaults

                    interfaces: globalState.interfaces,
                },
                { swal: popup, ...options }
            ).catch((e) => {
                this.notify(e.message, "error");
                popup.close();
                throw e;
            });

            completed++;
            if (isMultiple) {
                const progressInfo = { b: completed, bsize: 1, tsize: toRun.length };
                elements.progress.value = progressInfo;
            }

            const subRef = results[subject] ?? (results[subject] = {})
            subRef[session] = result
        }

        popup.close();

        return results;
    }

    //   NOTE: Until the shadow DOM is supported in Storybook, we can't use this render function how we'd intend to.
    addPage = (id, subpage) => {
        if (!this.info.pages) this.info.pages = {};
        this.info.pages[id] = subpage;
        this.updatePages();
    };

    unsavedUpdates = false; // Track unsaved updates

    // NOTE: Make sure you call this explicitly if a child class overwrites this AND data is updated
    updated() {
        this.unsavedUpdates = false;
    }

    render() {
        return html`<slot></slot>`;
    }
}

customElements.get("nwbguide-page") || customElements.define("nwbguide-page", Page);
