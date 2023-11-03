import { LitElement, html, css } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

export class Button extends LitElement {
    constructor({ icon = null, primary, label, color = null, size, onClick, buttonStyles } = {}) {
        super();
        this.icon = icon;
        this.label = label;
        this.primary = primary;
        this.color = color;
        this.size = size;
        this.onClick = onClick;
        this.buttonStyles = buttonStyles || {};
    }

    static get styles() {
        return css`
            :host {
                display: inline-block;
            }

            .storybook-button {
                padding: 10px 15px;
                font-family: "Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
                font-weight: 700;
                border: 0;
                border-radius: 5px;
                cursor: pointer;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .button-icon {
                margin-right: 7px;
            }

            svg {
                margin: 0px !important;
                width: auto;
                height: 25px;
            }

            .storybook-button--primary {
                color: white;
                background-color: hsl(190, 60%, 36%);
            }
            .storybook-button--secondary {
                color: #333;
                background-color: transparent;
                box-shadow: rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset;
            }
            .storybook-button--small {
                font-size: 12px;
                padding: 10px 16px;
            }
            .storybook-button--medium {
                font-size: 14px;
                padding: 11px 20px;
            }
            .storybook-button--large {
                font-size: 16px;
                padding: 12px 24px;
            }

            [disabled] {
                opacity: 50%;
                cursor: default;
            }
        `;
    }

    static get properties() {
        return {
            primary: { type: Boolean },
            color: { type: String },
            size: { type: String },
            onClick: { type: Function },
            label: { type: String },
            icon: { type: String },
            disabled: { type: Boolean },
        };
    }

    render() {
        const mode = this.primary ? "storybook-button--primary" : "storybook-button--secondary";

        return html`
            <button
                type="button"
                ?disabled=${this.disabled}
                class=${["storybook-button", `storybook-button--${this.size || "medium"}`, mode].join(" ")}
                style=${styleMap(
                    this.primary
                        ? { ...this.buttonStyles, backgroundColor: this.color }
                        : { ...this.buttonStyles, color: this.color }
                )}
                @click=${this.onClick}
            >
                ${this.icon
                    ? html`<span class="button-icon"
                          >${this.icon instanceof HTMLElement ? this.icon : unsafeHTML(this.icon)}</span
                      >`
                    : ""}
                <slot>${this.label ?? ""}</slot>
            </button>
        `;
    }
}

customElements.get("nwb-button") || customElements.define("nwb-button", Button);
