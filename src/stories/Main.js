

import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

const componentCSS = `
    :host {
        width: 100%;
        height: 100%;
    }
`

export class Main extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  history = []

  constructor () {
    super()
  }

  createRenderRoot() {
    return this;
  }

  onTransition = () => {} // user-defined function

  set(content) {
    if (typeof content === 'function') content = new content()
    content.onTransition = this.onTransition;

    this.content.innerHTML = "";
    this.content.insertAdjacentElement("beforeend", content);
  }


  updated(){
    this.content = (this.shadowRoot ?? this).querySelector("#content");
  }

  render() {
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.overflow = "hidden";

    return html`<main id="content" class="js-content"></main>`;
  }
};

customElements.get('nwb-main') || customElements.define('nwb-main',  Main);
