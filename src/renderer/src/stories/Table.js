import { LitElement, html } from "lit";
import { Handsontable, css } from "./hot";
import { header } from "./forms/utils";
import { errorHue, warningHue } from "./globals";
import { checkStatus } from "../validation";
import { emojiFontFamily } from "./globals";

import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

const rowSymbol = Symbol("row");

const maxRows = 20;

const isRequired = (col, schema) => {
    return schema.required?.includes(col);
};

export const getEditable = (value, rowData = {}, config, colName) => {
    if (typeof config === "boolean") return config;
    if (typeof config === "function") return config(value, rowData);
    return getEditable(value, rowData, config?.[colName] ?? true);
};

export function sortTable(schema, keyColumn, order) {
    const cols = Object.keys(schema.properties)

        //Sort alphabetically
        .sort((a, b) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        })
        .sort((a, b) => {
            const aRequired = isRequired(a, schema);
            const bRequired = isRequired(b, schema);
            if (aRequired && bRequired) return 0;
            if (aRequired) return -1;
            if (bRequired) return 1;
            return 0;
        })
        .sort((a, b) => {
            if (a === keyColumn) return -1;
            if (b === keyColumn) return 1;
            return 0;
        });

    return order
        ? cols.sort((a, b) => {
              const idxA = order.indexOf(a);
              const idxB = order.indexOf(b);
              if (idxA === -1) return 1;
              if (idxB === -1) return -1;
              return idxA - idxB;
          })
        : cols;
}

// Inject scoped stylesheet
const styles = `

        ${css}


        .handsontable td[error] {
            background: hsl(${errorHue}, 100%, 90%) !important;
        }

        [warning] {
            background: hsl(${warningHue}, 100%, 90%) !important;
        }

      ul {
        list-style-type: none;
        padding: 0;
      }


      ul li:before {
        content: '-';
        position: absolute;
        margin-left: -10px;
      }

      ul li {
        padding-left: 20px
      }

      .relative .info {
        margin: 0px 5px;
        font-size: 80%;
        font-family: ${emojiFontFamily}
      }

      .handsontable {
        overflow: unset !important;
      }

      th > [data-required] > *:first-child::after {
        content: '*';
        margin-left: 2px;
        color: gray;
      }

      th > [data-required=true] > *:first-child::after {
        color: red;
      }
`;

const styleSymbol = Symbol("table-styles");

export class Table extends LitElement {
    validateOnChange;

    constructor({
        schema,
        data,
        globals,
        keyColumn,
        validateOnChange,
        onUpdate,
        onOverride,
        validateEmptyCells,
        onStatusChange,
        onThrow,
        contextMenu,
        ignore,
        groups, // NOTE: All groups must be non-overlapping
    } = {}) {
        super();
        this.schema = schema ?? {};
        this.data = data ?? [];
        this.keyColumn = keyColumn;
        this.globals = globals ?? {};
        this.validateEmptyCells = validateEmptyCells ?? true;
        this.contextMenu = contextMenu ?? {};
        this.ignore = ignore ?? {};
        this.groups = groups ?? [];

        if (onThrow) this.onThrow = onThrow;
        if (onUpdate) this.onUpdate = onUpdate;
        if (onOverride) this.onOverride = onOverride;
        if (validateOnChange) this.validateOnChange = validateOnChange;
        if (onStatusChange) this.onStatusChange = onStatusChange;

        if (this.data.length > maxRows) this.data = this.data.slice(0, maxRows);

        this.style.width = "100%";
        this.style.display = "flex";
        this.style.flexWrap = "wrap";
        this.style.alignItems = "center";
        this.style.justifyContent = "center";
    }

    static get properties() {
        return {
            data: { type: Object, reflect: true },
            globals: { type: Object, reflect: true },
        };
    }

    createRenderRoot() {
        return this;
    }

    #getRowData(row, cols = this.colHeaders) {
        const hasRow = row in this.data;
        return cols.map((col, j) => {
            let value;
            if (col === this.keyColumn) {
                if (hasRow) value = row;
                else return undefined;
            } else value = (hasRow ? this.data[row][col] : undefined) ?? this.globals[col];

            return value;
        });
    }

    #getData(rows = Object.keys(this.data), cols = this.colHeaders) {
        return rows.map((row, i) => this.#getRowData(row, cols));
    }

    #checkStatus = () => {
        const hasWarning = this.querySelector("[warning]");
        const hasError = this.querySelector("[error]");
        checkStatus.call(this, hasWarning, hasError);
    };

    validate = () => {
        let message;

        const nUnresolved = Object.keys(this.unresolved).length;
        if (nUnresolved)
            message = `${nUnresolved} row${nUnresolved > 1 ? "s are" : " is"} missing a ${
                this.keyColumn ? `${header(this.keyColumn)} ` : "n "
            }entry`;

        if (!message) {
            const errors = this.querySelectorAll("[error]");
            const len = errors.length;
            if (len === 1) message = errors[0].getAttribute("data-message") || "Error found";
            else if (len) message = `${len} errors exist on this table.`;
        }

        if (message) throw new Error(message);
    };

    status;
    onStatusChange = () => {};
    onUpdate = () => {};
    onOverride = () => {};
    onThrow = () => {};

    #schema = {};
    #itemSchema = {};
    #itemProps = {};

    get schema() {
        return this.#schema;
    }

    set schema(schema) {
        this.#schema = schema;
        this.#itemSchema = schema.items ?? {};
        this.#itemProps = { ...(this.#itemSchema.properties ?? {}) };
    }

    getRowName = (row) =>
        this.keyColumn ? Object.entries(this.data).find(([k, v]) => v[rowSymbol] === row)?.[0] : row;

    revalidate = (skipped = []) => {
        this.table.getData().forEach((rowData, i) => {
            rowData.forEach((value, j) => {
                const isSkipped = skipped.find(({ row, prop }) => row === i && j === prop);
                if (!isSkipped) this.table.setDataAtCell(i, j, value);
            });
        });
    };

    #info = {};

    updated() {
        const div = (this.shadowRoot ?? this).querySelector("div");

        const unresolved = (this.unresolved = {});

        const entries = this.#itemProps;
        for (let key in this.ignore) delete entries[key];
        for (let key in this.ignore["*"] ?? {}) delete entries[key];

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

        // Sort Columns by Key Column and Requirement

        const colHeaders = (this.colHeaders = sortTable(
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

        Object.keys(this.data).forEach((row, i) =>
            Object.defineProperty(this.data[row], rowSymbol, { value: i, configurable: true })
        ); // Set initial row trackers

        const displayHeaders = [...colHeaders].map(header);

        const columns = colHeaders.map((k, i) => {
            const info = (this.#info[k] = { type: "text", stopGroupUpdates: {} });

            const colInfo = entries[k];
            if (colInfo.unit) displayHeaders[i] = `${displayHeaders[i]} (${colInfo.unit})`;

            // Enumerate Possible Values
            if (colInfo.enum) {
                info.source = colInfo.enumLabels ? Object.values(colInfo.enumLabels) : colInfo.enum;
                if (colInfo.strict === false) info.type = "autocomplete";
                else info.type = "dropdown";
            }

            // Constrain to Date Format
            if (colInfo.format === "date-time") {
                info.type = "date-time";
                info.correctFormat = false;
            }

            if (colInfo.type === "array") {
                info.data = k;
                info.type = "array";
                info.uniqueItems = colInfo.uniqueItems;
            }

            // Validate Regex Pattern
            if (colInfo.pattern) {
                const regex = new RegExp(colInfo.pattern);
                info.validator = (value, callback) => callback(regex.test(value));
            }

            const runThisValidator = async (value, row, prop) => {
                try {
                    const path = [row, k];
                    const valid = this.validateOnChange
                        ? await this.validateOnChange(
                              path,
                              { ...this.data[this.getRowName(row)] }, // Validate on a copy of the parent
                              value,
                              info
                          )
                        : true; // Return true if validation errored out on the JavaScript side (e.g. server is down)

                    return this.#handleValidationResult(valid, row, prop);
                } catch {
                    return true; // Return true if validation errored out on the JavaScript side (e.g. server is down)
                }
            };

            let instanceThis = this;
            const required = isRequired(k, this.#itemSchema);

            const validator = async function (value, callback) {
                const row = this.row;

                const validateEmptyCells = instanceThis.validateEmptyCells;
                const willValidate =
                    validateEmptyCells === true ||
                    (Array.isArray(validateEmptyCells) && validateEmptyCells.includes(k));

                value = instanceThis.#getValue(value, colInfo);

                // Clear empty values if not validated
                if (!value && !willValidate) {
                    instanceThis.#handleValidationResult(
                        [], // Clear errors
                        row,
                        this.col
                    );
                    callback(true); // Allow empty value
                    return;
                }

                if (value && k === instanceThis.keyColumn) {
                    if (value in instanceThis.data && instanceThis.data[value]?.[rowSymbol] !== row) {
                        // Convert previously valid value to unresolved
                        const previousKey = instanceThis.getRowName(rrow);
                        if (previousKey) {
                            unresolved[row] = instanceThis.data[previousKey];
                            delete instanceThis.data[previousKey];
                        }

                        // Throw error
                        instanceThis.#handleValidationResult(
                            [{ message: `${header(k)} already exists`, type: "error" }],
                            row,
                            this.col
                        );
                        callback(false);
                        return;
                    }
                }

                if (!(await runThisValidator(value, row, this.col))) {
                    callback(false);
                    return;
                }

                const isUndefined = value == "";

                if (isUndefined && required) {
                    instanceThis.#handleValidationResult(
                        [{ message: `${header(k)} is a required property.`, type: "error" }],
                        row,
                        this.col
                    );
                    callback(false);
                    return;
                }
            };

            if (info.validator) {
                const og = info.validator;
                info.validator = async function (value, callback) {
                    let wasCalled = false;

                    const newCallback = (valid) => {
                        wasCalled = true;
                        callback(valid);
                    };

                    await validator.call(this, value, newCallback);
                    if (!wasCalled) og(value, callback);
                };
            } else
                info.validator = async function (value, callback) {
                    let wasCalled = false;

                    const newCallback = (valid) => {
                        wasCalled = true;
                        callback(valid);
                    };

                    await validator.call(this, value, newCallback);
                    if (!wasCalled) callback(true); // Default to true if not called earlier
                };

            return info;
        });

        const onAfterGetHeader = (index, TH) => {
            const col = colHeaders[index];
            const desc = entries[col].description;

            const rel = TH.querySelector(".relative");

            const required = isRequired(col, this.#itemSchema);
            if (required)
                rel.setAttribute(
                    "data-required",
                    this.validateEmptyCells
                        ? Array.isArray(this.validateEmptyCells)
                            ? this.validateEmptyCells.includes(col)
                            : true
                        : undefined
                );

            if (desc) {
                let span = rel.querySelector(".info");

                if (!span) {
                    span = document.createElement("span");
                    span.classList.add("info");
                    span.innerText = "ℹ️";
                    rel.append(span);
                }

                if (span._tippy) span._tippy.destroy();
                tippy(span, { content: `${desc}`, allowHTML: true });
            }
        };

        const data = this.#getData();

        let nRows = Object.keys(data).length;

        let contextMenu = ["row_below", "remove_row"];
        if (this.#itemSchema.additionalProperties) contextMenu.push("col_right", "remove_col");

        contextMenu = contextMenu.filter((k) => !(this.contextMenu.ignore ?? []).includes(k));

        const descriptionEl = this.querySelector("#description");
        const operations = {
            rows: [],
            columns: [],
        };

        if (contextMenu.includes("row_below")) operations.rows.push("add");
        if (contextMenu.includes("remove_row")) operations.rows.push("remove");
        if (contextMenu.includes("col_right")) operations.columns.push("add");
        if (contextMenu.includes("remove_col")) operations.columns.push("remove");
        const operationSet = new Set(Object.values(operations).flat());
        const operationOn = Object.keys(operations).filter((k) => operations[k].length);

        if (operationSet.size) {
            const desc = `Right click to ${Array.from(operationSet).join("/")} ${operationOn.join("and")}.`;
            descriptionEl.innerText = desc;
        }

        if (this.table) this.table.destroy();

        const table = new Handsontable(div, {
            data: this.#getRenderedData(data),
            // rowHeaders: rowHeaders.map(v => `sub-${v}`),
            colHeaders: displayHeaders,
            columns,
            height: "auto", // Keeping this will ensure there is no infinite loop that adds length to the table
            stretchH: "all",
            manualColumnResize: true,
            preventOverflow: "horizontal",
            width: "100%",
            contextMenu,
            licenseKey: "non-commercial-and-evaluation", // for non-commercial use only
            afterGetColHeader: onAfterGetHeader,
            afterGetRowHeader: onAfterGetHeader,
        });

        this.table = table;

        // Move context menu
        const menu = div.ownerDocument.querySelector(".htContextMenu");
        if (menu) this.#root.appendChild(menu); // Move to style root

        let validated = 0;

        const initialCellsToUpdate = data.reduce((acc, arr) => acc + arr.length, 0);

        table.addHook("afterValidate", (isValid, value, row, prop) => {
            const header = typeof prop === "number" ? colHeaders[prop] : prop;
            const info = this.#info[header];

            // Update other columns in the group

            const skipUpdate = info.stopGroupUpdates[row];

            // Decrement counters
            if (skipUpdate) info.stopGroupUpdates[row]--;

            if (!skipUpdate) {
                const isUserUpdate = initialCellsToUpdate <= validated;

                let rowName = this.getRowName(row);

                if (isUserUpdate) {
                    // NOTE: We would like to allow invalid values to mutate the results
                    // if (isValid) {
                    const isResolved = rowName in this.data;
                    let target = this.data;

                    if (!isResolved) {
                        if (!this.keyColumn)
                            this.data[rowName] = {}; // Add new row to array
                        else {
                            rowName = row;
                            if (!unresolved[rowName]) unresolved[rowName] = {}; // Ensure row exists
                            target = unresolved;
                        }
                    }

                    value = this.#getValue(value, entries[header]);

                    // Transfer data to object (if valid)
                    if (header === this.keyColumn) {
                        if (isValid && value && value !== rowName) {
                            const old = target[rowName] ?? {};
                            this.data[value] = old;
                            delete target[rowName];
                            delete unresolved[row];
                            Object.defineProperty(this.data[value], rowSymbol, { value: row, configurable: true }); // Setting row tracker
                            this.revalidate([{ row, prop }]);
                        }
                    }

                    // Update data on passed object
                    else {
                        const globalValue = this.globals[header];

                        if (value == undefined || value === "") {
                            if (globalValue) {
                                value = target[rowName][header] = globalValue;
                                table.setDataAtCell(row, prop, value);
                                this.onOverride(header, value, rowName);
                            }
                            target[rowName][header] = undefined;
                        } else {
                            // Correct for expected arrays (copy-paste issue)
                            if (entries[header]?.type === "array") {
                                if (value && !Array.isArray(value)) value = value.split(",").map((v) => v.trim());
                            }

                            target[rowName][header] = value === globalValue ? undefined : value;
                        }
                    }

                    this.onUpdate(rowName, header, value);
                }

                validated++;

                // Check associated groups for validity
                for (let group of this.groups) {
                    const table = this.table;
                    if (group.includes(header)) {
                        const otherGroup = group.filter((col) => col !== header);

                        otherGroup.forEach((col) => {
                            const j = colHeaders.indexOf(col);
                            const value = table.getDataAtCell(row, j);
                            const depInfo = this.#info[col];
                            const otherGroups = group.filter((c) => c !== col);
                            depInfo.stopGroupUpdates[row] = otherGroups.length; // Expecting this many updates from other members of the group
                            table.setDataAtCell(row, j, value);
                        });

                        return;
                    }
                }
            }

            if (typeof isValid === "function") isValid();
        });

        // If only one row, do not allow deletion
        table.addHook("beforeRemoveRow", (index, amount) => {
            if (nRows - amount < 1) {
                this.onThrow("You must have at least one row", "error");
                return false;
            }
        });

        table.addHook("afterRemoveRow", (_, amount, physicalRows) => {
            nRows -= amount;
            physicalRows.map(async (row) => {
                const rowName = this.getRowName(row);
                // const cols = this.data[rowHeaders[row]]
                // Object.keys(cols).map(k => cols[k] = '')
                // if (this.validateOnChange) Object.keys(cols).map(k => this.validateOnChange([ k ], { ...cols },  cols[k])) // Validate with empty values before removing
                delete this.data[rowName];
                delete unresolved[row];
                this.onUpdate(rowName, null, undefined); // NOTE: Global metadata PR might simply set all data values to undefined
            });
        });

        table.addHook("afterCreateRow", (index, amount) => {
            nRows += amount;
            const physicalRows = Array.from({ length: amount }, (_, i) => index + i);
            physicalRows.forEach((row) => this.#setRow(row, this.#getRowData(row)));
        });

        // Trigger validation on all cells
        data.forEach((row, i) => this.#setRow(i, row));
    }

    #getRenderedValue = (value, colInfo) => {
        // Handle enums
        if (colInfo.enumLabels) return colInfo.enumLabels[value] ?? value;
        return value;
    };

    #getRenderedData = (data) => {
        return Object.values(data).map((row) =>
            row.map((value, j) => this.#getRenderedValue(value, this.#itemSchema.properties[this.colHeaders[j]]))
        );
    };

    #getValue = (value, colInfo) => {
        // Handle enums
        if (colInfo.enumLabels)
            return Object.keys(colInfo.enumLabels).find((k) => colInfo.enumLabels[k] === value) ?? value;

        return value;
    };

    #setRow(row, data) {
        data.forEach((value, j) => {
            value = this.#getRenderedValue(value, this.#itemSchema.properties[this.colHeaders[j]]);
            this.table.setDataAtCell(row, j, value);
        });
    }

    #handleValidationResult = (result, row, prop) => {
        const warnings = Array.isArray(result) ? result.filter((info) => info.type === "warning") : [];
        const errors = Array.isArray(result) ? result?.filter((info) => info.type === "error") : [];

        // Display errors as tooltip
        const cell = this.table.getCell(row, prop); // NOTE: Does not resolve unless the cell is rendered...

        if (cell) {
            let message = "";
            let theme = "";
            if (warnings.length) {
                (theme = "warning"), (message = warnings.map((error) => error.message).join("\n"));
            } else cell.removeAttribute("warning");

            if (errors.length) {
                (theme = "error"), (message = errors.map((error) => error.message).join("\n")); // Class switching handled automatically
            } else cell.removeAttribute("error");

            if (theme) cell.setAttribute(theme, "");

            if (cell._tippy) {
                cell._tippy.destroy();
                cell.removeAttribute("data-message");
            }

            if (message) {
                tippy(cell, { content: message, allowHTML: true });
                cell.setAttribute("data-message", message);
            }
        }

        this.#checkStatus(); // Check status after every validation update

        return result === true || result == undefined || errors.length === 0;
    };

    #root;

    // Clean up after the injected stylesheet, which may affect the rendering of other elements (e.g. the main sidebar list items)
    disconnectedCallback() {
        super.disconnectedCallback();
        this.stylesheet[styleSymbol]--;
        if (this.stylesheet[styleSymbol] === 0) this.stylesheet.remove();
    }

    connectedCallback() {
        super.connectedCallback();
        const root = this.getRootNode().body ?? this.getRootNode();
        this.#root = root;
        const stylesheets = Array.from(root.querySelectorAll("style"));
        const exists = (this.stylesheet = stylesheets.find((stylesheet) => styleSymbol in stylesheet));

        if (exists) exists[styleSymbol]++;
        else {
            const stylesheet = (this.stylesheet = document.createElement("style"));
            stylesheet.innerHTML = styles;
            stylesheet[styleSymbol] = true; //1;
            root.append(stylesheet);
        }
    }

    render() {
        return html`
            <div></div>
            <p style="width: 100%; margin: 0; margin-top: 10px;">
                <small id="description" style="color: gray;"></small>
            </p>
        `;
    }
}

customElements.get("nwb-table") || customElements.define("nwb-table", Table);
