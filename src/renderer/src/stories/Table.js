import { LitElement, html } from "lit";
import { isStorybook, notify } from "../globals";
import { Handsontable } from "./hot";
import { header } from "./forms/utils";

export class Table extends LitElement {
    validateOnChange;

    constructor({ schema, data, template, keyColumn, validateOnChange } = {}) {
        super();
        this.schema = schema ?? {};
        this.data = data ?? [];
        this.keyColumn = keyColumn ?? "id";
        this.template = template ?? {};
        if (validateOnChange) this.validateOnChange = validateOnChange;

        this.style.width = "100%";
        this.style.display = "flex";
        this.style.flexWrap = "wrap";
        this.style.alignItems = "center";
        this.style.justifyContent = "center";

        // Inject scoped stylesheet
        const style = `
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

      [title] .relative::after {
        content: 'ℹ️';
        display: inline-block;
        margin: 0px 5px;
        text-align: center;
        font-size: 80%;
        font-family: "Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",  "Noto Color Emoji", "EmojiOne Color",  "Android Emoji", sans-serif;
      }

      .handsontable {
        overflow: unset !important;
      }
`;

        //       .ht_clone_top {
        //         pointer-events: none;
        //       }

        //       .ht_clone_top th:not([title]) {
        //         pointer-events: auto;
        //       }

        //       .ht_master [title] {
        //         overflow: unset !important;
        //         visibility: visible !important;
        //         position: relative;
        //       }

        //       .htColumnHeaders {
        //         overflow: visible !important;
        //       }
        // `

        //   .ht_master [title]::after {
        //     position: absolute;
        //     content: attr(title);
        //     background: dimgray;
        //     color: #fff;
        //     font-size: 80%;
        //     padding: 10px;
        //     border-radius: 5px;
        //     z-index: 100;
        //     display: none;
        //     width: 200px;
        //     white-space: pre-wrap;
        //     text-align: left;
        //   }

        //   .ht_master [title]:hover::after {
        //     display: block;
        //   }
        // `

        const styleEl = document.createElement("style");
        styleEl.innerHTML = style;
        this.appendChild(styleEl);
    }

    static get properties() {
        return {
            data: { type: Object, reflect: true },
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
                else return "";
            } else
                value =
                    (hasRow ? this.data[row][col] : undefined) ??
                    this.template[col] ??
                    this.schema.properties[col].default ??
                    "";
            return value;
        });
    }

    #getData(rows = this.rowHeaders, cols = this.colHeaders) {
        return rows.map((row, i) => this.#getRowData(row, cols));
    }

    updated() {
        const div = this.querySelector("div");

        const entries = this.schema.properties;

        // Sort Columns by Key Column and Requirement
        const colHeaders = (this.colHeaders = Object.keys(entries).sort((a, b) => {
            if (a === this.keyColumn) return -1;
            if (b === this.keyColumn) return 1;
            if (entries[a].required && !entries[b].required) return -1;
            if (!entries[a].required && entries[b].required) return 1;
            return 0;
        }));

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

            const runThisValidator = async (value, row) => {
                const valid = this.validateOnChange
                    ? await this.validateOnChange(k, this.data[rowHeaders[row]], value).catch(() => true)
                    : true; // Return true if validation errored out on the JavaScript side (e.g. server is down)
                let warnings = Array.isArray(valid) ? valid.filter((info) => info.type === "warning") : [];
                const errors = Array.isArray(valid) ? valid?.filter((info) => info.type === "error") : [];
                return valid === true || valid == undefined || errors.length === 0;
            };

            if (info.validator) {
                const og = info.validator;
                info.validator = async function (value, callback) {
                    if (!value) return callback(true); // Allow empty values
                    if (!(await runThisValidator(value, this.row))) return callback(false);
                    og(value, callback);
                };
            } else {
                info.validator = async function (value, callback) {
                    if (!value) return callback(true); // Allow empty values
                    callback(await runThisValidator(value, this.row));
                };
            }

            return info;
        });

        const onAfterGetHeader = function (index, TH) {
            const desc = entries[colHeaders[index]].description;
            if (desc) TH.setAttribute("title", desc);
        };

        const data = this.#getData();

        let nRows = rowHeaders.length;

        const table = new Handsontable(div, {
            data,
            // rowHeaders: rowHeaders.map(v => `sub-${v}`),
            colHeaders: displayHeaders,
            columns,
            // height: 'auto', // Commenting this will fix dropdown issue
            height: "auto", // Keeping this will ensure there is no infinite loop that adds length to the table
            stretchH: "all",
            manualColumnResize: true,
            preventOverflow: "horizontal",
            width: "100%",
            contextMenu: ["row_below", "remove_row"], //, 'row_above', 'col_left', 'col_right', 'remove_row', 'remove_col'],
            licenseKey: "non-commercial-and-evaluation", // for non-commercial use only
            afterGetColHeader: onAfterGetHeader,
            afterGetRowHeader: onAfterGetHeader,
        });

        this.table = table;

        const unresolved = (this.unresolved = {});

        table.addHook("afterValidate", (isValid, value, row, prop) => {
            const header = typeof prop === "number" ? colHeaders[prop] : prop;
            let rowName = rowHeaders[row];

            if (isValid) {
                const isResolved = rowName in this.data;
                let target = this.data;

                if (!isResolved) {
                    if (!unresolved[row]) unresolved[row] = {}; // Ensure row exists
                    rowName = row;
                    target = unresolved;
                }

                // Transfer data to object
                if (header === this.keyColumn) {
                    if (value !== rowName) {
                        const old = target[rowName] ?? {};
                        this.data[value] = old;
                        delete target[rowName];
                        delete unresolved[row];
                        rowHeaders[row] = value;
                    }
                }

                // Update data on passed object
                else {
                    if (value == undefined && value === "") delete target[rowName][header];
                    else target[rowName][header] = value;
                }
            }
        });

        // If only one row, do not allow deletion
        table.addHook("beforeRemoveRow", (index, amount) => {
            if (nRows - amount < 1) {
                notify("You must have at least one row", "error");
                return false;
            }
        });

        table.addHook("afterRemoveRow", (_, amount, physicalRows) => {
            nRows -= amount;
            physicalRows.forEach((row) => {
                delete this.data[rowHeaders[row]];
                delete unresolved[row];
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
        data.forEach((value, j) => {
            if (value !== "") this.table.setDataAtCell(row, j, value);
        });
    }

    render() {
        return html`
            <div></div>
            <p style="width: 100%; margin: 10px 0px">
                <small style="color: gray;">Right click to add or remove rows.</small>
            </p>
        `;
    }
}

customElements.get("nwb-table") || customElements.define("nwb-table", Table);
