

import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

import "./NavigationSidebar.js"
import "./Sidebar.js";
import "./Main.js";

const componentCSS = `
    :host {
        display: flex;
        height: 100%;
        width: 100%;
    }

    nwb-main {
        background: #fff;
        border-top: 1px solid #c3c3c3;
    }
`

export class Dashboard extends LitElement {

  static get styles() {
    const style = useGlobalStyles(componentCSS, sheet => sheet.href && sheet.href.includes('bootstrap'), this.shadowRoot)
    return style
}


  static get properties() {
    return {
      pages: { type: Object, reflect: false },
      name: { type: String, reflect: true }
    };
  }

  #pagesById = {}

  #latest

  constructor (props = {}) {
    super()
    this.pages = props.pages ?? {}
    this.name = props.name ?? "NWB App"
  }

  createRenderRoot() {
    return this;
  }

  attributeChangedCallback(...args) {
    super.attributeChangedCallback(...args)
    if (args[0] === 'pages' || args[0] === 'name') this.requestUpdate()
  }


  getPage(entry) {
    if (!entry) throw new Error('Page not found...')
    let page = entry.page ?? entry
    if (page instanceof HTMLElement) return page
    if (Array.isArray(page)) return this.getPage(page[0])
    else if (typeof page === 'object') return Object.values(page)[0]
  }

  setMain(info){
    this.#latest = info
    const page = this.getPage(info)
    this.main.set(page)
  }

  updated(){
    this.sidebar = (this.shadowRoot ?? this).querySelector("nwb-sidebar");
    this.main = (this.shadowRoot ?? this).querySelector("nwb-main");
    this.sidebar.onClick = (key, value) => this.setMain(value)
    this.main.onTransition = (transition) => {

      if (typeof transition === 'number'){
        const sign = Math.sign(transition)
        if (sign === 1) this.setMain(this.#latest.next)
        else if (sign === -1) this.setMain(this.#latest.previous)
      }

      if (!(transition in this.pages) && transition in this.#pagesById)  {
        const info = this.#pagesById[transition]
        if (info.base === undefined) transition = this.#pagesById[transition].key // Get key from id
      }

      if (transition in this.pages) this.sidebar.select(transition)
      else this.setMain(this.#pagesById[transition])
    }

    // Track Pages By Id
    const addPage = (acc, arr, additionalInfo = {}) => {
      const [key, info] = arr
      const page = info.page ?? info
      let id = info.id || key
      if (additionalInfo.base) id = `${additionalInfo.base}/${id}`

      if (page instanceof HTMLElement) acc[id] = {page, key, ...additionalInfo}
      else if (Array.isArray(page)) page.forEach((v, i) => addPage(acc, [0, v], {
        base: id,
        previous: page[i-1],
        next: page[i+1]
      }))
      else throw new Error('Unknown page type')
      return acc
    }

    this.#pagesById = {}
    Object.entries(this.pages).forEach((arr) => addPage(this.#pagesById, arr))

    // Set sidebar pages
    this.sidebar.pages = this.pages
  }

  render() {
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.display = "grid";
    this.style.gridTemplateColumns = "fit-content(0px) 1fr"

    return html`
        <div>
          <nwb-sidebar name=${this.name}></nwb-sidebar>
          <nwb-navigation-sidebar></nwb-navigation-sidebar>
        </div>
        <nwb-main class="dash-app"></nwb-main>
    `;
  }
};

customElements.get('nwb-dashboard') || customElements.define('nwb-dashboard',  Dashboard);
