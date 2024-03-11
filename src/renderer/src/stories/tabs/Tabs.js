import { LitElement, css, html } from "lit";
import { TabItem } from "./TabItem";

export class Tabs extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                display: grid;
                height: 100%;
                grid-template-rows: auto 1fr;
            }

            #tab-toggles {
                display: flex;
                flex-wrap: wrap;
                overflow-x: auto;
                background-color: whitesmoke;
                gap: 5px;
                padding: 3px;
                padding-bottom: 0;
            }

            #tab-toggles.single {
                padding: 0;
            }

            #tab-content {
                height: 100%;
                overflow-y: hidden;
            }

            .content {
                overflow-y: auto;
                height: max-content;
                max-height: 100%;
                display: none;
            }

            .content [disabled] {
                opacity: 0.5;
                pointer-events: none;
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

    constructor({ items = [], selected = 0, contentPadding = "15px" } = {}) {
        super();
        this.items = items;
        this.selected = selected;
        this.contentPadding = contentPadding;
    }

    updated() {
        this.toggle(this.selected);
    }

    toggle(index) {
        const toggles = this.shadowRoot.querySelectorAll("nwb-tab-item");
        if (toggles.length) toggles[index].click();
    }

    render() {
        return html`
            <div id="tab-toggles" class="${this.items.length > 1 ? "" : "single"}">
                ${this.items.map((item, i) => {
                    const tabItem = item instanceof TabItem ? item : new TabItem({ ...item });

                    tabItem.selected = i === this.selected;

                    tabItem.onClick = () => {
                        const tabItems = this.shadowRoot.querySelectorAll("nwb-tab-item");
                        Array.from(tabItems).forEach((item, j) => (i === j ? "" : (item.selected = false)));
                        Array.from(this.shadowRoot.getElementById("tab-content").children).forEach(
                            (content, j) => (content.style.display = i === j ? "block" : "")
                        );
                    };

                    return tabItem;
                })}
            </div>
            <div id="tab-content">
                ${this.items.map(
                    (item) => html` <div class="content" style="padding: ${this.contentPadding}">${item.content}</div> `
                )}
            </div>
        `;
    }
}

customElements.get("nwb-tabs") || customElements.define("nwb-tabs", Tabs);
