import { LitElement, css, html } from "lit";
import { header } from "./forms/utils";
import { checkStatus } from "../validation";

import { TableCell } from "./table/Cell";
import { ContextMenu } from "./table/ContextMenu";
import { errorHue, successHue, warningHue } from "./globals";
import { notify } from "../globals";

import { Loader } from "./Loader";

var isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

const isVisible = function (ele, container) {
    const { bottom, height, top } = ele.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return top <= containerRect.top ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
};

export class SimpleTable extends LitElement {
    validateOnChange;

    static get styles() {
        return css`
            :host {
                width: 100%;
                display: inline-block;
                font-family: sans-serif;
                font-size: 13px;
                box-sizing: border-box;
                --loader-color: hsl(200, 80%, 50%);
                max-height: 400px;
            }

            tfoot {
                display: none;
            }

            tfoot tr,
            tfoot td {
                background: transparent;
                display: block;
            }

            :host([loading]) table {
                background: whitesmoke;
                min-height: 400px;
            }

            :host([loading]) tfoot {
                display: block;
            }

            :host([loading]) tfoot td {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, calc(-50% + 10px));
                text-align: center;
                border: none;
            }

            :host([measure]) td {
                height: 50px;
            }

            [error] {
                background: hsl(${errorHue}, 100%, 90%) !important;
            }

            [warning] {
                background: hsl(${warningHue}, 100%, 90%) !important;
            }

            [selected] {
                border: 1px solid hsl(240, 100%, 50%);
                background: hsl(240, 100%, 98%);
            }

            table {
                display: inline-block;
                overflow: auto;
                position: relative;
                max-height: 400px;
                background: white;
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

    constructor({ schema, data, template, keyColumn, validateOnChange, validateEmptyCells, onStatusChange, onLoaded, deferLoading } = {}) {
        super();
        this.schema = schema ?? {};
        this.data = data ?? [];
        this.keyColumn = keyColumn;
        this.template = template ?? {};
        this.validateEmptyCells = validateEmptyCells ?? true;
        this.deferLoading = deferLoading ?? false

        if (validateOnChange) this.validateOnChange = validateOnChange;
        if (onStatusChange) this.onStatusChange = onStatusChange;
        if (onLoaded) this.onLoaded = onLoaded;

        this.onmousedown = (ev) => {
            this.#clearSelected();
            this.#selecting = true;
            const cell = this.#getCellFromEvent(ev);
            if (cell) this.#selectCells(cell);
        };

        this.onmouseup = document.onmouseup = (ev) => (this.#selecting = false);

        document.onmousedown = (ev) => {
            const path = this.#getPath(ev);
            if (!path.includes(this)) this.#clearSelected();
        };

        // Handle Copy-Paste Commands
        document.addEventListener("copy", (ev) => {
            ev.preventDefault();
            const tsv = Object.values(this.#selected)
                .map((arr) => arr.map((el) => el.value).join("\t"))
                .join("\n");
            ev.clipboardData.setData("text/plain", tsv);
        });

        document.addEventListener("keydown", (ev) => {
            var key = ev.keyCode || ev.charCode;
            if (key == 8 || key == 46) {
                const path = this.#getPath(ev);
                if (path[0] === document.body)
                    Object.values(this.#selected).forEach((row) => row.forEach((o) => o.setInput("")));
                return;
            }

            // Avoid special key clicks
            if ((ev.metaKey || ev.ctrlKey || ev.shiftKey) && !ev.key) return;

            // Undo / Redo
            if ((isMac ? ev.metaKey : ev.ctrlKey) && ev.key === "z") {
                this.#clearSelected();
                if (ev.shiftKey) console.error("redo");
                else console.error("Undo");
                return;
            }

            if (this.#firstSelected) {
                const path = this.#getPath(ev);
                if (path[0] === document.body) {
                    this.#firstSelected.input.toggle(true); // Open editor
                    this.#firstSelected.input.execute("selectAll"); // redirect keydown to the hidden input
                }
            }
        });

        document.addEventListener("paste", (ev) => {
            ev.preventDefault();
            const topLeftCell = Object.values(this.#selected)[0][0];
            if (!topLeftCell) return;
            const { i: firstI, j: firstJ } = topLeftCell.simpleTableInfo;
            const tsv = ev.clipboardData.getData("text/plain");
            let lastCell;

            tsv.split("\n").map((str, i) =>
                str.split("\t").forEach((v, j) => {
                    const cell = this.#cells[firstI + i]?.[firstJ + j];
                    if (cell) {
                        cell.value = v;
                        // cell.input.innerText = v; // Not undoable
                        lastCell = cell;
                    }
                })
            );

            this.#selectCells(lastCell, topLeftCell);
        });
    }

    #selected = {};
    #selecting = false;
    #firstSelected; // TableCell

    #clearSelected = (clearFirst = true) => {
        if (clearFirst && this.#firstSelected) {
            // this.#firstSelected.parentNode.removeAttribute("first");
            this.#firstSelected = null;
        }
        Object.values(this.#selected).forEach((arr) => arr.forEach((el) => el.parentNode.removeAttribute("selected")));
        this.#selected = {};
    };

    #getPath = (ev) => ev.path || ev.composedPath();
    #getCellFromEvent = (ev) => this.#getCellFromPath(this.#getPath(ev));
    #getCellFromPath = (path) => {
        const found = path.find((el) => el instanceof TableCell || el.children?.[0] instanceof TableCell);
        if (found instanceof HTMLTableCellElement) return found.children[0];
        else return found;
    };

    #selectCells = (cell, firstSelected = this.#firstSelected) => {
        if (!firstSelected) {
            firstSelected = this.#firstSelected = cell;
            // cell.parentNode.setAttribute("first", "");
        }

        const { i, j } = firstSelected.simpleTableInfo;
        const { i: lastI, j: lastJ } = cell.simpleTableInfo;

        this.#clearSelected(false);

        // if (i === lastI && j === lastJ) this.#selectCell(i, j)
        // else {
        const firstRow = Math.min(i, lastI);
        const lastRow = firstRow == i ? lastI : i;
        const firstCol = Math.min(j, lastJ);
        const lastCol = firstCol == j ? lastJ : j;
        for (let row = firstRow; row <= lastRow; row++) {
            for (let col = firstCol; col <= lastCol; col++) this.#selectCell(row, col);
        }
        // }

        return this.#selected;
    };

    #selectCell = (row, col) => {
        const cell = this.#cells[row][col];
        if (!this.#selected[row]) this.#selected[row] = [];
        this.#selected[row].push(cell);
        const parent = cell.parentNode;
        parent.setAttribute("selected", "");
        return cell;
    };

    static get properties() {
        return {
            data: { type: Object, reflect: true },
        };
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

    #getData(rows = Object.keys(this.data), cols = this.colHeaders) {
        return rows.map((row, i) => this.#getRowData(row, cols));
    }

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

        const nUnresolved = Object.keys(this.#unresolved).length;
        if (nUnresolved)
            message = `${nUnresolved} subject${nUnresolved > 1 ? "s are" : " is"} missing a ${
                this.keyColumn ? `${this.keyColumn} ` : ""
            }value`;

        if (message) throw new Error(message);
    };

    status;
    onStatusChange = () => {};
    onLoaded = () => {};

    #context;

    mapCells(callback) {
        return this.#cells.map((row) => Object.values(row).map((c) => callback(c)));
    }

    #switchDisplay = (cell, container, on = true) => {
        const parent = cell.parentNode;
        let visible = isVisible(parent, container);
        if (on && visible) {
            cell.style.display = "";
            cell.input.firstUpdated(); // Trigger initialization of contents
        } else if (!visible) {
            cell.style.display = "none"; // Ensure cells are not immediately rendered
            return cell;
        }
    };

    #menuOptions = {
        row: {
            add: {
                label: "Add Row",
                onclick: (path) => {
                    const cell = this.#getCellFromPath(path);
                    const { i } = cell.simpleTableInfo;
                    this.#updateRows(i, 1); //2) // TODO: Support adding more than one row
                },
            },
            remove: {
                label: "Remove Row",
                onclick: (path) => {
                    const cell = this.#getCellFromPath(path);
                    const { i } = cell.simpleTableInfo; // TODO: Support detecting when the user would like to remove more than one row
                    this.#updateRows(i, -1);
                },
            },
        },

        column: {
            add: {
                label: "Add Column",
                onclick: (path) => {
                    console.log("add column");
                    this.#getCellFromPath(path);
                },
            },
            remove: {
                label: "Remove Column",
                onclick: (path) => {
                    console.log("remove column");
                    this.#getCellFromPath(path);
                },
            },
        },
    };

    generateContextMenu(options) {
        const items = [];
        if (options.row?.add) items.push(this.#menuOptions.row.add);
        if (options.row?.remove) items.push(this.#menuOptions.row.remove);
        if (options.column?.add) items.push(this.#menuOptions.column.add);
        if (options.column?.remove) items.push(this.#menuOptions.column.remove);

        this.#context = new ContextMenu({ target: this.shadowRoot.querySelector("table"), items });

        this.shadowRoot.append(this.#context); // Insert context menu
    }

    #loaded = false
    load = () => {

        const scrollRoot = this.shadowRoot.querySelector("table");
        // Add cells to body after the initial table render
        const body = this.shadowRoot.querySelector("tbody");
        const data = this.#getData();

        if (!this.#loaded) {
            const tStart = performance.now();
            body.append(
                ...data.map((row, i) => {
                    const tr = document.createElement("tr");
                    tr.append(...row.map((v, j) => this.#renderCell(v, { i, j })));
                    return tr;
                })
            );

            this.setAttribute("measure", "");
            const mapped = this.mapCells((c) => this.#switchDisplay(c, scrollRoot, false)).flat();

            let filtered = mapped.filter((c) => c);
            scrollRoot.onscroll = () => {
                filtered = filtered.map((c) => this.#switchDisplay(c, scrollRoot)).filter((c) => c);
                if (!filtered.length) scrollRoot.onscroll = null;
            };
            this.removeAttribute("measure");

            console.warn('Milliseconds to render table:', performance.now() - tStart)

            this.removeAttribute('loading')
            this.#loaded = true
            this.onLoaded()


            this.generateContextMenu({
                row: {
                    add: true,
                    remove: true
                }
            })

        }
    }
    
    updated() {

        this.setAttribute("loading", "");

        // Trigger load after a short delay if not deferred
        if (!this.deferLoading) {
            setTimeout(() => {
                this.load()
            }, 100)
        }
    
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
    }

    #updateRows(row, nRows) {
        if (!nRows) return;

        const count = Math.abs(nRows);
        const range = Array.from({ length: count }, (_, i) => row + i);

        const children = Array.from(this.shadowRoot.querySelector("tbody").children);

        const isPositive = Math.sign(nRows) === 1;

        // Remove elements and cell entries that correspond to the removed elements
        if (!isPositive) {
            if (children.length - count < 1) {
                notify("You must have at least one row", "error");
                return false;
            }

            const rowHeaders = Object.keys(this.data);
            range.map((i) => {
                children[i].remove();
                delete this.data[rowHeaders[row]];
                delete this.#unresolved[row];
                delete this.#cells[i];
            });
        }

        // Shift all cells in a row
        let ogCells = { ...this.#cells };

        const afterIdx = row + count;
        const after = children.slice(afterIdx);
        after.forEach((o, i) => {
            const pos = afterIdx + i + nRows;
            this.#cells[pos] = ogCells[afterIdx + i];
            Array.from(o.children).forEach((o) => (o.children[0].simpleTableInfo.i = pos)); // Increment position
        });

        if (isPositive) {
            const current = children[row];

            // Replace deleted base row(s) with new one
            let latest = current;
            return range.map((idx) => {
                const i = idx + 1;
                delete this.#cells[i];
                const data = this.#getRowData(); // Get information for an undefined row
                const newRow = document.createElement("tr");
                newRow.append(...data.map((v, j) => this.#renderCell(v, { i, j })));
                latest.after(newRow);
                return (latest = newRow);
            });
        }
    }

    #renderHeaderContent = (str) => html`<div class="relative"><span>${str}</span></div>`;

    #renderHeader = (str, { description }) => {
        if (description) return html`<th title="${description}">${this.#renderHeaderContent(str)}</th>`;
        return html`<th>${this.#renderHeaderContent(str)}</th>`;
    };

    #cells = [];

    #unresolved = {};
    #onCellChange = (cell) => {
        const value = cell.value;

        const { i: row, col: header, row: possibleRowName, j: prop } = cell.simpleTableInfo;
        // const header = typeof prop === "number" ? col : prop;
        let rowName = possibleRowName;

        // NOTE: We would like to allow invalid values to mutate the results
        // if (isValid) {
        const isResolved = rowName in this.data;
        let target = this.data;
        if (!isResolved) {
            if (!this.#unresolved[row]) this.#unresolved[row] = {}; // Ensure row exists
            rowName = row;
            target = this.#unresolved;
        }
        // Transfer data to object
        if (header === this.keyColumn) {
            if (value !== rowName) {
                const old = target[rowName] ?? {};
                if (value) {
                    this.data[value] = old; // Allow renaming when different
                    delete this.#unresolved[row];
                } else this.#unresolved[row] = old; // Allow tracking when keyColumn is deleted

                delete target[rowName]; // Delete the old name from source
            }
        }
        // Update data on passed object
        else {
            if (value == undefined || value === "") delete target[rowName][header];
            else target[rowName][header] = value;
        }
    };

    #renderCell = (value, info) => {
        const td = document.createElement("td");

        const rowNames = Object.keys(this.data);

        const fullInfo = { ...info, col: this.colHeaders[info.j], row: rowNames[info.i] };

        const schema = this.#schema[fullInfo.col];

        // Track the cell renderer
        const cell = new TableCell({
            value,
            schema,
            validateOnChange: (value) => {
                if (!value && !this.validateEmptyCells) return true; // Empty cells are valid

                const res = this.validateOnChange
                    ? this.validateOnChange(
                          fullInfo.col,
                          { ...this.data[fullInfo.row] }, // Validate on a copy of the parent
                          value
                      )
                    : true;

                return res;
            },

            onValidate: (info) => {
                for (let key in info) {
                    const value = info[key];
                    if (value === undefined) td.removeAttribute(key);
                    else td.setAttribute(key, info[key]);
                }

                this.#onCellChange(cell);
                this.#checkStatus(); // Check status after every validation update
            },
        });

        cell.simpleTableInfo = fullInfo;
        td.onmouseover = () => {
            if (this.#selecting) this.#selectCells(cell);
        };

        if (!this.#cells[fullInfo.i]) this.#cells[fullInfo.i] = {};
        this.#cells[fullInfo.i][fullInfo.j] = cell;

        td.appendChild(cell);
        return td;
    };

    #schema = {};

    render() {
        const entries = (this.#schema = { ...this.schema.properties });

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

        return html`
            ${this.#context}
            <table cellspacing="0">
                <thead>
                    <tr>
                        ${[...keys].map(header).map((str, i) => this.#renderHeader(str, entries[keys[i]]))}
                    </tr>
                </thead>
                <tbody></tbody>
                <tfoot>
                    <tr>
                        <td>${new Loader()} Rendering table data...</td>
                    </tr>
                </tfoot>
            </table>
            <p style="margin: 10px 0px">
                <small style="color: gray;">Right click to add or remove rows.</small>
            </p>
        `;
    }
}

customElements.get("nwb-simple-table") || customElements.define("nwb-simple-table", SimpleTable);
