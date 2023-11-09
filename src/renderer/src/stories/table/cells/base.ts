import { LitElement, PropertyValueMap, css, html } from "lit"
import { placeCaretAtEnd } from "../utils"

type BaseTableProps = {
    info: { 
        col: string,
    },
    toggle: (state?: boolean) => void,
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

    schema: BaseTableProps['schema'];
    info: BaseTableProps['info'];
    editToggle: BaseTableProps['toggle']

    interacted = false

    constructor({
        info,
        schema,
        onOpen,
        onClose,
        onChange,
        toggle
    }: Partial<BaseTableProps> = {}) {

        super()

        this.info = info ?? {}
        this.schema = schema ?? {}
        
        this.editToggle = toggle ?? (() => {});

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

    #editableClose = () => this.editToggle(false)

    toggle (state = !this.#active) {
        if (state === this.#active) return

        if (state) {

            this.setAttribute('editing', '')

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
                if (this.#editor && this.#editor.onEditEnd) this.#editor.onEditEnd()
            }

            this.onClose()


            this.setText( current )
        }

        this.#active = state
    }

    getValue = (input: any = this.value) => input // Process inputs from the editor

    #update(current: any) {
        let value = this.getValue(current)
        console.log('Updating', this.value, value)
        // NOTE: Forcing change registration for all cells
        // if (this.value !== value) {
            this.value = value
            this.onChange(value)
        // }
    }

    setText(value: any, setOnInput = true) {
        if (setOnInput) [ this.#editor, this.#renderer ].forEach(el => this.setChild(el, value)) // RESETS HISTORY

        if (this.schema.type === 'array') this.#update(value) // Ensure array values are not coerced
        else this.#update(`${value}`) // Coerce to string

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
        
        this.addEventListener('blur', (ev) => {
            ev.stopPropagation()
            this.toggle(false)
        })


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
