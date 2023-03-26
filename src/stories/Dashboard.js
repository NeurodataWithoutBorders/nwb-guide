

import { LitElement, html } from 'lit';
import useGlobalStyles from './utils/useGlobalStyles.js';

import { Main } from './Main.js';
import { Sidebar } from './sidebar.js';
import { NavigationSidebar } from './NavigationSidebar.js';

// Global styles to apply with the dashboard
import "../assets/css/variables.css"
import "../assets/css/nativize.css"
import "../assets/css/global.css"
import "../assets/css/nav.css"
import "../assets/css/section.css"
import "../assets/css/demo.css"
import "../assets/css/individualtab.css"
import "../assets/css/main_tabs.css"
// import "../../node_modules/cropperjs/dist/cropper.css"
import "../../node_modules/notyf/notyf.min.css"
import "../assets/css/spur.css"
import "../assets/css/main.css"
// import "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
import "../../node_modules/@fortawesome/fontawesome-free/css/all.css"
// import "../../node_modules/select2/dist/css/select2.min.css"
import "../../node_modules/@toast-ui/editor/dist/toastui-editor.css"
import "../../node_modules/codemirror/lib/codemirror.css"
// import "../../node_modules/@yaireo/tagify/dist/tagify.css"
import "../../node_modules/fomantic-ui/dist/semantic.min.css"
import "../../node_modules/fomantic-ui/dist/components/accordion.min.css"
import "../../node_modules/@sweetalert2/theme-bulma/bulma.css"
// import "../../node_modules/intro.js/minified/introjs.min.css"
import "../assets/css/guided.css"

// import "https://jsuites.net/v4/jsuites.js"
// import "https://bossanova.uk/jspreadsheet/v4/jexcel.js"


const componentCSS = `
    :host {
        display: flex;
        height: 100%;
        width: 100%;
        position: relative;
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
      activePage: { type: String, reflect: true },
    };
  }

  main;
  sidebar;
  subSidebar;

  pagesById = {}
  #active

  constructor (props = {}) {
    super()

    this.main = new Main()
    this.main.classList.add('dash-app')

    this.sidebar = new Sidebar()
    this.sidebar.onClick = (_, value) => this.setAttribute('activePage', value.info.id)

    this.subSidebar = new NavigationSidebar()
    this.subSidebar.onClick = (id) => this.setAttribute('activePage', id)


    this.pages = props.pages ?? {}
    this.name = props.name ?? "NWB App"
    if (props.activePage) this.setAttribute('activePage', props.activePage)

    this.#updated()
  }

  createRenderRoot() {
    return this;
  }

  attributeChangedCallback(key, previous, latest) {
    super.attributeChangedCallback(...arguments)
    if (key === 'subtitle' && this.sidebar) this.sidebar.subtitle = latest // Update subtitle without rerender
    else if (key === 'name') this.requestUpdate()
    else if (key === 'pages') this.#updated(latest)
    else if (key.toLowerCase() === 'activepage'){
      const page = this.getPage(this.pagesById[latest])
      this.sidebar.initialize = false
      this.setMain(page)
    }
  }


  getPage(entry) {
    if (!entry) throw new Error('Page not found...')
    let page = entry.page ?? entry
    if (page instanceof HTMLElement) return page
    else if (typeof page === 'object') return this.getPage(Object.values(page)[0])
  }


  setMain(page, infoPassed = {}){


    // Update Previous Page
    // if (page.page) page = page.page
    const info = page.info
    const previous = this.#active
    // if (!info.next && !info.previous && info.page instanceof HTMLElement) info = this.pagesById[info.page.id] // Get info from a direct page

    if (previous === page) return // Prevent rerendering the same page

    if (previous) {
      if (previous.info.parent && previous.info.section) previous.save() // Save only on nested pages

      previous.active = false
    }

    // Update Active Page
    this.#active = page
    const toPass = { ...infoPassed}
    if (previous) toPass.globalState = previous.info.globalState


    if (info.parent && info.section) {
      this.subSidebar.sections = this.#getSections(info.parent.info.pages, toPass.globalState) // Update sidebar items (if changed)
      this.subSidebar.active = info.id // Update active item (if changed)

      this.sidebar.hide(true)
      this.subSidebar.show()
    } else {
      this.sidebar.show()
      this.subSidebar.hide()
    }

    page.set(toPass)

    // const page = this.getPage(info)
    this.main.set({
      page,
      sections: this.subSidebar.sections ?? {}
    })
  }


  // Populate the sections tracked for this page by using the global state as a model
  #getSections = (pages = {}, globalState = {}) => {

    if (!globalState.sections) globalState.sections = {}

    Object.entries(pages).forEach(([id, page]) => {

      const info = page.info
      if (info.id) id = info.id

      if (info.section) {

        const section = info.section

        let state = globalState.sections[section]
        if (!state) state = globalState.sections[section] = { open: false, active: false, pages: {} }

        let pageState = state.pages[id]
        if (!pageState) pageState = state.pages[id] = { visited: false, active: false, pageLabel: page.info.label }

        state.active = false
        pageState.active = false

        if (!('visited' in pageState)) pageState.visited = false
        if (id === this.#active.info.id) state.active = pageState.visited = pageState.active = true // Set active page as visited
      }
    })

    return globalState.sections

  }

  #updated(pages=this.pages) {
    this.main.onTransition = (transition) => {

      if (typeof transition === 'number'){
        const info = this.#active.info
        const sign = Math.sign(transition)
        if (sign === 1) return this.setAttribute('activePage', info.next.info.id)
        else if (sign === -1) return this.setAttribute('activePage', (info.previous ?? info.parent).info.id) // Default to back in time
      }

      if (transition in this.pages) this.sidebar.select(transition)
      else this.setAttribute('activePage', transition)
    }

      this.pagesById = {}
      Object.entries(pages).forEach((arr) => this.addPage(this.pagesById, arr))
      this.sidebar.pages = pages

      const page = this.pagesById[this.activePage]
      if (page) {
        this.setMain(page)
        // if (update) this.requestUpdate()
      }
  }

  // Track Pages By Id
   addPage = (acc, arr) => {
        let [ id, page ] = arr

        const info = { ...page.info}

        if (info.id) id = info.id
        else page.info.id = id // update id

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
          Object.entries(pages).forEach((arr) => this.addPage(acc, arr))

        }

        return acc
      }


  updated(){

    const div = (this.shadowRoot ?? this).querySelector("div");
    div.style.height = '100vh'
    this.#updated()
  }

  render() {
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.display = "grid";
    this.style.gridTemplateColumns = "fit-content(0px) 1fr"
    this.style.position = "relative"

    this.sidebar.name = this.name

    return html`
        <div>
          ${this.sidebar}
          ${this.subSidebar}
        </div>
        ${this.main}
    `;
  }
};

customElements.get('nwb-dashboard') || customElements.define('nwb-dashboard',  Dashboard);
