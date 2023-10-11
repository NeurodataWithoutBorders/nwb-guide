import { LitElement, html } from "lit";
import useGlobalStyles from "./utils/useGlobalStyles.js";

const componentCSS = `

`;

export class NavigationSidebar extends LitElement {
    static get styles() {
        return useGlobalStyles(
            componentCSS,
            (sheet) => sheet.href && sheet.href.includes("bootstrap"),
            this.shadowRoot
        );
    }

    static get properties() {
        return {
            sections: { type: Object, reflect: false },
            active: { type: String, reflect: true },
        };
    }

    constructor({ sections = {} } = {}) {
        super();
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
            if (isActive) this.#toggleDropdown(sectionName, true);
            else this.#toggleDropdown(sectionName, false);
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

    #updateClass = (name, el, force) => {
        if (force === undefined) el.classList.toggle(name);
        else {
            if (force) el.classList.remove(name);
            else el.classList.add(name);
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
        return html`
            <nav id="guided-nav" class="guided--nav">
                <h4>Sections</h4>
                <hr />
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
                ${state.visited ? " completed" : " not-completed"}
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
