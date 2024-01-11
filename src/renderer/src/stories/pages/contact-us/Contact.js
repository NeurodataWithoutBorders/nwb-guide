import { html } from "lit";
import { contact_lottie } from "../../../../assets/lotties/contact-us-lotties.js";
import { Page } from "../Page.js";

import { startLottie } from "../../../dependencies/globals.js";

export class ContactPage extends Page {
    header = {
        title: "Contact Us",
        subtitle: "Let us know your issues and feature requests.",
    };

    constructor(...args) {
        super(...args);
    }

    updated() {
        let contact_lottie_container = (this.shadowRoot ?? this).querySelector("#contact-us-lottie");
        startLottie(contact_lottie_container, contact_lottie);
    }

    render() {
        return html`
            <div class="documentation_container">
                <div class="document_container">
                    <div class="doc_container">
                        <div class="dc_con">
                            <div class="document-content">
                                <div id="contact-us-lottie" class="documentation-lottie_style"></div>
                            </div>
                            <div class="docu-content-container">
                                <h2 class="document_text">
                                    If you encounter any issues or have requests for new features, please create a new
                                    <a
                                        target="_blank"
                                        href="https://github.com/NeurodataWithoutBorders/nwb-guide/issues/new/choose"
                                        >ticket on our GitHub page</a
                                    >.
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-contact-page") || customElements.define("nwbguide-contact-page", ContactPage);
