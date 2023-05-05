import { LitElement, css, html } from "lit";
import { header } from "./forms/utils";
import { checkStatus } from "../validation";

import { TableCell } from './table/Cell'
import { ContextMenu } from './table/ContextMenu'
import { errorHue, warningHue } from "./globals";

export class SimpleTable extends LitElement {
    validateOnChange;

    static get styles() {
        return css`

        :host {
            width: 100%;
            display: block;
            overflow: auto;
            font-family: sans-serif;
            font-size: 13px;
        }

        [error] {
            background: hsl(${errorHue}, 100%, 90%) !important;
        }

        [warning] {
            background: hsl(${warningHue}, 100%, 90%) !important;
        }

        [selected] {
            border: 1px solid blue;
        }

        th {
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
        }

        td {
            user-select: none;
        }

        [title] .relative::after {
            content: 'ℹ️';
            display: inline-block;
            margin: 0px 5px;
            text-align: center;
            font-size: 80%;
            font-family: "Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",  "Noto Color Emoji", "EmojiOne Color",  "Android Emoji", sans-serif;
        }
        
        `
    }

    constructor({ schema, data, template, keyColumn, validateOnChange, validateEmptyCells, onStatusChange } = {}) {
        super();
        this.schema = schema ?? {};
        this.data = data ?? [];
        this.keyColumn = keyColumn;
        this.template = template ?? {};
        this.validateEmptyCells = validateEmptyCells ?? true;

        if (validateOnChange) this.validateOnChange = validateOnChange;
        if (onStatusChange) this.onStatusChange = onStatusChange;

        this.onmousedown = (ev) => {
            this.#firstSelected  = null
            this.#clearSelected()
            this.#selecting = true
            const cell = this.#getCellFromEvent(ev)
            if (cell) this.#selectCells(cell)
        }

        this.onmouseup = document.onmouseup = (ev) => this.#selecting = false

        document.onmousedown = (ev) => {
            const path = this.#getPath(ev)
            if (!path.includes(this)) {
                this.#firstSelected  = null
                this.#clearSelected()
            }
        }

        // Handle Copy-Paste Commands
        document.addEventListener('copy', (ev) => {
            ev.preventDefault()
            const tsv = Object.values(this.#selected).map(arr => arr.map(el => el.value).join('\t')).join('\n')
            ev.clipboardData.setData("text/plain", tsv);
        })

        document.addEventListener('paste', (ev) => {
            ev.preventDefault()
            const topLeftCell = Object.values(this.#selected)[0][0]
            if (!topLeftCell) return
            const { i: firstI, j: firstJ } = topLeftCell.simpleTableInfo
            const tsv = ev.clipboardData.getData("text/plain")
            let lastCell;
            tsv.split('\n').map((str, i) => str.split('\t').forEach((v, j) => {
                const cell =  this.#cells[firstI + i]?.[firstJ + j]
                if (cell) {
                    // cell.value = v
                    cell.input.innerText // Not undoable
                    lastCell = cell
                }
            }))

            this.#selectCells(lastCell, topLeftCell)
        })
    }

    #selected = {}
    #selecting = false
    #firstSelected // TableCell

    #clearSelected = () => {
        Object.values(this.#selected).forEach(arr => arr.forEach(el => el.parentNode.removeAttribute('selected')))
        this.#selected = {}
    }


    #getPath = (ev) => ev.path || ev.composedPath()
    #getCellFromEvent = (ev) => this.#getCellFromPath(this.#getPath(ev))
    #getCellFromPath = (path) =>  path.find(el => el instanceof TableCell)

    #selectCells = (cell, firstSelected = this.#firstSelected) => {

        if (!firstSelected) firstSelected = this.#firstSelected = cell

        const { i, j } = firstSelected.simpleTableInfo
        const { i: lastI, j: lastJ } = cell.simpleTableInfo

        this.#clearSelected()

        // if (i === lastI && j === lastJ) this.#selectCell(i, j)
        // else {
            const firstRow = Math.min(i, lastI)
            const lastRow = firstRow == i ? lastI : i
            const firstCol = Math.min(j, lastJ)
            const lastCol = firstCol == j ? lastJ : j
            for (let row = firstRow; row <= lastRow; row++ ) {
                for (let col = firstCol; col <= lastCol; col++ ) this.#selectCell(row, col)
            }
        // }

        return this.#selected
    }

    #selectCell = (row, col) => {
        const cell = this.#cells[row][col]
        if (!this.#selected[row]) this.#selected[row] = []
        this.#selected[row].push(cell)
        const parent = cell.parentNode
        parent.setAttribute('selected', '')
        return cell
    }

    static get properties() {
        return {
            data: { type: Object, reflect: true },
        };
    }

    #context = new ContextMenu({ 
        target: this,
        items: [
            {
                label: 'Add Row',
                onclick: (path) => {
                    const cell = this.#getCellFromPath(path)
                    const { i } = cell.simpleTableInfo
                    this.#updateRows(i, 1) //2) // TODO: Support adding more than one row
                }
            },
            {
                label: 'Remove Row',
                onclick: (path) => {
                    const cell = this.#getCellFromPath(path)
                    const { i } = cell.simpleTableInfo // TODO: Support detecting when the user would like to remove more than one row
                    this.#updateRows(i, -1)
                }
            },
            // {
            //     label: 'Add Column',
            //     onclick: (path) => {
            //         console.log('add column')
            //         this.#getCellFromPath(path)
            //     }
            // },
            // {
            //     label: 'Remove Column',
            //     onclick: (path) => {
            //         console.log('remove column')
            //         this.#getCellFromPath(path)
            //     }
            // },
        ]
    })

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

        if (!message) {
            const errors = this.querySelectorAll("[error]");
            const len = errors.length;
            if (len === 1) message = errors[0].title;
            else if (len) message = `${len} errors exist on this table.`;
        }

        const nUnresolved = Object.keys(this.unresolved).length;
        if (nUnresolved)
            message = `${nUnresolved} subject${nUnresolved > 1 ? "s are" : " is"} missing a ${
                this.keyColumn ? `${this.keyColumn} ` : ""
            }value`;

        if (message) throw new Error(message);
    };

    status;
    onStatusChange = () => {};

    updated() {

        // const columns = colHeaders.map((k, i) => {
        //     const info = { type: "text" };

        //     const colInfo = entries[k];
        //     if (colInfo.unit) displayHeaders[i] = `${displayHeaders[i]} (${colInfo.unit})`;

        //     // Enumerate Possible Values
        //     if (colInfo.enum) {
        //         info.source = colInfo.enum;
        //         if (colInfo.strict === false) info.type = "autocomplete";
        //         else info.type = "dropdown";
        //     }

        //     // Constrain to Date Format
        //     if (colInfo.format === "date-time") {
        //         info.type = "date-time";
        //         info.correctFormat = false;
        //     }

        //     if (colInfo.type === "array") {
        //         info.data = k;
        //         info.type = "array";
        //         info.uniqueItems = colInfo.uniqueItems;
        //     }

        //     // Validate Regex Pattern
        //     if (colInfo.pattern) {
        //         const regex = new RegExp(colInfo.pattern);
        //         info.validator = (value, callback) => callback(regex.test(value));
        //     }

        //     const runThisValidator = async (value, row, prop) => {
        //         try {
        //             const valid = this.validateOnChange
        //                 ? await this.validateOnChange(
        //                       k,
        //                       { ...this.data[rowHeaders[row]] }, // Validate on a copy of the parent
        //                       value
        //                   )
        //                 : true; // Return true if validation errored out on the JavaScript side (e.g. server is down)

        //             return this.#handleValidationResult(valid, row, prop);
        //         } catch (e) {
        //             return true; // Return true if validation errored out on the JavaScript side (e.g. server is down)
        //         }
        //     };

        //     let ogThis = this;
        //     const isRequired = ogThis.schema?.required?.includes(k);

        //     const validator = async function (value, callback) {
        //         if (!value) {
        //             if (isRequired) {
        //                 ogThis.#handleValidationResult(
        //                     [{ message: `${k} is a required property.`, type: "error" }],
        //                     this.row,
        //                     this.col
        //                 );
        //                 callback(false);
        //                 return true;
        //             }
        //             if (!ogThis.validateEmptyCells) {
        //                 callback(true); // Allow empty value
        //                 return true;
        //             }
        //         }

        //         if (!(await runThisValidator(value, this.row, this.col))) {
        //             callback(false);
        //             return true;
        //         }
        //     };

        //     if (info.validator) {
        //         const og = info.validator;
        //         info.validator = async function (value, callback) {
        //             const called = await validator.call(this, value, callback);
        //             if (!called) og(value, callback);
        //         };
        //     } else
        //         info.validator = async function (value, callback) {
        //             const called = await validator.call(this, value, callback);
        //             if (!called) callback(true); // Default to true if not called earlier
        //         };

        //     return info;
        // });

        // const onAfterGetHeader = function (index, TH) {
        //     const desc = entries[colHeaders[index]].description;
        //     if (desc) TH.setAttribute("title", desc);
        // };

        // table.addHook("afterValidate", (isValid, value, row, prop) => {
        //     const header = typeof prop === "number" ? colHeaders[prop] : prop;
        //     let rowName = rowHeaders[row];

        //     // NOTE: We would like to allow invalid values to mutate the results
        //     // if (isValid) {
        //     const isResolved = rowName in this.data;
        //     let target = this.data;

        //     if (!isResolved) {
        //         if (!unresolved[row]) unresolved[row] = {}; // Ensure row exists
        //         rowName = row;
        //         target = unresolved;
        //     }

        //     // Transfer data to object
        //     if (header === this.keyColumn) {
        //         if (value !== rowName) {
        //             const old = target[rowName] ?? {};
        //             this.data[value] = old;
        //             delete target[rowName];
        //             delete unresolved[row];
        //             rowHeaders[row] = value;
        //         }
        //     }

        //     // Update data on passed object
        //     else {
        //         if (value == undefined || value === "") delete target[rowName][header];
        //         else target[rowName][header] = value;
        //     }
        //     // }
        // });

        // // If only one row, do not allow deletion
        // table.addHook("beforeRemoveRow", (index, amount) => {
        //     if (nRows - amount < 1) {
        //         notify("You must have at least one row", "error");
        //         return false;
        //     }
        // });

        // table.addHook("afterRemoveRow", (_, amount, physicalRows) => {
        //     nRows -= amount;
        //     physicalRows.forEach((row) => {
        //         delete this.data[rowHeaders[row]];
        //         delete unresolved[row];
        //     });
        // });

        // table.addHook("afterCreateRow", (index, amount) => {
        //     nRows += amount;
        //     const physicalRows = Array.from({ length: amount }, (e, i) => index + i);
        //     physicalRows.forEach((row) => this.#setRow(row, this.#getRowData(row)));
        // });
    }

    #setRow(row, data) {
        data.forEach((value, j) => this.#cells[row][j].value = value);
    }

    #updateRows(row, nRows) {

        if (!nRows) return

        const count = Math.abs(nRows)
        const range = Array.from({length:count}, (_, i) => row + i)

        const children = Array.from(this.shadowRoot.querySelector('tbody').children)

        const isPositive = Math.sign(nRows) === 1

        // Remove elements and cell entries that correspond to the removed elements
        if (!isPositive) {
            range.map(i => {
                children[i].remove()
                delete this.#cells[i]
            })
        }

        // Shift all cells in a row
        let ogCells = { ...this.#cells }

        const afterIdx = row + count
        const after = children.slice(afterIdx)
        after.forEach((o, i) => {
            const pos = afterIdx + i + nRows
            this.#cells[pos] = ogCells[afterIdx + i]
            Array.from(o.children).forEach(o => o.children[0].simpleTableInfo.i = pos) // Increment position
        })

        if (isPositive) {
            const current = children[row]

            // Replace deleted base row(s) with new one
            let latest = current
            return range.map(idx => {
                const i = idx + 1
                delete this.#cells[i]
                const data = this.#getRowData() // Get information for an undefined row
                const newRow = document.createElement('tr')
                newRow.append(...data.map((v, j) => this.#renderCell(v, { i, j })))
                latest.after(newRow)
                return latest = newRow
            })
        }

    }


    #renderHeaderContent = (str) => html`<div class="relative"><span>${str}</span></div>`

    #renderHeader = (str, { description }) => {
        if (description) return html`<th title="${description}">${this.#renderHeaderContent(str)}</th>`
        return html`<th>${this.#renderHeaderContent(str)}</th>`
    }

    #cells = []

    #renderCell = (value, info) => {
        const td = document.createElement('td')

        const rowNames = Object.keys(this.data)

        const fullInfo = { ...info, col: this.colHeaders[info.j], row: rowNames[info.i] }

        const schema = this.#schema[fullInfo.col]

        // Track the cell renderer
        const cell = new TableCell({ 
            value, 
            schema,
            validateOnChange: (value) => this.validateOnChange ? this.validateOnChange(
                fullInfo.col,
                { ...this.data[fullInfo.row] }, // Validate on a copy of the parent
                value
            ) : true,

            onValidate: (info) => {
                for (let key in info) {
                    const value =info[key]
                    if (value === undefined) td.removeAttribute(key)
                    else td.setAttribute(key, info[key])
                }

                this.#checkStatus(); // Check status after every validation update
            }
        })

        cell.simpleTableInfo = fullInfo
        td.onmouseover = () => {
            if (this.#selecting) this.#selectCells(cell)
        }

        
        if (!this.#cells[fullInfo.i]) this.#cells[fullInfo.i] = {}
        this.#cells[fullInfo.i][fullInfo.j] = cell

        td.appendChild(cell)
        return td
    }


    #schema = {}

    render() {

        const entries = this.#schema = { ...this.schema.properties };

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


        const data = this.#getData();

        const rowNames = Object.keys(this.data)

        return html`
        ${this.#context}
        <table cellspacing="0">
            <thead>
                <tr>
                ${[...keys].map(header).map((str, i) => this.#renderHeader(str, entries[keys[i]]))}
                </tr>
            </thead>
            <tbody>
            ${data.map((row, i) => {
                return html`<tr>
                ${row.map((v, j) => this.#renderCell(v, { i, j}))}
                </tr>
            `
            })}
            </tbody>
            <tfooter>
            </tfooter>
        </table>
        `;
    }
}

customElements.get("nwb-simple-table") || customElements.define("nwb-simple-table", SimpleTable);
