import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";

export class GuidedConversionOptionsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {
        next: "Run Conversion Preview",
        onNext: async () => {
            this.save(); // Save in case the conversion fails
            await this.form.validate(); // Will throw an error in the callback

            // Preview a random conversion
            delete this.info.globalState.preview; // Clear the preview results
            const results = await this.runConversions({ stub_test: true }, 1, {
                title: "Testing conversion on a random session",
            });
            this.info.globalState.preview = results; // Save the preview results

            this.onTransition(1);
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
        });

        return html`
            <div id="guided-mode-starting-container" class="guided--main-tab">
                <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
                    <div class="title">
                        <h1 class="guided--text-sub-step">Conversion Details</h1>
                    </div>
                    <div class="guided--section">${this.form}</div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-conversion-options-page") ||
    customElements.define("nwbguide-guided-conversion-options-page", GuidedConversionOptionsPage);
