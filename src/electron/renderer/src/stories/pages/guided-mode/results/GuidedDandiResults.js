import { html } from "lit";
import { Page } from "../../Page.js";

import { DandiResults } from "../../../DandiResults.js";

export class GuidedDandiResultsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {};

    workflow = {
        upload_to_dandi: {
            condition: (v) => v === false,
            skip: true,
        },
    };

    updated() {
        this.save(); // Save the current state
    }

    render() {
        const { conversion } = this.info.globalState;

        if (!conversion)
            return html`<div style="text-align: center;"><p>Your conversion failed. Please try again.</p></div>`;

        const { info = {}, results } = this.info.globalState.upload ?? {};
        const { dandiset } = info;

        return html`<div style="padding: 10px 20px;">
            ${new DandiResults({
                id: dandiset,
                files: {
                    subject: results.map((file) => {
                        return { file };
                    }),
                },
            })}
        </div>`;
    }
}

customElements.get("nwbguide-guided-dandi-results-page") ||
    customElements.define("nwbguide-guided-dandi-results-page", GuidedDandiResultsPage);
