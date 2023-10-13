import { LitElement, css, html } from "lit";
import { List } from "../../List";
import { getMessageType, isErrorImportance } from "../../../validation";

const sortList = (items) => {
    return items
        .sort((a, b) => {
            const aCritical = isErrorImportance.includes(a.importance);
            const bCritical = isErrorImportance.includes(a.importance);
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

const aggregateMessages = (items) => {
    let messages = {};
    items.forEach((o) => {
        if (!messages[o.message]) messages[o.message] = [];
        messages[o.message].push(o);
    });
    return messages;
};

export class InspectorList extends List {
    static get styles() {
        return [
            super.styles,
            css`
            :host {
                display: block;
            }
        }`,
        ];
    }

    constructor(props) {
        const { items } = props;
        const aggregatedItems = Object.values(aggregateMessages(items)).map((items) => {
            const aggregate = { ...items.pop() }; // Create a base object for the aggregation
            aggregate.files = [aggregate.file_path, ...items.map((o) => o.file_path)];
            return aggregate;
        });

        super({
            editable: false,
            unordered: true,
            ...props,
            items: sortList(aggregatedItems).map((o) => {
                const item = new InspectorListItem(o);
                item.style.flexGrow = "1";
                return { content: item };
            }),
        });
    }
}

customElements.get("inspector-list") || customElements.define("inspector-list", InspectorList);

export class InspectorListItem extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
                background: WhiteSmoke;
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

            #objectType {
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
        this.type = getMessageType({
            ...this,
            type: this.ORIGINAL_TYPE,
        });

        this.setAttribute("title", this.message);

        const hasObjectType = "object_type" in this;
        const hasMetadata = hasObjectType && "object_name" in this;

        return html`
            ${hasMetadata ? html`<span id="objectType">${hasObjectType ? `${this.object_type}` : ""} </span>` : ""}
            ${hasMetadata ? html`<span id="message">${this.message}</span>` : html`<p>${this.message}</p>`}
            ${this.file_path
                ? html`<span id="filepath"
                      >${this.files && this.files.length > 1
                          ? `${this.files[0]} and ${this.files.length - 1} other files`
                          : this.file_path}</span
                  >`
                : ""}
        `;
    }
}

customElements.get("inspector-list-item") || customElements.define("inspector-list-item", InspectorListItem);
