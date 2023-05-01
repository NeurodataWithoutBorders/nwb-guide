import { LitElement, html } from "lit";
import useGlobalStyles from "./utils/useGlobalStyles.js";

import { Main } from "./Main.js";
import { Sidebar } from "./sidebar.js";
import { NavigationSidebar } from "./NavigationSidebar.js";

// Global styles to apply with the dashboard
import "../../assets/css/variables.css";
import "../../assets/css/nativize.css";
import "../../assets/css/global.css";
import "../../assets/css/nav.css";
import "../../assets/css/section.css";
import "../../assets/css/demo.css";
import "../../assets/css/individualtab.css";
import "../../assets/css/main_tabs.css";
// import "../../node_modules/cropperjs/dist/cropper.css"
import "../../../../node_modules/notyf/notyf.min.css";
import "../../assets/css/spur.css";
import "../../assets/css/main.css";
// import "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
import "../../../../node_modules/@fortawesome/fontawesome-free/css/all.css";
// import "../../node_modules/select2/dist/css/select2.min.css"
// import "../../node_modules/@toast-ui/editor/dist/toastui-editor.css"
// import "../../node_modules/codemirror/lib/codemirror.css"
// import "../../node_modules/@yaireo/tagify/dist/tagify.css"
import "../../../../node_modules/fomantic-ui/dist/semantic.min.css";
import "../../../../node_modules/fomantic-ui/dist/components/accordion.min.css";
import "../../../../node_modules/@sweetalert2/theme-bulma/bulma.css";
// import "../../node_modules/intro.js/minified/introjs.min.css"
import "../../assets/css/guided.css";
import isElectron from "../electron/check.js";
import { isStorybook, reloadPageToHome } from "../globals.js";

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
`;

export class Dashboard extends LitElement {
  static get styles() {
    const style = useGlobalStyles(
      componentCSS,
      (sheet) => sheet.href && sheet.href.includes("bootstrap"),
      this.shadowRoot
    );
    return style;
  }

  static get properties() {
    return {
      renderNameInSidebar: { type: Boolean, reflect: true },
      name: { type: String, reflect: true },
      logo: { type: String, reflect: true },
      subtitle: { type: String, reflect: true },
      activePage: { type: String, reflect: true },
      globalState: { type: Object },
    };
  }

  main;
  sidebar;
  subSidebar;

  pagesById = {};
  #active;

  constructor(props = {}) {
    super();

    this.main = new Main();
    this.main.classList.add("dash-app");

    this.sidebar = new Sidebar();
    this.sidebar.onClick = (_, value) => this.setAttribute("activePage", value.info.id);

    this.subSidebar = new NavigationSidebar();
    this.subSidebar.onClick = (id) => this.setAttribute("activePage", id);

    this.pages = props.pages ?? {};
    this.name = props.name;
    this.logo = props.logo;
    this.renderNameInSidebar = props.renderNameInSidebar ?? true;

    this.globalState = props.globalState; // Impose a static global state on pages that have none

    if (props.activePage) this.setAttribute("activePage", props.activePage);

    // Handle all pop and push state updates
    const pushState = window.history.pushState;
    window.history.pushState = function (state) {
      if (typeof window.onpushstate == "function") window.onpushstate({ state: state });
      return pushState.apply(window.history, arguments);
    };

    window.onpushstate = window.onpopstate = (e) => {
      if (e.state) {
        document.title = `${e.state.label} - ${this.name}`;
        const page = this.pagesById[e.state.page]; // ?? this.pagesById[this.#activatePage]
        if (!page) return;
        this.setMain(page);
      }
    };

    this.#updated();
  }

  createRenderRoot() {
    return this;
  }

  attributeChangedCallback(key, _, latest) {
    super.attributeChangedCallback(...arguments);
    if (this.sidebar && (key === "name" || key === "logo" || key === "subtitle"))
      this.sidebar[key] = latest;
    else if (key === "renderNameInSidebar")
      this.sidebar.renderName = latest === "true" || latest === true;
    else if (key === "pages") this.#updated(latest);
    else if (key.toLowerCase() === "activepage") {
      if (this.#active && this.#active.info.parent && this.#active.info.section)
        this.#active.save(); // Always properly saves the page

      while (latest && !this.pagesById[latest]) latest = latest.split("/").slice(0, -1).join("/"); // Trim off last character until you find a page

      this.sidebar.selectItem(latest); // Just highlight the item
      this.sidebar.initialize = false;
      this.#activatePage(latest);
      return;
    }
  }

  getPage(entry) {
    if (!entry) return reloadPageToHome();
    const page = entry.page ?? entry;
    if (page instanceof HTMLElement) return page;
    else if (typeof page === "object") return this.getPage(Object.values(page)[0]);
  }

  setMain(page) {
    // Update Previous Page
    const info = page.info;
    const previous = this.#active;

    // if (previous === page) return // Prevent rerendering the same page

    const isNested = info.parent && info.section;

    const toPass = {};
    if (previous) {
      previous.dismiss(); // Dismiss all notifications for this page
      if (previous.info.globalState) toPass.globalState = previous.info.globalState; // Pass global state over if appropriate
      previous.active = false;
    }

    // On initial reload, load global state if you can
    if (isNested && !("globalState" in toPass))
      toPass.globalState = this.globalState ?? page.load();

    // Update Active Page
    this.#active = page;

    if (isNested) {
      let parent = info.parent;
      while (parent.info.parent) parent = parent.info.parent; // Lock sections to the top-level parent
      this.subSidebar.sections = this.#getSections(parent.info.pages, toPass.globalState); // Update sidebar items (if changed)
      this.subSidebar.active = info.id; // Update active item (if changed)
      this.sidebar.hide(true);
      this.subSidebar.show();
    } else {
      this.sidebar.show();
      this.subSidebar.hide();
    }

    page.set(toPass);

    // const page = this.getPage(info)
    this.main.set({
      page,
      sections: this.subSidebar.sections ?? {},
    });
  }

  // Populate the sections tracked for this page by using the global state as a model
  #getSections = (pages = {}, globalState = {}) => {
    if (!globalState.sections) globalState.sections = {};

    Object.entries(pages).forEach(([id, page]) => {
      const info = page.info;
      if (info.id) id = info.id;

      if (info.section) {
        const section = info.section;

        let state = globalState.sections[section];
        if (!state)
          state = globalState.sections[section] = { open: false, active: false, pages: {} };

        let pageState = state.pages[id];
        if (!pageState)
          pageState = state.pages[id] = {
            visited: false,
            active: false,
            pageLabel: page.info.label,
          };

        state.active = false;
        pageState.active = false;

        if (page.info.pages) this.#getSections(page.info.pages, globalState); // Show all states

        if (!("visited" in pageState)) pageState.visited = false;
        if (id === this.#active.info.id) state.active = pageState.visited = pageState.active = true; // Set active page as visited
      }
    });

    return globalState.sections;
  };

  #updated(pages = this.pages) {
    const url = new URL(window.location.href);
    let active = url.pathname.slice(1);
    if (isElectron || isStorybook) active = new URLSearchParams(url.search).get("page");
    if (!active) active = this.activePage; // default to active page

    this.main.onTransition = (transition) => {
      if (typeof transition === "number") {
        const info = this.#active.info;
        const sign = Math.sign(transition);
        if (sign === 1) return this.setAttribute("activePage", info.next.info.id);
        else if (sign === -1)
          return this.setAttribute("activePage", (info.previous ?? info.parent).info.id); // Default to back in time
      }

      if (transition in this.pages) this.sidebar.select(transition);
      else this.setAttribute("activePage", transition);
    };

    this.main.updatePages = () => {
      this.#updated(); // Rerender with new pages
      this.setAttribute("activePage", this.#active.info.id); // Re-render the current page
    };

    this.pagesById = {};
    Object.entries(pages).forEach((arr) => this.addPage(this.pagesById, arr));
    this.sidebar.pages = pages;

    if (active) this.setAttribute("activePage", active);
  }

  #activatePage = (id) => {
    const page = this.getPage(this.pagesById[id]);

    if (page) {
      const { id, label } = page.info;
      const queries = new URLSearchParams(window.location.search);
      queries.set("page", id);
      const project = queries.get("project");
      const value =
        isElectron || isStorybook
          ? `?${queries}`
          : `${window.location.origin}/${id === "/" ? "" : id}?${queries}`;
      history.pushState({ page: id, label, project }, label, value);
    }
  };

  // Track Pages By Id
  addPage = (acc, arr) => {
    let [id, page] = arr;

    const info = page.info;

    if (info.id) id = info.id;
    else page.info.id = id; // update id

    const pages = info.pages;

    // NOTE: This is not true for nested pages with more info...
    if (page instanceof HTMLElement) acc[id] = page;

    if (pages) {
      const pagesArr = Object.values(pages);

      const originalNext = page.info.next;
      page.info.next = pagesArr[0]; // Next is the first nested page

      // Update info with relative information
      Object.entries(pages).forEach(([newId, nestedPage], i) => {
        nestedPage.info.base = id;

        const previousPage = pagesArr[i - 1];
        nestedPage.info.previous =
          (previousPage?.info?.pages
            ? Object.values(previousPage.info.pages).pop()
            : previousPage) ?? page; // Previous is the previous nested page or the parent page
        nestedPage.info.next = pagesArr[i + 1] ?? originalNext; // Next is the next nested page or the original next page
        nestedPage.info.id = `${id}/${newId}`;
        nestedPage.info.parent = page;
      });

      // Register all pages
      Object.entries(pages).forEach((arr) => this.addPage(acc, arr));
    }

    return acc;
  };

  #first = true;
  updated() {
    const div = (this.shadowRoot ?? this).querySelector("div");
    div.style.height = "100vh";

    if (this.#first) {
      this.#first = false;
      this.#updated();
    }
  }

  render() {
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.display = "grid";
    this.style.gridTemplateColumns = "fit-content(0px) 1fr";
    this.style.position = "relative";

    if (this.name) this.sidebar.name = this.name;
    if (this.logo) this.sidebar.logo = this.logo;
    if ("renderNameInSidebar" in this) this.sidebar.renderName = this.renderNameInSidebar;

    return html`
      <div>${this.sidebar} ${this.subSidebar}</div>
      ${this.main}
    `;
  }
}

customElements.get("nwb-dashboard") || customElements.define("nwb-dashboard", Dashboard);
