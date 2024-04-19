import { LitElement, css, html, unsafeCSS } from "lit";
import { header, tempPropertyValueKey } from "./forms/utils";
import { checkStatus } from "../validation";

import { TableCell } from "./table/Cell";
import { ContextMenu } from "./table/ContextMenu";
import { emojiFontFamily, errorHue, warningHue } from "./globals";

import { Loader } from "./Loader";
import { styleMap } from "lit/directives/style-map.js";

import "./Button";
import tippy from "tippy.js";
import { sortTable, getEditable } from "./Table";
import { NestedInputCell } from "./table/cells/input";
import { getIgnore } from "./JSONSchemaForm";

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
                position: relative;
            }

            :host([loading]) tfoot td {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, calc(-50% + 10px));
                text-align: center;
                border: none;
            }

            td[editable="false"] {
                background: whitesmoke;
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
                border: 1px solid gray;
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

            table tr:first-child td {
                border-top: 0px;
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

            table *:last-child {
                border-right: none;
            }

            .relative .info {
                margin: 0px 5px;
                font-size: 80%;
                font-family: ${unsafeCSS(emojiFontFamily)};
            }

            h3 {
                margin: 0;
                padding: 10px;
                background: black;
                color: white;
                border-radius-top: 5px;
            }
        `;
    }

    #rendered;
    #updateRendered = (force) =>
        force || this.rendered === true
            ? (this.rendered = new Promise((resolve) => (this.#rendered = () => resolve((this.rendered = true)))))
            : this.rendered;
    rendered = this.#updateRendered(true);

    #onUpdate = (...args) => {
        this.onUpdate(...args);
        if (this.#context) this.#updateContextMenuRendering();
    };

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
        contextOptions = {},
        ignore = {},
        editable = {},
    } = {}) {
        super();
        this.schema = schema ?? {};
        this.#keyColumn = keyColumn;
        this.data = data ?? [];

        this.globals = globals ?? {};
        this.validateEmptyCells = validateEmptyCells ?? true;
        this.deferLoading = deferLoading ?? false;
        this.maxHeight = maxHeight ?? "";

        this.ignore = ignore;
        this.editable = editable;

        this.contextOptions = contextOptions;

        if (validateOnChange) this.validateOnChange = validateOnChange;
        if (onStatusChange) this.onStatusChange = onStatusChange;
        if (onLoaded) this.onLoaded = onLoaded;
        if (onThrow) this.onThrow = onThrow;
        if (onUpdate) this.onUpdate = onUpdate;

        this.onmousedown = (pointerDownEvent) => {
            pointerDownEvent.stopPropagation();
            this.#clearSelected();
            this.#selecting = true;
            const cell = this.#getCellFromEvent(pointerDownEvent);
            if (cell) this.#selectCells(cell);
        };

        this.onmouseup = () => (this.#selecting = false);

        document.addEventListener("onmouseup", this.onmouseup);

        document.addEventListener("mousedown", (pointerDownEvent) => {
            const path = this.#getPath(pointerDownEvent);
            if (!path.includes(this)) this.#clearSelected();
        });

        // Handle Copy-Paste Commands
        this.addEventListener("copy", (copyEvent) => {
            copyEvent.stopPropagation();
            copyEvent.preventDefault();

            const tsv = Object.values(this.#selected)
                .map((arr) => arr.map((inputElement) => inputElement.value).join("\t"))
                .join("\n");

            copyEvent.clipboardData.setData("text/plain", tsv);
        });

        document.addEventListener("keydown", (keyDownEvent) => {
            var key = keyDownEvent.keyCode || keyDownEvent.charCode;
            if (key == 8 || key == 46) {
                const path = this.#getPath(keyDownEvent);
                if (path[0] === document.body)
                    Object.values(this.#selected).forEach((row) => {
                        row.forEach((cell) => {
                            if (cell.type !== "table") cell.setInput("");
                        });
                    });
                return;
            }

            // Avoid special key clicks
            if ((keyDownEvent.metaKey || keyDownEvent.ctrlKey || keyDownEvent.shiftKey) && !keyDownEvent.key) return;

            // Undo / Redo
            if ((isMac ? keyDownEvent.metaKey : keyDownEvent.ctrlKey) && keyDownEvent.key === "z")
                return this.#clearSelected();

            if (this.#firstSelected) {
                const path = this.#getPath(keyDownEvent);
                if (path[0] === document.body) {
                    this.#firstSelected.input.toggle(true); // Open editor
                    this.#firstSelected.input.execute("selectAll"); // redirect keydown to the hidden input
                }
            }
        });

        this.addEventListener("paste", (pasteEvent) => {
            pasteEvent.stopPropagation();
            pasteEvent.preventDefault();

            const topLeftCell = Object.values(this.#selected)[0]?.[0];
            if (!topLeftCell) return;
            const { i: firstI, j: firstJ } = topLeftCell.simpleTableInfo;
            const tsv = pasteEvent.clipboardData.getData("text/plain");
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

    #keyColumn;
    #data = [];
    get data() {
        // Remove empty array entries
        if (Array.isArray(this.#data)) return this.#data.filter((o) => Object.keys(o).length);
        else return this.#data;
    }

    set data(val) {
        this.#data = val;
        this.keyColumn = Array.isArray(this.#data) ? undefined : this.#keyColumn ?? "Property Key";
    }

    #selected = {};
    #selecting = false;
    #firstSelected; // TableCell

    #clearSelected = (clearFirst = true) => {
        if (clearFirst && this.#firstSelected) {
            // this.#firstSelected.parentNode.removeAttribute("first");
            this.#firstSelected = null;
        }

        Object.values(this.#selected).forEach((arr) =>
            arr.forEach((cellElement) => cellElement.parentNode.removeAttribute("selected"))
        );
        this.#selected = {};
    };

    #getPath = (ev) => ev.path || ev.composedPath();
    #getCellFromEvent = (ev) => this.#getCellFromPath(this.#getPath(ev));
    #getCellFromPath = (path) => {
        let inInputCell;

        const found = path.find((element) => {
            if (element instanceof NestedInputCell) inInputCell = true;
            return !inInputCell && (element instanceof TableCell || element.children?.[0] instanceof TableCell);
        });
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

    #isUndefined(val) {
        return val === undefined || val === "";
    }

    #getRowData(row, cols = this.colHeaders) {
        const hasRow = row in this.#data;
        return cols.map((col, j) => {
            let value;
            if (col === this.keyColumn) {
                if (hasRow) value = row;
                else return "";
            } else {
                value = hasRow ? this.#data[row][col] : undefined;
                if (this.#isUndefined(value)) value = this.globals[col];
                if (this.#isUndefined(value)) value = this.#itemSchema.properties?.[col]?.default;
                if (this.#isUndefined(value)) value = "";
            }
            return value;
        });
    }

    #getData(rows = Object.keys(this.#data), cols = this.colHeaders) {
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

    #updateContextMenuRendering = () => {
        const { minItems, maxItems } = this.schema;

        if (minItems || maxItems) {
            const nRows = this.data.length;
            const addRowButton = this.#context.shadowRoot.querySelector("#add-row");
            const removeRowButton = this.#context.shadowRoot.querySelector("#remove-row");

            removeRowButton.removeAttribute("disabled");
            addRowButton.removeAttribute("disabled");

            if (nRows <= minItems) removeRowButton.setAttribute("disabled", "");

            if (nRows >= maxItems) addRowButton.setAttribute("disabled", "");
        }
    };

    #menuOptions = {
        row: {
            add: {
                id: "add-row",
                label: "Add Row",
                onclick: (path) => {
                    // const cell = this.#getCellFromPath(path);
                    // if (!cell) return this.addRow(); // No cell selected
                    // const { i } = cell.simpleTableInfo;
                    const lastRow = this.#cells.length - 1;
                    this.addRow(lastRow); // Just insert row at the end
                },
            },
            remove: {
                id: "remove-row",
                label: "Remove Row",
                onclick: (path) => {
                    const cell = this.#getCellFromPath(path);
                    if (!cell) return; // No cell selected

                    const { i, row } = cell.simpleTableInfo; // TODO: Support detecting when the user would like to remove more than one row

                    // Validate with empty values before removing (to trigger any dependent validations)
                    const cols = this.#data[row];
                    Object.keys(cols).map((k) => (cols[k] = ""));
                    if (this.validateOnChange)
                        Object.keys(cols).map((k) => {
                            const res = this.validateOnChange([k], { ...cols }, cols[k]); // NOTE: This is likely incorrect
                            if (typeof res === "function") res();
                        });

                    // Actually update the rows
                    this.#updateRows(i, -1);
                },
            },
        },

        column: {
            add: {
                id: "add-column",
                label: "Add Column",
                onclick: (path) => {
                    console.log("add column");
                    this.#getCellFromPath(path);
                },
            },
            remove: {
                id: "remove-column",
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

        const { minItems, maxItems } = this.schema;
        const nRows = this.data.length;

        const noRowEdits = minItems && maxItems && minItems === maxItems && nRows === minItems && nRows === maxItems;

        if (!noRowEdits) {
            if (options.row?.add) items.push(this.#menuOptions.row.add);
            if (options.row?.remove) items.push(this.#menuOptions.row.remove);
        }

        if (options.column?.add) items.push(this.#menuOptions.column.add);
        if (options.column?.remove) items.push(this.#menuOptions.column.remove);

        if (items.length) {
            this.#context = new ContextMenu({
                target: this.shadowRoot.querySelector("table"),
                items,
                onOpen: (path) => {
                    const checks = {
                        row_remove: {
                            check: this.editable.__row_remove,
                            element: this.#context.shadowRoot.querySelector("#remove-row"),
                        },

                        row_add: {
                            check: this.editable.__row_add,
                            element: this.#context.shadowRoot.querySelector("#add-row"),
                        },
                    };

                    const hasChecks = Object.values(checks).some(({ check }) => check);

                    if (hasChecks) {
                        const cell = this.#getCellFromPath(path);
                        const info = cell.simpleTableInfo;
                        const rowNames = Object.keys(this.#data);
                        const row = Array.isArray(this.#data) ? info.i : rowNames[info.i];

                        const results = Object.values(checks).map(({ check, element }) => {
                            if (check) {
                                const canRemove = check(cell.value, this.#data[row]);
                                if (canRemove) element.removeAttribute("disabled");
                                else element.setAttribute("disabled", "");
                                return canRemove;
                            } else return true;
                        });

                        return !results.every((r) => r === false); // If all are hidden, don't show the context menu
                    }

                    return true;
                },
            });

            this.#context.updated = () => this.#updateContextMenuRendering(); // Run when done rendering

            document.body.append(this.#context); // Insert context menu
        }
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
        body.innerHTML = ""; // Clear existing render

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
                ...this.contextOptions,
            });
        }
    };

    updated() {
        this.setAttribute("loading", "");

        const data = this.#getData(); // Always render at least one row
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

        const bodyEl = this.shadowRoot.querySelector("tbody");
        const children = Array.from(bodyEl.children);

        const isPositive = Math.sign(nRows) === 1;

        // Remove elements and cell entries that correspond to the removed elements
        if (!isPositive) {
            const rowHeaders = Object.keys(this.#data);
            range.map((i) => {
                children[i].remove();
                delete this.#data[rowHeaders[row]];
                delete this.#unresolved[row];
                delete this.#cells[i];
            });
        }

        // Shift all cells in a row
        let ogCells = { ...this.#cells };

        const afterIdx = row + count;
        const after = children.slice(afterIdx);
        after.forEach((element, i) => {
            const pos = afterIdx + i + nRows;
            this.#cells[pos] = ogCells[afterIdx + i];
            Array.from(element.children).forEach((element) => (element.children[0].simpleTableInfo.i = pos)); // Increment position
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

                if (latest) latest.insertAdjacentElement("afterend", newRow);
                else bodyEl.append(newRow);

                return this.getRow(i);
            });

            this.#onUpdate([], this.data);
            return mapped;
        }

        this.#onUpdate([], this.data);
    }

    #renderHeader = (str, { title, description }) => {
        const header = document.createElement("th");

        // Inner Content
        const div = document.createElement("div");
        div.classList.add("relative");
        const span = document.createElement("span");
        span.innerHTML = title ?? str;
        div.append(span);
        header.append(div);

        // Add Description Tooltip
        if (description) {
            const span = document.createElement("span");
            span.classList.add("info");
            span.innerText = "ℹ️";
            div.append(span);
            tippy(span, { content: `${description[0].toUpperCase() + description.slice(1)}`, allowHTML: true });
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

        const isResolved = rowName in this.#data;
        let target = this.#data;

        if (!isResolved) {
            if (!this.keyColumn)
                this.#data[rowName] = {}; // Add new row to array
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
                    this.#data[value] = old; // Allow renaming when different
                    delete this.#unresolved[row];
                } else this.#unresolved[row] = old; // Allow tracking when keyColumn is deleted

                delete target[rowName]; // Delete the old name from source
            }
        }
        // Update data on passed object
        else {
            if (this.#isUndefined(value)) target[rowName][header] = undefined;
            else target[rowName][header] = value;
        }

        if (cell.interacted) this.#onUpdate([rowName, header], value);
    };

    #createCell = (value, info) => {
        const rowNames = Object.keys(this.#data);

        const row = Array.isArray(this.#data) ? info.i : rowNames[info.i];

        const fullInfo = {
            ...info,
            col: this.colHeaders[info.j],
            row: `${row}`,
        };

        const schema = this.#itemProps[fullInfo.col];

        const ignore = getIgnore(this.ignore, [fullInfo.col]);
        const rowData = this.#data[row];
        const isEditable = getEditable(value, rowData, this.editable, fullInfo.col);

        // Track the cell renderer
        const cell = new TableCell({
            info: {
                title: header(
                    fullInfo.col === tempPropertyValueKey
                        ? "Property" // outerParent[tempPropertyKey] // NOTE: For new rows, this will be unresolved at instantiation
                        : fullInfo.col
                ),
                col: this.colHeaders[info.j],
            },
            editable: isEditable,
            value,
            schema,
            ignore,
            validateOnChange: async (
                value,
                path = [],
                parent = { ...this.#data[fullInfo.row] }, // A copy of the parent
                innerSchema = schema
            ) => {
                if (!value && !this.validateEmptyCells) return true; // Empty cells are valid

                const res = this.validateOnChange
                    ? await this.validateOnChange([row, fullInfo.col, ...path], parent, value, innerSchema)
                    : true;

                return res;
            },

            onValidate: (info) => {
                const td = cell.simpleTableInfo.td;
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

                this.#onCellChange(cell); // Only update data if the value has changed

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

        td.setAttribute("editable", cell.editable);

        td.onmouseover = () => {
            if (this.#selecting) this.#selectCells(cell);
        };

        td.ondblclick = () => cell.toggle(true);

        cell.addEventListener("blur", () => {
            this.#clearSelected(); // NOTE: May now make other clearSelected calls redundant
        });

        td.appendChild(cell);
        return td;
    };

    #schema = {};

    #itemSchema = {};
    #itemProps = {};

    get schema() {
        return this.#schema;
    }

    set schema(schema = {}) {
        this.#schema = schema;
        this.#itemSchema = this.#schema.items ?? {};
        this.#itemProps = { ...(this.#itemSchema.properties ?? {}) };
    }

    render() {
        this.#updateRendered();
        this.#resetLoadState();

        const entries = this.#itemProps;

        // Add existing additional / pattern properties to the entries variable if necessary
        if (this.#itemSchema.additionalProperties !== false || this.#itemSchema.patternProperties) {
            Object.values(this.#data).reduce((acc, v) => {
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
        this.colHeaders = sortTable(
            {
                ...this.#itemSchema,
                properties: entries,
            },
            this.keyColumn,
            this.#itemSchema.order ?? ["name"] // Specify the order of the columns
        );

        // Try to guess the key column if unspecified
        if (!Array.isArray(this.#data) && !this.keyColumn) {
            const [key, value] = Object.entries(this.#data)[0];
            const foundKey = Object.keys(value).find((k) => value[k] === key);
            if (foundKey) this.keyColumn = foundKey;
        }

        return html`
            ${this.#context}
            <div class="table-container">
                <table cellspacing="0" style=${styleMap({ maxHeight: this.maxHeight })}>
                    <thead>
                        <tr>
                            ${[...this.colHeaders]
                                .map(header)
                                .map((str, i) => this.#renderHeader(str, entries[this.colHeaders[i]]))}
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
            <p style="margin: 0; margin-top: 10px">
                <small style="color: gray;">Right click to add or remove rows.</small>
            </p>
        `;
    }
}

customElements.get("nwb-simple-table") || customElements.define("nwb-simple-table", SimpleTable);
