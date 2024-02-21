import { LitElement, css, html } from "lit";
import {
    errorHue,
    warningHue,
} from "./globals";

export class Tabs extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                display: block;
            }

            #tab-toggles {
                display: flex;
                align-items: center;
                overflow-x: auto;
            }

            .toggle {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                cursor: pointer;
                user-select: none;
                background-color: rgb(235, 235, 235);
                flex-grow: 1;
                min-width: 200px;
                width: fit-content;
                border-left: 2px solid gray;
            }

            .toggle:first-child {
                border-left: none;
            }

            .status {
                border-radius: 50%;
                border: 1px solid #BFBFBF;
                width: 25px;
                aspect-ratio: 1 / 1;
                height: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .statuses {
                display: flex;
                gap: 5px;
            }

            .status.errors {
                background-color: hsl(${errorHue}, 100%, 70%);
                color: white;
            }

            .status.warnings {
                background-color: hsl(${warningHue}, 100%, 70%);
                color: black;
            }

            .toggle:hover {
                background-color: gainsboro;
            }

            .toggle.active {
                background-color: gainsboro;
            }

            .toggle .name {
                font-size: 110%;
                font-weight: bold;
            }

            .toggle .subtitle {
                font-size: 90%;
            }

            .content {
                display: none;
            }
        `;
    }

    static get properties() {
        return {
            items: { type: Array },
            // name: { type: String, reflect: true },
            // open: { type: Boolean, reflect: true },
            // disabled: { type: Boolean, reflect: true },
            // status: { type: String, reflect: true },
        };
    }

    constructor({
        items = [],
        selected = 0,
        contentPadding = "15px",
    } = {}) {
        super();
        this.items= items
        this.selected = selected
        this.contentPadding = contentPadding
    }

    updated() {
        this.toggle(this.selected)
    }

    toggle(index) {
        const toggles = this.shadowRoot.getElementById("tab-toggles").children;
        toggles[index].click()
    }

    render() {


        return html`
            <div id="tab-toggles">
            ${this.items.map((item, i) => {
                return html`
                    <div class="toggle" 
                    
                        @click=${() => {

                            Array.from(this.shadowRoot.getElementById("tab-toggles").children).forEach((toggle, j) => {
                                toggle.classList.toggle("active", i === j)
                            })

                            Array.from(this.shadowRoot.getElementById("tab-content").children).forEach((content, j) => {
                                content.style.display = i === j ? 'block' : ""
                            })
                        }}
                    >
                        <div>
                            <span class="name">${item.name}</span><br>
                            <span class="subtitle">${item.subtitle}</span>
                        </div>
                        <div class="statuses">
                            ${Object.entries(item.status).map(([status, value]) => {
                                if (!value) return
                                return html`
                                    <span class="status ${status}">${typeof value === 'number' ? value : ''}</span>
                                `;
                            })}
                        </div>
                    </div>
                `;
            })}
            </div>
            <div id="tab-content">
                ${this.items.map((item) => {
                    return html`
                        <div 
                            class="content" 
                            style="padding: ${this.contentPadding}"
                        >
                            ${item.content}
                        </div>
                    `;
                })}
            </div>
        `
    }
}

customElements.get("nwb-tabs") || customElements.define("nwb-tabs", Tabs);
