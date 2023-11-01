import { LitElement, html } from "lit";
import { Handsontable, css } from "./hot";
import { header } from "./forms/utils";
import { errorHue, warningHue } from "./globals";
import { checkStatus } from "../validation";
import { emojiFontFamily } from "./globals";

import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

const maxRows = 20;

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
    } = {}) {
        super();
        this.schema = schema ?? {};
        this.data = data ?? [];
        this.keyColumn = keyColumn;
        this.globals = globals ?? {};
        this.validateEmptyCells = validateEmptyCells ?? true;
        this.contextMenu = contextMenu ?? {};

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

    #getData(rows = this.rowHeaders, cols = this.colHeaders) {
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

    isRequired = (col) => {
        return this.schema?.required?.includes(col);
    };

    updated() {
        const div = (this.shadowRoot ?? this).querySelector("div");

        const unresolved = (this.unresolved = {});

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
        const colHeaders = (this.colHeaders = Object.keys(entries)
            .sort((a, b) => {
                //Sort alphabetically
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            })
            .sort((a, b) => {
                const aRequired = this.isRequired(a);
                const bRequired = this.isRequired(b);
                if (aRequired && bRequired) return 0;
                if (aRequired) return -1;
                if (bRequired) return 1;
                return 0;
            })
            .sort((a, b) => {
                if (a === this.keyColumn) return -1;
                if (b === this.keyColumn) return 1;
                return 0;
            }));

        // Try to guess the key column if unspecified
        if (!Array.isArray(this.data) && !this.keyColumn) {
            const [key, value] = Object.entries(this.data)[0];
            const foundKey = Object.keys(value).find((k) => value[k] === key);
            if (foundKey) this.keyColumn = foundKey;
        }

        const rowHeaders = (this.rowHeaders = Object.keys(this.data));

        const displayHeaders = [...colHeaders].map(header);

        const columns = colHeaders.map((k, i) => {
            const info = { type: "text" };

            const colInfo = entries[k];
            if (colInfo.unit) displayHeaders[i] = `${displayHeaders[i]} (${colInfo.unit})`;

            // Enumerate Possible Values
            if (colInfo.enum) {
                info.source = colInfo.enum;
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
                    const valid = this.validateOnChange
                        ? await this.validateOnChange(
                              k,
                              { ...this.data[rowHeaders[row]] }, // Validate on a copy of the parent
                              value
                          )
                        : true; // Return true if validation errored out on the JavaScript side (e.g. server is down)

                    return this.#handleValidationResult(valid, row, prop);
                } catch (e) {
                    return true; // Return true if validation errored out on the JavaScript side (e.g. server is down)
                }
            };

            let ogThis = this;
            const isRequired = this.isRequired(k);

            const validator = async function (value, callback) {
                const validateEmptyCells = ogThis.validateEmptyCells;
                const willValidate =
                    validateEmptyCells === true ||
                    (Array.isArray(validateEmptyCells) && validateEmptyCells.includes(k));

                // Clear empty values if not validated
                if (!value && !willValidate) {
                    ogThis.#handleValidationResult(
                        [], // Clear errors
                        this.row,
                        this.col
                    );
                    callback(true); // Allow empty value
                    return;
                }


                if (value && k === ogThis.keyColumn && unresolved[this.row]) {
                    if (value in ogThis.data) {
                        ogThis.#handleValidationResult(
                            [{ message: `${header(k)} already exists`, type: "error" }],
                            this.row,
                            this.col
                        );
                        callback(false);
                        return;
                    }
                }

                if (!(await runThisValidator(value, this.row, this.col))) {
                    callback(false);
                    return;
                }

                if (!value && isRequired) {
                    ogThis.#handleValidationResult(
                        [{ message: `${header(k)} is a required property.`, type: "error" }],
                        this.row,
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

            const isRequired = this.isRequired(col);
            if (isRequired)
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
                tippy(span, { content: `${desc}` });
            }
        };

        const data = this.#getData();

        let nRows = rowHeaders.length;

        let contextMenu = ["row_below", "remove_row"];
        if (this.schema.additionalProperties) contextMenu.push("col_right", "remove_col");

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
            data,
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
        const initialCellsToUpdate = data.reduce((acc, v) => acc + v.length, 0);

        table.addHook("afterValidate", (isValid, value, row, prop) => {
            const header = typeof prop === "number" ? colHeaders[prop] : prop;
            let rowName = this.keyColumn ? rowHeaders[row] : row;

            // NOTE: We would like to allow invalid values to mutate the results
            // if (isValid) {
            const isResolved = rowName in this.data;
            let target = this.data;

            if (!isResolved) {
                if (!this.keyColumn) this.data[rowName] = {}; // Add new row to array
                else {
                    rowName = row;
                    if (!unresolved[rowName]) unresolved[rowName] = {}; // Ensure row exists
                    target = unresolved;
                }
            }

            const isUserUpdate = initialCellsToUpdate <= validated;

            // Transfer data to object (if valid)
            if (isValid){
                if (header === this.keyColumn) {
                    if (value && value !== rowName) {
                        const old = target[rowName] ?? {};
                        this.data[value] = old;
                        delete target[rowName];
                        delete unresolved[row];
                        rowHeaders[row] = value;
                    }
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

            validated++;

            if (isUserUpdate) this.onUpdate(rowName, header, value);

            if (typeof isValid === "function") isValid();
            // }
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
                const rowName = rowHeaders[row];
                // const cols = this.data[rowHeaders[row]]
                // Object.keys(cols).map(k => cols[k] = '')
                // if (this.validateOnChange) Object.keys(cols).map(k => this.validateOnChange(k, { ...cols },  cols[k])) // Validate with empty values before removing
                delete this.data[rowHeaders[row]];
                delete unresolved[row];
                this.onUpdate(rowName, null, undefined); // NOTE: Global metadata PR might simply set all data values to undefined
            });
        });

        table.addHook("afterCreateRow", (index, amount) => {
            nRows += amount;
            const physicalRows = Array.from({ length: amount }, (e, i) => index + i);
            physicalRows.forEach((row) => this.#setRow(row, this.#getRowData(row)));
        });

        // Trigger validation on all cells
        data.forEach((row, i) => this.#setRow(i, row));
    }

    #setRow(row, data) {
        data.forEach((value, j) => this.table.setDataAtCell(row, j, value));
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
                (theme = "warning"), (message = warnings.map((o) => o.message).join("\n"));
            } else cell.removeAttribute("warning");

            if (errors.length) {
                (theme = "error"), (message = errors.map((o) => o.message).join("\n")); // Class switching handled automatically
            } else cell.removeAttribute("error");

            if (theme) cell.setAttribute(theme, "");

            if (cell._tippy) {
                cell._tippy.destroy();
                cell.removeAttribute("data-message");
            }

            if (message) {
                tippy(cell, { content: message, theme });
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
        const exists = (this.stylesheet = stylesheets.find((el) => styleSymbol in el));

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
            <p style="width: 100%; margin: 10px 0px">
                <small id="description" style="color: gray;"></small>
            </p>
        `;
    }
}

customElements.get("nwb-table") || customElements.define("nwb-table", Table);
