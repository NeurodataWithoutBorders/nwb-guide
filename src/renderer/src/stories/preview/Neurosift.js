import { LitElement, css, html } from "lit";
import { baseUrl } from "../../globals";

import { Loader } from "../Loader";

export function getURLFromFilePath(file, projectName) {
    const regexp = new RegExp(`.+(${projectName}.+)`);
    return `${baseUrl}/stubs/${file.match(regexp)[1]}`;
}

export class Neurosift extends LitElement {
    static get styles() {
        return css`
            :host {
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: 100%;
                position: relative;
                --loader-color: hsl(200, 80%, 50%);
            }

            :host > * {
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

    constructor({ url } = {}) {
        super();
        this.url = url;
    }

    render() {
        return this.url
            ? html` <div class="loader-container">${new Loader({ message: `Loading Neurosift view...<br/><small>${this.url}</small>` })}</div>
                  <iframe
                      class="iframe-placeholder"
                      src="https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${this.url}"
                      @load=${function (ev) {
                          ev.target.previousElementSibling.remove();
                      }}
                  ></iframe>`
            : ``;
    }
}

customElements.get("neurosift-iframe") || customElements.define("neurosift-iframe", Neurosift);
