import { JSONSchemaForm } from "../../../JSONSchemaForm.js";

import { ManagedPage } from "./ManagedPage.js";

import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";

import { html } from "lit";

import { run } from "../options/utils.js";
import { getStubArray } from "../options/GuidedStubPreview";
import { until } from "lit/directives/until.js";

export class GuidedBackendConfigurationPage extends ManagedPage {
    constructor(...args) {
        super(...args);
        this.style.height = "100%"; // Fix main section
    }

    beforeSave = () => {
        merge(this.localState.results, this.info.globalState.results);
    };

    form;


    header = {
        subtitle: "Configure your backend",
    };

    workflow = {
        locate_data: {
            skip: true
        }
    }

    footer = {
        onNext: async () => {
            await this.save(); // Save in case the conversion fails
            for (let { form } of this.forms) await form.validate(); // Will throw an error in the callback
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

    render() {

        this.#updateRendered(true);

        const { stubs } = this.info.globalState.preview;
        const stubArray = getStubArray(stubs);

        const nwbfile_path = stubArray[0].file;
        const promise = run('configuration', {
            nwbfile_path,
            backend: "hdf5"
        })
            .then((backendOptions) => {
                return (this.form = new JSONSchemaForm({
                    schema: {},
                    results: {},
                    globals: backendOptions,
                    onUpdate: () => (this.unsavedUpdates = true),
                    onThrow,
                    validateOnChange: validate,
                }));
            })
            .catch((error) => html`<p>${error}</p>`);

        const untilResult = until(promise, html`Loading form contents...`);

        promise.then(() => {
            this.#toggleRendered();
        });

        return untilResult
        
    }
}

customElements.get("nwbguide-guided-backend-configuration-page") ||
    customElements.define("nwbguide-guided-backend-configuration-page", GuidedBackendConfigurationPage);
