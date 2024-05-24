import { LitElement } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

export class UnsafeComponent extends LitElement {
    constructor(html) {
        super();
        this.html = html;
    }

    render() {
        return unsafeHTML(this.html);
    }
}
customElements.get("nwbguide-unsafe") || customElements.define("nwbguide-unsafe", UnsafeComponent);
