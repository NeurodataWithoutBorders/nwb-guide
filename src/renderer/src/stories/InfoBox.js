import { LitElement, css, html } from "lit";
import { Chevron } from "./Chevron";

export class InfoBox extends LitElement {
    static get styles() {
        return css`
            @keyframes demo-box-fade-in {
                0% {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            :host {
                display: inline-block;
                width: 100%;
            }

            .icon {
                margin-right: 10px;
                font-size: 12px;
                color: #000;
            }

            nwb-chevron {
                transform: scale(70%);
                margin-left: 5px;
            }

            .guided--info-dropdown {
                display: flex;
                align-self: flex-start;
                flex-wrap: nowrap;
                justify-content: start;
                align-items: center;
                cursor: pointer;
            }

            #header {
                margin: 0px;
                font-weight: 500;
                font-size: 12px;
                color: #000;
            }

            .guided--info-container {
                background-color: var(--color-transparent-soda-green);

                margin-top: 5px;
                padding: 10px;

                display: none;
                flex-direction: column;
                justify-content: center;

                text-align: justify;

                border: 1px solid var(--color-light-green);
                border-radius: 3px;
            }

            .guided--info-container .guided--help-text {
                font-size: 13px;
                color: hsl(0, 0%, 22%);
            }

            .container-open {
                display: flex;
                margin-bottom: 0px;
                animation: demo-box-fade-in 0.2s cubic-bezier(0, 0.2, 0.2, 0.96);
            }
            
        `;
    }

    constructor({ header = "Info", content, type = "info", open = false } = {}) {
        super();
        this.header = header;
        this.content = content;
        this.type = type;
        this.open = open
    }

    updated() {
        const infoDropdown = this.shadowRoot.querySelector(".guided--info-dropdown");
        const infoTextElement = infoDropdown.querySelector("#header");

        // Auto-add icons if they're not there
        if (this.type === "info") infoTextElement.insertAdjacentHTML("beforebegin", `<span class="icon">ℹ️</span>`);
        if (this.type === "warning") infoTextElement.insertAdjacentHTML("beforebegin", ` <span class="icon">⚠️</span>`);

        const infoContainer = infoDropdown.nextElementSibling;
        infoDropdown.onclick = () => this.onToggle(!infoContainer.classList.contains("container-open"))

        this.onToggle()
    }

    onToggle(open = this.open) {
        const infoDropdown = this.shadowRoot.querySelector(".guided--info-dropdown");

        const infoContainer = infoDropdown.nextElementSibling;
        const infoContainerChevron = infoDropdown.querySelector("nwb-chevron");

        if (open) {
            infoContainerChevron.direction = "bottom";
            infoContainer.classList.add("container-open");
        } else {
            infoContainerChevron.direction = "right";
            infoContainer.classList.remove("container-open");
        }
}

render() {
    return html`
            <div class="guided--info-dropdown">
                <span id="header"> ${this.header} </span>
                ${new Chevron({ direction: "right" })}
            </div>
            <div class="guided--info-container">
                <span class="guided--help-text">${this.content}</span>
            </div>
        `;
}
}

customElements.get("nwbguide-info-box") || customElements.define("nwbguide-info-box", InfoBox);
