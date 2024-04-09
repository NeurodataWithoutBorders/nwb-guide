import { JSONSchemaForm } from "../../../JSONSchemaForm.js";

import { ManagedPage } from "./ManagedPage.js";

import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";

import { html } from "lit";

import { run } from "../options/utils.js";
import { until } from "lit/directives/until.js";

import { resolve } from "../../../../promises";
import { InstanceManager } from "../../../InstanceManager.js";
import { getSchema } from "../../../../../../../schemas/backend-configuration.schema";
import { getInfoFromId } from "./utils.js";
import { InspectorListItem } from "../../../preview/inspector/InspectorList.js";

const getBackendConfigurations = (info, options = {}) => run(`configuration`, info, options);

const itemIgnore = {
    full_shape: true,
    compression_options: true,
};

const backendMap = {
    zarr: "Zarr",
    hdf5: "HDF5",
};

export class GuidedBackendConfigurationPage extends ManagedPage {
    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
    }

    beforeSave = () => {
        merge(this.localState.results, this.info.globalState.results);
    };

    form;
    instances = [];
    #getForm = (sub, ses) => {
        const found = this.instances.find((o) => o.session === ses && o.subject === sub);
        return found?.instance instanceof JSONSchemaForm ? found.instance : null;
    };

    #subtitle = document.createElement("span");

    header = {
        subtitle: this.#subtitle,
    };

    workflow = {
        backend_configuration: {
            // Ensure conversion is completed with skip
            skip: async () => {
                await this.convert({
                    preview: true,
                    configuration: false,
                });
            },
        },
        backend_type: {},
    };

    footer = {
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            for (let { instance } of this.instances) {
                if (instance instanceof JSONSchemaForm) await instance.validate(); // Will throw an error in the callback
            }

            const title = document.createElement("div");
            const header = document.createElement("h4");
            header.innerText = "Running preview conversion on all sessions";
            Object.assign(header.style, { margin: 0 });

            const small = document.createElement("small");
            small.innerText = "Includes the latest configuration options";

            title.append(header, small);

            await this.convert(
                {
                    preview: true,
                    backend: this.workflow.backend_type.value,
                },
                { title }
            ); // Validate by trying to set backend configuration with the latest values

            return this.to(1);
        },
    };

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

    async updated() {
        await this.rendered;
    }

    renderInstance = ({ session, subject, info }) => {
        this.localState.results[subject][session].configuration = info;

        let instance;
        if (Object.keys(info).length === 0) {
            instance = document.createElement("span");
            instance.innerText = "No configuration options available for this session";
        } else {
            const itemSchema = getSchema();

            const schema = { type: "object", properties: {} };

            const reorganized = Object.entries(info).reduce((acc, [name, item]) => {
                const splitName = name.split("/");

                const resolved = { schema, results: acc };

                const lenSplit = splitName.length;
                splitName.reduce((acc, key, i) => {
                    const { schema, results } = acc;

                    const props = schema.properties ?? (schema.properties = {});

                    // Set directly on last iteration
                    if (i === lenSplit - 1) {
                        const schema = (props[key] = { ...itemSchema });

                        if (item.compression_options == null) item.compression_options = {}; // Set blank compression options to an empty object
                        results[key] = item;

                        const { _metadata = {} } = item;
                        const {
                            source_size_in_gb = 0,
                            maximum_ram_usage_per_iteration_in_gb = 0,
                            disk_space_usage_per_chunk_in_mb = 0,
                        } = _metadata;

                        schema.description = `Source size: ${source_size_in_gb.toFixed(2)} GB`;
                        schema.properties.buffer_shape.description = `Expected RAM usage: ${maximum_ram_usage_per_iteration_in_gb.toFixed(2)} GB`;
                        schema.properties.chunk_shape.description = `Disk space usage per chunk: ${disk_space_usage_per_chunk_in_mb.toFixed(2)} MB`;

                        delete item._metadata;

                        return;
                    }

                    // Otherwise drill into the results
                    else {
                        const thisSchema = props[key] ?? (props[key] = {});
                        if (!results[key]) results[key] = {};
                        return { schema: thisSchema, results: results[key] };
                    }
                }, resolved);

                return acc;
            }, {});

            const existingForm = this.#getForm(subject, session);
            if (existingForm) {
                existingForm.results = reorganized; // Update resolved values
                return { session, subject, instance: existingForm };
            }

            instance = new JSONSchemaForm({
                schema,
                results: reorganized,
                ignore: {
                    "*": itemIgnore,
                },
                onUpdate: (updatedPath) => {
                    console.log(updatedPath);
                    this.unsavedUpdates = true;
                },
                onThrow,
                // validateOnChange: validate,
            });
        }

        return { session, subject, instance };
    };

    getBackendConfiguration = (config = true, opts = {}) => {
        if (!opts.title && config === true) opts.title = "Getting backend options for all sessions";

        return this.runConversions(
            {
                backend: this.workflow.backend_type.value,
            },
            config, // All or specific session
            opts,
            getBackendConfigurations
        );
    };

    #needsUpdate = {};

    render() {
        const backend = this.workflow.backend_type.value;
        this.#subtitle.innerText = `Configured for ${backendMap[backend]}`;

        this.#needsUpdate = {};
        this.#updateRendered(true);

        this.localState = { results: structuredClone(this.info.globalState.results ?? {}) };

        const renderInstances = (toIterate) => {
            const instances = {};
            this.instances = toIterate
                ? this.mapSessions(this.renderInstance, toIterate)
                : this.mapSessions(
                      ({ subject, session, info }) =>
                          this.renderInstance({ subject, session, info: info.configuration }),
                      toIterate
                  );

            this.instances.forEach(({ subject, session, instance }) => {
                if (!instances[`sub-${subject}`]) instances[`sub-${subject}`] = {};
                instances[`sub-${subject}`][`ses-${session}`] = instance;
            });

            this.manager = new InstanceManager({
                header: "Sessions",
                instanceType: "Session",
                instances,
                controls: [
                    {
                        name: "Update",
                        primary: true,
                        onClick: async (key) => {
                            const { subject, session } = getInfoFromId(key);

                            const existingForm = this.#getForm(subject, session);
                            await existingForm.validate();

                            const merged = merge(this.localState, structuredClone(this.info.globalState));

                            const results = await this.getBackendConfiguration(
                                [
                                    {
                                        subject,
                                        session,
                                        globalState: merged,
                                    },
                                ],
                                {
                                    title: `Configuring backend for ${key}`,
                                }
                            ).catch(() => {});

                            if (!results) return;

                            // Update existing instance
                            this.renderInstance({ subject, session, info: results[subject][session] });

                            await this.save(); // Save if properly returned
                        },
                    },
                ],
            });

            return this.manager;
        };

        const hasAll = this.mapSessions(
            ({ session, subject }) => !!this.info.globalState.results[subject][session].configuration
        );

        const sameBackend = this.info.globalState.project.backend === backend;

        if (hasAll.every((v) => v === true) && sameBackend) return renderInstances();

        const promise = this.getBackendConfiguration()
            .then((backendOptions) => {
                this.info.globalState.project.backend = backend; // Track current backend type
                console.log(backendOptions);
                return renderInstances(backendOptions);
            })
            .catch(
                (error) => html`
                    <h4>Configuration failed for ${backendMap[backend]} file backend</h4>
                    ${new InspectorListItem({
                        message: error.message.split(":")[1].slice(1),
                        type: "error",
                    })}
                    <p>You may want to change to another filetype.</p>
                `
            );

        const untilResult = until(promise, html`Loading form contents...`);

        promise.then(() => {
            this.#toggleRendered();
        });

        return untilResult;
    }
}

customElements.get("nwbguide-guided-backend-configuration-page") ||
    customElements.define("nwbguide-guided-backend-configuration-page", GuidedBackendConfigurationPage);
