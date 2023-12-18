import { LitElement, css, html } from "lit";
import { TableCellBase } from "./base";
import { BaseRenderer } from "./renderers/base";
import { Modal } from "../../Modal";

import { SimpleTable } from "../../SimpleTable.js";
import { header } from "../../forms/utils";

export class NestedTableEditor extends LitElement {

    info: any
    schema: any
    toggle: any
    validateOnChange

    constructor(props: any) {
        super(props)
        this.schema = props.schema
        this.info = props.info ?? {}
        this.toggle = props.toggle
        this.validateOnChange = props.validateOnChange
    }

    #modal = new Modal({
        header: 'Table Editor',
        onClose: () => this.toggle(false)
    })

    #table: SimpleTable

    onEditStart () {
        const modal = this.#modal

        if (this.info.col) modal.header = `${header(this.info.col)} Table Editor`

        if (this.#table) this.#table.remove()


        const div = document.createElement('div')
        Object.assign(div.style, {
            width: `${10}px`,
            height: `${10}px`,
            position: 'absolute',
            zIndex: 1000,
            background: 'red'
        })

        document.body.append(div)

        const table = this.#table = new SimpleTable({
            schema: this.schema.items,
            data: this.#value,
            validateOnChange: (path, parent, value, schema) => {
                if (this.validateOnChange) return this.validateOnChange(value, path, parent, schema) // NOTE: Flipped because usually only value is passed
            }
        })

        table.style.padding = '25px 50px'

        modal.append(table)

        modal.open = true
    }

    #value: any

    set value(value) {
        this.#value = value
        if (this.#table) this.#table.data = value
    }

    get value() {
        return this.#table.data ?? this.#value
    }

    onEditEnd = () => {
        this.#modal.open = false
        Array.from(this.#modal.children).forEach(child => child.remove())
    }

    render() {
        return this.#modal
    }
}

customElements.get("nwb-nested-table-cell-editor") || customElements.define("nwb-nested-table-cell-editor", NestedTableEditor);



export class NestedTableRenderer extends BaseRenderer {


    static get styles() {
        return [
            css`
                :host {
                    display: block;
                    text-align: center;
                    width: 100%;
                }
            `
        ]
    }

    constructor(...args: any[]) {
        super(...args)
    }

    render() {
        return html`<small>Click to view table</small>`
    }
}

customElements.get("nwb-nested-table-cell-renderer") || customElements.define("nwb-nested-table-cell-renderer", NestedTableRenderer);


export class NestedTableCell extends TableCellBase {

    constructor(props: any){
        super(props)
    }

    renderer = new NestedTableRenderer({ value: this.value })

    editor = new NestedTableEditor({ 
        info: this.info, 
        toggle: this.editToggle, 
        value: this.value, 
        schema: this.schema,
        ...this.nestedProps
    })
}

customElements.get("nwb-nested-table-cell") || customElements.define("nwb-nested-table-cell", NestedTableCell);
