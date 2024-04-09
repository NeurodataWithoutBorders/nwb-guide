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

const getBackendConfigurations = (info, options = {}) => run(`configuration`, info, options);

const itemIgnore = {
    full_shape: true,
    compression_options: true
}

export class GuidedBackendConfigurationPage extends ManagedPage {
    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
    }

    beforeSave = () => {
        merge(this.localState.results, this.info.globalState.results);
    };

    form;
    instances = []
    #getForm = (sub, ses) => {
        const found = this.instances.find(o => o.session === ses && o.subject === sub )
        return found?.instance instanceof JSONSchemaForm ? found.instance : null
    }

    header = {
        subtitle: "Configure your backend",
    };

    workflow = {
        backend_configuration: {
            skip: {
                condition: (v) => v === false,
                skip: true,
            },
        },
    };

    footer = {
        onNext: async () => {
            await this.save(); // Save in case the conversion fails
            for (let { instance } of this.instances) {
                if (instance instanceof JSONSchemaForm) await instance.validate(); // Will throw an error in the callback
            }

            // NOTE: Eventually you'll want to swap this to a full stub conversion with these options (which will fail the same...)
            await this.getBackendConfiguration(true, { title: "Validating backend options..." }) // Validate by trying to set backend configuration with the latest values

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

        this.localState.results[subject][session].configuration = info

        let instance;
        if (Object.keys(info).length === 0) {
            instance = document.createElement("span");
            instance.innerText = "No configuration options available for this session";
        }

        else {
    
            const itemSchema = getSchema()

            const schema = { type: 'object', properties: {} }

            const reorganized = Object.entries(info).reduce((acc, [ name, item ]) => {

                const splitName = name.split('/')

                const resolved = { schema, results: acc }

                const lenSplit = splitName.length
                splitName.reduce((acc, key, i) => {

                        const { schema, results } = acc

                        const props = schema.properties ?? (schema.properties = {})

                        // Set directly on last iteration
                        if (i === (lenSplit - 1)) {
                            props[key] = {...itemSchema}
                            if (item.compression_options == null) item.compression_options = {} // Set blank compression options to an empty object
                            results[key] = item
                            return
                        }

                        // Otherwise drill into the results
                        else {
                            const thisSchema = props[key] ?? (props[key] = {})
                            if (!results[key]) results[key] = {}
                            return { schema: thisSchema, results: results[key] }
                        }

                }, resolved)

                return acc

            }, {})

            const existingForm = this.#getForm(subject, session)
            if (existingForm) {
                existingForm.results = reorganized // Update resolved values
                return { session, subject, instance: existingForm }
            }


            instance = new JSONSchemaForm({
                schema,
                results: reorganized,
                ignore: {
                    '*': itemIgnore
                },
                onUpdate: (updatedPath) => {
                    console.log(updatedPath)
                    this.unsavedUpdates = true
                },
                onThrow,
                // validateOnChange: validate,
            })
        }

        return { session, subject, instance };

    };

    getBackendConfiguration = (config = true, opts = {}) => {

        if (!opts.title && config === true) opts.title = "Getting backend options for all sessions" 


        return this.runConversions(
            {}, 
            config, // All or specific session
            opts, 
            getBackendConfigurations
        )
    }

    #needsUpdate = {}

    render() {

        this.#needsUpdate = {}
        this.#updateRendered(true);

        this.localState = { results: structuredClone(this.info.globalState.results ?? {}) };

        const renderInstances = (toIterate) => {

            const instances = {};
            this.instances = toIterate ? this.mapSessions(this.renderInstance, toIterate) :  this.mapSessions(({ subject, session, info }) => this.renderInstance({ subject, session, info: info.configuration }), toIterate);
            
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

                            const existingForm = this.#getForm(subject, session)
                            await existingForm.validate()

                            const merged = merge(this.localState, structuredClone(this.info.globalState))

                            const results = await this.getBackendConfiguration(                            [
                                {
                                    subject,
                                    session,
                                    globalState:merged,
                                },
                            ],
                            { 
                                title: `Configuring backend for ${key}`
                            }).catch(() => {})

    
                            if (!results) return;

                            // Update existing instance
                            this.renderInstance({ subject, session, info: results[subject][session] })

                            await this.save() // Save if properly returned
    
                        },
                    },
                ]        
            })

            return this.manager

        }


        const hasAll = this.mapSessions(({ session, subject}) => !!this.info.globalState.results[subject][session].configuration)
        if (hasAll.every((v) => v === true)) return renderInstances()


        const promise = this.getBackendConfiguration().then((backendOptions) =>  renderInstances(backendOptions)).catch((error) => html`<p>${error}</p>`);

        const untilResult = until(promise, html`Loading form contents...`);

        promise.then(() => {
            this.#toggleRendered();
        });

        return untilResult;
        
    }
}

customElements.get("nwbguide-guided-backend-configuration-page") ||
    customElements.define("nwbguide-guided-backend-configuration-page", GuidedBackendConfigurationPage);