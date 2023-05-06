

// class DateTimeEditor extends Handsontable.editors.BaseEditor {
//     constructor(hotInstance) {
//         super(hotInstance);
//     }

//     init() {
//         // Create detached node, add CSS class and make sure its not visible
//         this.DATETIME = new DateTimeSelector();
//         this.DATETIME.type = "datetime-local";
//         this.DATETIME.style.position = "absolute";

//         this.DATETIME.style.display = "none";
//         this.DATETIME.input.style.width = "0px"; // Don't actually show the input, just the picker

//         // Attach node to DOM, by appending it to the container holding the table
//         this.hot.rootElement.appendChild(this.DATETIME);

//         // // Immediately transfers the CopyPastePlugin FocusableWrapper element to the WC Shadow Root
//         const copyPastePlugin = this.hot.getPlugin("copyPaste");
//         const ogFn = copyPastePlugin.getOrCreateFocusableElement.bind(copyPastePlugin);
//         copyPastePlugin.getOrCreateFocusableElement = () => {
//             const res = ogFn();
//             const focusable = copyPastePlugin.focusableElement.getFocusableElement();
//             const root = this.hot.rootElement.getRootNode();
//             focusable.style.position = "absolute";
//             focusable.style.opacity = "0";
//             focusable.style.pointerEvents = "none";
//             copyPastePlugin.getOrCreateFocusableElement = ogFn;
//             root.append(focusable);
//             return res;
//         };
//     }

//     getValue() {
//         return this.DATETIME.value;
//     }

//     setValue(newValue) {
//         this.DATETIME.value = newValue;
//     }

//     open() {
//         const { top, start, width, height } = this.getEditedCellRect();
//         const style = this.DATETIME.style;
//         this._opened = true;

//         style.height = `${height}px`;
//         style.minWidth = `${width}px`;
//         style.top = `${top}px`;
//         style[this.hot.isRtl() ? "right" : "left"] = `${start}px`;
//         style.margin = "0px";
//         style.display = "";
//     }

//     focus() {
//         this.DATETIME.click();
//     }

//     close() {
//         this._opened = false;
//         this.DATETIME.style.display = "none";
//         // setTimeout(() => this.correctCopyPasteElement(), 40)
//     }
// }

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