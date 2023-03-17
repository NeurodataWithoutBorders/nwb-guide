

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
      name: { type: String, reflect: true },
      subtitle: { type: String, reflect: true },
    };
  }

  #pagesById = {}
  #active

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
    if (args[0] === 'subtitle' && this.sidebar) this.sidebar.setSubtitle(args[1]) // Update subtitle without rerender
    if (args[0] === 'pages' || args[0] === 'name') this.requestUpdate()
  }


  getPage(entry) {
    if (!entry) throw new Error('Page not found...')
    let page = entry.page ?? entry
    if (page instanceof HTMLElement) return page
    else if (typeof page === 'object') return this.getPage(Object.values(page)[0])
  }

  reset() {
    this.#sectionStates = {} // Reset state of the navigation sidebar
  }

  setMain(page){

    // Resolve info and page
    // if (page.page) page = page.page
    const info = page.info
    // if (!info.next && !info.previous && info.page instanceof HTMLElement) info = this.#pagesById[info.page.id] // Get info from a direct page

    if (this.#active === page) return // Prevent rerendering the same page

    if (this.#active?.info?.base !== info.base) this.reset() // Reset state if base page changed

    // Update Active Page
    if (this.#active) this.#active.active = false
    this.#active = page

    if (info.parent && info.section) {

      this.subSidebar.sections = this.#getSections(info.parent.info.pages) // Update sidebar items (if changed)
      this.subSidebar.active = info.id // Update active item (if changed)

      this.sidebar.hide(true)
      this.subSidebar.show()
    } else {
      this.sidebar.show()
      this.subSidebar.hide()
    }
    // const page = this.getPage(info)
    this.main.set({
      page,
      sections: this.subSidebar.sections ?? {}
    })
  }


  #sectionStates = {}

  #getSections = (pages = {}) => {
    Object.entries(pages).forEach(([id, page]) => {

      const info = page.info
      if (info.id) id = info.id

      if (info.section) {

        const section = info.section

        let state = this.#sectionStates[section]
        if (!state) state = this.#sectionStates[section] = { open: false, active: false, pages: {} }

        let pageState = state.pages[id]
        if (!pageState) pageState = state.pages[id] = { visited: false, active: false, page }

        state.active = false
        pageState.active = false

        if (!('visited' in pageState)) pageState.visited = false
        if (id === this.#active.info.id) state.active = pageState.visited = pageState.active = true // Set active page as visited
      }
    })

    return this.#sectionStates

  }

  updated(){
    const div = (this.shadowRoot ?? this).querySelector("div");
    div.style.height = '100vh'
    this.sidebar = (this.shadowRoot ?? this).querySelector("nwb-sidebar");
    this.subSidebar = (this.shadowRoot ?? this).querySelector("nwb-navigation-sidebar");
    this.main = (this.shadowRoot ?? this).querySelector("nwb-main");
    this.sidebar.onClick = this.subSidebar.onClick = (_, value) => this.setMain(value)
    this.main.onTransition = (transition) => {

      if (typeof transition === 'number'){
        const info = this.#active.info
        const sign = Math.sign(transition)
        if (sign === 1) return this.setMain(info.next)
        else if (sign === -1) return this.setMain(info.previous ?? info.parent) // Default to back in time
      }

      if (transition in this.pages) this.sidebar.select(transition)
      else this.setMain(this.#pagesById[transition])
    }

    // Track Pages By Id
    const addPage = (acc, arr) => {
      let [ id, page ] = arr

      const info = { ...page.info}

      if (info.id) id = info.id

      const pages = info.pages
      delete info.pages

      // NOTE: This is not true for nested pages with more info...
      if (page instanceof HTMLElement) acc[id] = page

      if (pages) {
        const pagesArr = Object.values(pages)

        // Update info with relative information
        Object.entries(pages).forEach(([newId, nestedPage], i) => {
          nestedPage.info.base = id
          nestedPage.info.previous = pagesArr[i-1]
          nestedPage.info.next = pagesArr[i+1]
          nestedPage.info.id = `${id}/${newId}`
          nestedPage.info.parent = page
        })

        // // Register a base page
        // const firstPage = pageArr[0]
        // if (pagesArr.find(([id]) => id === '/')) addPage(acc, [id, ...firstPage.slice(1)], firstPage[1])

        // Register all pages
        Object.entries(pages).forEach((arr) => addPage(acc, arr))

      }

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
