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
                --loader-color: hsl(200, 80%, 50%);
            }

            :host > * {
                width: 100%;
                height: 100%;
            }

            div {
                display: flex;
                align-items: center;
                justify-content: center;
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

    constructor({ url }) {
        super();
        this.url = url;
    }

    render() {
        return html` <div>
                <div>
                    ${new Loader()}
                    <small>Loading Neurosift view...</small>
                </div>
            </div>
            <iframe
                hidden
                class="iframe-placeholder"
                src="https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${this.url}"
                @load=${function (ev) {
                    const sibling = ev.target.previousSibling.previousSibling;
                    console.log(sibling);
                    sibling.remove();
                    ev.target.removeAttribute("hidden");
                }}
            ></iframe>`;
    }
}

customElements.get("neurosift-iframe") || customElements.define("neurosift-iframe", Neurosift);
