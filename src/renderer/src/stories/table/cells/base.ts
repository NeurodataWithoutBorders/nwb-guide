import { LitElement, PropertyValueMap, css, html } from "lit"
import { placeCaretAtEnd } from "../utils"

type BaseTableProps = {
    schema: any,
    onOpen: Function,
    onClose: Function,
    onChange: Function
}

export class TableCellBase extends LitElement {

    declare value: any

    // Separate editor and renderer
    #editable: HTMLElement = document.createElement('div')
    editor: HTMLElement | Function = this.#editable
    renderer: HTMLElement | Function = this.editor
    #editor?: HTMLElement
    #renderer?: HTMLElement


    static get styles() {
        return css`

            #editable {
                padding: 5px 10px;
                pointer-events: none;
            }

            [contenteditable]:focus {
                outline: none;
                cursor: text;
            }

             .editor, :host([editing]) .renderer {
                opacity: 0;
                pointer-events: none;
                position: absolute;
            }

            .renderer, :host([editing]) .editor {
                position: relative;
                pointer-events: all;
                opacity: 1;
            }
        `
    }

    schema: any;

    interacted = false

    constructor({
        schema,
        onOpen,
        onClose,
        onChange
    }: Partial<BaseTableProps> = {}) {

        super()

        this.schema = schema ?? {}
        if (onOpen) this.onOpen = onOpen
        if (onChange) this.onChange = onChange
        if (onClose) this.onClose = onClose

        this.#editable.addEventListener('input', (ev: InputEvent) => {
            this.interacted = true
            if (ev.inputType.includes('history')) this.setText(this.#editable.innerText) // Catch undo / redo}
        })

        this.#editable.addEventListener('blur', () => this.#editable.removeAttribute('contenteditable'))

    }

    #active = false
    onOpen: BaseTableProps['onOpen'] = () => {}
    onClose: BaseTableProps['onClose'] = () => {}
    onChange: BaseTableProps['onChange'] = () => {}

    toggle (state = !this.#active) {
        if (state === this.#active) return

        if (state) {
            this.#editable.setAttribute('contenteditable', '')
            this.setAttribute('editing', ''),
            this.onOpen()
            this.#editable.style.pointerEvents = 'auto'
            placeCaretAtEnd(this.#editable)
        } else {
            const current = this.getElementValue(this.#editable)
            this.removeAttribute('editing')
            this.onClose()
            this.#editable.style.pointerEvents = ''
            this.setText( current )
        }

        this.#active = state
    }

    getValue = (input: any = this.value) => input // Process inputs from the editor

    #update(current: any) {
        let value = this.getValue(current)
        if (this.value !== value) {
            this.value = value
            this.onChange(value)
        }
    }

    setText(value: any, setOnInput = true) {
        if (setOnInput) [ this.#editor, this.#renderer ].forEach(el => this.setChild(el, value)) // RESETS HISTORY
        this.#update(`${value}`) // Coerce to string
    }


    execute = (command: string, show: boolean, value: any) => {
        this.#editable.focus();
        document.execCommand(command, show, value)
    }

    set(value: any) {

        if (document.execCommand) {
            this.#editable.setAttribute('contenteditable', '')
            this.#editable.focus();
            document.execCommand('selectAll');
            document.execCommand('insertText', false, value);
            this.setText(value)
            this.#editable.blur();
            this.#editable.removeAttribute('contenteditable')
        }

        else this.setText(value) // Ensure value is still set
    }

    #render(property: 'renderer' | 'editor') {
        if (!this[property]) return undefined
        return (typeof this[property] === 'function') ? (this[property] as Function)() : this[property]
    }

    // Initialize values
    firstUpdated() {
        const elements = [ this.#editor, this.#renderer ]
        elements.forEach(el => this.setChild(el))
    }

    setChild = (el: HTMLElement, value = this.value) => {
        if (el) {
            if ('value' in el) el.value = value // Directly set test (no setValue method)
            else {
                if (el.innerText !== value) {
                    el.innerText = value // No history
                }
            }
        }
        return value
    }

    getElementValue = (el: HTMLElement) => el.value || el.innerText

    render() {

        this.interacted = false

        this.#editable.id = 'editable'

        const editor = this.#editor = this.#render('editor')
        const renderer = this.#renderer = this.#render('renderer')

        this.addEventListener('blur', () => this.toggle(false))


        if (!editor || !renderer || renderer === editor) return editor || renderer
        // else {
        //     const container = document.createElement('div')
        //     const rendererContainer = document.createElement('div')
        //     rendererContainer.classList.add('renderer')
        //     rendererContainer.append(renderer)

        //     const editorContainer = document.createElement('div')
        //     editorContainer.classList.add('renderer')
        //     editorContainer.append(renderer)

        //     container.append(renderer, editor)
        //     return container
        // }

        return html`<div class="renderer">${renderer}</div><div class="editor">${editor}</div>`
    }
}

customElements.get("nwb-cell-base") || customElements.define("nwb-cell-base", TableCellBase);
