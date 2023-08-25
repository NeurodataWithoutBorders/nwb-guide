import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { onThrow } from "../../../../errors";

export class GuidedConversionOptionsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {
        next: "Run Conversion Preview",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails
            await this.form.validate(); // Will throw an error in the callback

            // Preview a random conversion
            delete this.info.globalState.stubs; // Clear the preview results
            const results = await this.runConversions({ stub_test: true }, 1, {
                title: "Testing conversion on a random session",
            });
            this.info.globalState.stubs = results; // Save the preview results

            this.to(1);
        },
    };

    render() {
        const schema = {
            properties: {
                output_folder: {
                    type: "string",
                    format: "directory",
                },
            },
            required: ["output_folder"],
        };

        let conversionGlobalState = this.info.globalState.conversion;
        if (!conversionGlobalState) {
            conversionGlobalState = this.info.globalState.conversion = { info: {}, results: null };
        }

        this.form = new JSONSchemaForm({
            schema,
            results: conversionGlobalState.info,
            dialogType: "showOpenDialog",
            dialogOptions: {
                properties: ["openDirectory", "createDirectory"],
            },
            onUpdate: () => (this.unsavedUpdates = true),
            onThrow,
        });

        return html` ${this.form} `;
    }
}

customElements.get("nwbguide-guided-conversion-options-page") ||
    customElements.define("nwbguide-guided-conversion-options-page", GuidedConversionOptionsPage);
