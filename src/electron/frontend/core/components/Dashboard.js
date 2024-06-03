import { LitElement, html } from "lit";
import useGlobalStyles from "./utils/useGlobalStyles.js";

import { Main, checkIfPageIsSkipped } from "./Main.js";
import { Sidebar } from "./sidebar.js";
import { NavigationSidebar } from "./NavigationSidebar.js";

// Defined by Garrett late in GUIDE development to clearly separate global styles unrelated to SODA (May 20th, 2024)
import "../../assets/css/custom.css";

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
import "../../../../../node_modules/notyf/notyf.min.css";
import "../../assets/css/spur.css";
import "../../assets/css/main.css";
// import "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
import "../../../../../node_modules/@fortawesome/fontawesome-free/css/all.css";
// import "../../node_modules/select2/dist/css/select2.min.css"
// import "../../node_modules/@toast-ui/editor/dist/toastui-editor.css"
// import "../../node_modules/codemirror/lib/codemirror.css"
// import "../../node_modules/@yaireo/tagify/dist/tagify.css"
import "../../../../../node_modules/fomantic-ui/dist/semantic.min.css";
import "../../../../../node_modules/fomantic-ui/dist/components/accordion.min.css";
import "../../../../../node_modules/@sweetalert2/theme-bulma/bulma.css";
// import "../../node_modules/intro.js/minified/introjs.min.css"
import "../../assets/css/guided.css";
import { isElectron } from "../../utils/electron.js";
import { isStorybook, reloadPageToHome } from "../globals.js";
import { getCurrentProjectName, updateAppProgress } from "../progress/index.js";

// import "https://jsuites.net/v4/jsuites.js"
// import "https://bossanova.uk/jspreadsheet/v4/jexcel.js"

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
            activePage: { type: String, reflect: true },
            globalState: { type: Object, reflect: true },
        };
    }

    main;
    sidebar;
    subSidebar;

    // Custom Getter / Setter for Subtitle
    #subtitle;
    set subtitle(v) {
        this.#subtitle = v;
        this.sidebar.subtitle = v;
    }

    get subtitle() {
        return this.#subtitle;
    }

    pagesById = {};
    page;

    next = () => this.main.next();
    back = () => this.main.back();

    constructor(props = {}) {
        super();

        this.main = new Main();
        this.main.classList.add("dash-app");

        this.sidebar = new Sidebar();
        this.sidebar.onClick = (_, value) => {
            const id = value.info.id;
            if (this.page) this.page.to(id);
            else this.setAttribute("activePage", id);
        };

        this.subSidebar = new NavigationSidebar();
        this.subSidebar.onClick = async (id) => this.page.to(id);

        this.pages = props.pages ?? {};
        this.name = props.name;
        this.logo = props.logo;
        this.renderNameInSidebar = props.renderNameInSidebar ?? true;

        this.globalState = props.globalState; // Impose a static global state on pages that have none

        if (props.activePage) this.setAttribute("activePage", props.activePage);

        // Handle all pop and push state updates
        const pushState = window.history.pushState;

        const pushPopListener = (popEvent) => {
            if (popEvent.state) {
                const titleString = popEvent.state.title ?? popEvent.state.label;
                document.title = `${titleString} - ${this.name}`;
                const page = this.pagesById[popEvent.state.page]; // ?? this.pagesById[this.#activatePage]
                if (!page) return;
                if (page === this.page) return; // Do not rerender current page
                this.setMain(page);
            }
        };

        window.history.pushState = function (state) {
            pushPopListener({ state: state });
            return pushState.apply(window.history, arguments);
        };

        window.addEventListener("popstate", pushPopListener);
        window.addEventListener("pushstate", pushPopListener);

        this.#updated();
    }

    requestPageUpdate() {
        if (this.page) this.page.requestUpdate();
    }

    createRenderRoot() {
        return this;
    }

    attributeChangedCallback(key, _, latest) {
        super.attributeChangedCallback(...arguments);
        if (this.sidebar && (key === "name" || key === "logo")) this.sidebar[key] = latest;
        else if (key === "renderNameInSidebar") this.sidebar.renderName = latest === "true" || latest === true;
        else if (key === "pages") this.#updated(latest);
        else if (key.toLowerCase() === "activepage") {
            if (this.page && this.page.info.parent && this.page.info.section) {
                const currentProject = getCurrentProjectName();
                if (currentProject) updateAppProgress(latest, currentProject);
            }

            while (latest && !this.pagesById[latest]) latest = latest.split("/").slice(0, -1).join("/"); // Trim off last character until you find a page

            // Update sidebar states

            this.sidebar.selectItem(latest); // Just highlight the item
            this.sidebar.initialize = false;
            this.#activatePage(latest);
            return;
        } else if (key.toLowerCase() === "globalstate" && this.page) {
            this.page.info.globalState = JSON.parse(latest);
            this.page.requestUpdate();
        }
    }

    getPage(entry) {
        if (!entry) return reloadPageToHome();
        const page = entry.page ?? entry;
        if (page instanceof HTMLElement) return page;
        else if (typeof page === "object") return this.getPage(Object.values(page)[0]);
    }

    updateSections({ sidebar = true, main = false, header = false } = {}, globalState = this.page.info.globalState) {
        const info = this.page.info;
        let parent = info.parent;

        if (sidebar) {
            this.subSidebar.sections = this.#getSections(parent.info.pages, globalState); // Update sidebar items (if changed)
        }

        const { sections } = this.subSidebar;

        if (main) {
            if (this.page.header) delete this.page.header.sections; // Ensure sections are updated
            this.main.set({
                page: this.page,
                sections,
            });
        } else if (header) this.main.header.sections = sections; // Update header sections

        return sections;
    }

    setMain(page) {
        window.getSelection().empty(); // Remove user selection before transitioning

        // Update Previous Page
        const info = page.info;
        const previous = this.page;

        // if (previous === page) return // Prevent rerendering the same page

        const isNested = info.parent && info.section;

        const toPass = {};
        if (previous) {
            previous.dismiss(); // Dismiss all notifications for this page
            if (previous.info.globalState) toPass.globalState = previous.info.globalState; // Pass global state over if appropriate
            previous.active = false;
        }

        // On initial reload, load global state if you can
        if (isNested && !("globalState" in toPass)) toPass.globalState = this.globalState ?? page.load();

        // Update Active Page
        this.page = page;

        // Reset global state if page has no parent
        if (!this.page.info.parent) toPass.globalState = {};

        if (isNested) {
            let parent = info.parent;
            while (parent.info.parent) parent = parent.info.parent; // Lock sections to the top-level parent
            this.updateSections({ sidebar: true }, toPass.globalState);
            this.subSidebar.active = info.id; // Update active item (if changed)
            this.sidebar.hide(true);
            this.subSidebar.show();
        } else {
            this.sidebar.show();
            this.subSidebar.hide();
        }

        this.page.set(toPass, false);

        // Resolve the workflow configuration values before rendering the page
        const workflowConfig = page.workflow ?? (page.workflow = {});
        const workflowValues = page.info.globalState?.project?.workflow ?? {};

        Object.entries(workflowValues).forEach(([key, state = {}]) => {
            const config = workflowConfig[key] ?? (workflowConfig[key] = {});
            const value = (config.value = workflowValues[key]);

            if (state.elements) {
                const elements = state.elements;
                if (value) elements.forEach((el) => el.removeAttribute("hidden"));
                else elements.forEach((el) => el.setAttribute("hidden", true));
            }
        });

        // Ensure that all states are synced to the proper state for this page (e.g. conversions have been run)
        this.page
            .checkSyncState()
            .then(async () => {
                const projectName = info.globalState?.project?.name;

                this.subSidebar.header = projectName
                    ? `<h4 style="margin-bottom: 0px;">${projectName}</h4><small>Conversion Pipeline</small>`
                    : projectName;

                const { skipped } = this.subSidebar.sections[info.section]?.pages?.[info.id] ?? {};

                if (skipped) {
                    if (isStorybook) return; // Do not skip on storybook

                    const backwards = previous && previous.info.previous === this.page;

                    return (
                        Promise.all(
                            Object.entries(page.workflow).map(async ([_, state]) => {
                                if (typeof state.skip === "function" && !backwards) return await state.skip(); // Run skip functions
                            })
                        )

                            // Skip right over the page if configured as such
                            .then(async () => {
                                if (backwards) await this.main.onTransition(-1);
                                else await this.main.onTransition(1);
                            })
                    );
                }

                // Update main to render page
                this.updateSections({ sidebar: false, main: true });
            })

            .catch((e) => {
                const previousId = previous?.info?.id ?? -1;
                this.main.onTransition(previousId); // Revert back to previous page
                const hasHTML = /<[^>]*>/.test(e);
                page.notify(
                    hasHTML
                        ? e.message
                        : `<h4 style="margin: 0">Fallback to previous page after error occurred</h4><small>${e}</small>`,
                    "error"
                );
            })

            .finally(() => {
                if (this.#transitionPromise.value) this.#transitionPromise.trigger(this.main.page); // This ensures calls to page.to() can be properly awaited until the next page is ready
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
                    state = globalState.sections[section] = {
                        open: undefined,
                        active: false,
                        pages: {},
                    };

                let pageState = state.pages[id];
                if (!pageState)
                    pageState = state.pages[id] = {
                        visited: false,
                        active: false,
                        saved: false,
                        pageLabel: page.info.label,
                        pageTitle: page.info.title,
                    };

                info.states = pageState;

                state.active = false;
                pageState.active = false;

                // Check if page is skipped based on workflow state (if applicable)
                pageState.skipped = checkIfPageIsSkipped(page, globalState.project?.workflow);

                if (page.info.pages) this.#getSections(page.info.pages, globalState); // Show all states

                if (!("visited" in pageState)) pageState.visited = false;
                if (id === this.page.info.id) state.active = pageState.visited = pageState.active = true; // Set active page as visited
            }
        });

        return (globalState.sections = { ...globalState.sections }); // Update global state with new reference (to ensure re-render)
    };

    #transitionPromise = {};

    #updated(pages = this.pages) {
        const url = new URL(window.location.href);
        let active = url.pathname.slice(1);
        if (isElectron || isStorybook) active = new URLSearchParams(url.search).get("page");
        if (!active) active = this.activePage; // default to active page

        this.main.onTransition = async (transition) => {
            const promise =
                this.#transitionPromise.value ??
                (this.#transitionPromise.value = new Promise(
                    (resolve) =>
                        (this.#transitionPromise.trigger = (v) => {
                            this.#transitionPromise.value = null; // Reset promise
                            resolve(v);
                        })
                ));

            if (typeof transition === "number") {
                const info = this.page.info;
                const sign = Math.sign(transition);
                if (sign === 1) transition = info.next.info.id;
                else if (sign === -1) transition = (info.previous ?? info.parent).info.id; // Default to back in time
            }

            this.setAttribute("activePage", transition);

            return promise;
        };

        this.main.updatePages = () => {
            this.#updated(); // Rerender with new pages
            this.setAttribute("activePage", this.page.info.id); // Re-render the current page
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
                    (previousPage?.info?.pages ? Object.values(previousPage.info.pages).pop() : previousPage) ?? page; // Previous is the previous nested page or the parent page
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
        this.main.style.height = "100vh";

        if (this.name) this.sidebar.name = this.name;
        if (this.logo) this.sidebar.logo = this.logo;
        if ("renderNameInSidebar" in this) this.sidebar.renderName = this.renderNameInSidebar;

        return html`
            <div style="height: 100vh;">${this.sidebar} ${this.subSidebar}</div>
            ${this.main}
        `;
    }
}

customElements.get("nwb-dashboard") || customElements.define("nwb-dashboard", Dashboard);
