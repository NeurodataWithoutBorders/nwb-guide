import { LitElement, css, html } from "lit";
import { errorHue, successHue, warningHue } from "../globals";

export class TabItem extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 5px 10px;
                user-select: none;
                background-color: rgb(235, 235, 235);
                flex-grow: 1;
                min-width: 200px;
                width: -webkit-fill-available;
            }

            :host([disabled]) {
                opacity: 0.5;
            }

            :host(:not(:only-child)) {
                cursor: pointer;
            }

            :host([data-status="error"]) {
                border-bottom: 2px solid hsl(${errorHue}, 100%, 70%) !important;
            }

            :host([data-status="warning"]) {
                border-bottom: 2px solid hsl(${warningHue}, 100%, 70%) !important;
            }

            :host([data-status="valid"]) {
                border-bottom: 2px solid hsl(${successHue}, 100%, 70%) !important;
            }

            .status {
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
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

            .name {
                font-size: 110%;
                font-weight: bold;
            }

            .subtitle {
                font-size: 90%;
            }

            :host(hover:not(:only-child)) {
                background-color: gainsboro;
            }

            :host([selected]:not(:only-child)) {
                background-color: gainsboro;
            }
        `;
    }

    static get properties() {
        return {
            selected: { type: Boolean, reflect: true },
            disabled: { type: Boolean, reflect: true },
            status: { type: Object },
        };
    }

    constructor({ status = {}, name = "Tab", subtitle, content, selected = false, disabled = false, onClick } = {}) {
        super();
        this.status = status;
        this.name = name;
        this.subtitle = subtitle;
        this.content = content;
        this.selected = selected;
        this.disabled = disabled
        if (onClick) this.onClick = onClick;
        this.addEventListener("click", () => this.#select());
    }

    #select = (select = true) => {
        this.selected = select;
        if (select) this.onClick();
    };

    onClick = () => {};

    render() {
        const warnings = this.status?.warnings ?? 0;
        const errors = this.status?.errors ?? 0;

        const status = errors ? "error" : warnings ? "warning" : "valid";
        this.setAttribute("data-status", status);

        if (this.content) {
            if (this.disabled) this.content.setAttribute("disabled", true);
            else this.content.removeAttribute("disabled");
        }

        return html`
            <div>
                <span class="name">${this.name}</span><br />
                <span class="subtitle">${this.subtitle}</span>
            </div>
            <div class="statuses">
                ${Object.entries(this.status).map(([status, value]) => {
                    if (!value) return;
                    return html` <span class="status ${status}">${typeof value === "number" ? value : ""}</span> `;
                })}
            </div>
        `;
    }
}

customElements.get("nwb-tab-item") || customElements.define("nwb-tab-item", TabItem);
