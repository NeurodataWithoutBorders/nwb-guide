
import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';
import catalystNeuroLogo from '../assets/img/logo-catalystneuro.png'

const componentCSS = `` // These are not active until the component is using shadow DOM

export class Sidebar extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  static get properties() {
    return {
      pages: { type: Object, reflect: false },
      name: { type: String, reflect: true },
      subtitle: { type: String, reflect: true },
    };
  }

  initialize = true

  constructor (props = {}) {
    super()
    this.pages = props.pages
    this.name = props.name ?? ''
    this.subtitle = props.subtitle ?? ''
  }

  // This method turns off shadow DOM to allow for global styles (e.g. bootstrap)
  // NOTE: This component checks whether this is active to determine how to handle styles and internal element references
  createRenderRoot() {
    return this;
  }

  attributeChangedCallback(...args) {
    const attrs = ['pages', 'name', 'subtitle']
    super.attributeChangedCallback(...args)
    if (attrs.includes(args[0])) this.requestUpdate()
  }

  updated(){
    this.nav = (this.shadowRoot ?? this).querySelector("#main-nav");

    this.subtitleElement = (this.shadowRoot ?? this).querySelector("#subtitle");

      // Toggle sidebar
      const toggle = this.toggle = (this.shadowRoot ?? this).querySelector("#sidebarCollapse");
      toggle.onclick = () => {
        this.nav.classList.toggle("active");
        toggle.classList.toggle("active");
      }

      const firstItem = (this.shadowRoot ?? this).querySelector("ul").children[0];
      if (this.initialize && firstItem) firstItem.click()
  }

  show = () => {
    if (this.nav) {
      this.nav.classList.remove("active");
      this.toggle.classList.remove("active")
      this.style.display = "block";
    }
  }

  hide = (changeDisplay) => {
    if (this.nav) {
      this.nav.classList.add("active");
      this.toggle.classList.add("active")
      if (changeDisplay) this.style.display = "none";
    }
  }

  onClick = () => {} // Set by the user
  #onClick = (id) => {
    if (!this.pages[id]) throw new Error(`No page found for key ${id}`)
    const links = (this.shadowRoot ?? this).querySelectorAll('a')
    links.forEach((a) => a.classList.remove('is-selected'))
    const a = (this.shadowRoot ?? this).querySelector(`a[data-id="${id}"]`)
    if (a) a.classList.add('is-selected')
    this.onClick(id, this.pages[id])
  }

  select = (id) => {
    const info = this.pages[id]
    if (info) this.#onClick(id, info)
  }

  render() {
    return html`
    <button type="button" id="sidebarCollapse" class="navbar-btn">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav id="main-nav" class="nav js-nav">
        <div id="nav-items" class="nav-item u-category-windows">
          <!-- Sidebar Header -->
          <div class="sidebar-header">
                ${this.name ? html`<h1 style="margin-bottom: 0;">${this.name}</h1>` : ''}
                ${this.subtitle ? html`<span id="subtitle" style="font-size: 14px">${this.subtitle}</span>` : ''}
            </div>
            <!-- Sidebar Links -->
            <ul class="list-unstyled components">
              ${Object.entries(this.pages).map(([id, page]) => {
                const info = page.info ?? {}
                let label = info.label ?? id
                const icon = info.icon ?? ''
                const a = document.createElement('a')
                a.setAttribute('data-id', id)
                a.href = "#"
                a.innerHTML = `
                  ${icon}
                  ${label}
                `
                return html`<li @click="${() => this.#onClick(id)}">${a}</li>`
              })}
            </ul>
            <div class="help-section">
              <ul
                class="list-unstyled components"
                style="
                  height: 50px;
                  margin-bottom: 0;
                  margin-left: 35px;
                  display: flex;
                  flex-direction: row;
                  justify-content: center;
                "
              ></ul>
            </div>
          </div>
          <!-- Sidebar Footer -->
          <div class="boxhead">
            <div style="display: block" id="catalystneuro-logo">
              <h3
                style="
                  width: auto;
                  text-align: center;
                "
              >
                <a
                  href="https://catalystneuro.com/"
                  style="border-bottom:0px;text-decoration:none;"
                >
                  <img
                    src="${catalystNeuroLogo}"
                    width="140px"
                    height="140px"
                    border="0"
                  />
                </a>
              </h3>
            </div>
        </div>
      </nav>
    `;
  }
};

customElements.get('nwb-sidebar') || customElements.define('nwb-sidebar',  Sidebar);
