import { LitElement, css, html } from "lit";
import { baseUrl } from "../../globals";

import { Loader } from "../Loader";
import { FullScreenToggle } from "../FullScreenToggle";

export function getURLFromFilePath(file, projectName) {
    const regexp = new RegExp(`.+(${projectName}.+)`);
    return `${baseUrl}/preview/${file.match(regexp)[1]}`;
}


export class Neurosift extends LitElement {
    static get styles() {
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

            iframe, .loader-container {
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
        };
    }

    constructor({ url, fullscreen = true } = {}) {
        super();
        this.url = url;
        this.fullscreen = fullscreen
    }
    

    render() {
        return this.url
            ? html` <div class="loader-container">
                      ${new Loader({ message: `Loading Neurosift view...<br/><small>${this.url}</small>` })}
                  </div>
                  ${this.fullscreen ? new FullScreenToggle({ target: this }) : ''}
                  <iframe
                      src="https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${this.url}"
                      @load=${function () {
                        const loader = this.shadowRoot.querySelector(".loader-container");
                        loader.remove();
                      }}
                  ></iframe>`
            : ``;
    }
}

customElements.get("neurosift-iframe") || customElements.define("neurosift-iframe", Neurosift);
