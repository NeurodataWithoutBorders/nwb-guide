import { LitElement, css, html } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { header } from "./forms/utils";
import { checkStatus } from "../validation";
import { errorHue, warningHue } from "./globals";

import "./Button"

export class BasicTable extends LitElement {

    static get styles() {
        return css`
            :host {
                width: 100%;
                display: inline-block;
                font-family: sans-serif;
                font-size: 13px;
                box-sizing: border-box;
            }


            [error] {
                background: hsl(${errorHue}, 100%, 90%) !important;
            }

            [warning] {
                background: hsl(${warningHue}, 100%, 90%) !important;
            }


            .table-container {
                position: relative;
                overflow: auto;
                max-height: 400px;
            }

            table {
                background: white;
                width: 100%;
            }

            thead {
                position: sticky;
                top: 0;
                left: 0;
            }

            th {
                border: 1px solid silver;
                color: #222;
                font-weight: 400;
                text-align: center;
                white-space: nowrap;
            }

            th .relative {
                position: relative;
                padding: 2px 8px;
                user-select: none;
            }

            th span {
                display: inline-block;
            }

            thead {
                background: gainsboro;
            }

            td {
                border: 1px solid gainsboro;
                background: white;
                user-select: none;
            }

            td > * {
                display: flex;
                white-space: nowrap;
                color: black;
                padding: 5px;
                width: 100%;
            }

            [title] .relative::after {
                content: "ℹ️";
                cursor: help;
                display: inline-block;
                margin: 0px 5px;
                text-align: center;
                font-size: 80%;
                font-family: "Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
                    "Noto Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif;
            }
        `;
    }

    constructor({
        name,
        schema,
        data,
        keyColumn,
        maxHeight,
        validateEmptyCells,
        validateOnChange,
        onStatusChange,
        onLoaded,
    } = {}) {
        super();
        this.name = name ?? 'data_table'
        this.schema = schema ?? {};
        this.data = data ?? [];
        this.keyColumn = keyColumn;
        this.maxHeight = maxHeight ?? "";
        this.validateEmptyCells = validateEmptyCells ?? true;

        if (validateOnChange) this.validateOnChange = validateOnChange;
        if (onStatusChange) this.onStatusChange = onStatusChange;
        if (onLoaded) this.onLoaded = onLoaded;
    }

    #renderHeaderContent = (str) => html`<div class="relative"><span>${str}</span></div>`;

    #renderHeader = (str, { description }) => {
        if (description) return html`<th title="${description}">${this.#renderHeaderContent(str)}</th>`;
        return html`<th>${this.#renderHeaderContent(str)}</th>`;
    };

    #getRowData(row, cols = this.colHeaders) {
        const hasRow = row in this.data;
        return cols.map((col, j) => {
            let value;
            if (col === this.keyColumn) {
                if (hasRow) value = row;
                else return "";
            } else
                value =
                    (hasRow ? this.data[row][col] : undefined) ??
                    // this.template[col] ??
                    this.schema.properties[col].default ??
                    "";
            return value;
        });
    }

    #getData(rows = Object.keys(this.data), cols = this.colHeaders) {
        return rows.map((row, i) => this.#getRowData(row, cols));
    }


    // Validation Code

    #checkStatus = () => {
        const hasWarning = this.shadowRoot.querySelector("[warning]");
        const hasError = this.shadowRoot.querySelector("[error]");
        checkStatus.call(this, hasWarning, hasError);
    };

    validate = () => {
        let message;

        if (!message) {
            const errors = this.shadowRoot.querySelectorAll("[error]");
            const len = errors.length;
            if (len === 1) message = errors[0].title;
            else if (len) message = `${len} errors exist on this table.`;
        }

        if (message) throw new Error(message);
    };

    status;
    onStatusChange = () => {};
    onLoaded = () => {};


    #validateCell = async (value, col, parent) => {
        if (!value && !this.validateEmptyCells) return true; // Empty cells are valid
        if (!this.validateOnChange) return true
        
        let result = await this.validateOnChange(col, parent, value)

        let info = {
            title: undefined,
            warning: undefined,
            error: undefined
        }

        const warnings = Array.isArray(result) ? result.filter((info) => info.type === "warning") : [];
        const errors = Array.isArray(result) ? result?.filter((info) => info.type === "error") : [];

        if (result === false) errors.push({ message: 'Cell is invalid' })

        if (warnings.length) {
            info.warning = ''
            info.title = warnings.map((o) => o.message).join("\n");
        }

        if (errors.length) {
            info.error = ''
            info.title = errors.map((o) => o.message).join("\n"); // Class switching handled automatically
        }

        return info
    }

    async updated() {

        const rows = Object.keys(this.data)
        
        await Promise.all(this.#data.map((v, i) => {

            return Promise.all(v.map(async (vv, j) => {
                const info = await this.#validateCell(vv, this.colHeaders[j], {...this.data[rows[i]]})
                if (info === true) return
                const td = this.shadowRoot.getElementById(`i${i}_j${j}`);
                if (td) {
                    for (let key in info) {
                        const value = info[key];
                        if (value === undefined) td.removeAttribute(key);
                        else td.setAttribute(key, info[key]);
                    }
                }
            }))
        }))

        this.#checkStatus()
        this.onLoaded()
    }

    #data = []

    // Render Code
    render() {
        
        const entries = { ...this.schema.properties };

        // Add existing additional properties to the entries variable if necessary
        if (this.schema.additionalProperties) {
            Object.values(this.data).reduce((acc, v) => {
                Object.keys(v).forEach((k) =>
                    !(k in entries)
                        ? (entries[k] = {
                              type: typeof v[k],
                          })
                        : ""
                );
                return acc;
            }, entries);
        }

        // Sort Columns by Key Column and Requirement
        const keys = (this.colHeaders = Object.keys(entries).sort((a, b) => {
            if (a === this.keyColumn) return -1;
            if (b === this.keyColumn) return 1;
            if (entries[a].required && !entries[b].required) return -1;
            if (!entries[a].required && entries[b].required) return 1;
            return 0;
        }));

        // Try to guess the key column if unspecified
        if (!Array.isArray(this.data) && !this.keyColumn) {
            const [key, value] = Object.entries(this.data)[0];
            const foundKey = Object.keys(value).find((k) => value[k] === key);
            if (foundKey) this.keyColumn = foundKey;
        }

        const data = this.#data = this.#getData()

        return html`
        <div class="table-container">
            <table cellspacing="0" style=${styleMap({ maxHeight: this.maxHeight })}>
                <thead>
                    <tr>
                        ${keys.map(header).map((str, i) => this.#renderHeader(str, entries[keys[i]]))}
                    </tr>
                </thead>
                <tbody>
                    ${data.map((row, i) => html`<tr>${row.map((col, j) => html`<td id="i${i}_j${j}"><div>${col}</div></td>`)}</tr>`)}
                </tbody>
            </table>
        </div>
        <nwb-button @click=${() => {
            const tsv = keys.map((k) => k).join("\t") + "\n" + data.map((row) => row.map((col) => col).join("\t")).join("\n");  
            const element = document.createElement('a');
            element.setAttribute("href", "data:text/tab-separated-values;charset=utf-8," + encodeURIComponent(tsv));
            element.setAttribute("download", `${this.name.split(' ').join('_')}.tsv`);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }}>Download File</nwb-button>
        <nwb-button @click=${() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "text/tab-separated-values";
            input.click();
            input.onchange = () => {
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = () => {
                    const data = reader.result.split("\n").map((row) => row.split("\t"));
                    const header = data.shift()

                    const structuredData = data.map(row => row.reduce((acc, col, i) => {
                        acc[header[i]] = col
                        return acc
                    }, {}))

                    Object.keys(this.data).forEach((row) => delete this.data[row]) // Delete all previous rows
                    Object.keys(data).forEach((row) => {
                        const cols = structuredData[row]
                        this.data[this.keyColumn ? cols[this.keyColumn] : row] = cols
                    })

                    this.requestUpdate();
                };
                reader.readAsText(file);
            };
        }}>Upload File</nwb-button>
        `
    }
}

customElements.get("nwb-basic-table") || customElements.define("nwb-basic-table", BasicTable);
