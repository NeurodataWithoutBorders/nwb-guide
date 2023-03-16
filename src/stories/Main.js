

import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

const componentCSS = `
    :host {
        position: relative;
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

  #queue = []

  set(content) {
    if (typeof content === 'function') content = new content()
    content.onTransition = this.onTransition;

    if (this.content) {
      this.content.innerHTML = "";
      this.content.insertAdjacentElement("beforeend", content);
    } else this.#queue.push(content)
  }


  updated(){
    this.content = (this.shadowRoot ?? this).querySelector("#content");
    if (this.#queue.length) {
      this.#queue.forEach(content => this.set(content))
      this.#queue = []
    }

    this.style.overflow = "hidden"
    this.content.style.height = "100%"
  }

  render() {
    this.style.position = "relative";

    return html`<main id="content" class="js-content"></main>`;
  }
};

customElements.get('nwb-main') || customElements.define('nwb-main',  Main);
