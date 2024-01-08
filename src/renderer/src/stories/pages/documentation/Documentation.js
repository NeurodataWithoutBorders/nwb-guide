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
        let doc_lottie = (this.shadowRoot ?? this).querySelector("#documentation-lottie");

        startLottie(doc_lottie, docu_lottie);
        const svg = doc_lottie.querySelector("svg");
        console.log(svg);
        svg.setAttribute("viewBox", "50 100 300 200");

        doc_lottie.style.marginBottom = "20px";

        const container = (this.shadowRoot ?? this).querySelector(".document-content");
        container.style.height = "200px";
    }

    render() {
        return html`
            <p>
                The NWB GUIDE walks users step-by-step through all the requirements for converting their data to the NWB
                format and uploading datasets to the DANDI Archive. Each stage is designed to conveniently guide users
                through the conversion process and include all necessary information such that no prior knowledge of the
                NWB data standard is required.
            </p>
  
            <div class="document-content">
                <div id="documentation-lottie" class="documentation-lottie_style"></div>
                ${new Button({
                    label: "NWB GUIDE Official Documentation",
                    onClick: () => {
                        window.open("https://nwb-guide.readthedocs.io/en/latest/");
                    },
                })}
            </div>

                <h3 style="padding: 0; margin-top: 25px;">Getting Started</h3>
                <h4 style="margin-top: 0;">Converting your data</h4>
                <p>Most users will want to start with the <a @click=${(ev) => {
                    ev.preventDefault();
                    this.to('tutorial')
                }}>Tutorial</a> to learn how to use the NWB GUIDE.</p>
                <p>If you'd like to jump right in, head to the <a @click=${(ev) => {
                    ev.preventDefault();
                    this.to('/')
                }}>Convert</a> page and click "Create a new conversion pipeline" to begin your own custom conversion.</p>

                <h4>Standalone Utilities</h4>
                <p>For users who are already familiar with the NWB format, the NWB GUIDE also provides standalone utilities for validating, exploring, and uploading existing NWB files.</p>

                <h5>Validating your data</h5>
                <p>Visit the <a @click=${(ev) => {
                    ev.preventDefault();
                    this.to('validate')
                }}>Validate</a> page to validate your NWB files against Best Practices.</p>

                <h5>Exploring your data</h5>
                <p>Visit the <a @click=${(ev) => {
                    ev.preventDefault();
                    this.to('explore')
                }}>Explore</a> page to explore your NWB files and view their contents using Neurosift.</p>

                <h5>Uploading your data</h5>
                <p>Visit the <a @click=${(ev) => {
                    ev.preventDefault();
                    this.to('dandiset')
                }}>Upload</a> page to create dandisets and share your files on the DANDI Archive</p>

            
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
                <br>
            </div>
        `;
    }
}

customElements.get("nwbguide-documentation-page") ||
    customElements.define("nwbguide-documentation-page", DocumentationPage);
