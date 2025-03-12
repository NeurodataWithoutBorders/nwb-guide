import { LitElement, css, html, CSSResult, TemplateResult } from "lit";
import { Loader } from "./Loader";
import { FullScreenToggle } from "./FullScreenToggle";
import { baseUrl } from "../server/globals";

export function getURLFromFilePath(file: string, projectName: string): string {
    const regexp = new RegExp(`.+(${projectName}.+)`);
    const match = file.match(regexp);
    if (!match) throw new Error(`File path ${file} does not contain project name ${projectName}`);
    return `${baseUrl}/preview/${match[1]}`;
}

export class Neurosift extends LitElement {
    static get styles(): CSSResult {
        return css`
            :host {
                background: white;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: 100%;
                position: relative;
                --loader-color: hsl(200, 80%, 50%);
            }

            iframe,
            .loader-container {
                width: 100%;
                height: 100%;
            }

            .loader-container {
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
                top: 0;
                left: 0;
            }

            .fullscreen-toggle {
                display: flex;
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 10px;
                color: white;
                background-color: gainsboro;
                border: 1px solid gray;
                border-radius: 10px;
                cursor: pointer;
            }

            span {
                font-size: 14px;
            }

            small {
                padding-left: 10px;
            }

            iframe {
                border: 0;
            }
        `;
    }

    static get properties() {
        return {
            url: { type: String, reflect: true },
            fullscreen: { type: Boolean }
        };
    }

    declare url?: string;
    declare fullscreen: boolean;

    constructor(options: { url?: string; fullscreen?: boolean } = {}) {
        super();
        this.url = options.url;
        this.fullscreen = options.fullscreen ?? true;
    }

    render(): TemplateResult | string {
        // Clear neurosift cross-session storage database
        // see https://github.com/NeurodataWithoutBorders/nwb-guide/issues/974
        if (this.url) {
            indexedDB.deleteDatabase("neurosift-hdf5-cache");
        }

        return this.url
            ? html` <div class="loader-container">
                      ${new Loader({
                          message: `Loading Neurosift view...<br/><small>${this.url}</small>`,
                      })}
                  </div>
                  ${this.fullscreen ? new FullScreenToggle({ target: this }) : ""}
                  <iframe
                      src="https://neurosift.app/?p=/nwb&url=${this.url}"
                      @load=${function(this: Neurosift) {
                          const loader = this.shadowRoot?.querySelector(".loader-container");
                          if (loader) loader.remove();
                      }}
                  ></iframe>`
            : "";
    }
}

customElements.get("neurosift-iframe") || customElements.define("neurosift-iframe", Neurosift); 