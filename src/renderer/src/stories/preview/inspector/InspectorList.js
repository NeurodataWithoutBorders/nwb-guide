import { LitElement, css, html } from "lit";
import { List } from "../../List";

const sortList = (items) => {
    return items
        .sort((a, b) => {
            const aCritical = a.importance === "CRITICAL";
            const bCritical = b.importance === "CRITICAL";
            if (aCritical && bCritical) return 0;
            else if (aCritical) return -1;
            else return 1;
        })
        .sort((a, b) => {
            const aLow = a.severity == "LOW";
            const bLow = b.severity === "LOW";
            if (aLow && bLow) return 0;
            else if (aLow) return 1;
            else return -1;
        });
};

export class InspectorList extends List {
    constructor({ items, listStyles }) {
        super({
            editable: false,
            unordered: true,
            items: sortList(items).map((o) => {
                const item = new InspectorListItem(o);
                item.style.flexGrow = "1";
                return { content: item };
            }),
            listStyles,
        });
    }
}

customElements.get("inspector-list") || customElements.define("inspector-list", InspectorList);

export class InspectorListItem extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
                background: gainsboro;
                border: 1px solid gray;
                border-radius: 10px;
                padding: 5px 10px;
                overflow: hidden;
                text-wrap: wrap;
            }

            #message {
                display: block;
                font-size: 14px;
                font-weight: bold;
            }

            #filepath {
                font-size: 10px;
            }

            :host > * {
                margin: 0px;
            }

            :host([type="error"]) {
                color: #9d0b0b;
                padding: 25px;
                background: #f8d7da;
                border: 1px solid #f5c2c7;
                border-radius: 4px;
                margin: 0 0 1em;
            }

            :host([type="warning"]) {
                color: #856404;
                padding: 25px;
                background: #fff3cd;
                border: 1px solid #ffeeba;
                border-radius: 4px;
                margin: 0 0 1em;
            }
        `;
    }

    constructor(props) {
        super();
        this.ORIGINAL_TYPE = props.type;
        Object.assign(this, props);
    }

    static get properties() {
        return {
            type: {
                type: String,
                reflect: true,
            },
        };
    }

    render() {
        this.type = this.ORIGINAL_TYPE ?? (this.importance === "CRITICAL" ? "error" : "warning");

        this.setAttribute("title", this.message);

        const hasObjectType = "object_type" in this;
        const hasMetadata = hasObjectType && "object_name" in this;

        return html`
            ${this.file_path ? html`<span id="filepath">${this.file_path}</span>` : ""}
            ${hasMetadata ? html`<span id="message">${this.message}</span>` : html`<p>${this.message}</p>`}
            ${hasMetadata
                ? html`<small>${hasObjectType ? `${this.object_type}` : ""} </small>`
                : ""}
        `;
    }
}

customElements.get("inspector-list-item") || customElements.define("inspector-list-item", InspectorListItem);
