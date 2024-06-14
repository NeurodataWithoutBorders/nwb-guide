import { LitElement, html } from "lit";
import { GuidedFooter } from "./pages/guided-mode/GuidedFooter.js";
import { GuidedHeader } from "./pages/guided-mode/GuidedHeader.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

export const checkIfPageIsSkipped = (page, workflowValues = {}) => {
    if (page.workflow) {
        const workflow = page.workflow;
        const skipped = Object.entries(workflow).some(([key, state]) => {
            const value = workflowValues[key];
            if (state.condition) return state.condition(value) ? state.skip : false;
            if (!value) return state.skip;
        });

        return skipped;
    }

    return false;
};

export class Main extends LitElement {
    static get properties() {
        return {
            toRender: { type: Object, reflect: false },
        };
    }

    history = [];

    constructor({ toRender } = {}) {
        super();
        this.toRender = toRender;
    }

    createRenderRoot() {
        return this;
    }

    attributeChangedCallback(...args) {
        const attrs = ["toRender"];
        super.attributeChangedCallback(...args);
        if (attrs.includes(args[0])) this.requestUpdate();
    }

    onTransition = () => {}; // user-defined function
    updatePages = () => {}; // user-defined function

    next = () => (this.footer ? this.footer.onNext() : this.toRender.page.to(1));
    back = () => (this.footer ? this.footer.onBack() : this.toRender.page.to(-1));

    #queue = [];

    set(toRender) {
        let page = toRender.page ?? toRender;

        if (typeof page === "function") page = new page();
        page.onTransition = this.onTransition;
        page.updatePages = this.updatePages;

        if (this.content)
            this.toRender = toRender.page ? toRender : { page }; // Ensure re-render in either case
        else this.#queue.push(page);
    }

    updated() {
        this.content = (this.shadowRoot ?? this).querySelector("#content");
        if (this.#queue.length) {
            this.#queue.forEach((content) => this.set(content));
            this.#queue = [];
        }

        this.style.overflow = "hidden";
        this.content.style.height = "100%";

        // Reset scroll position on page change
        const section = this.content.children[0];
        section.scrollTop = 0;
    }

    #hasAvailableNextPages = (page) => {
        const allNext = [];
        let currentPage = page;
        const workflowValues = page.info.globalState?.project?.workflow ?? {};
        while (currentPage.info.next) {
            const nextPage = currentPage.info.next;
            const skipped = checkIfPageIsSkipped(nextPage, workflowValues);
            if (!skipped) allNext.push(nextPage);
            currentPage = nextPage;
        }

        return allNext.length > 0;
    };

    render() {
        let { page = "", sections = {} } = this.toRender ?? {};

        let footer = page?.footer; // Page-specific footer

        if (page) {
            this.to = page.to;

            const info = page.info ?? {};

            // Default Footer Behavior
            if (info.parent) {
                if (!("footer" in page)) footer = true; // Allow navigating laterally if there is a next page

                const hasAvailableNextPages = this.#hasAvailableNextPages(page);

                // Go to home screen if there is no next page
                if (!info.next || !hasAvailableNextPages) {
                    footer = Object.assign(
                        {
                            exit: false,
                            next: "Exit Pipeline",
                            onNext: () => this.toRender.page.to("/"),
                        },
                        footer && typeof footer === "object" ? footer : {}
                    );
                }
            }

            if (footer === true) footer = {};
            if (footer && "onNext" in footer && !("next" in footer)) footer.next = "Next";
        }

        const footerEl = footer ? (this.footer = new GuidedFooter(footer)) : html`<div></div>`; // Render for grid
        if (!footer) delete this.footer; // Reset footer

        this.header = new MainHeader(sections, page);

        return html`
            ${this.header}

            <main id="content" class="js-content" style="overflow: hidden;">
                <section class="section">${page}</section>
            </main>
            ${footerEl}
        `;
    }
}

customElements.get("nwb-main") || customElements.define("nwb-main", Main);

class MainHeader extends LitElement {
    static get properties() {
        return {
            sections: { type: Object },
        };
    }

    constructor(sections, page) {
        super();
        this.sections = sections;
        this.page = page;
    }

    createRenderRoot() {
        return this;
    }

    render() {
        let { page = "", sections = {} } = this;

        delete this.title; // Reset title

        let config = page?.header; // Page-specific header

        if (page) {
            const info = page.info ?? {};

            const section = sections[info.section];
            if (section) {
                if (config === true || !("header" in page) || !("sections" in page.header)) {
                    const sectionNames = Object.entries(sections)
                        .filter(([name, info]) => !Object.values(info.pages).every((state) => state.skipped))
                        .map(([name]) => name);

                    config = page.header && typeof page.header === "object" ? page.header : {};
                    config.sections = sectionNames;
                    config.selected = sectionNames.indexOf(info.section);
                }
            }
        }

        const headerEl = config ? (this.header = new GuidedHeader(config)) : html`<div></div>`; // Render for grid
        if (!config) delete this.header; // Reset header

        const title = config?.title ?? page.info?.title;
        if (title) this.title = title; // Set title if not undefined

        let subtitle = config?.subtitle;
        if (typeof subtitle === "function") subtitle = subtitle(); // Generate custom header content if required

        let controls = config?.controls;
        if (typeof controls === "function") controls = controls(); // Generate custom header content if required

        return html`
            <div style="overflow: hidden; ${this.title ? "" : "padding-top: 35px;"}">
                ${headerEl}
                ${this.title
                    ? html`<div
                          style="position: sticky; padding: 0px 50px; top: 0; left: 0; background: white; z-index: 1; padding-top: 35px;"
                      >
                          <div style="display: flex; flex: 1 1 0px; justify-content: space-between; align-items: end;">
                              <div style="line-height: 1em; color: gray;">
                                  <h1 class="title" style="margin: 0; padding: 0; color:black;">${this.title}</h1>
                                  <small>${subtitle instanceof HTMLElement ? subtitle : unsafeHTML(subtitle)}</small>
                              </div>
                              <div style="padding-left: 25px; display: flex; gap: 10px;">${controls}</div>
                          </div>
                          <hr style="margin-bottom: 0;" />
                      </div>`
                    : ""}
            </div>
        `;
    }
}

customElements.get("nwb-main-header") || customElements.define("nwb-main-header", MainHeader);
