import { LitElement, css, html } from "lit";
import { baseUrl } from "../globals";

export function getURLFromFilePath(file, projectName) {
    const regexp = new RegExp(`.+(${projectName}.+)`);
    return `${baseUrl}/stubs/${file.match(regexp)[1]}`;
}

export class Neurosift extends LitElement {
    static get styles() {
        return css`
            iframe {
                width: 100%;
                height: 100%;
                border: 0;
            }
        `;
    }

    constructor({ url }) {
        super();
        this.url = url;
    }

    render() {
        return html`<iframe
            class="iframe-placeholder"
            src="https://flatironinstitute.github.io/neurosift/?p=/nwb&url=${this.url}"
        ></iframe>`;
    }
}

customElements.get("neurosift-iframe") || customElements.define("neurosift-iframe", Neurosift);
