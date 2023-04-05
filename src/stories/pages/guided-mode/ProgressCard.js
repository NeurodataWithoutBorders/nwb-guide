import { html, LitElement } from "lit";
import * as progress from '../../../progress.js'


export class ProgressCard extends LitElement {

    static get properties(){
        return {
            info: {type: Object}
        }
    }

    constructor(info){
        super()
        this.info = info
    }

    createRenderRoot(){
        return this
    }

    updated() {
        this.style.width = "100%";
    }

    resume = () => {} // User-defined function to resume progress

    render(){
        let progressFileImage = this.info["banner-image-path"] || "";

        if (progressFileImage === "") {
          progressFileImage = html`
            <img
              src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
              alt="Dataset banner image placeholder"
              style="height: 80px; width: 80px"
            />
          `;
        } else {
          progressFileImage = html`
            <img
              src='${progressFileImage}'
              alt="Dataset banner image"
              style="height: 80px; width: 80px"
            />
          `;
        }
        const progressFileName = this.info.project["name"] || "";
        const progressFileSubtitle =
        this.info.project.NWBFile?.["lab"] || this.info.project.NWBFile?.["institution"]
        // const progressFileOwnerName =
        // this.info["pi-owner"]["name"] || "Not designated yet";
        const progressFileLastModified = new Date(this.info["last-modified"]).toLocaleString(
          [],
          {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          }
        );
        const savedUploadDataProgress =
        this.info["previously-uploaded-data"] &&
          Object.keys(this.info["previously-uploaded-data"]).length > 0;

        return html`
          <div class="guided--dataset-card">
            ${progressFileImage /* banner image */}

            <div class="guided--dataset-card-body">
              <div class="guided--dataset-card-row">
                <h1
                  class="guided--text-dataset-card progress-file-name progress-card-popover"
                  rel="popover"
                  placement="bottom"
                  data-trigger="hover"
                >${progressFileName}</h1>
              </div>
              <div class="guided--dataset-card-row">
                ${progressFileSubtitle ? html`<small
                  style="color: gray;"
                >
                    ${
                      progressFileSubtitle.length > 70
                        ? `${progressFileSubtitle.substring(0, 70)}...`
                        : progressFileSubtitle
                    }
                </small>` :''}
              </div>
              <div class="guided--dataset-card-row">
                <h2 class="guided--text-dataset-card-sub" style="width: auto;">
                  <i
                    class="fas fa-clock-o progress-card-popover"
                    rel="popover"
                    data-placement="bottom"
                    data-trigger="hover"
                  ></i>
                </h2>
                <h1 class="guided--text-dataset-card ml-sm-1">${progressFileLastModified}</h1>
                ${
                  savedUploadDataProgress
                    ? html`
                      <span class="badge badge-warning mx-2">Incomplete upload</span>
                    `
                    : ``
                }
              </div>
            </div>
            <div class="guided--container-dataset-card-center">
              ${
                this.info["previous-guided-upload-dataset-name"]
                  ? html`
                      <button
                        class="ui positive button guided--button-footer"
                        style="
                          background-color: var(--color-light-green) !important;
                          width: 160px !important;
                          margin: 4px;
                          margin-bottom: 15px;
                        "
                        @click="${(ev) => this.resume(ev.target)}"
                      >
                        Edit dataset
                      </button>
                    `
                  : html`
                      <button
                        class="ui positive button guided--button-footer"
                        style="
                          background-color: var(--color-light-green) !important;
                          width: 160px !important;
                          margin: 4px;
                          margin-bottom: 15px;
                        "
                        @click="${(ev) => this.resume(ev.target)}"
                      >
                        ${savedUploadDataProgress ? "Resume upload" : "Continue curating"}
                      </button>
                    `
              }
              <h2 class="guided--text-dataset-card" style="width: auto; text-decoration: underline; cursor: pointer;" @click=${(ev) => progress.deleteProgressCard(ev.target)}>
                <i
                  class="fas fa-trash mr-sm-1"
                ></i>
                Delete progress file
              </h2>
            </div>
          </div>
        `
    }
}

customElements.get('nwb-progress-card') || customElements.define('nwb-progress-card',  ProgressCard);
