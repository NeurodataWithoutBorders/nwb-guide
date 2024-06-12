

// When clicking into a contenteditable div, the cursor is, by default, placed at the beginning of the text. 
// This function places the cursor at the end of the text.
export function placeCaretAtEnd(
    inputElement: HTMLInputElement
) {
    inputElement.focus();
    const range = document.createRange();
    range.selectNodeContents(inputElement);
    range.collapse(false);
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);

}
