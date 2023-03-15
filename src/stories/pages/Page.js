

import { LitElement, html } from 'lit';
import useGlobalStyles from '../utils/useGlobalStyles.js';

const componentCSS = `

`

export class Page extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  constructor () {
    super()
  }

  createRenderRoot() {
    return this;
  }

  query = (input) => {
    return (this.shadowRoot ?? this).querySelector(input);
  }

  onTransition = () => {} // User-defined function

  render() {
    return html`
    <section></section>
    `;
  }
};

customElements.get('nwbguide-page') || customElements.define('nwbguide-page',  Page);
