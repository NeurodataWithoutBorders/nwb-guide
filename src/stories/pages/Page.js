

import { LitElement, html } from 'lit';
import useGlobalStyles from '../utils/useGlobalStyles.js';
import './guided-mode/GuidedHeader.js'
import '../Footer.js'
import '../Button'

import { save } from '../../progress.js'

const componentCSS = `

`

export class Page extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  info = { globalState: {} }

  constructor (info = {}) {
    super()
    Object.assign(this.info, info)
  }

  createRenderRoot() {
    return this;
  }

  query = (input) => {
    return (this.shadowRoot ?? this).querySelector(input);
  }

  onSet = () => {} // User-defined function

  set = (info) => {
    if (info){
      Object.assign(this.info, info)
      this.onSet()
      this.requestUpdate()
    }
  }

  onTransition = () => {} // User-defined function

  save = () => save(this)

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