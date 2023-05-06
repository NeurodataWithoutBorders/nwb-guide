import { LitElement, css } from "lit"
import { placeCaretAtEnd } from "./utils"

type BaseTableProps = {
    onOpen: Function,
    onClose: Function,
    onChange: Function
}

export class TableCellBase extends LitElement {

    declare value: any

    editable = document.createElement('div')

    static get styles() {
        return css`
            [contenteditable] {
                padding: 5px;
                pointer-events: none;
            }
        `
    }

    // static get properties() {
    //     return {
    //         value: { reflect: true }
    //     }
    // }


    constructor({
        onOpen,
        onClose,
        onChange
    }: Partial<BaseTableProps> = {}) {

        super()

        if (onOpen) this.onOpen = onOpen
        if (onChange) this.onChange = onChange
        if (onClose) this.onClose = onClose

        this.editable.setAttribute('contenteditable', '')
        this.editable.addEventListener('blur', () => {
            const currentValue = this.editable.innerText;
            if (this.value !== currentValue) {
                this.value = currentValue
                this.onChange(currentValue)
            }
            this.toggle(false)
        })

    }

    #active = false
    onOpen: BaseTableProps['onOpen'] = () => {}
    onClose: BaseTableProps['onClose'] = () => {}
    onChange: BaseTableProps['onChange'] = () => {}

    toggle (state = !this.#active) {
        if (state === this.#active) return

        if (state) {
            this.onOpen()
            this.style.pointerEvents = 'all'
            placeCaretAtEnd(this.editable)
        } else {
            this.onClose()
            this.style.pointerEvents = ''
        }
        
        this.#active = state

    }

    setText(value: any) {
        this.editable.innerText = value
        this.value = this.editable.innerText // Coerce to string
    }


    set(value: any) {
        this.editable.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, value);
        this.editable.blur();
        this.setText(value)
    }


    render() {
        return this.editable
    }
}

customElements.get("nwb-cell-base") || customElements.define("nwb-cell-base", TableCellBase);
