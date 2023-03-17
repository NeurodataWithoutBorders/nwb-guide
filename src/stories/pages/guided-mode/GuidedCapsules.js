



import { LitElement, html } from 'lit';

export class GuidedCapsules extends LitElement {

    constructor({ n = 0, selected = 0 } = {}) {
        super();
        this.n = n;
        this.selected = selected;
    }

    static get properties() {
        return {
            n: { type: Number, reflect: true },
            selected: { type: Number, reflect: true },
        };
    }
    
    attributeChangedCallback(...args) {
        const attrs = ['n', 'selected']
        super.attributeChangedCallback(...args)
        if (attrs.includes(args[0])) this.requestUpdate()
    }

    createRenderRoot() {
        return this;
    }

    render() {

        if (!this.n) return html``;

        return html`
            <div class="guided--capsule-container">
            <div class="guided--capsule-container-branch">
            ${Array.from({ length: this.n }, (_, i) => html`<div class="guided--capsule ${i === this.selected ? `active` : ''}"></div>`)}
            </div>
            </div>
        `;
    }
};

customElements.get('nwb-guided-capsules') || customElements.define('nwb-guided-capsules', GuidedCapsules);
