import { html } from "lit";
import { Page } from "../Page.js";
import "./GuidedFooter";
import { InfoBox } from "../../InfoBox.js";
import { InspectorListItem } from "../../preview/inspector/InspectorList.js";

export class GuidedStartPage extends Page {
    constructor(...args) {
        super(...args);
    }

    updated() {
        // this.content = (this.shadowRoot ?? this).querySelector("#content");
        // Handle dropdown text
        const infoDropdowns = (this.shadowRoot ?? this).getElementsByClassName("guided--info-dropdown");
        for (const infoDropdown of Array.from(infoDropdowns)) {
            const infoTextElement = infoDropdown.querySelector(".guided--dropdown-text");

            // Auto-add icons if they're not there
            const dropdownType = infoTextElement.dataset.dropdownType;
            if (infoTextElement.previousSibling.tagName !== "I") {
                if (dropdownType === "info") {
                    //insert the info icon before the text
                    infoTextElement.insertAdjacentHTML("beforebegin", ` <i class="fas fa-info-circle"></i>`);
                }
                if (dropdownType === "warning") {
                    //insert the warning icon before the text
                    infoTextElement.insertAdjacentHTML("beforebegin", ` <i class="fas fa-exclamation-triangle"></i>`);
                }
            }

            infoDropdown.onclick = () => {
                const infoContainer = infoDropdown.nextElementSibling;
                const infoContainerChevron = infoDropdown.querySelector(".fa-chevron-right");

                const infoContainerIsopen = infoContainer.classList.contains("container-open");

                if (infoContainerIsopen) {
                    infoContainerChevron.style.transform = "rotate(0deg)";
                    infoContainer.classList.remove("container-open");
                } else {
                    infoContainerChevron.style.transform = "rotate(90deg)";
                    infoContainer.classList.add("container-open");
                }
            };
        }
    }

    render() {
        return html`
                <div class="guided--panel" style="flex-grow: 1">
                    <div class="title-border">
                        <h1 class="guided--text-sub-step">Designing a Conversion Pipeline: A Look Ahead</h1>
                    </div>
                    <div>
                        <br>
                        <p>
                           In the NWB GUIDE, the process of running a conversion pipeline is broken into four high-level sections.
                        <p>
                        <h4>1. Project Structure</h4>
                        <p>
                            The first section will direct you to specify the high-level structure of your conversion pipeline, including data formats and global metadata.
                        </p>
                        <h4>2. Data Review</h4>
                        <p>
                            The second section will have you provide your source data files and NWB File metadata on a per-subject basis to populate your files.
                        </p>
                        ${new InspectorListItem({
                            message: html`<b>Red boxes are error messages.</b> These will block your conversion progress
                                until resolved.`,
                            type: "error",
                        })}
                        ${new InspectorListItem({
                            message: html`<b>Yellow boxes are warnings.</b> Fixing them will align your NWB files with
                                best practices.`,
                            type: "warning",
                        })}
                        <h4>3. Conversion Preview</h4>
                        <p>
                            In the third section, you will preview your conversion before uploading to DANDI.
                        </p>
                        <h4>4. Final Review</h4>
                        <p>
                            Finally, you will upload your conversion to DANDI and review the resulting dandiset.
                        </p>

                        <br>
                        <h4>Additional Resources</h4>
                        <hr>
                        ${new InfoBox({
                            header: "Where can I learn more about the conversion process?",
                            content: html`
                                Although not required to use the GUIDE, you can learn more about the NWB conversion
                                process in the
                                <a href="https://neuroconv.readthedocs.io/en/main" target="_blank"
                                    >neuroconv documentation page</a
                                >
                            `,
                        })}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-start-page") ||
    customElements.define("nwbguide-guided-start-page", GuidedStartPage);
