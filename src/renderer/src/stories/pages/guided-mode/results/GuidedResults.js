import { html } from "lit";
import { Page } from "../../Page.js";

export class GuidedResultsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {};

    updated() {
        this.save(); // Save the current state
    }

    render() {
        const { conversion } = this.info.globalState;

        if (!conversion)
            return html`<div style="text-align: center;"><p>Your conversion failed. Please try again.</p></div>`;

        return html`
            <p>Your data was successfully converted to NWB!</p>
            ${Object.entries(conversion)
                .map(([subject, sessions]) => {
                    return html` <h3 style="margin: 0; padding: 0;">sub-${subject}</h3>
                        <ol style="margin: 10px 0px; padding-top: 0;">
                            ${Object.entries(sessions).map(([session, info]) => {
                                return html`<li><b>ses-${session}</b> — ${info.file}</li>`;
                            })}
                        </ol>`;
                })
                .flat()}
        `;
    }
}

customElements.get("nwbguide-guided-results-page") ||
    customElements.define("nwbguide-guided-results-page", GuidedResultsPage);
