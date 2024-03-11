import { LitElement, css, html } from "lit";
import "./Button";
import { Button } from "./Button";

export class OptionalSection extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
            }

            h2 {
                margin: 0;
                margin-bottom: 10px;
            }

            .optional-section__toggle {
                margin-bottom: 5px;
            }

            .optional-section__content {
                text-align: left;
            }

        `;
    }

    get hidden() {
        return this.shadowRoot.querySelector(".optional-section__content").hidden;
    }

    attributeChangedCallback(...args) {
        super.attributeChangedCallback(...args);
        if (args[0] === "value") this.requestUpdate();
    }

    changed;

    constructor(props) {
        super();
        this.header = props.header ?? "";
        this.description = props.description ?? "";
        this.content = props.content ?? "";
        this.altContent = props.altContent ?? "";
        this.value = props.value;
        this.size = props.size;

        if (props.onChange) this.onChange = props.onChange;
        this.addEventListener("change", () => this.onChange(this.value))
    }

    onChange = () => {}; // User-defined function

    show(state) {
        this.toggled = true;
        const content = this.shadowRoot.querySelector(".optional-section__content");
        const altContent = this.shadowRoot.querySelector("#altContent");

        this.value = state;

        if (state === undefined) state = !content.classList.contains("hidden");
        
        this.onChange(state);

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
        console.log(this);
        if (this.value === undefined) this.shadowRoot.querySelector(".optional-section__content").hidden = true;
        else if (this.value) this.yes.onClick();
        else this.no.onClick();
    }

    render() {
        
        this.yes.size = this.size;
        this.no.size = this.size;

        return html`
            <div class="optional-section__header">
                ${this.header ? html`<h2>${this.header}</h2>` : ""}
                <div>${this.description}</div>
                <div class="optional-section__toggle">${this.yes} ${this.no}</div>
            </div>
            <div class="optional-section__content" hidden>
                <slot>${this.content}</slot>
            </div>
            <div id="altContent" class="optional-section__content" hidden>${this.altContent}</div>
        `;
    }
}

customElements.get("nwb-optional-section") || customElements.define("nwb-optional-section", OptionalSection);
