import { LitElement, css, html } from "lit";
import "./Button";
import { Button } from "./Button";

export class OptionalSection extends LitElement {
    static get styles() {
        return css`
            :host {
                text-align: center;
            }

            h2 {
                margin: 0;
            }

            .optional-section__content {
                text-align: left;
            }
        `;
    }

    static get properties() {
        return {
            state: { type: Boolean, reflect: true },
        };
    }

    get hidden() {
        return this.shadowRoot.querySelector(".optional-section__content").hidden;
    }

    attributeChangedCallback(...args) {
        super.attributeChangedCallback(...args);
        if (args[0] === "state") this.requestUpdate();
    }

    changed;

    constructor(props) {
        super();
        this.header = props.header ?? "";
        this.description = props.description ?? "This is the description of the optional section.";
        this.content = props.content ?? "";
        this.altContent = props.altContent ?? "";
        this.state = props.state;

        if (props.onChange) this.onChange = props.onChange;
    }

    onChange = () => {}; // User-defined function

    show(state) {
        this.toggled = true;
        const content = this.shadowRoot.querySelector(".optional-section__content");
        const altContent = this.shadowRoot.querySelector("#altContent");

        if (this.changed === undefined) this.changed = false;
        else this.changed = true;

        if (state === undefined) state = !content.classList.contains("hidden");
        else if (this.changed && this.hidden === state) this.onChange();

        if (state) {
            content.removeAttribute("hidden");
            altContent.setAttribute("hidden", true);
        } else {
            content.setAttribute("hidden", true);
            altContent.removeAttribute("hidden");
        }
    }

    yes = new Button({
        label: "Yes",
        color: "green",
        onClick: () => {
            this.show(true);
            this.yes.primary = true;
            this.no.primary = false;
        },
    });

    no = new Button({
        label: "No",
        color: "red",
        onClick: () => {
            this.show(false);
            this.yes.primary = false;
            this.no.primary = true;
        },
    });

    updated() {
        if (this.state === undefined) this.shadowRoot.querySelector(".optional-section__content").hidden = true;
        else if (this.state) this.yes.onClick();
        else this.no.onClick();
    }

    render() {
        return html`
            <div class="optional-section">
                <div class="optional-section__header">
                    ${this.header ? html`<h2>${this.header}</h2>` : ""}
                    <div>${this.description}</div>
                    <div class="optional-section__toggle">${this.yes} ${this.no}</div>
                </div>
                <div class="optional-section__content" hidden>
                    <slot>${this.content}</slot>
                </div>
                <div id="altContent" class="optional-section__content" hidden>${this.altContent}</div>
            </div>
        `;
    }
}

customElements.get("nwb-optional-section") || customElements.define("nwb-optional-section", OptionalSection);
