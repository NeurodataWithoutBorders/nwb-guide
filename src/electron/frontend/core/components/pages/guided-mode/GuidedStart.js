import { html } from "lit";
import { Page } from "../Page.js";
import "./GuidedFooter";
import { InfoBox } from "../../InfoBox.js";
import { InspectorListItem } from "../../preview/inspector/InspectorList.js";
import { sections } from "../globals";

export class GuidedStartPage extends Page {
  constructor(...args) {
    super(...args);
  }

  updated() {
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
    // Handle dropdown text
    const infoDropdowns = (this.shadowRoot ?? this).getElementsByClassName(
      "guided--info-dropdown",
    );
    for (const infoDropdown of Array.from(infoDropdowns)) {
      const infoTextElement = infoDropdown.querySelector(
        ".guided--dropdown-text",
      );

      // Auto-add icons if they're not there
      const dropdownType = infoTextElement.dataset.dropdownType;
      if (infoTextElement.previousSibling.tagName !== "I") {
        if (dropdownType === "info") {
          //insert the info icon before the text
          infoTextElement.insertAdjacentHTML(
            "beforebegin",
            ` <i class="fas fa-info-circle"></i>`,
          );
        }
        if (dropdownType === "warning") {
          //insert the warning icon before the text
          infoTextElement.insertAdjacentHTML(
            "beforebegin",
            ` <i class="fas fa-exclamation-triangle"></i>`,
          );
        }
      }

      infoDropdown.onclick = () => {
        const infoContainer = infoDropdown.nextElementSibling;
        const infoContainerChevron =
          infoDropdown.querySelector(".fa-chevron-right");

        const infoContainerIsopen =
          infoContainer.classList.contains("container-open");

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
                           In the GUIDE, the process of running a conversion pipeline is broken into four high-level sections.
                        <p>
                        <h4>1. ${sections[0]}</h4>
                        <p>
                            The first section will direct you to specify the high-level structure of your conversion pipeline, including data formats and global metadata.
                        </p>
                        <h4>2. ${sections[1]}</h4>
                        <p>
                            The second section will have you provide your source data files and NWB File metadata on a per-subject basis to populate your files.
                        </p>

                        ${new InspectorListItem({
                          message: html`Red boxes are <b>Error</b> messages.
                            These will block your conversion progress until
                            resolved.`,
                          type: "error",
                        })}
                        ${new InspectorListItem({
                          message: html`Yellow boxes are
                            <b>Warning</b> messages. Fixing them will align your
                            NWB files with best practices.`,
                          type: "warning",
                        })}

                        <p>
                            Throughout the forms found in the GUIDE, asterisks (<span style="color:red;">*</span>) represent required properties.
                            Attempting to move forward will throw an <b>Error</b> until these properties are filled in.
                        </p>
                        <p>
                            Gray asterisks (<span style="color:gray;">*</span>) are sometimes used to represent loose requirements, where missing this property will throw an <b>Error</b>
                            — though you don't need to specify a value at the current stage.
                        </p>

                        <h4>3. ${sections[2]}</h4>
                        <p>
                            In the third section, you will preview your conversion before uploading to DANDI.
                        </p>
                        <h4>4. ${sections[3]}</h4>
                        <p>
                            Finally, you will upload your conversion to DANDI and review the resulting Dandiset.
                        </p>

                        <h2 style="padding: 0; font-size: 20px;">Additional Resources</h2>
                        <hr>
                        ${new InfoBox({
                          header:
                            "Where can I learn more about the conversion process?",
                          content: `
                                Although not required to use the GUIDE, you can learn more about the NWB conversion
                                process in the
                                <a href="https://neuroconv.readthedocs.io/en/main" target="_blank"
                                    >neuroconv documentation page</a>.
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
