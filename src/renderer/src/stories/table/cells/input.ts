import { LitElement, css, html } from "lit";
import { TableCellBase } from "./base";
import { BaseRenderer } from "./renderers/base";
import { Modal } from "../../Modal";

import { SimpleTable } from "../../SimpleTable.js";
import { JSONSchemaInput } from "../../JSONSchemaInput";

import { header } from "../../forms/utils";

export class NestedEditor extends LitElement {

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
        header: 'Editor',
        onClose: () => this.toggle(false)
    })

    #input: JSONSchemaInput

    onEditStart () {
        const modal = this.#modal

        if (this.info.col) modal.header = `${this.schema.title ?? header(this.info.col)} Editor`

        if (this.#input) this.#input.remove()

        const data = this.#value || (this.schema.type === 'array' ? [] : (this.schema.type === 'object' ? {} : this.schema.default))

        console.log('Schema',  modal.header, this.schema)

        const input = this.#input = new JSONSchemaInput({
            schema: this.schema,
            value: data,
            path: [ this.info.col ],
            validateOnChange: (path, parent, value, schema) => {
                if (this.validateOnChange) return this.validateOnChange(value, path, parent, schema) // NOTE: Flipped because usually only value is passed
            },
            form: {
                createTable: (name, metadata, path) => new SimpleTable(metadata), // If possible to render as a table, do so
            }
        })

        input.style.padding = '25px 50px'

        modal.append(input)

        modal.open = true
    }

    #value: any

    set value(value) {
        this.#value = value
        if (this.#input) this.#input.value = value
    }

    get value() {
        return this.#input.value ?? this.#value
    }

    onEditEnd = () => {
        this.#modal.open = false
        Array.from(this.#modal.children).forEach(child => child.remove())
    }

    render() {
        return this.#modal
    }
}

customElements.get("nwb-nested-input-editor") || customElements.define("nwb-nested-input-editor", NestedEditor);



export class NestedRenderer extends BaseRenderer {


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
        return html`<small>Click to view cell</small>`
    }
}

customElements.get("nwb-nested-input-renderer") || customElements.define("nwb-nested-input-renderer", NestedRenderer);


export class NestedInputCell extends TableCellBase {

    constructor(props: any){
        super(props)
    }

    renderer = new NestedRenderer({ value: this.value })

    editor = new NestedEditor({
        info: this.info,
        toggle: this.editToggle,
        value: this.value,
        schema: this.schema,
        ...this.nestedProps
    })
}

customElements.get("nwb-nested-input-cell") || customElements.define("nwb-nested-input-cell", NestedInputCell);
