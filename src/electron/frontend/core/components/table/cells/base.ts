import { LitElement, css, html } from "lit"
import { placeCaretAtEnd } from "../../../../utils/table"

type BaseTableProps = {
    info: {
        col: string,
    },
    editable: boolean,
    toggle: (state?: boolean) => void,
    schema: any,
    onOpen: Function,
    onClose: Function,
    onChange: Function,
    nestedProps: NestedTableCellProps,
}


type NestedTableCellProps = {
    validateOnChange?: Function,
}

export class TableCellBase extends LitElement {

    declare value: any

    nestedProps: NestedTableCellProps

    // Separate editor and renderer
    #editable: HTMLElement = document.createElement('div')
    editor: HTMLElement | Function = this.#editable
    renderer: HTMLElement | Function = this.editor
    #editor?: HTMLElement
    #renderer?: HTMLElement

    // Internal variables
    #firstUpdated = false
    #initialValue: undefined | any

    static get styles() {
        return css`

            .editable {
                padding: 5px 10px;
                pointer-events: none;
            }

            [contenteditable]:focus {
                outline: none;
                cursor: text;
            }

            #editor, :host([editing]) .renderer {
                opacity: 0;
                pointer-events: none;
                display: none;
            }

            .renderer, :host([editing]) #editor {
                position: relative;
                display: unset;
                pointer-events: all;
                opacity: 1;
            }
        `
    }

    schema: BaseTableProps['schema'];
    info: BaseTableProps['info'];
    editToggle: BaseTableProps['toggle']

    editable: BaseTableProps['editable'];

    interacted = false

    constructor({
        info,
        schema,
        onOpen,
        onClose,
        onChange,
        toggle,
        nestedProps,
        editable = true
    }: Partial<BaseTableProps> = {}) {

        super()

        this.info = info ?? {}
        this.schema = schema ?? {}
        this.nestedProps = nestedProps ?? {}

        this.editToggle = toggle ?? (() => {});

        if (onOpen) this.onOpen = onOpen
        if (onChange) this.onChange = onChange
        if (onClose) this.onClose = onClose

        this.editable = editable

        this.#editable.addEventListener('input', (ev: InputEvent) => {
            if (ev.isTrusted) this.interacted = true
            if (ev.inputType.includes('history')) this.setText(this.#editable.innerText) // Catch undo / redo}
        })

        this.#editable.addEventListener('blur', () => {
            this.#editable.removeAttribute('contenteditable')
        })

    }

    #active = false
    onOpen: BaseTableProps['onOpen'] = () => {}
    onClose: BaseTableProps['onClose'] = () => {}
    onChange: BaseTableProps['onChange'] = () => {}

    #editableClose = () => this.editToggle(false)

    toggle (state = !this.#active) {

        if (state === this.#active) return

        if (state) {

            if (!this.editable && this.#initialValue) return // Non-editability does not apply to new rows

            this.setAttribute('editing', '')

            const listenForEnter = (ev: KeyboardEvent) => {

                if (ev.key === 'Enter') {
                    ev.preventDefault()
                    ev.stopPropagation()
                    this.#editable.blur()
                    this.removeEventListener('keydown', listenForEnter)
                    this.toggle(false)
                }
            }

            this.addEventListener('keydown', listenForEnter)

            if (this.#editor === this.#editable) {
                this.#editable.setAttribute('contenteditable', '')
                this.#editable.style.pointerEvents = 'auto'
                placeCaretAtEnd(this.#editable)
                document.addEventListener('click', this.#editableClose)
            } else {
                this.#editor.onEditStart()
            }

            this.onOpen()

        } else {

            let current
            this.removeAttribute('editing')

            if (this.#editor === this.#editable) {
                current = this.getElementValue(this.#editable)
                this.#editable.style.pointerEvents = ''
                document.removeEventListener('click', this.#editableClose)
            } else {
                current = this.#editor.value
                this.interacted = true
                if (this.#editor && this.#editor.onEditEnd) this.#editor.onEditEnd()
            }

            this.onClose()

            this.setText( current )
        }

        this.#active = state
    }

    getValue = (input: any = this.value) => input // Process inputs from the editor

    #update = (current: any, forceUpdate = false, runOnChange = true) => {
        let value = this.getValue(current)

        if (!this.#firstUpdated) this.#initialValue = value

        // NOTE: Forcing change registration for all cells
        if (this.value !== value || forceUpdate) {
            this.value = value
            if (runOnChange) this.onChange(value)
        }
    }

    setText(value: any, setOnInput = true, runOnChange = true) {
        if (setOnInput) [ this.#editor, this.#renderer ].forEach(element => this.setChild(element, value)) // RESETS HISTORY
        if (this.schema.type === 'array' || this.schema.type === 'object') this.#update(value, true, runOnChange) // Ensure array values are not coerced
        else this.#update(`${value}`, undefined, runOnChange) // Coerce to string
    }


    execute = (command: string, show: boolean, value: any) => {
        this.#editable.focus();
        document.execCommand(command, show, value)
    }

    set(value: any, runOnChange = true) {

        // Ensure all operations are undoable
        if (typeof InputEvent === 'function') {
            this.#editable.setAttribute('contenteditable', '')
            this.#editable.focus();

            const range = document.createRange();
            range.selectNodeContents(this.#editable);
            const sel = window.getSelection()!;
            sel.removeAllRanges();
            sel.addRange(range);

            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: false,
                data: value,
                inputType: 'insertText',
            });

            this.#editable.dispatchEvent(inputEvent);

            this.setText(value, undefined, runOnChange)
            this.#editable.blur();
            this.#editable.removeAttribute('contenteditable')
        }


        else this.setText(value, undefined, runOnChange) // Just set value
    }

    #render(property: 'renderer' | 'editor') {
        if (!this[property]) return undefined
        return (typeof this[property] === 'function') ? (this[property] as Function)() : this[property]
    }

    // Initialize values
    firstUpdated() {
        this.#firstUpdated = true
        const elements = [ this.#editor, this.#renderer ]
        elements.forEach(element => this.setChild(element))
    }

    setChild = (element: HTMLElement, value = this.value) => {
        if (element) {
            if ('value' in element) element.value = value // Directly set test (no setValue method)
            else {
                if (element.innerText !== value) {
                    element.innerText = value // No history
                }
            }
        }
        return value
    }

    getElementValue = (element: HTMLElement) => element.value || element.innerText

    render() {

        this.interacted = false

        this.#editable.classList.add('editable')

        const editor = this.#editor = this.#render('editor')
        const renderer = this.#renderer = this.#render('renderer')


        this.addEventListener('blur', (ev) => {
            ev.stopPropagation()
            this.toggle(false)
        })



        if (!editor || !renderer || renderer === editor) return editor || renderer

        return html`<div class="renderer">${renderer}</div><div id="editor">${editor}</div>`
    }
}

customElements.get("nwb-cell-base") || customElements.define("nwb-cell-base", TableCellBase);
