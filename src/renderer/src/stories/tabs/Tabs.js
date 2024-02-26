import { LitElement, css, html } from "lit";
import { TabItem } from "./TabItem";

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
                overflow-x: auto;
            }

            .content {
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
            <div id="tab-toggles">
                ${this.items.map((item, i) => {
                    const tabItem = item instanceof TabItem ? item : TabItem({ ...item });

                    tabItem.selected = i === this.selected;

                    tabItem.onClick = () => {
                        const tabItems = this.shadowRoot.querySelectorAll("nwb-tab-item");
                        Array.from(tabItems).forEach((item, j) => {
                            if (!(item === tabItem)) item.selected = false;
                        });

                        Array.from(this.shadowRoot.getElementById("tab-content").children).forEach((content) => {
                            content.style.display = content.children[0] === tabItem.content ? "block" : "";
                        });
                    };

                    return tabItem;
                })}
            </div>
            <div id="tab-content">
                ${this.items.map((item) => {
                    return html` <div class="content" style="padding: ${this.contentPadding}">${item.content}</div> `;
                })}
            </div>
        `;
    }
}

customElements.get("nwb-tabs") || customElements.define("nwb-tabs", Tabs);
