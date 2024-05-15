
import { DateTimeSelector } from '../../DateTimeSelector'
import { TableCellBase } from "./base";
import { BaseRenderer } from './renderers/base';

export class DateTimeCell extends TableCellBase {

    constructor() {
        super();
    }

    editor = new DateTimeEditor()

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

customElements.get("nwb-datetime-cell") || customElements.define("nwb-datetime-cell", DateTimeCell);


export class DateTimeEditor extends BaseRenderer {

    DATETIME = new DateTimeSelector()
    constructor(...args) {
        super(...args);
        this.DATETIME.type = "datetime-local";
        this.DATETIME.style.position = "absolute";
        this.DATETIME.style.display = "none";
    }

    render() {
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

customElements.get("nwb-datetime-editor") || customElements.define("nwb-datetime-editor", DateTimeEditor);
