import { LitElement, html } from "lit";

export class BaseRenderer extends LitElement {

    declare value: any[]

    static get properties() {
        return {
            value: { reflect: true }
        }
    }

    constructor({ value = []} = {}) {
        super()
        this.value = value
    }


    render() {
        return html`${this.value}`
    }
}

customElements.get("nwb-renderer") || customElements.define("nwb-renderer", BaseRenderer);
