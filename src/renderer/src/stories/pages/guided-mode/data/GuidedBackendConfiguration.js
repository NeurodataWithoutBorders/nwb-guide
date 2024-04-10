import { JSONSchemaForm, get } from "../../../JSONSchemaForm.js";

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
import { JSONSchemaInput } from "../../../JSONSchemaInput.js";

const prod = (arr) => arr.reduce((accumulator, currentValue) => accumulator * currentValue, 1);

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

            await this.convert({ 
                preview: true,
                backend: this.workflow.backend_type.value
            }, { title: "Running preview conversion on all sessions" }); // Validate by trying to set backend configuration with the latest values

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

    #bufferShapeDescription = (value, itemsize) => `Expected RAM usage: ${(prod(value) * (itemsize / 1e9)).toFixed(2)} GB`
    #chunkShapeDescription = (value, itemsize) => `Disk space usage per chunk: ${(prod(value) * (itemsize / 1e6)).toFixed(2)} MB`

    #itemsize = {}
    #getItemSize = (path) => get(path.slice(0, -1), this.#itemsize)

    #getDescription = (path, value) => {
        const name = path.slice(-1)[0];
        if (name === 'buffer_shape') return this.#bufferShapeDescription(value, this.#getItemSize(path))
        if (name === 'chunk_shape') return this.#chunkShapeDescription(value, this.#getItemSize(path))
        return
    }

    renderInstance = ({ session, subject, info }) => {

        const { results, schema } = info
        
        this.localState.results[subject][session].configuration = info;

        let instance;
        if (Object.keys(results).length === 0) {
            instance = document.createElement("span");
            instance.innerText = "No configuration options available for this session";
        } else {
            const itemSchema = getSchema();

            const schema = { type: "object", properties: {} };

            const reorganized = Object.entries(results).reduce((acc, [name, item]) => {
                const splitName = name.split("/");

                const resolved = { schema, results: acc, itemsize: this.#itemsize };

                const lenSplit = splitName.length;
                splitName.reduce((acc, key, i) => {
                    const { schema, results, itemsize } = acc;

                    const props = schema.properties ?? (schema.properties = {});

                    // Set directly on last iteration
                    if (i === lenSplit - 1) {
                        const schema = (props[key] = { ...itemSchema });

                        if (item.compression_options == null) item.compression_options = {}; // Set blank compression options to an empty object
                        results[key] = item;

                        const { _itemsize = 0 } = item;
                        itemsize[key] = _itemsize;

                        const source_size_in_gb = prod(item["full_shape"]) * _itemsize / 1e9;

                        schema.description = `Full Shape: ${item["full_shape"]} | Source size: ${source_size_in_gb.toFixed(2)} GB`; // This is static
                        schema.properties.buffer_shape.description = this.#bufferShapeDescription(item["buffer_shape"], _itemsize)
                        schema.properties.chunk_shape.description = this.#chunkShapeDescription(item["chunk_shape"], _itemsize)

                        delete item._itemsize; // Remove itemsize from the results

                        return;
                    }

                    // Otherwise drill into the results
                    else {
                        const thisSchema = props[key] ?? (props[key] = {});
                        if (!results[key]) results[key] = {};
                        if (!itemsize[key]) itemsize[key] = {};
                        return { schema: thisSchema, results: results[key], itemsize: itemsize[key]};
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
                onUpdate: (updatedPath, value) => {
                    const updatedDescription = this.#getDescription(updatedPath, value)
                    this.unsavedUpdates = true;
                    console.log(updatedDescription)
                    if (updatedDescription) {
                        const input = instance.getFormElement(updatedPath);
                        input.description = 'AHH' // updatedDescription;
                        console.warn('UPDATED')
                    }
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
                          this.renderInstance({ subject, session, info: info }),
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
                    ( id ) => {
                        const instance = id.split('/').reduce((acc, key) => acc[key], instances);
                        console.log(instance)
                        return new JSONSchemaInput({
                            path: [],
                            schema: {
                                type: "string",
                                placeholder: "Select backend type",
                                enum: Object.keys(backendMap),
                                enumLabels: backendMap,
                            },
                            value: backend,
                        })
                    }
                ],
            });


            console.log(this.manager )
            return this.manager;
        };

        const hasAll = this.mapSessions(
            ({ session, subject }) => !!this.info.globalState.results[subject][session].configuration
        );

        const sameBackend = this.info.globalState.project.backend === backend;

        if (hasAll.every((v) => v === true) && sameBackend) return renderInstances();

        const promise = this.getBackendConfiguration()
            .then((configurationInfo) => {
                this.info.globalState.project.backend = backend; // Track current backend type
                return renderInstances(configurationInfo)
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
