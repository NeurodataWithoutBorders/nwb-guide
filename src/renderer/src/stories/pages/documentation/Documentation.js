import { html } from "lit";
import { docu_lottie } from "../../../../assets/lotties/documentation-lotties.js";
import { Page } from "../Page.js";

import { startLottie } from "../../../dependencies/globals.js";

import { Button } from "../../Button.js";

export class DocumentationPage extends Page {
    header = {
        title: "Documentation",
        subtitle: "Learn more about the GUIDE.",
    };

    constructor(...args) {
        super(...args);
    }

    updated() {
        let doc_lottie = (this ?? this.shadowRoot).querySelector("#documentation-lottie");

        startLottie(doc_lottie, docu_lottie);
    }

    render() {
        return html`
            <div class="documentation_container">
                <div class="document_container">
                    <div class="doc_container">
                        <div class="dc_con">
                            <div class="document-content">
                                <div id="documentation-lottie" class="documentation-lottie_style"></div>
                                ${new Button({
                                    label: "NWB GUIDE Documentation",
                                    onClick: () => {
                                        window.open("https://nwb-guide.readthedocs.io/en/latest/");
                                    },
                                })}
                            </div>
                            <div class="docu-content-container">
                                <h3 style="padding: 0; margin-top: 25px;">Additional Resources</h3>
                                <p>
                                    Conversion to NWB is powered by
                                    <a target="_blank" href="https://neuroconv.readthedocs.io/">NeuroConv</a>.
                                </p>
                                <p>
                                    Inspection of NWB files is powered by
                                    <a target="_blank" href="https://nwbinspector.readthedocs.io/">NWB Inspector</a>.
                                </p>
                                <p>
                                    <a target="_blank" href="https://github.com/flatironinstitute/neurosift"
                                        >Neurosift</a
                                    >
                                    is an interactive data visualization tool created by Jeremy Magland at the Flatiron
                                    Institute.
                                </p>
                                <p>
                                    For help on creating a Dandiset and uploading to DANDI, please see the
                                    <a target="_blank" href="https://www.dandiarchive.org/handbook/13_upload/"
                                        >DANDI Documentation</a
                                    >.
                                </p>
                                <p>
                                    To learn more about NWB, please see the
                                    <a target="_blank" href="https://nwb-overview.readthedocs.io/"
                                        >NWB Overview Documentation</a
                                    >.
                                </p>

                                <h3 style="padding: 0; margin-top: 25px;">Acknowledgments</h3>
                                <p>
                                    <small>
                                        NWB GUIDE is an open-source project developed by CatalystNeuro (Cody Baker,
                                        Garrett Flynn, Ben Dichter) and Lawrence Berkeley National Laboratory (Ryan Ly,
                                        Oliver Ruebel) and generously supported by
                                        <a target="_blank" href="https://www.kavlifoundation.org/"
                                            >The Kavli Foundation</a
                                        >.
                                    </small>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-documentation-page") ||
    customElements.define("nwbguide-documentation-page", DocumentationPage);