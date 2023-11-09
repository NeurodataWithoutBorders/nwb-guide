import { LitElement, css, html, unsafeCSS } from "lit";
import { header } from "./forms/utils";
import { checkStatus } from "../validation";

import { TableCell } from "./table/Cell";
import { ContextMenu } from "./table/ContextMenu";
import { emojiFontFamily, errorHue, warningHue } from "./globals";

import { Loader } from "./Loader";
import { styleMap } from "lit/directives/style-map.js";

import "./Button";
import tippy from "tippy.js";

var isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

const isVisible = function (ele, container) {
    const { bottom, height, top } = ele.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return top <= containerRect.top ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
};

export class SimpleTable extends LitElement {
    validateOnChange;
    onUpdate = () => {};

    static get styles() {
        return css`
            :host {
                width: 100%;
                display: inline-block;
                font-family: sans-serif;
                font-size: 13px;
                box-sizing: border-box;
                --loader-color: hsl(200, 80%, 50%);
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
                height: 250px;
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

            :host([loading]:not([waiting])) table {
                height: 250px;
            }

            :host([loading]:not([waiting])) .loadTrigger {
                display: none;
            }

            :host([loading]:not([waiting])) thead {
                filter: blur(1.5px);
            }

            :host([loading][waiting]) .loader {
                display: none;
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

            .table-container {
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
                z-index: 1;
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
                background: whitesmoke;
            }

            td {
                border: 1px solid gainsboro;
                background: white;
                user-select: none;
            }

            .relative .info {
                margin: 0px 5px;
                font-size: 80%;
                font-family: ${unsafeCSS(emojiFontFamily)}
            }
        `;
    }

    #rendered;
    #updateRendered = (force) =>
        force || this.rendered === true
            ? (this.rendered = new Promise((resolve) => (this.#rendered = () => resolve((this.rendered = true)))))
            : this.rendered;
    rendered = this.#updateRendered(true);

    constructor({
        schema,
        data,
        globals,
        keyColumn,
        validateOnChange,
        validateEmptyCells,
        onStatusChange,
        onLoaded,
        onUpdate,
        onThrow,
        deferLoading,
        maxHeight,
    } = {}) {
        super();
        this.schema = schema ?? {};
        this.data = data ?? [];
        this.keyColumn = keyColumn;
        this.globals = globals ?? {};
        this.validateEmptyCells = validateEmptyCells ?? true;
        this.deferLoading = deferLoading ?? false;
        this.maxHeight = maxHeight ?? "";

        if (validateOnChange) this.validateOnChange = validateOnChange;
        if (onStatusChange) this.onStatusChange = onStatusChange;
        if (onLoaded) this.onLoaded = onLoaded;
        if (onThrow) this.onThrow = onThrow;
        if (onUpdate) this.onUpdate = onUpdate;

        this.onmousedown = (ev) => {
            this.#clearSelected();
            this.#selecting = true;
            const cell = this.#getCellFromEvent(ev);
            if (cell) this.#selectCells(cell);
        };

        this.onmouseup = (ev) => (this.#selecting = false);

        document.addEventListener("onmouseup", this.onmouseup);

        document.addEventListener("mousedown", (ev) => {
            const path = this.#getPath(ev);
            if (!path.includes(this)) this.#clearSelected();
        });

        // Handle Copy-Paste Commands
        this.addEventListener("copy", (ev) => {
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
            if ((isMac ? ev.metaKey : ev.ctrlKey) && ev.key === "z") return this.#clearSelected();

            if (this.#firstSelected) {
                const path = this.#getPath(ev);
                if (path[0] === document.body) {
                    this.#firstSelected.input.toggle(true); // Open editor
                    this.#firstSelected.input.execute("selectAll"); // redirect keydown to the hidden input
                }
            }
        });

        this.addEventListener("paste", (ev) => {
            ev.preventDefault();
            const topLeftCell = Object.values(this.#selected)[0]?.[0];
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
                    this.globals[col] ??
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
            if (len === 1) message = errors[0].title || "Error found";
            else if (len) {
                message = `${len} errors exist on this table.`;
            }
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
    onThrow = () => {};

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

    addRow = (anchorRow = this.#cells.length - 1, n) => this.#updateRows(anchorRow, 1)[0];
    getRow = (i) => Object.values(this.#cells[i]);

    #menuOptions = {
        row: {
            add: {
                label: "Add Row",
                onclick: (path) => {
                    const cell = this.#getCellFromPath(path);
                    const { i } = cell.simpleTableInfo;
                    this.addRow(i); //2) // TODO: Support adding more than one row
                },
            },
            remove: {
                label: "Remove Row",
                onclick: (path) => {
                    const cell = this.#getCellFromPath(path);
                    const { i, row } = cell.simpleTableInfo; // TODO: Support detecting when the user would like to remove more than one row

                    // Validate with empty values before removing (to trigger any dependent validations)
                    const cols = this.data[row];
                    Object.keys(cols).map((k) => (cols[k] = ""));
                    if (this.validateOnChange)
                        Object.keys(cols).map((k) => {
                            const res = this.validateOnChange(k, { ...cols }, cols[k]);
                            if (typeof res === "function") res();
                        });

                    // Actually update the rows
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

    #loaded = false;
    #resetLoadState() {
        this.setAttribute("waiting", "");
        this.#loaded = false;
    }

    load = () => {
        this.removeAttribute("waiting");

        const scrollRoot = this.shadowRoot.querySelector("table");
        // Add cells to body after the initial table render
        const body = this.shadowRoot.querySelector("tbody");

        if (!this.#loaded) {
            const tStart = performance.now();
            body.append(
                ...Object.values(this.#cells).map((row) => {
                    const tr = document.createElement("tr");
                    tr.append(...Object.values(row).map((cell, j) => this.#renderCell(cell)));
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

            console.warn(`Visible Cell Load Time: ${(performance.now() - tStart).toFixed(2)}ms`);

            this.removeAttribute("loading");
            this.#loaded = true;
            this.onLoaded();

            this.generateContextMenu({
                row: {
                    add: true,
                    remove: true,
                },
            });
        }
    };

    updated() {
        this.setAttribute("loading", "");

        const data = this.#getData();
        const cells = data.map((row, i) => row.map((v, j) => this.#createCell(v, { i, j }))).flat();

        // Trigger load after a short delay if not deferred
        if (!this.deferLoading) {
            this.removeAttribute("waiting");
            setTimeout(() => {
                this.load();
                this.#rendered(true);
            }, 100);
            // Otherwise validate the data itself without rendering
        } else {
            cells.forEach((c) => c.validate());
            this.#rendered(true);
        }
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
                this.onThrow("You must have at least one row");
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
            const mapped = range.map((idx) => {
                const i = idx + 1;
                delete this.#cells[i];
                const data = this.#getRowData(); // Get information for an undefined row
                const newRow = document.createElement("tr");
                newRow.append(...data.map((v, j) => this.#renderCell(v, { i, j })));
                latest.insertAdjacentElement("afterend", newRow);
                latest = newRow;
                return this.getRow(i);
            });

            return mapped;
        }
    }

    #renderHeader = (str, { description }) => {
        const header = document.createElement('th')

        // Inner Content
        const div = document.createElement("div");
        div.classList.add("relative");
        const span = document.createElement("span");
        span.innerHTML = str
        div.append(span);
        header.append(div)

        // Add Description Tooltip
        if (description) {
            const span = document.createElement("span");
            span.classList.add("info");
            span.innerText = "ℹ️";
            div.append(span);
            tippy(span, { content: `${description[0].toUpperCase() + description.slice(1)}` });
        }

        return header;
    };

    #cells = [];

    #unresolved = {};
    #onCellChange = (cell) => {
        const value = cell.value;

        const { i: row, col: header, row: possibleRowName, j: prop } = cell.simpleTableInfo;
        // const header = typeof prop === "number" ? col : prop;

        let rowName = this.keyColumn ? possibleRowName : row;

        // NOTE: We would like to allow invalid values to mutate the results
        // if (isValid) {

        const isResolved = rowName in this.data;
        let target = this.data;

        if (!isResolved) {
            if (!this.keyColumn) this.data[rowName] = {}; // Add new row to array
            else {
                rowName = row;
                if (!this.#unresolved[rowName]) this.#unresolved[rowName] = {}; // Ensure row exists
                target = this.#unresolved;
            }
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
            if (value == undefined || value === "") target[rowName][header] = undefined;
            else target[rowName][header] = value;
        }

        if (cell.interacted) this.onUpdate(rowName, header, value);
    };

    #createCell = (value, info) => {
        const rowNames = Object.keys(this.data);

        const fullInfo = {
            ...info,
            col: this.colHeaders[info.j],
            row: Array.isArray(this.data) ? `${info.i}` : rowNames[info.i],
        };

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
                const td = cell.simpleTableInfo.td;
                if (td) {
                    for (let key in info) {
                        const value = info[key];
                        if (value === undefined) td.removeAttribute(key);
                        else td.setAttribute(key, info[key]);
                    }
                }

                this.#onCellChange(cell);
                this.#checkStatus(); // Check status after every validation update
            },
        });

        cell.simpleTableInfo = fullInfo;

        if (!this.#cells[fullInfo.i]) this.#cells[fullInfo.i] = {};
        this.#cells[fullInfo.i][fullInfo.j] = cell;
        return cell;
    };

    #renderCell = (value, info) => {
        const td = document.createElement("td");
        const cell = value instanceof TableCell ? value : this.#createCell(value, info);

        cell.simpleTableInfo.td = td;
        td.onmouseover = () => {
            if (this.#selecting) this.#selectCells(cell);
        };

        td.appendChild(cell);
        return td;
    };

    #schema = {};

    render() {
        this.#updateRendered();
        this.#resetLoadState();

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
            <div class="table-container">
                <table cellspacing="0" style=${styleMap({ maxHeight: this.maxHeight })}>
                    <thead>
                        <tr>
                            ${[...keys].map(header).map((str, i) => this.#renderHeader(str, entries[keys[i]]))}
                        </tr>
                    </thead>
                    <tbody></tbody>
                    <tfoot>
                        <tr>
                            <td>
                                <div class="loader">${new Loader()} Rendering table data...</div>
                                <nwb-button
                                    class="loadTrigger"
                                    @click=${() => {
                                        this.removeAttribute("waiting");
                                        setTimeout(() => this.load(), 100);
                                    }}
                                    >Load Data</nwb-button
                                >
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <p style="margin: 10px 0px">
                <small style="color: gray;">Right click to add or remove rows.</small>
            </p>
        `;
    }
}

customElements.get("nwb-simple-table") || customElements.define("nwb-simple-table", SimpleTable);
