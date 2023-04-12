
import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

const componentCSS = `` // These are not active until the component is using shadow DOM

export class Sidebar extends LitElement {

  static get styles() {
    return useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
  }

  static get properties() {
    return {
      pages: { type: Object, reflect: false },
      name: { type: String, reflect: true },
      logo: { type: String, reflect: true },
      subtitle: { type: String, reflect: true },

      renderName: { type: Boolean, reflect: true },
    };
  }

  initialize = true

  constructor (props = {}) {
    super()
    this.pages = props.pages
    this.name = props.name ?? ''
    this.logo = props.logo
    this.subtitle = props.subtitle ?? '0.0.1'
    this.renderName = props.renderName ?? true
  }

  // This method turns off shadow DOM to allow for global styles (e.g. bootstrap)
  // NOTE: This component checks whether this is active to determine how to handle styles and internal element references
  createRenderRoot() {
    return this;
  }

  attributeChangedCallback(...args) {
    const attrs = ['pages', 'name', 'subtitle', 'renderName']
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

      // Actually click the item
      let selectedItem = (this.#selected) ? (this.shadowRoot ?? this).querySelector(`ul[data-id='${this.#selected}']`) : (this.shadowRoot ?? this).querySelector("ul").children[0]
      if (this.initialize && selectedItem) selectedItem.click()
      else if (this.#selected) this.selectItem(this.#selected) // Visually select the item

      if (this.#hidden) this.hide(true)

  }

  show = () => {
    this.#hidden = false

    if (this.nav) {
      this.nav.classList.remove("active");
      this.toggle.classList.remove("active")
      this.style.display = "block";
    }
  }

  #hidden = false

  hide = (changeDisplay) => {
    this.#hidden = true
    if (this.nav) {
      this.nav.classList.add("active");
      this.toggle.classList.add("active")
      if (changeDisplay) this.style.display = "none";
    }
  }

  onClick = () => {} // Set by the user

  selectItem = (id) => {
    this.#selected = id.split('/')[0] || '/'
    const links = (this.shadowRoot ?? this).querySelectorAll('a')
    links.forEach((a) => a.classList.remove('is-selected'))
    const a = (this.shadowRoot ?? this).querySelector(`a[data-id="${this.#selected}"]`)
    if (a) a.classList.add('is-selected')
  }

  #onClick = (id) => {
    if (!this.pages[id]) throw new Error(`No page found for key ${id}`)
    this.selectItem(id)
    this.onClick(id, this.pages[id])
  }

  #selected = ''

  select = (id) => {
    const info = this.pages?.[id]
    if (info) this.#onClick(id, info)
  }

  render() {

    const hasName = this.name && this.renderName
    const logoNoName = (this.logo && !hasName)

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
              ${logoNoName ? html`
                <img
                  id="button-soda-big-icon"
                  class="nav-center-logo-image"
                  src="${this.logo}"
                />
              ` : ''}
                ${hasName ? html`<h1 style="margin-bottom: 0;">${this.name}</h1>` : ''}
                ${this.subtitle ? html`<span id="subtitle" style="font-size: 14px; ${logoNoName ? `padding-top: 15px; text-align: center; width: 100%; display: block;` : ''}">${this.subtitle}</span>` : ''}
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
            <div>
            ${!logoNoName && this.logo ? html`
            <img
              id="button-soda-big-icon"
              class="nav-center-logo-image"
              style="padding:0px 40px;"
              src="${this.logo}"
            />
          ` : ''}
            </div>
          </div>
        </div>
      </nav>
    `;
  }
};

customElements.get('nwb-sidebar') || customElements.define('nwb-sidebar',  Sidebar);
