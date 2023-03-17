

import { LitElement, html } from 'lit';
import useGlobalStyles from '../utils/useGlobalStyles.js';
import './guided-mode/GuidedHeader.js'
import '../Footer.js'
import '../Button'

const componentCSS = `

`

export class Page extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  constructor (info = {}) {
    super()
    this.info = info
  }

  createRenderRoot() {
    return this;
  }

  query = (input) => {
    return (this.shadowRoot ?? this).querySelector(input);
  }

  onTransition = () => {} // User-defined function

//   NOTE: Until the shadow DOM is supported in Storybook, we can't use this render function how we'd intend to.
  render() {
    return html`
    <nwbguide-guided-header></nwbguide-guided-header>
    <section><slot></slot></section>
    <nwb-footer style="display: flex; align-items: center; justify-content: space-between;">
        <div>
            <nwb-button @click=${() => this.onTransition(-1)}>Back</nwb-button>
            <nwb-button @click=${() => this.onTransition(1)} primary>Next</nwb-button>
        </div>
        <nwb-button @click=${() => this.onTransition('/')}>Save and Exit</nwb-button>
    </nwb-footer>
    `;
  }
};

customElements.get('nwbguide-page') || customElements.define('nwbguide-page',  Page);
