

import { html } from 'lit';
import { Page } from '../Page.js';

export class GuidedNewDatasetPage extends Page {

  constructor () {
    super()
  }

  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
  }

  render() {
    return html`
  <section
    class="section js-section u-category-windows"
  >
  <div
  id="prepare-dataset-parent-tab"
  class="guided--parent-tab hidden"
  data-parent-tab-name="Dataset Structure"
>
  <div class="guided--capsule-container" id="structure-dataset-capsule-container">
    <div class="guided--capsule hidden" id="guided-prepare-helpers-capsule"></div>
    <div class="guided--capsule active" id="guided-dataset-starting-point-capsule"></div>

    <div
      class="guided--capsule-container-branch hidden"
      id="guided-curate-new-dataset-branch-capsule-container"
    >
      <div class="guided--capsule" id="guided-subjects-folder-capsule"></div>

      <div class="guided--capsule" id="guided-primary-data-organization-capsule"></div>
      <div class="guided--capsule" id="guided-source-data-organization-capsule"></div>
      <div class="guided--capsule" id="guided-derivative-data-organization-capsule"></div>
      <div class="guided--capsule" id="guided-code-folder-capsule"></div>
      <div class="guided--capsule" id="guided-protocol-folder-capsule"></div>
      <div class="guided--capsule" id="guided-docs-folder-capsule"></div>

      <button
        class="ui yellow basic button"
        id="guided-button-preview-folder-structure"
        style="
          z-index: 2001;
          position: absolute;
          top: 75px;
          left: 0px;
          background-color: white;
          display: none;
        "
      >
        Preview folder structure
      </button>
    </div>
    <div
      class="guided--capsule-container-branch hidden"
      id="guided-curate-existing-local-dataset-branch-capsule-container"
    >
      <div class="guided--capsule" id="guided-folder-importation-capsule"></div>
    </div>
    <div class="guided--capsule" id="guided-folder-structure-preview-capsule"></div>
  </div>

  <div id="guided-prepare-helpers-tab" class="guided--page" data-page-name="Prepare data">
    <div class="guided--section">
      <h1
        class="guided--text-sub-step"
        style="
          border-bottom: 5px solid var(--color-bg-plum);
          width: 131%;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
        "
      >
        Before Getting Started
      </h1>
      <p class="guided--help-text">
        Several resources are required to curate and share a SPARC dataset. They are listed
        below so you can make sure you can have access to them before getting started. You can
        optionally connect them to SODA here although you will also be able to do so later on
        as well.
      </p>
      <label class="guided--welcome-section-label text-center">1. Pennsieve Account</label>
      <p class="guided--help-text">
        All SPARC datasets must be uploaded on the Pennsieve data platform. You will therefore
        need a Pennsieve account and access to the SPARC Organization on Pennsieve. Once you
        have access you can connect your Pennsieve account with SODA using the button below.
      </p>
      <div class="guided--info-dropdown">
        <p class="guided--dropdown-text" data-dropdown-type="warning">
          I don't have a Pennsieve account
        </p>
        <i class="fas fa-chevron-right" style="transform: rotate(0deg)"></i>
      </div>
      <div class="guided--info-container" style="width: 800px">
        <p class="guided--help-text">
          Get access to Pennsieve as well as the SPARC Consortium organization on Pennsieve by
          filling out this
          <a
            target="_blank"
            href="https://www.wrike.com/frontend/requestforms/index.html?token=eyJhY2NvdW50SWQiOjMyMDM1ODgsInRhc2tGb3JtSWQiOjUwMzQzN30JNDgwNTg4NjU3MjA3Nwk0MTg5ZTY0ODEyZGYxNTU1ZDJkYmU5MzIxNWZiNTQyZWUwZTMzY2U4NDQ5ODI0ZWI0YzZiMWZhNjVhYzgyOTRm"
            >this form.</a
          >
        </p>
      </div>
      <div class="before-getting-started-btn">
        <button
          id="getting-started-pennsieve-account"
          class="metadata-button button-generate-dataset"
          style="width: 150px; height: 150px; margin: 12px"
        >
          <div>
            <img
              src="assets/img/pennsieveLogo.png"
              alt="PennsieveLogo"
              width="50px"
              height="50px"
            />
          </div>

          <svg
            style="display: none"
            width="40px"
            height="50px"
            viewbox="0 0 16 16"
            class="bi bi-check2"
            fill="var(--color-light-green)"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"
            ></path>
          </svg>
          <p style="margin-top: 11px">Connect Pennsieve Account</p>
        </button>
      </div>
      <label class="guided--welcome-section-label text-center"
        >2. Data Deliverables document</label
      >
      <p class="guided--help-text">
        The milestones and associated datasets as agreed between awardees and SPARC are
        summarized in a document called Data Deliverables document. Information contained in
        this document is required in one of the metadata files to be included in your dataset.
        You will therefore need access to the Data Deliverables document associated with your
        SPARC award. Once you have this document you can optionally import it into SODA to
        easily prepare your metadata file.
      </p>
      <div class="guided--info-dropdown">
        <p class="guided--dropdown-text" data-dropdown-type="info">
          Where can I find my Data Deliverables document?
        </p>
        <i class="fas fa-chevron-right" style="transform: rotate(0deg)"></i>
      </div>
      <div class="guided--info-container" style="margin-bottom: 1.5rem">
        <p class="guided--help-text">
          To obtain the Data Deliverables document associated with your award, simply ask your
          PI or grant manager. Download a template of the Data Deliverables document
          <a
            target="_blank"
            href="https://github.com/fairdataihub/SODA-for-SPARC/blob/main/file_templates/DataDeliverablesDocument-template.docx?raw=true"
            >here</a
          >
          to see the expected format.
        </p>
      </div>
      <div class="before-getting-started-btn" style="margin-top: 1rem">
        <button
          id="getting-started-data-deliverable-btn"
          class="metadata-button button-generate-dataset"
          style="width: 150px; height: 150px; margin: 12px"
        >
          <svg
            width="50px"
            height="50px"
            viewbox="0 0 16 16"
            class="bi bi-file-earmark-plus"
            fill="#13716D"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 0h5.5v1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h1V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"
            ></path>
            <path d="M9.5 3V0L14 4.5h-3A1.5 1.5 0 0 1 9.5 3z"></path>
            <path
              fill-rule="evenodd"
              d="M8 6.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 .5-.5z"
            ></path>
          </svg>
          <svg
            style="display: none"
            width="50px"
            height="50px"
            viewbox="0 0 16 16"
            class="bi bi-check2"
            fill="var(--color-light-green)"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"
            ></path>
          </svg>
          <p style="margin-top: 11px">Import Data Deliverables document</p>
        </button>
      </div>

      <label class="guided--welcome-section-label text-center"
        >3. Airtable Account (optional)</label
      >
      <p class="guided--help-text">
        The SPARC program maintains a spreadsheet on the Airtable platform with SPARC award
        numbers and contact information about the SPARC consortium members. SPARC members are
        encouraged to check and frequently update information about them and their team
        members.
      </p>
      <p class="guided--help-text">
        We recommend you to connect this Airtable sheet with SODA to easily add metadata to
        your dataset such as award number and contributor information.
      </p>
      <div class="guided--info-dropdown">
        <p class="guided--dropdown-text" data-dropdown-type="info">
          How do I get access to the SPARC Airtable sheet?
        </p>
        <i class="fas fa-chevron-right" style="transform: rotate(0deg)"></i>
      </div>
      <div class="guided--info-container" style="width: 800px">
        <p class="guided--help-text">
          To get access to the SPARC Airtable sheet first create an
          <a target="_blank" href="https://www.airtable.com/">Airtable account</a>
          then request access
          <a
            target="_blank"
            href="https://www.wrike.com/frontend/requestforms/index.html?token=eyJhY2NvdW50SWQiOjMyMDM1ODgsInRhc2tGb3JtSWQiOjUwMzQzN30JNDgwNTg4NjU3MjA3Nwk0MTg5ZTY0ODEyZGYxNTU1ZDJkYmU5MzIxNWZiNTQyZWUwZTMzY2U4NDQ5ODI0ZWI0YzZiMWZhNjVhYzgyOTRm"
            >here</a
          >.
        </p>
      </div>
      <div class="before-getting-started-btn" style="margin-top: 1rem">
        <button
          class="metadata-button button-generate-dataset"
          id="getting-started-button-import-sparc-award"
          style="width: 150px; height: 150px; margin: 12px"
        >
          <svg
            style="display: none"
            width="50px"
            height="50px"
            viewbox="0 0 16 16"
            class="bi bi-check2"
            fill="var(--color-light-green)"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"
            ></path>
          </svg>
          <div class="guided--tile-button-icon" style="margin-left: 2rem">
            <img
              src="assets/img/Airtable-icon.png"
              alt="Airtable icon"
              style="width: 50px; height: 50px; object-fit: contain"
            />
          </div>
          <p style="margin-top: 24px">Connect Airtable Account</p>
        </button>
      </div>
    </div>
  </div>

    </section>
    `;
  }
};

customElements.get('nwbguide-guided-newdataset-page') || customElements.define('nwbguide-guided-newdataset-page',  GuidedNewDatasetPage);