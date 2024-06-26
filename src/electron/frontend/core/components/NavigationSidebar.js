import { LitElement, html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

const autoOpenValue = Symbol("SECTION_AUTO_OPEN");

function isHTML(str) {
    var doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
}

export class NavigationSidebar extends LitElement {
    static get properties() {
        return {
            sections: { type: Object, reflect: false },
            active: { type: String, reflect: true },
            header: { type: Object, reflect: false },
        };
    }

    #header;

    constructor({ sections = {}, header } = {}) {
        super();
        if (header) this.header = this.#header = header;
        this.sections = sections;
    }

    createRenderRoot() {
        return this;
    }

    attributeChangedCallback(...args) {
        const attrs = ["page", "active"];
        super.attributeChangedCallback(...args);
        if (attrs.includes(args[0])) this.requestUpdate();
    }

    #queue = [];

    updated() {
        this.nav = (this.shadowRoot ?? this).querySelector("#guided-nav");

        Object.entries(this.sections).map(([sectionName, info]) => {
            const isActive = Object.values(info.pages).find((state) => state.active);

            const isAllSkipped = Object.values(info.pages).every((state) => state.skipped);
            this.#updateClass(
                "skipped",
                this.querySelector("[data-section-name='" + sectionName + "']"),
                !isAllSkipped
            );

            if (isActive) this.#toggleDropdown(sectionName, autoOpenValue);
            else if (info.open === autoOpenValue) this.#toggleDropdown(sectionName, false);
            else this.#toggleDropdown(sectionName, info.open);
        });

        if (this.#queue.length) {
            this.#queue.forEach((content) => content());
            this.#queue = [];
        }
    }

    show() {
        if (this.nav) this.nav.style.display = "block";
        else this.#queue.push(() => this.show());
    }

    hide() {
        if (this.nav) this.nav.style.display = "none";
        else this.#queue.push(() => this.hide());
    }

    onClick = () => {}; // Set by the user

    #updateClass = (name, element, force) => {
        if (force === undefined) element.classList.toggle(name);
        else {
            if (force) element.classList.remove(name);
            else element.classList.add(name);
        }
    };

    #toggleDropdown = (sectionName, forcedState) => {
        const hasForce = forcedState !== undefined;
        //remove hidden from child elements with guided--nav-bar-section-page class
        const children = this.querySelectorAll("[data-section='" + sectionName + "']");
        for (const child of children) child.toggleAttribute("hidden", hasForce ? !forcedState : undefined);

        const dropdown = this.querySelector("[data-section-name='" + sectionName + "']");

        const toggledState = !this.sections[sectionName].open;

        //toggle the chevron
        const chevron = dropdown.querySelector("i");
        this.#updateClass("fa-chevron-right", chevron, forcedState);
        this.#updateClass("fa-chevron-down", chevron, hasForce ? !forcedState : forcedState);

        this.sections[sectionName].open = hasForce ? forcedState : toggledState;
    };

    render() {
        const header = this.header ?? this.#header;

        return html`
            <nav id="guided-nav" class="guided--nav">
                ${header
                    ? html` ${isHTML(header) ? unsafeHTML(header) : html`<h4>${header}</h4>`}
                          <hr />`
                    : ""}
                <ul id="guided-nav-items" class="guided--container-nav-items">
                    ${Object.entries(this.sections)
                        .map(([sectionName, info]) => {
                            return html`
                                <div class="guided--nav-bar-section">
                                    <div
                                        class="guided--nav-bar-dropdown"
                                        data-section-name=${sectionName}
                                        @click=${() => this.#toggleDropdown(sectionName)}
                                    >
                                        <p class="guided--help-text mb-0">${sectionName}</p>
                                        <i class="fas fa-chevron-right"></i>
                                    </div>
                                    ${Object.entries(info.pages).map(([id, state]) => {
                                        return html`<div
              data-section="${sectionName}"
              class="
                guided--nav-bar-section-page
                hidden
                ${state.skipped ? " skipped" : ""}
                ${state.visited && !state.skipped ? " completed" : " not-completed"}
                ${state.active ? "active" : ""}"f
              "
              @click=${() => this.onClick(id)}
            >
              <div class="guided--nav-bar-section-page-title">
                ${state.pageLabel ?? id}
              </div>
            </div>
          </div>
          `;
                                    })}
                                </div>
                            `;
                        })
                        .flat()}
                </ul>
            </nav>
        `;
    }
}

customElements.get("nwb-navigation-sidebar") || customElements.define("nwb-navigation-sidebar", NavigationSidebar);
