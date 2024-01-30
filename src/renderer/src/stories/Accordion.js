import { LitElement, css, html, unsafeCSS } from "lit";
import {
    emojiFontFamily,
    errorHue,
    errorSymbol,
    successHue,
    successSymbol,
    warningHue,
    warningSymbol,
} from "./globals";

import { Chevron } from "./Chevron";

const faSize = "1em";
const faColor = "#000000";

export class Accordion extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                display: block;
            }

            .header {
                display: flex;
                align-items: center;
                white-space: nowrap;
            }

            .header > * {
                line-height: initial;
                margin: 0;
                padding: 0;
            }

            .header > *:first-child {
                font-size: 1.2em;
                font-weight: bold;
                margin-right: 10px;
            }

            .guided--nav-bar-section {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                width: 100%;
                height: 100%;
            }

            .content {
                width: 100%;
            }

            .guided--nav-bar-dropdown {
                position: relative;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: nowrap;
                user-select: none;
                background-color: rgb(235, 235, 235);
                box-shadow: 0 5px 2px -2px silver;
            }

            .guided--nav-bar-section > * {
                padding: 3px 15px 3px 10px;
            }

            .guided--nav-bar-dropdown.active {
                border-left: none;
            }

            .guided--nav-bar-dropdown.error {
                border-left: 3px solid hsl(${errorHue}, 100%, 70%) !important;
            }

            .guided--nav-bar-dropdown.warning {
                border-left: 3px solid hsl(${warningHue}, 100%, 70%) !important;
            }

            .guided--nav-bar-dropdown.valid {
                border-left: 3px solid hsl(${successHue}, 100%, 70%) !important;
            }

            .guided--nav-bar-dropdown {
                margin-right: 50px;
            }

            .guided--nav-bar-dropdown::after {
                font-size: 0.8em;
                position: absolute;
                right: 25px;
                font-family: ${unsafeCSS(emojiFontFamily)};
            }

            .guided--nav-bar-dropdown.toggleable::after {
                right: 50px;
            }

            .guided--nav-bar-dropdown.toggleable:hover {
                cursor: pointer;
                background-color: gainsboro;
            }

            .guided--nav-bar-section-page {
                display: flex;
                width: calc((100% - 20px));
                justify-content: flex-start;
                margin-left: 15px;
                margin-top: 3px;
                padding-left: 5px;
            }

            .guided--container-nav-items {
                width: 100%;
                list-style: none;
                padding-left: 0px;
                overflow-y: auto;
            }

            .disabled {
                opacity: 0.5;
                pointer-events: none;
            }
        `;
    }

    static get properties() {
        return {
            name: { type: String, reflect: true },
            open: { type: Boolean, reflect: true },
            disabled: { type: Boolean, reflect: true },
            status: { type: String, reflect: true },
        };
    }

    constructor({
        name,
        subtitle,
        toggleable = true,
        content,
        open = false,
        status,
        disabled = false,
        contentPadding,
    } = {}) {
        super();
        this.name = name;
        this.subtitle = subtitle;
        this.content = content;
        this.open = open;
        this.status = status;
        this.disabled = disabled;
        this.toggleable = toggleable;
        this.contentPadding = contentPadding;
    }

    updated() {
        if (!this.content) return;
        this.toggle(!!this.open);
    }

    setStatus = (status) => {
        const dropdownElement = this.shadowRoot.getElementById("dropdown");
        dropdownElement.classList.remove("error", "warning", "valid");
        dropdownElement.classList.add(status);
        this.status = status;
    };

    onClick = () => {}; // Set by the user

    #updateClass = (name, element, force) => {
        if (force === undefined) element.classList.toggle(name);
        else {
            if (force) element.classList.remove(name);
            else element.classList.add(name);
        }
    };

    toggle = (forcedState) => {
        const hasForce = forcedState !== undefined;
        const toggledState = !this.open;

        const desiredState = hasForce ? forcedState : toggledState;
        const state = this.toOpen(desiredState);

        //remove hidden from child elements with guided--nav-bar-section-page class
        const section = this.shadowRoot.getElementById("section");
        section.toggleAttribute("hidden", hasForce ? !state : undefined);

        const dropdown = this.shadowRoot.getElementById("dropdown");
        this.#updateClass("active", dropdown, !state);

        //toggle the chevron
        const chevron = dropdown.querySelector("nwb-chevron");
        if (chevron) chevron.direction = state ? "bottom" : "right";

        if (desiredState === state) this.open = state; // Update state if not overridden
    };

    toOpen = (state = this.open) => {
        if (!this.toggleable)
            return true; // Force open if not toggleable
        else if (this.disabled) return false; // Force closed if disabled
        return state;
    };

    render() {
        const isToggleable = this.content && this.toggleable;

        return html`
            <div class="guided--nav-bar-section">
                <div
                    id="dropdown"
                    class="guided--nav-bar-dropdown ${isToggleable && "toggleable"} ${this.disabled
                        ? "disabled"
                        : ""} ${this.status}"
                    @click=${() => isToggleable && this.toggle()}
                >
                    <div class="header">
                        <span>${this.name}</span>
                        <small>${this.subtitle}</small>
                    </div>
                    ${isToggleable
                        ? new Chevron({
                              direction: "right",
                              color: faColor,
                              size: faSize,
                          })
                        : ""}
                </div>
                ${this.content
                    ? html`<div
                          id="section"
                          class="content hidden ${this.disabled ? "disabled" : ""}"
                          style="padding: ${this.contentPadding ?? "20px"}"
                      >
                          ${this.content}
                      </div>`
                    : ""}
            </div>
        `;
    }
}

customElements.get("nwb-accordion") || customElements.define("nwb-accordion", Accordion);

// Object.entries(info.pages).map(([id, state]) => {

//   return html`<div
//     data-section="${sectionName}"
//     class="
//       guided--nav-bar-section-page
//       hidden
//       ${state.visited ? " completed" : " not-completed"}
//       ${state.active ? "active" : ""}"f
//     "
//     @click=${() => this.onClick(id)}
//   >
//     <div class="guided--nav-bar-section-page-title">
//       ${state.pageLabel ?? id}
//     </div>
//   </div>
// </div>
// `
// })
