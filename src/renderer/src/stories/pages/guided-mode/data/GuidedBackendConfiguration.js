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
import { InspectorListItem } from "../../../preview/inspector/InspectorList.js";
import { JSONSchemaInput } from "../../../JSONSchemaInput.js";

const prod = (arr) => arr.reduce((accumulator, currentValue) => accumulator * currentValue, 1);

const getBackendConfigurations = (info, options = {}) => run(`configuration`, info, options);

const itemIgnore = {
    full_shape: true,
    compression_options: true,
    filter_options: true,
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
        merge(this.localState, this.info.globalState);
    };

    form;
    instances = [];
    #getForm = (sub, ses) => {
        const found = this.instances.find((o) => o.session === ses && o.subject === sub);
        return found?.instance instanceof JSONSchemaForm ? found.instance : null;
    };

    header = {};

    workflow = {

        // Ensure conversion is completed when skipped
        backend_configuration: {
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

            await this.convert(
                { preview: true },
                { title: "Running preview conversion on all sessions" }
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

    #bufferShapeDescription = (value, itemsize) =>
        `Expected RAM usage: ${(prod(value) * (itemsize / 1e9)).toFixed(2)} GB`;
    #chunkShapeDescription = (value, itemsize) =>
        `Disk space usage per chunk: ${(prod(value) * (itemsize / 1e6)).toFixed(2)} MB`;

    #itemsize = {};
    #getItemSize = (path) => get(path.slice(0, -1), this.#itemsize);

    #getDescription = (path, value) => {
        const name = path.slice(-1)[0];
        if (name === "buffer_shape") return this.#bufferShapeDescription(value, this.#getItemSize(path));
        if (name === "chunk_shape") return this.#chunkShapeDescription(value, this.#getItemSize(path));
        return;
    };

    renderInstance = ({ session, subject, info }) => {
        const { results, schema } = info;

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
                    if (!schema.required) schema.required = [];
                    schema.required.push(key)

                    // Set directly on last iteration
                    if (i === lenSplit - 1) {
                        const schema = (props[key] = { ...itemSchema });


                        if (!item.compression_options) item.compression_options = {}; // Set blank compression options to an empty object
                        if (!item.filter_methods) item.filter_methods = []
                        if (!item.filter_options) item.filter_options = []; // Set blank compression options to an empty object

                        results[key] = item;

                        const { chunk_shape, buffer_shape, full_shape } = item;

                        const chunkSchema = schema.properties.chunk_shape;
                        const bufferSchema = schema.properties.buffer_shape;

                        const { _itemsize = 0 } = item;
                        itemsize[key] = _itemsize;

                        const source_size_in_gb = (prod(item["full_shape"]) * _itemsize) / 1e9;

                        schema.description = `Full Shape: ${item["full_shape"]} | Source size: ${source_size_in_gb.toFixed(2)} GB`; // This is static
                        
                        // bufferSchema.items.max = chunk_shape // Only in increments of the chunk_shape
                        bufferSchema.maxItems = bufferSchema.minItems = buffer_shape.length;
                        bufferSchema.description = this.#bufferShapeDescription(
                            buffer_shape,
                            _itemsize
                        );

                        chunkSchema.maxItems = chunkSchema.minItems = chunk_shape.length;
                        // chunkSchema.items.max = full_shape // 1 - full_shape size
                        chunkSchema.description = this.#chunkShapeDescription(
                            chunk_shape,
                            _itemsize
                        );

                        delete item._itemsize; // Remove itemsize from the results

                        return;
                    }

                    // Otherwise drill into the results
                    else {
                        const thisSchema = props[key] ?? (props[key] = {});
                        if (!results[key]) results[key] = {};
                        if (!itemsize[key]) itemsize[key] = {};
                        return { schema: thisSchema, results: results[key], itemsize: itemsize[key] };
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
                    const updatedDescription = this.#getDescription(updatedPath, value);
                    this.unsavedUpdates = true;
                    console.log(updatedDescription);
                    if (updatedDescription) {
                        const input = instance.getFormElement(updatedPath);
                        input.description = "AHH"; // updatedDescription;
                        console.warn("UPDATED");
                    }
                },
                onThrow,
                // validateOnChange: validate,
            });
        }

        return { session, subject, instance };
    };

    getMissingBackendConfigurations = () => {

        const toRun = this.mapSessions(
            ({ session, subject }) => {
                const sesResult = this.info.globalState.results[subject][session].configuration;
                if (!sesResult) return { subject, session, skip: false };
                
                const backend = sesResult.backend ?? this.workflow.backend_type.value;

                return {
                    subject,
                    session,
                    skip: !!sesResult.results[backend],
                }
            }
        ).filter(({ skip }) => !skip);

        return this.runConversions(
            {},
            toRun, // All or specific session
            {
                title: "Getting backend options"
            },
            getBackendConfigurations
        );
    };

    #getManager = () => {

        const instances = {};

        this.instances = this.mapSessions(
            ({ subject, session, info }) => {
                  const backend = info.configuration.backend ?? this.workflow.backend_type.value // Use the default backend if none is set
                  return this.renderInstance({ subject, session, info: {
                      backend,
                      results: info.configuration.results[backend],
                      schema: this.info.globalState.schema.configuration[subject][session][backend], // Get the schema for the current session
                  }})
              },
        );

        this.instances.forEach(({ subject, session, instance }) => {
            if (!instances[`sub-${subject}`]) instances[`sub-${subject}`] = {};
            instances[`sub-${subject}`][`ses-${session}`] = instance;
        });

        const ogManager = this.manager;

        this.manager = new InstanceManager({
            header: "Sessions",
            instanceType: "Session",
            instances,
            controls: [
                (id) => {

                    const instanceInfo = id.split("/").reduce((acc, key) => acc[key.split('-').slice(1).join('-')], this.localState.results);
                    const backend = instanceInfo.configuration.backend ?? this.workflow.backend_type.value;


                    return new JSONSchemaInput({
                        path: [],
                        schema: {
                            type: "string",
                            placeholder: "Select backend type",
                            enum: Object.keys(backendMap),
                            enumLabels: backendMap
                        },
                        value: backend,
                        onUpdate: async (value) => {
                            if (instanceInfo.configuration.backend === value) return;
                            instanceInfo.configuration.backend = value; // Ensure new backend choice is persistent
                            await this.save();
                            await this.#update()
                        }
                    });
                },
            ],
        });

        if (ogManager) ogManager.replaceWith(this.manager);

        return this.manager;
    };

    #update = () => {

        return this.getMissingBackendConfigurations()
            .then((update) => {

                if (Object.keys(update)) {
                    this.mapSessions(({ subject, session, info }) => {

                        const { results, schema, backend } = info;

                        const sesResults = this.localState.results[subject][session]
                        if (!sesResults.configuration) sesResults.configuration = { results: {} };

                        sesResults.configuration.results[backend] = results // Set the configuration options for the current session

                        // Set the schema for the current session
                        const path = [ subject, session, backend ];
                        path.reduce((acc, key, i) => {
                            if (i === path.length - 1) acc[key] = schema
                            if (!acc[key]) acc[key] = {};
                            return acc[key];
                        }, this.localState.schema.configuration);
                        
                    }, update)
                

                    this.save(); // Save data as soon as it arrives from the server

                }

                return this.#getManager();

            })

            .catch(
                (error) => new InspectorListItem({
                    message: error.message.split(":")[1].slice(1),
                    type: "error",
                })
            );
    }

    render() {

        delete this.manager // Delete any existing manager

        this.#updateRendered(true);


        const globalSchemas = this.info.globalState.schema
        if (!globalSchemas.configuration) globalSchemas.configuration = {};

        this.localState = { 
            results: structuredClone(this.info.globalState.results), 
            schema: { configuration: structuredClone(globalSchemas.configuration) }, 
        };

        const promise = this.#update();

        const untilResult = until(promise, html`Loading form contents...`);
        promise.then(() => this.#toggleRendered());
        return untilResult;
    }
}

customElements.get("nwbguide-guided-backend-configuration-page") ||
    customElements.define("nwbguide-guided-backend-configuration-page", GuidedBackendConfigurationPage);
