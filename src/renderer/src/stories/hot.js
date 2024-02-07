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

class DateTimeEditor extends Handsontable.editors.BaseEditor {
    constructor(hotInstance) {
        super(hotInstance);
    }

    init() {
        // Create detached node, add CSS class and make sure its not visible
        this.DATETIME = new DateTimeSelector();

        Object.assign(this.DATETIME.style, {
            overflow: 'hidden',
            position: 'absolute',
            display: 'none',
            zIndex: 1000
        })

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

        style.minWidth = `${width}px`;
        style.top = `${top}px`;
        style[this.hot.isRtl() ? "right" : "left"] = `${start}px`;
        style.margin = "0px";
        style.display = "";
        
        Object.assign(this.DATETIME.input.style, {
            height: `${height}px`,
            minWidth: `${width}px`,
            padding: '5px',
            boxSizing: 'border-box',
            fontSize: '12px'
        })

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

class DateEditor extends DateTimeEditor {
    constructor(hotInstance) {
        super(hotInstance);
    }

    init() {
        super.init()
        this.DATETIME.input.type = "date";
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

// Handsontable.cellTypes.registerCellType("date", {
//     editor: DateEditor,
// });
