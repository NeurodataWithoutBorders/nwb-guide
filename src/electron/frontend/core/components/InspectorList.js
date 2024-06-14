import { LitElement, css, html } from "lit";
import { List } from "./List";
import { getMessageType, isErrorImportance } from "../validation";

import { unsafeHTML } from "lit/directives/unsafe-html.js";

import { header } from '../../utils/text'

const sortAlphabeticallyWithNumberedStrings = (a, b) => {
    if (a === b) return 0;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
    

const sortList = (items) => {
    return items
        .sort((a, b) => sortAlphabeticallyWithNumberedStrings(a.object_name, b.object_name))
        .sort((a, b) => sortAlphabeticallyWithNumberedStrings(a.object_type, b.object_type))
        .sort((a, b) => {
            const lowA = a.severity == "LOW";
            const lowB = b.severity === "LOW";
            if (lowA && lowB) return 0;
            else if (lowA) return 1;
            else return -1;
        })
        
        .sort((a, b) => {
            const aCritical = isErrorImportance.includes(a.importance);
            const bCritical = isErrorImportance.includes(b.importance);
            if (aCritical && bCritical) return 0;
            else if (aCritical) return -1;
            else return 1;
        })
};

const aggregateMessages = (items) => {
    let messages = {};
    console.log(items)
    items.forEach((item) => {
        const copy = { ...item };
        delete copy.file_path;
        const encoded = JSON.stringify(copy);
        if (!messages[encoded]) messages[encoded] = [];
        messages[encoded].push(item);
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

    constructor(props = {}) {
        const { items } = props;
        const aggregatedItems = Object.values(aggregateMessages(items)).map((items) => {
            const aggregate = { ...items.pop() }; // Create a base object for the aggregation
            aggregate.files = [aggregate.file_path, ...items.map(({ file_path }) => file_path)];
            return aggregate;
        });

        aggregatedItems.forEach((item, i) => {
            if (i === 0) item.importance = "CRITICAL";  
        })


        super({
            editable: false,
            unordered: true,
            ...props,
            items: sortList(aggregatedItems).map((itemProps, i) => {
                const item = new InspectorListItem(itemProps);
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
                overflow: hidden;
                text-wrap: wrap;
                padding: 10px;
                font-size: 12.5px;
            }

            :host(:not(:last-child)) {
                margin: 0 0 1em;
            }

            #message {
                display: block;
                font-size: 14px;
                font-weight: bold;
            }

            #filepath {
                font-size: 10px;
            }

            #header {
                font-size: 10px;
            }

            :host > * {
                margin: 0px;
            }

            :host([type="error"]) {
                color: #9d0b0b;
                background: #f8d7da;
                border: 1px solid #f5c2c7;
                border-radius: 4px;
            }

            :host([type="warning"]) {
                color: #856404;
                background: #fff3cd;
                border: 1px solid #ffeeba;
                border-radius: 4px;
            }

            small {
                font-size: 10px;
            }
        `;
    }

    constructor(props = {}) {
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

        const isString = typeof this.message === "string";
        if (isString) this.setAttribute("title", this.message);

        const hasMetadata = "object_type" in this && "object_name" in this;

        const message = isString ? unsafeHTML(this.message) : this.message;

        const headerText = this.object_name ? `${this.object_type} — ${header(this.object_name)}` : this.object_type;

        return html`
            ${hasMetadata ? html`<span id="header">${headerText}</span>` : ""}
            ${hasMetadata ? html`<span id="message">${message}</span>` : html`<p>${message}</p>`}
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

const legendEntries = [
    { type: "error", header: "Error", message: "Must be fixed" },
    { type: "warning", header: "Warning", message: "Can be safely ignored" },
];

export class InspectorLegend extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
                font-size: 80%;
            }

            inspector-list-item {
                margin: 0;
            }

            :host > div {
                padding: 5px 10px;
                display: flex;
                gap: 25px;
                align-items: center;
                border: 1px solid gray;
                border-radius: 0 0 10px 10px;
            }

            h4 {
                margin: 0;
                padding: 5px 10px;
                width: 100%;
                background: black;
                color: white;
                border-radius: 10px 10px 0 0;
                box-sizing: border-box;
            }
        `;
    }

    constructor(props) {
        super();
        Object.assign(this, props);
    }

    render() {
        return html`
            <h4>Legend</h4>
            <div>
                ${legendEntries.map(({ type, header, message }) => {
                    const item = new InspectorListItem({
                        type,
                        message: html`<h3 style="margin: 0;">${header}</h3>
                            <span>${message}</span>`,
                    });
                    item.style.width = "max-content";
                    return item;
                })}
                <div>
                    <p>
                        To fix issues specific to a single file, you can edit the <b>file metadata</b> on the previous
                        page.
                    </p>
                    ${this.multiple === false
                        ? ""
                        : html`<p>
                              To fix issues across many files, you may want to edit the <b>default metadata</b> on the
                              previous page.
                          </p>`}
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-inspector-legend") || customElements.define("nwbguide-inspector-legend", InspectorLegend);
