import { LitElement, html } from "lit";
import { run } from "../../../utils/run";
import { get, save } from "../../progress/index.js";

import { dismissNotification, notify } from "../../notifications";
import { isStorybook } from "../../globals.js";

import { mapSessions, merge } from "../../../utils/data";
import { getRandomSample } from "../../../utils/random";

import { resolveMetadata } from "../../../utils/data";
import Swal from "sweetalert2";
import { createProgressPopup } from "../../../utils/popups";

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

    async convert({ preview, ...conversionOptions } = {}, options = {}) {
        const key = preview ? "preview" : "conversion";

        delete this.info.globalState[key]; // Clear the preview results

        if (preview) {
            if (!options.title) options.title = "Running preview conversion on all sessions...";

            const stubs = await this.runConversions({ stub_test: true, ...conversionOptions }, undefined, options);

            this.info.globalState[key] = { stubs };
        } else {
            if (!options.title) options.title = "Running all conversions";

            this.info.globalState[key] = await this.runConversions(conversionOptions, true, options);
        }

        this.unsavedUpdates = true;

        // Indicate conversion has run successfully
        let { desyncedData } = this.info.globalState;
        if (!desyncedData) desyncedData = this.info.globalState.desyncedData = {};
        desyncedData[key] = false;
        await this.save({}, false);
    }

    async runConversions(conversionOptions = {}, toRun, options = {}, backendFunctionToRun = null) {
        const hasCustomFunction = !!backendFunctionToRun;

        let original = toRun;
        if (!Array.isArray(toRun)) toRun = this.mapSessions();

        // Filter the sessions to run
        if (typeof original === "number")
            toRun = getRandomSample(toRun, original); // Grab a random set of sessions
        else if (typeof original === "string") toRun = toRun.filter(({ subject }) => subject === original);
        else if (typeof original === "function") toRun = toRun.filter(original);

        const conversionOutput = {};

        const swalOpts = hasCustomFunction
            ? options
            : await createProgressPopup({ title: `Running conversion`, ...options });

        const { close: closeProgressPopup } = swalOpts;

        const fileConfiguration = [];

        try {
            for (let info of toRun) {
                const { subject, session, globalState = this.info.globalState } = info;
                const file = `sub-${subject}/sub-${subject}_ses-${session}.nwb`;

                const { conversion_output_folder, name, SourceData, alignment } = globalState.project;

                const sessionResults = globalState.results[subject][session];

                const configurationCopy = { ...(sessionResults.configuration ?? {}) };

                const sourceDataCopy = structuredClone(sessionResults.source_data);

                if (!configurationCopy.backend) configurationCopy.backend = this.workflow.file_format.value;

                // Resolve the correct session info from all of the metadata for this conversion
                const sessionInfo = {
                    configuration: configurationCopy,
                    metadata: resolveMetadata(subject, session, globalState),
                    source_data: merge(SourceData, sourceDataCopy),
                };

                const optsCopy = structuredClone(conversionOptions);

                if (optsCopy.configuration === false) {
                    delete sessionInfo.configuration; // Skip backend configuration options if specified as such
                    delete optsCopy.backend;
                } else {
                    if (typeof optsCopy.configuration === "object") merge(optsCopy.configuration, configurationCopy);
                }

                delete optsCopy.configuration;

                const payload = {
                    output_folder: optsCopy.stub_test ? undefined : conversion_output_folder,
                    project_name: name,
                    nwbfile_path: file,
                    overwrite: true, // We assume override is true because the native NWB file dialog will not allow the user to select an existing file (unless they approve the overwrite)
                    ...sessionInfo, // source_data and metadata are passed in here
                    ...optsCopy, // Any additional conversion options override the defaults
                    interfaces: globalState.interfaces,
                    alignment,
                    timezone: this.workflow.timezone.value,
                };

                if (hasCustomFunction) {
                    const result = await backendFunctionToRun(payload, swalOpts); // Already handling Swal popup
                    const subRef = conversionOutput[subject] ?? (conversionOutput[subject] = {});
                    subRef[session] = result;
                } else fileConfiguration.push(payload);
            }

            if (fileConfiguration.length) {
                const results = await run(
                    `neuroconv/convert`,
                    {
                        files: fileConfiguration,
                        max_workers: 2, // TODO: Make this configurable and confirm default value
                        request_id: swalOpts.id,
                    },
                    {
                        title: "Running the conversion",
                        onError: () => "Conversion failed with current metadata. Please try again.",
                        ...swalOpts,
                    }
                ).catch(async (error) => {
                    let message = error.message;

                    if (message.includes("The user aborted a request.")) {
                        this.notify("Conversion was cancelled.", "warning");
                        throw error;
                    }

                    this.notify(message, "error");
                    throw error;
                });
                console.log("Conversion results:", results);

                results.forEach((info) => {
                    const { file } = info;
                    const fileName = file.eplace(/\\/g, "/").split("/").pop();
                    console.log("File name:", fileName);
                    const [subject, session] = fileName.match(/sub-(.+)_ses-(.+)\.nwb/).slice(1);
                    console.log("Subject:", subject, "Session:", session);
                    const subRef = conversionOutput[subject] ?? (conversionOutput[subject] = {});
                    subRef[session] = info;
                });
            }
        } finally {
            closeProgressPopup && (await closeProgressPopup());
        }

        return conversionOutput;
    }

    //   NOTE: Until the shadow DOM is supported in Storybook, we can't use this render function how we'd intend to.
    addPage = (id, subpage) => {
        if (!this.info.pages) this.info.pages = {};
        this.info.pages[id] = subpage;
        this.updatePages();
    };

    checkSyncState = async (info = this.info, sync = info.sync) => {
        if (!sync) return;
        if (isStorybook) return;

        const { desyncedData } = info.globalState;

        return Promise.all(
            sync.map((k) => {
                if (desyncedData?.[k] !== false) {
                    if (k === "conversion") return this.convert();
                    else if (k === "preview") return this.convert({ preview: true });
                }
            })
        );
    };

    updateSections = () => {
        const dashboard = document.querySelector("nwb-dashboard");
        dashboard.updateSections({ sidebar: true, header: true }, this.info.globalState);
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
