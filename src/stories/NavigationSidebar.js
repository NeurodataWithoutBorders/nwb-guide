

import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

const componentCSS = `

`

export class NavigationSidebar extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  constructor () {
    super()
  }

  createRenderRoot() {
    return this;
  }


  updated(){
    // this.content = (this.shadowRoot ?? this).querySelector("#content");
  }

  render() {
    return html`
<nav id="guided-nav" style="display: none" class="guided--nav">
    <img class="nav-center-logo-image" src="assets/img/logo-neuroconv.png" />
    <h1 class="guided--text-sub-step mb-0 mt-0">Guided Mode</h1>
    <p
      class="guided--help-text mb-0 mt-md"
      style="border-bottom: 1px solid var(--color-light-green)"
      id="guided-page-navigation-header"
    >
      <b>Page navigation</b>
    </p>

    <ul id="guided-nav-items" class="guided--container-nav-items"></ul>
</nav>
    `;
  }
};

customElements.get('nwb-navigation-sidebar') || customElements.define('nwb-navigation-sidebar',  NavigationSidebar);
