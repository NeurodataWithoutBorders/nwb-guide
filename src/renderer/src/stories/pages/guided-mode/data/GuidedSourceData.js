import Swal from "sweetalert2";
import { isStorybook } from "../../../../dependencies/globals.js";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { InstanceManager } from "../../../InstanceManager.js";
import { ManagedPage } from "./ManagedPage.js";
import { onThrow } from "../../../../errors";
import { merge, sanitize } from "../../utils.js";
import preprocessSourceDataSchema from "../../../../../../../schemas/source-data.schema";

import { createGlobalFormModal } from "../../../forms/GlobalFormModal";
import { header } from "../../../forms/utils";
import { Button } from "../../../Button.js";

import globalIcon from "../../../assets/global.svg?raw";

import { baseUrl } from "../../../../server/globals";

import { run } from "../options/utils.js";
import { getInfoFromId } from "./utils.js";
import { Modal } from "../../../Modal";
import { TimeAlignment } from "./alignment/TimeAlignment.js";

const propsToIgnore = {
    "*": {
        verbose: true,
        es_key: true,
        exclude_shanks: true,
        load_sync_channel: true,
        stream_id: true, // NOTE: May be desired for other interfaces
        nsx_override: true,
        combined: true,
        plane_no: true,
    },
};

export class GuidedSourceDataPage extends ManagedPage {
    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
    }

    beforeSave = () => {
        merge(this.localState, this.info.globalState);
    };

    #globalButton = new Button({
        icon: globalIcon,
        label: "Edit Global Source Data",
        onClick: () => {
            this.#globalModal.form.results = structuredClone(this.info.globalState.project.SourceData ?? {});
            this.#globalModal.open = true;
        },
    });

    header = {
        controls: [this.#globalButton],
        subtitle:
            "Specify the file and folder locations on your local system for each interface, as well as any additional details that might be required.",
    };

    workflow = {
        multiple_sessions: {
            elements: [this.#globalButton],
        },
    };

    footer = {
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            for (let { form } of this.forms) await form.validate(); // Will throw an error in the callback

            // const previousResults = this.info.globalState.metadata.results

            let stillFireSwal = true;
            const fireSwal = () => {
                Swal.fire({
                    title: "Getting metadata for source data",
                    html: "Please wait...",
                    allowEscapeKey: false,
                    allowOutsideClick: false,
                    heightAuto: false,
                    backdrop: "rgba(0,0,0, 0.4)",
                    timerProgressBar: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                });
            };

            setTimeout(() => {
                if (stillFireSwal) fireSwal();
            });

            await Promise.all(
                Object.values(this.forms).map(async ({ subject, session, form }) => {
                    const info = this.info.globalState.results[subject][session];

                    // NOTE: This clears all user-defined results
                    const result = await fetch(`${baseUrl}/neuroconv/metadata`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            source_data: sanitize(structuredClone(form.resolved)), // Use resolved values, including global source data
                            interfaces: this.info.globalState.interfaces,
                        }),
                    })
                        .then((res) => res.json())
                        .catch((error) => {
                            Swal.close();
                            stillFireSwal = false;
                            this.notify(`<b>Critical Error:</b> ${error.message}`, "error", 4000);
                            throw error;
                        });

                    Swal.close();

                    if (isStorybook) return;

                    if (result.message) {
                        const [type, ...splitText] = result.message.split(":");
                        const text = splitText.length
                            ? splitText.join(":").replaceAll("<", "&lt").replaceAll(">", "&gt")
                            : result.traceback
                              ? `<small><pre>${result.traceback.trim().split("\n").slice(-2)[0].trim()}</pre></small>`
                              : "";

                        const message = `<h4 style="margin: 0;">Request Failed</h4><small>${type}</small><p>${text}</p>`;
                        this.notify(message, "error");
                        throw result;
                    }

                    const { results: metadata, schema } = result;

                    // Always delete Ecephys if absent ( NOTE: temporarily manually removing from schema on backend...)
                    const alwaysDelete = ["Ecephys"];
                    alwaysDelete.forEach((k) => {
                        if (!metadata[k]) delete info.metadata[k]; // Delete directly on metadata
                    });

                    for (let key in info.metadata) {
                        if (!alwaysDelete.includes(key) && !(key in schema.properties)) metadata[key] = undefined;
                    }

                    // Merge metadata results with the generated info
                    merge(metadata, info.metadata);

                    // Mirror structure with metadata schema
                    const schemaGlobal = this.info.globalState.schema;
                    if (!schemaGlobal.metadata) schemaGlobal.metadata = {};
                    if (!schemaGlobal.metadata[subject]) schemaGlobal.metadata[subject] = {};
                    schemaGlobal.metadata[subject][session] = schema;
                })
            );

            await this.save(undefined, false); // Just save new raw values

            return this.to(1);
        },
    };

    createForm = ({ subject, session, info }) => {
        const hasMultipleSessions = this.workflow.multiple_sessions.value;

        const instanceId = `sub-${subject}/ses-${session}`;

        const schema = this.info.globalState.schema.source_data;
        delete schema.description;

        const form = new JSONSchemaForm({
            identifier: instanceId,
            schema: preprocessSourceDataSchema(schema),
            results: info.source_data,
            emptyMessage: "No source data required for this session.",
            ignore: propsToIgnore,
            globals: hasMultipleSessions ? this.info.globalState.project.SourceData : undefined,
            onOverride: (name) => {
                this.notify(`<b>${header(name)}</b> has been overridden with a global value.`, "warning", 3000);
            },
            // onlyRequired: true,
            onUpdate: () => (this.unsavedUpdates = "conversions"),
            onStatusChange: (state) => this.manager.updateState(instanceId, state),
            onThrow,
        });

        form.style.height = "100%";

        return {
            subject,
            session,
            form,
        };
    };

    #globalModal = null;

    connectedCallback() {
        super.connectedCallback();

        const schema = structuredClone(this.info.globalState.schema.source_data);
        delete schema.description;

        const modal = (this.#globalModal = createGlobalFormModal.call(this, {
            header: "Global Source Data",
            propsToRemove: {
                "*": {
                    ...propsToIgnore["*"],
                    folder_path: true,
                    file_path: true,
                    // NOTE: Still keeping plural path specifications for now
                },
            },
            key: "SourceData",
            schema,
            hasInstances: true,
        }));
        document.body.append(modal);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#globalModal) this.#globalModal.remove();
    }

    updated() {
        const dashboard = document.querySelector("nwb-dashboard");
        const page = dashboard.page;
    }

    render() {
        this.localState = { results: structuredClone(this.info.globalState.results ?? {}) };

        this.forms = this.mapSessions(this.createForm, this.localState.results);

        let instances = {};
        this.forms.forEach(({ subject, session, form }) => {
            if (!instances[`sub-${subject}`]) instances[`sub-${subject}`] = {};
            instances[`sub-${subject}`][`ses-${session}`] = form;
        });

        this.manager = new InstanceManager({
            header: "Sessions",
            // instanceType: 'Session',
            instances,
            controls: [
                {
                    name: "View Temporal Alignment",
                    primary: true,
                    onClick: async (id) => {
                        const { globalState } = this.info;

                        const { subject, session } = getInfoFromId(id);

                        const header = document.createElement("div");
                        Object.assign(header.style, { paddingTop: "10px" });
                        const h2 = document.createElement("h3");
                        Object.assign(h2.style, { margin: "0px" });
                        const small = document.createElement("small");
                        small.innerText = `${subject}/${session}`;
                        h2.innerText = `Temporal Alignment`;

                        header.append(h2, small);

                        const modal = new Modal({ header });

                        document.body.append(modal);

                        let alignment;

                        modal.footer = new Button({
                            label: "Update",
                            primary: true,
                            onClick: async () => {
                                console.log("Submit to backend");

                                if (alignment) {
                                    globalState.project.alignment = alignment.results;
                                    await this.save();
                                }

                                const sourceCopy = structuredClone(globalState.results[subject][session].source_data);

                                const alignmentInfo =
                                    globalState.project.alignment ?? (globalState.project.alignment = {});

                                const sessionInfo = {
                                    interfaces: globalState.interfaces,
                                    source_data: merge(globalState.project.SourceData, sourceCopy),
                                    alignment: alignmentInfo,
                                };

                                const data = await run("alignment", sessionInfo, {
                                    title: "Checking Alignment",
                                    message: "Please wait...",
                                });

                                alignment = new TimeAlignment({
                                    data,
                                    interfaces: globalState.interfaces,
                                    results: alignmentInfo,
                                });

                                modal.innerHTML = "";
                                modal.append(alignment);
                            },
                        });

                        modal.footer.onClick();

                        modal.open = true;
                    },
                },
            ],
            // onAdded: (path) => {

            //   let details = this.getDetails(path)

            //   const info = this.addSession(details)

            //   const form = this.createForm({
            //     ...details,
            //     info
            //   })

            //   this.forms.push(form)

            //   return {
            //     key: `sub-${details.subject}/ses-${details.session}`,
            //     value: form.form
            //   }
            // },
            // onRemoved: (_, path) => {
            //   let details = this.getDetails(path)
            //   this.removeSession(details)
            // }
        });

        return this.manager;
    }
}

customElements.get("nwbguide-guided-sourcedata-page") ||
    customElements.define("nwbguide-guided-sourcedata-page", GuidedSourceDataPage);
