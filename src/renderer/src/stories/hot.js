import Handsontable from "handsontable";
import css from "handsontable/dist/handsontable.full.min.css?inline";

export { Handsontable, css };

import { DateTimeSelector } from "./DateTimeSelector";

function arrayRenderer(instance, td, row, col, prop, value, cellProperties) {
    if (!value) value = [];
    const ul = document.createElement("ul");
    if (typeof value === "string") value = value.split(",");
    else if (!Array.isArray(value)) value = [value];
    value.forEach((v) => {
        const li = document.createElement("li");
        li.innerText = v;
        ul.appendChild(li);
    });

    td.innerText = "";
    td.appendChild(ul);

    return td;
}

// Borrowed from https://stackoverflow.com/a/29774197/7290573
function getDate(days) {
    let date;

    if (days !== undefined) {
        date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
        date = new Date();
    }

    const offset = date.getTimezoneOffset();

    date = new Date(date.getTime() - offset * 60 * 1000);

    return date.toISOString();
}

class DateTimeEditor extends Handsontable.editors.BaseEditor {
    constructor(hotInstance) {
        super(hotInstance);
    }

    init() {
        // Create detached node, add CSS class and make sure its not visible
        this.DATETIME = new DateTimeSelector();
        this.DATETIME.type = "datetime-local";
        this.DATETIME.style.position = "absolute";

        this.DATETIME.style.display = "none";
        this.DATETIME.input.style.width = "0px"; // Don't actually show the input, just the picker

        this.DATETIME.input.min = "1900-01-01T00:00";
        this.DATETIME.input.max = getDate(0).slice(0, -2);

        // Attach node to DOM, by appending it to the container holding the table
        this.hot.rootElement.appendChild(this.DATETIME);
    }

    getValue() {
        return this.DATETIME.value;
    }

    setValue(newValue) {
        this.DATETIME.value = newValue;
    }

    open() {
        const { top, start, width, height } = this.getEditedCellRect();
        const style = this.DATETIME.style;
        this._opened = true;

        style.height = `${height}px`;
        style.minWidth = `${width}px`;
        style.top = `${top}px`;
        style[this.hot.isRtl() ? "right" : "left"] = `${start}px`;
        style.margin = "0px";
        style.display = "";
    }

    focus() {
        this.DATETIME.click();
    }

    close() {
        this._opened = false;
        this.DATETIME.style.display = "none";
        // setTimeout(() => this.correctCopyPasteElement(), 40)
    }
}

class ArrayEditor extends Handsontable.editors.TextEditor {
    constructor(hotInstance) {
        super(hotInstance);
    }

    getValue() {
        const value = super.getValue();

        if (!value) return [];
        else {
            const split = value
                .split(",")
                .map((str) => str.trim())
                .filter((str) => str);

            return this.cellProperties.uniqueItems ? Array.from(new Set(split)) : split; // Only unique values
        }
    }

    setValue(newValue) {
        if (Array.isArray(newValue)) newValue = newValue.join(",");
        super.setValue(newValue);
    }
}

Handsontable.cellTypes.registerCellType("array", {
    editor: ArrayEditor,
    renderer: arrayRenderer,
});

Handsontable.cellTypes.registerCellType("date-time", {
    editor: DateTimeEditor,
});
