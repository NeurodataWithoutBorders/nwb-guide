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

import { getResourceUsage } from '../../../../validation/backend-configuration'

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

    #bufferShapeDescription = (value, itemsize) => {
        return `Expected RAM usage: ${getResourceUsage(value, itemsize).toFixed(2)} GB`;
    }
    #chunkShapeDescription = (value, itemsize) => {
        return `Disk space usage per chunk: ${getResourceUsage(value, itemsize, 1e6).toFixed(2)} MB`;
    }

    #getItemSize = (path, itemsizes) => itemsizes[path.slice(0, -1).join("/")];

    #updateSchema(schema, parent, itemsize, properties=[ 'chunk_shape', 'buffer_shape' ]) {
        const { chunk_shape, buffer_shape, full_shape } = parent;

        const chunkSchema = schema.properties.chunk_shape;
        const bufferSchema = schema.properties.buffer_shape;

        const shapeMax = full_shape[0]
        
        if (properties.includes('chunk_shape')) {
            chunkSchema.items.min = bufferSchema.items.min = 1
            chunkSchema.maxItems = chunkSchema.minItems = chunk_shape.length;
            chunkSchema.items.max = shapeMax
            chunkSchema.description = this.#chunkShapeDescription(
                chunk_shape,
                itemsize
            );

        }

        if (properties.includes('buffer_shape')) {

            bufferSchema.items.max = shapeMax
            bufferSchema.items.step = chunk_shape[0] // Constrain to increments of chunk size
            bufferSchema.strict = true

            bufferSchema.maxItems = bufferSchema.minItems = buffer_shape.length;
            bufferSchema.description = this.#bufferShapeDescription(
                buffer_shape,
                itemsize
            );
        }
    }

    renderInstance = (info) => {
        const { session, subject, info: configuration } = info;
        const { results, schema, itemsizes } = configuration;

        let instance;
        if (Object.keys(results).length === 0) {
            instance = document.createElement("span");
            instance.innerText = "No configuration options available for this session";
        } else {
            const itemSchema = getSchema();

            const schema = { type: "object", properties: {} };

            const reorganized = Object.entries(results).reduce((acc, [name, item]) => {
                const splitName = name.split("/");

                const itemsize = itemsizes[name];

                const resolved = { schema, results: acc };

                const lenSplit = splitName.length;
                splitName.reduce((acc, key, i) => {
                    const { schema, results } = acc;

                    const props = schema.properties ?? (schema.properties = {});
                    if (!schema.required) schema.required = [];
                    schema.required.push(key)

                    // Set directly on last iteration
                    if (i === lenSplit - 1) {
                        const schema = (props[key] = structuredClone(itemSchema));


                        if (!item.compression_options) item.compression_options = {}; // Set blank compression options to an empty object
                        
                        if (props.filter_methods && !item.filter_methods) item.filter_methods = []
                        if (props.filter_options && !item.filter_options) item.filter_options = []; // Set blank compression options to an empty object

                        results[key] = item;

                        const { full_shape } = item;

                        schema.description = `Full Shape: ${full_shape} | Source size: ${getResourceUsage(full_shape, itemsize).toFixed(2)} GB`; // This is static
                        
                        this.#updateSchema(schema, item, itemsize)
                       

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
                onUpdate: ( updatedPath ) => {

                    this.unsavedUpdates = true;

                    const parentPath = updatedPath.slice(0, -1);
                    const form = instance.getFormElement(parentPath);
                    const name = updatedPath.slice(-1)[0];

                    // Update used schema
                    const schema = form.schema;
                    this.#updateSchema(schema, form.results, itemsizes[parentPath.join("/")])

                    // Update rendered description
                    const input = form.inputs[name];
                    input.description = schema.properties[name].description;

                    // Buffer shape depends on chunk shape
                    if (name === 'chunk_shape') form.inputs['buffer_shape'].schema = { ...form.inputs['buffer_shape'].schema } // Force schema update
                },
                onThrow,
                validateOnChange: (name, parent, path, value) => {
                    if (name === 'chunk_shape') {
                        if (getResourceUsage(value, itemsizes[path.join("/")], 1e6) > 20) return [
                            {
                                message: "Recommended maximum chunk size is 20MB. Please reduce the size of the chunks.",
                                type: "warning"
                            }
                        ]
                    }
                },
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
        )
        .filter(({ skip }) => !skip);

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
                      results: info.configuration.results[backend], // Get the configuration options for the current session
                      itemsizes: info.configuration.itemsizes[backend], // Get the item sizes for the current session
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
                            enumLabels: backendMap,
                            strict: true
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

                        const { results, schema, backend, itemsizes } = info;

                        const sesResults = this.localState.results[subject][session]
                        if (!sesResults.configuration) sesResults.configuration = {};
                        if (!sesResults.configuration.results) sesResults.configuration.results = {};
                        if (!sesResults.configuration.itemsizes) sesResults.configuration.itemsizes = {};

                        sesResults.configuration.itemsizes[backend] = itemsizes // Set the item sizes for the current session
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
                (error) => {
                    const split = error.message.split(":")
                    console.error(error)
                    return new InspectorListItem({
                        message: split.length > 1 ? error.message.split(":")[1].slice(1) : error.message,
                        type: "error",
                    })
                }
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
