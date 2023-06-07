import { LitElement, html } from "lit";
import useGlobalStyles from "./utils/useGlobalStyles.js";
import { GuidedFooter } from "./pages/guided-mode/GuidedFooter";
import { GuidedCapsules } from "./pages/guided-mode/GuidedCapsules.js";
import { GuidedHeader } from "./pages/guided-mode/GuidedHeader.js";

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
    }

    render() {
        let { page = "", sections = {} } = this.toRender ?? {};

        let footer = page?.footer; // Page-specific footer
        let header = page?.header; // Page-specific header
        let capsules = page?.capsules; // Page-specific capsules

        if (page) {
            const info = page.info ?? {};

            // Default Footer Behavior
            if (footer === true || (!("footer" in page) && info.parent)) {
                // Go to home screen if there is no next page
                if (!info.next)
                    footer = {
                        next: "Back to Home Screen",
                        exit: "Exit",
                        onNext: () => this.onTransition("/"),
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
                    if (pages.length > 1)
                        capsules = {
                            n: pages.length,
                            selected: pages.map((o) => o.pageLabel).indexOf(page.info.label),
                        };
                }

                if (header === true || !("header" in page)) {
                    const sectionNames = Object.keys(sections);
                    header = {
                        sections: sectionNames,
                        selected: sectionNames.indexOf(info.section),
                    };
                }
            }
        }

        const headerEl = header ? new GuidedHeader(header) : html`<div></div>`; // Render for grid

        const capsuleEl = capsules ? new GuidedCapsules(capsules) : '';
        const footerEl = footer ? new GuidedFooter(footer) : html`<div></div>`; // Render for grid

        const title = page.info?.title
        return html`
            ${headerEl}
            ${capsules ? html`<div style="width: 100%; text-align: center; padding-top: 15px;">${capsuleEl}</div>` : html`<div style="height: 25px;"></div>`}
            <main id="content" class="js-content" style="overflow: hidden; display: flex;">
                <section class="section js-section u-category-windows"> 
                    ${title ? html`<div>
                        <h1 class="title">${title}</h1>
                        <hr>
                    </div>` : ''}
                    <div style="height: 10px;"></div>
                    ${page}
                </section>
            </main>
            ${footerEl}
        `;
    }
}

customElements.get("nwb-main") || customElements.define("nwb-main", Main);
