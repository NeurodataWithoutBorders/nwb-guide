import { LitElement, css, html, unsafeCSS } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { header } from "./forms/utils";
import { checkStatus } from "../validation";
import { emojiFontFamily, errorHue, warningHue } from "./globals";

import * as promises from "../promises";

import "./Button";
import { sortTable } from "./Table";
import tippy from "tippy.js";

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

            [required]::after {
                content: " *";
                color: #ff0033;
            }

            .table-container {
                position: relative;
                overflow: auto;
                max-height: 400px;
                border: 1px solid gray;
            }

            table tr:first-child td {
                border-top: 0px;
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
                border-right: 1px solid gray;
                border-bottom: 1px solid gray;
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

            .relative .info {
                margin: 0px 5px;
                font-size: 80%;
                font-family: ${unsafeCSS(emojiFontFamily)};
            }

            th span {
                display: inline-block;
            }

            thead {
                background: whitesmoke;
            }

            td {
                border: 1px solid gray;
                border-left: none;
                border-bottom: none;
                background: white;
                user-select: none;
            }

            td > * {
                display: flex;
                white-space: nowrap;
                color: rgb(10, 10, 10);
                padding: 0px 5px;
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

            #buttons {
                margin-top: 10px;
            }
        `;
    }

    constructor({
        name,
        schema,
        ignore,
        data,
        keyColumn,
        maxHeight,
        validateEmptyCells,
        validateOnChange,
        onStatusChange,
        onLoaded,
        onUpdate,
        editable = true,
        truncated = false,
    } = {}) {
        super();
        this.name = name ?? "data_table";
        this.schema = schema ?? {};
        this.data = data ?? [];
        this.keyColumn = keyColumn;
        this.maxHeight = maxHeight ?? "unset";
        this.validateEmptyCells = validateEmptyCells ?? true;

        this.ignore = ignore ?? {};

        if (validateOnChange) this.validateOnChange = validateOnChange;
        if (onUpdate) this.onUpdate = onUpdate;
        if (onStatusChange) this.onStatusChange = onStatusChange;
        if (onLoaded) this.onLoaded = onLoaded;

        this.truncated = truncated;
        this.editable = editable && !truncated;
    }

    #schema = {};
    #itemSchema = {};
    #itemProps = {};

    get schema() {
        return this.#schema;
    }

    set schema(schema = {}) {
        this.#schema = schema;
        this.#itemSchema = schema.items ?? {};
        this.#itemProps = { ...(this.#itemSchema.properties ?? {}) };
    }

    #rendered;
    #updateRendered = (force) =>
        force || this.rendered === true
            ? (this.rendered = new Promise((resolve) => (this.#rendered = () => resolve((this.rendered = true)))))
            : this.rendered;
    rendered = this.#updateRendered(true);

    #renderHeaderContent = (str) => {
        const required = this.#itemSchema.required ? this.#itemSchema.required.includes(str) : false;
        if (required)
            return html`<div class="relative">
                <span required>${header(str)}</span>
            </div>`;
        return html`<div class="relative"><span>${header(str)}</span></div>`;
    };

    #renderHeader = (prop, { description, title = prop } = {}) => {
        const th = document.createElement("th");

        const required = this.#itemSchema.required ? this.#itemSchema.required.includes(prop) : false;
        const container = document.createElement("div");
        container.classList.add("relative");
        const span = document.createElement("span");
        span.innerHTML = header(title);
        if (required) span.setAttribute("required", "");
        container.appendChild(span);

        // Add Description Tooltip
        if (description) {
            const span = document.createElement("span");
            span.classList.add("info");
            span.innerText = "ℹ️";
            container.append(span);
            tippy(span, {
                content: `${description[0].toUpperCase() + description.slice(1)}`,
                allowHTML: true,
            });
        }

        th.appendChild(container);

        return th;
    };

    #getRowData(row, cols = this.colHeaders) {
        const hasRow = row in this.data;
        return cols.map((col, j) => {
            let value;
            if (col === this.keyColumn) {
                if (hasRow) value = row;
                else return;
            } else
                value =
                    (hasRow ? this.data[row][col] : undefined) ??
                    // this.globals[col] ??
                    this.#itemSchema.properties[col]?.default;
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

        const errors = Array.from(this.shadowRoot.querySelectorAll("[error]"));
        const len = errors.length;
        if (len === 1) message = errors[0].title || "An error exists on this table.";
        else if (len) {
            message = `${len} errors exist on this table.`;
            console.error(Array.from(errors).map((error) => error.title));
        }

        if (message) throw new Error(message);
    };

    status;
    onStatusChange = () => {};
    onLoaded = () => {};

    #getType = (value, { type, data_type } = {}) => {
        let inferred = typeof value;
        if (Array.isArray(value)) inferred = "array";
        if (value == undefined) inferred = "null";

        const original = type || data_type;
        let resolved = original;

        // Handle based on JSON Schema types
        if (type) {
            if (resolved === "integer") resolved = "number"; // Map to javascript type
        } else if (data_type) {
            if (resolved.includes("array")) resolved = "array";
            if (resolved.includes("int") || resolved.includes("float")) resolved = "number";
            if (resolved.startsWith("bool")) resolved = "boolean";
            if (resolved.startsWith("str")) resolved = "string";
        }

        return {
            type: resolved,
            original,
            inferred,
        };
    };

    #validateCell = (value, col, row, parent) => {
        if (!value && !this.validateEmptyCells) return true; // Empty cells are valid
        if (!this.validateOnChange) return true;

        let result;

        const propInfo = this.#itemProps[col] ?? {};

        let { type, original, inferred } = this.#getType(value, propInfo);

        const isUndefined = value === undefined || value === "";

        // Check if required
        if (isUndefined && "required" in this.#itemSchema && this.#itemSchema.required.includes(col))
            result = [{ message: `${col} is a required property`, type: "error" }];
        // If not required, check matching types (if provided) for values that are defined
        else if (!isUndefined && type && inferred !== type)
            result = [
                {
                    message: `${col} is expected to be of type ${original}, not ${inferred}`,
                    type: "error",
                },
            ];
        // Otherwise validate using the specified onChange function
        else result = this.validateOnChange([row, col], parent, value, this.#itemProps[col]);

        // Will run synchronously if not a promise result
        return promises.resolve(result, (result) => {
            let info = {
                title: undefined,
                warning: undefined,
                error: undefined,
            };

            const warnings = Array.isArray(result) ? result.filter((info) => info.type === "warning") : [];
            const errors = Array.isArray(result) ? result?.filter((info) => info.type === "error") : [];

            if (result === false) errors.push({ message: "Cell is invalid" });

            if (errors.length) {
                info.error = "";
                info.title = errors.map((error) => error.message).join("\n"); // Class switching handled automatically
            } else if (warnings.length) {
                info.warning = "";
                info.title = warnings.map((warning) => warning.message).join("\n");
            }

            if (typeof result === "function") result(); // Run if returned value is a function

            return info;
        });
    };

    async updated() {
        const rows = Object.keys(this.data);

        const results = this.#data.map((v, i) => {
            return v.map((vv, j) => {
                const info = this.#validateCell(vv, this.colHeaders[j], i, {
                    ...this.data[rows[i]],
                }); // Could be a promise or a basic response
                return promises.resolve(info, (info) => {
                    if (info === true) return;
                    const td = this.shadowRoot.getElementById(`i${i}_j${j}`);
                    if (td) {
                        const message = info.title;
                        delete info.title;

                        if (td._tippy) {
                            td._tippy.destroy();
                            td.removeAttribute("data-message");
                        }

                        if (message !== undefined) {
                            tippy(td, { content: message, allowHTML: true });
                            td.setAttribute("data-message", message);
                        }

                        for (let key in info) {
                            const value = info[key];
                            if (value === undefined) td.removeAttribute(key);
                            else td.setAttribute(key, info[key]);
                        }
                    }
                });
            });
        });

        promises.resolveAll(results, () => {
            this.#checkStatus();
            this.#rendered(true);
            this.onLoaded();
        });
    }

    #keys = [];
    #data = [];

    #getTSV = () => {
        const data = this.#data;
        let keys = [...this.#keys];

        const sections = [
            keys.map((k) => k).join("\t"),
            data
                .map((row, i) => {
                    const mapped = row.map((col) => (typeof col !== "string" ? JSON.stringify(col) : col));
                    return mapped.join("\t");
                })
                .join("\n"),
        ];

        return sections.filter((v) => v).join("\n");
    };

    #readTSV(text) {
        let data = text.split("\n").map((row) =>
            row.split("\t").map((v) => {
                try {
                    return eval(v);
                } catch {
                    return v.trim();
                }
            })
        ); // Map to actual values using JSON.parse

        let header = data.shift();

        const structuredData = data.map((row) =>
            row.reduce((acc, col, i) => {
                acc[header[i]] = col;
                return acc;
            }, {})
        );

        Object.keys(this.data).forEach((row) => delete this.data[row]); // Delete all previous rows

        Object.keys(data).forEach((row) => {
            const cols = structuredData[row];
            const latest = (this.data[this.keyColumn ? cols[this.keyColumn] : row] = {});
            Object.entries(cols).forEach(([key, value]) => {
                // if (key in this.#itemProps) {
                const { type } = this.#getType(value, this.#itemProps[key]);
                if (type === "string") {
                    if (value === undefined) value = "";
                    else value = `${value}`; // Convert to string if necessary
                }
                latest[key] = value;
                // }
            }); // Only include data from schema
        });

        if (this.onUpdate) this.onUpdate([], data); // Update the whole table
    }

    // Render Code
    render() {
        this.#updateRendered();

        this.schema = this.schema; // Always update the schema
        const entries = this.#itemProps;

        if (this.truncated) this.data = this.data.slice(0, 5); // Limit to 5 rows when truncated

        // Add existing additional properties to the entries variable if necessary
        if (this.#itemSchema.additionalProperties) {
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

        // Ignore any additions in the ignore configuration
        for (let key in this.ignore) delete entries[key];
        for (let key in this.ignore["*"] ?? {}) delete entries[key];

        // Sort Columns by Key Column and Requirement
        const keys =
            (this.#keys =
            this.colHeaders =
                sortTable(
                    {
                        ...this.#itemSchema,
                        properties: entries,
                    },
                    this.keyColumn,
                    this.#itemSchema.order
                ));

        // Try to guess the key column if unspecified
        if (!Array.isArray(this.data) && !this.keyColumn) {
            const [key, value] = Object.entries(this.data)[0];
            const foundKey = Object.keys(value).find((k) => value[k] === key);
            if (foundKey) this.keyColumn = foundKey;
        }

        const data = (this.#data = this.#getData());

        const description = this.#schema.description;

        return html`
            ${description
                ? html`<p style="margin: 0; margin-bottom: 10px">
                      <small style="color: gray;">${description}</small>
                  </p>`
                : ""}
            <div class="table-container">
                <table cellspacing="0" style=${styleMap({ maxHeight: this.maxHeight })}>
                    <thead>
                        <tr>
                            ${keys.map((str, i) => this.#renderHeader(str, entries[keys[i]]))}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(
                            (row, i) =>
                                html`<tr>
                                    ${row.map(
                                        (col, j) =>
                                            html`<td id="i${i}_j${j}">
                                                <div>${JSON.stringify(col)}</div>
                                            </td>`
                                    )}
                                </tr>`
                        )}
                    </tbody>
                </table>
            </div>
            ${this.editable
                ? html`<div id="buttons">
                      <nwb-button
                          primary
                          size="small"
                          @click=${() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "text/tab-separated-values";
                              input.click();
                              input.onchange = () => {
                                  const file = input.files[0];
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                      this.#readTSV(reader.result);
                                      this.requestUpdate();
                                  };
                                  reader.readAsText(file);
                              };
                          }}
                          >Upload TSV File</nwb-button
                      >
                      <nwb-button
                          size="small"
                          @click=${() => {
                              const tsv = this.#getTSV();

                              const element = document.createElement("a");
                              element.setAttribute(
                                  "href",
                                  "data:text/tab-separated-values;charset=utf-8," + encodeURIComponent(tsv)
                              );
                              element.setAttribute("download", `${this.name.split(" ").join("_")}.tsv`);
                              element.style.display = "none";
                              document.body.appendChild(element);
                              element.click();
                              document.body.removeChild(element);
                          }}
                          >Download TSV File</nwb-button
                      >
                  </div>`
                : ""}
            ${this.truncated
                ? html`<p style="margin: 0; width: 100%; text-align: center; font-size: 150%;">...</p>`
                : ""}
        `;
    }
}

customElements.get("nwb-basic-table") || customElements.define("nwb-basic-table", BasicTable);
