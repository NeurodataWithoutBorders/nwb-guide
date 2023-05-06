import { LitElement } from "lit";

import { DateTimeSelector } from '../../DateTimeSelector'


export class DateTimeEditor extends LitElement {
    constructor() {
        super();
        this.DATETIME = new DateTimeSelector();
        this.DATETIME.type = "datetime-local";
        this.DATETIME.style.position = "absolute";
        // this.DATETIME.style.display = "none";
        // this.DATETIME.input.style.width = "0px"; // Don't actually show the input, just the picker
    }

    render () {
        return this.DATETIME
    }

    // getValue() {
    //     return this.DATETIME.value;
    // }

    // setValue(newValue) {
    //     this.DATETIME.value = newValue;
    // }

    // open() {
    //     const { top, start, width, height } = this.getEditedCellRect();
    //     const style = this.DATETIME.style;
    //     this._opened = true;

    //     style.height = `${height}px`;
    //     style.minWidth = `${width}px`;
    //     style.top = `${top}px`;
    //     style[this.hot.isRtl() ? "right" : "left"] = `${start}px`;
    //     style.margin = "0px";
    //     style.display = "";
    // }

    // focus() {
    //     this.DATETIME.click();
    // }

    // close() {
    //     this._opened = false;
    //     this.DATETIME.style.display = "none";
    //     // setTimeout(() => this.correctCopyPasteElement(), 40)
    // }
}

// class ArrayEditor extends Handsontable.editors.TextEditor {
//     constructor(hotInstance) {
//         super(hotInstance);
//     }

//     getValue() {
//         const value = super.getValue();
//         if (!value) return [];
//         else {
//             const split = value
//                 .split(",")
//                 .map((str) => str.trim())
//                 .filter((str) => str);
//             return this.cellProperties.uniqueItems ? Array.from(new Set(split)) : split; // Only unique values
//         }
//     }

//     setValue(newValue) {
//         if (Array.isArray(newValue)) return newValue.join(",");
//         super.setValue(newValue);
//     }
// }

customElements.get("nwb-datetime-editor") || customElements.define("nwb-datetime-editor", DateTimeEditor);
