

import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

const componentCSS = `

`

export class Main extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  constructor () {
    super()
  }

  createRenderRoot() {
    return this;
  }

  show() {
    this.content.classList.add("is-shown");
  }


  updated(){
    this.content = (this.shadowRoot ?? this).querySelector("#content");

    this.show()
  }

  render() {
    return html`<main id="content" class="content js-content"></main>`;
  }
};

customElements.get('nwb-main') || customElements.define('nwb-main',  Main);
