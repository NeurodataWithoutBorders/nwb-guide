

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

  #queue = []

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
    this.subSidebar.reset() // Reset state of the navigation sidebar
  }

  setMain(info){
    if (!info.next && !info.previous && info.page instanceof HTMLElement) info = this.#pagesById[info.page.id] // Get info from a direct page

    if (this.#active === info) return // Prevent rerendering the same page
    if (this.#active?.base !== info.base) this.reset() // Reset state if base page changed

    // Update Active Page
    if (this.#active) this.#active.active = false
    this.#active = info

    if (info.parent && info.section) {

      this.subSidebar.items = info.parent // Update sidebar items (if changed)
      this.subSidebar.active = info.id // Update active item (if changed)

      this.sidebar.hide(true)
      this.subSidebar.show()
    } else {
      this.sidebar.show()
      this.subSidebar.hide()
    }
    const page = this.getPage(info)
    this.main.set(page)
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
        const sign = Math.sign(transition)
        if (sign === 1) return this.setMain(this.#active.next)
        else if (sign === -1) return this.setMain(this.#active.previous)
      }

      if (!(transition in this.pages) && transition in this.#pagesById)  {
        const info = this.#pagesById[transition]
        if (info.base === undefined) transition = this.#pagesById[transition].id // Get key from id
      }

      if (transition in this.pages) this.sidebar.select(transition)
      else this.setMain(this.#pagesById[transition])
    }

    // Track Pages By Id
    const addPage = (acc, arr, additionalInfo = {}) => {
      let [ id, info ] = arr
      const page = info.page ?? info
      if (additionalInfo.id) id = additionalInfo.id

      if (page instanceof HTMLElement) {
        page.id = id // track id on the page
        acc[id] = {
          id,
          ...info, 
          ...additionalInfo
        }
      }
      else if (typeof page === 'object') {
        const pages = Object.values(page)
        const pagesInfo = {}
        
        Object.entries(page).forEach(([newId, value], i) => {
          newId = `${id}/${newId}`
          console.log('newId', newId)
          const baseInfo = {
            ...value,
            previous: pages[i-1],
            next: pages[i+1],
            id: newId
          }
          pagesInfo[newId] = { ...baseInfo}
        })

        const pageArr = Object.entries(pagesInfo)

        // Register a base page 
        const firstPage = pageArr[0]
        if (pageArr.find(([id]) => id === '/')) addPage(acc, [id, ...firstPage.slice(1)], firstPage[1])

        // Register all pages
        pageArr.forEach((arr) => {
          const info = arr[1]
          info.parent = pagesInfo
          addPage(acc, arr, { base: id, ...info})
        })

      } else throw new Error('Unknown page type')
      return acc
    }

    this.#pagesById = {}
    Object.entries(this.pages).forEach((arr) => addPage(this.#pagesById, arr))

    console.log(this.#pagesById)
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
