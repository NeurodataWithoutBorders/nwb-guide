

import { LitElement, html } from 'lit';

export class GuidedHeader extends LitElement {

  constructor({ sections = [], selected = 0 } = {}) {
    super();
    this.sections = sections;
    this.selected = selected;
}

static get properties() {
    return {
      sections: { type: Array, reflect: true },
      selected: { type: Number, reflect: true },
    };
}

attributeChangedCallback(...args) {
  const attrs = ['sections', 'selected']
  super.attributeChangedCallback(...args)
  if (attrs.includes(args[0])) this.requestUpdate()
}

  createRenderRoot() {
    return this;
  }


  render() {

    if (!this.sections.length) return html``;

    return html`
    <header id="guided-header-div" class="guided--header">
      <div class="guided--progression-tab-container">
      ${this.sections.map((section, i) => html`
      <div
          class="guided--progression-tab guided--progression-tab-triangle ${i === this.selected ? `selected-tab` : ''}"
          id="prepare-dataset-progression-tab"
        >
          <div class="guided--progression-tab-content">
            <span class="dot">${i}</span>
            <div class="guided--progression-tab-labels">
              <h1 class="guided--progression-tab-label-main">${section}</h1>
            </div>
          </div>
        </div>
    `)}
    </header>
    `;
  }
};

customElements.get('nwb-guided-header') || customElements.define('nwb-guided-header',  GuidedHeader);
