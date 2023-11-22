import { LitElement, html } from "lit";
import useGlobalStyles from "./utils/useGlobalStyles.js";
import { GuidedFooter } from "./pages/guided-mode/GuidedFooter.js";
import { GuidedCapsules } from "./pages/guided-mode/GuidedCapsules.js";
import { GuidedHeader } from "./pages/guided-mode/GuidedHeader.js";

import { unsafeHTML } from "lit/directives/unsafe-html.js";

const componentCSS = `
    :host {
        display: grid;
        grid-template-rows: fit-content(100%) 1fr fit-content(100%);
    }
`;

export class Main extends LitElement {
    static get styles() {
        return useGlobalStyles(
            componentCSS,
            (sheet) => sheet.href && sheet.href.includes("bootstrap"),
            this.shadowRoot
        );
    }

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

    #queue = [];

    set(toRender) {
        let page = toRender.page ?? toRender;

        if (typeof page === "function") page = new page();
        page.onTransition = this.onTransition;
        page.updatePages = this.updatePages;

        if (this.content) this.toRender = toRender.page ? toRender : { page };
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

    render() {
        let { page = "", sections = {} } = this.toRender ?? {};

        let footer = page?.footer; // Page-specific footer
        let header = page?.header; // Page-specific header
        let capsules = page?.capsules; // Page-specific capsules

        if (page) {
            this.to = page.to;

            const info = page.info ?? {};

            // Default Footer Behavior
            if (footer === true || (!("footer" in page) && info.parent)) {
                // Go to home screen if there is no next page
                if (!info.next)
                    footer = {
                        exit: false,
                        onNext: () => this.toRender.page.to("/"),
                    };
                // Allow navigating laterally if there is a next page
                else footer = true;
            }

            if (footer === true) footer = {};
            if (footer && "onNext" in footer && !("next" in footer)) footer.next = "Save and Continue";

            // Default Capsules Behavior
            const section = sections[info.section];
            if (section) {
                if (capsules === true || !("capsules" in page)) {
                    let pages = Object.values(section.pages);
                    const pageIds = Object.keys(section.pages);
                    if (pages.length > 1) {
                        const capsulesProps = {
                            n: pages.length,
                            selected: pages.map((o) => o.pageLabel).indexOf(page.info.label),
                        };

                        capsules = new GuidedCapsules(capsulesProps);
                        capsules.onClick = (i) => this.toRender.page.to(pageIds[i]);
                    }
                }

                if (header === true || !("header" in page) || !("sections" in page.header)) {
                    const sectionNames = Object.keys(sections);

                    header = page.header && typeof page.header === "object" ? page.header : {};
                    header.sections = sectionNames;
                    header.selected = sectionNames.indexOf(info.section);
                }
            }
        }

        const headerEl = header ? new GuidedHeader(header) : html`<div></div>`; // Render for grid

        const footerEl = footer ? new GuidedFooter(footer) : html`<div></div>`; // Render for grid

        const title = header?.title ?? page.info?.title;

        let subtitle = header?.subtitle;
        if (typeof subtitle === "function") subtitle = subtitle(); // Generate custom header content if required

        let controls = header?.controls;
        if (typeof controls === "function") controls = controls(); // Generate custom header content if required

        return html`
            ${headerEl}
            ${
                capsules
                    ? html`<div style="width: 100%; text-align: center; padding-top: 15px;">${capsules}</div>`
                    : html``
            }
            ${
                title
                    ? html`<div
                          style="position: sticky; padding: 0px 50px; top: 0; left: 0; background: white; z-index: 1; ${capsules
                              ? ""
                              : "padding-top: 35px;"}"
                      >
                          <div style="display: flex; flex: 1 1 0px; justify-content: space-between; align-items: end;">
                              <div style="line-height: 1em; color: gray;">
                                  <h1 class="title" style="margin: 0; padding: 0; color:black;">${title}</h1>
                                  <small>${unsafeHTML(subtitle)}</small>
                              </div>
                              <div style="padding-left: 25px;">${controls}</div>
                          </div>
                          <hr style="margin-bottom: 0;" />
                      </div>`
                    : ""
            }

            <main id="content" class="js-content" style="overflow: hidden; ${
                capsules || title ? "" : "padding-top: 35px;"
            }"">
                <section class="section">${page}</section>
            </main>
            ${footerEl}
        `;
    }
}

customElements.get("nwb-main") || customElements.define("nwb-main", Main);
