import { LitElement, css } from "lit"
import { ArrayCell } from "./cells/array"
import { NestedInputCell } from "./cells/input"

import { TableCellBase } from "./cells/base"
import { DateTimeCell } from "./cells/date-time"


import { getValue, renderValue } from './convert'

type ValidationResult = {
    title?: string,
    warning?: string,
    error?: string
}

type ValidationFunction = (value: any) => any | any[]

type OnValidateFunction = (info: ValidationResult) => void

type TableCellProps = {
    value: string,
    info: { col: string }
    schema: {[key: string]: any},
    validateOnChange?: ValidationFunction,
    onValidate?: OnValidateFunction,
}

const persistentInteraction = Symbol('persistentInteraction')

export class TableCell extends LitElement {

    declare schema: TableCellProps['schema']
    declare info: TableCellProps['info']

    static get styles() {
        return css`

            :host {
                display: flex;
                color: black;
                font-size: 13px;
                height: 100%;
                max-height:  100px;
                overflow-y: auto;
            }

            :host > * {
                width: 100%;
            }

            ul {
                list-style-type: none;
                padding: 0;
            }


            ul li:before {
                content: '-';
                position: absolute;
                margin-left: -10px;
            }

            ul li {
                padding-left: 20px
            }

        `
    }

    // static get properties() {
    //     return {
    //         value: { reflect: true }
    //     }
    // }

    type = 'text'

    constructor({ info, value, schema, validateOnChange, ignore, onValidate }: TableCellProps) {
        super()
        this.#value = value

        this.schema = schema
        this.info = info

        if (validateOnChange) this.validateOnChange = validateOnChange
        if (ignore) this.ignore = ignore

        if (onValidate) this.onValidate = onValidate

        // Set Information from Schema
        if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            this.#validator = (value) => regex.test(value)
        }

        this.ondblclick = (ev) => {
            ev.stopPropagation()
            this.toggle(true)
        }

    }

    toggle = (v: boolean) => this.input.toggle(v)

    get value() {
        let v = this.input ? this.input.getValue() : this.#value
        return getValue(v, this.schema)
    }

    set value(value) {
        if (this.input) this.input.set(renderValue(value, this.schema)) // Allow null to be set directly
        this.#value = this.input
                            ? this.input.getValue() // Ensure all operations are undoable / value is coerced
                            : value // Silently set value if not rendered yet
     }

    validateOnChange?: ValidationFunction
    ignore?: { [key: string]: boolean } = {}

    onValidate: OnValidateFunction = () => {}

    #validator: ValidationFunction = () => true

    validate = async (value = this.value) => {

        const prevValue = this.#value

        const validator = this.validateOnChange ?? this.#validator
        let result = await validator(value)
        if (result === true) result = this.#validator(value)

        let info: ValidationResult = {
            title: undefined,
            warning: undefined,
            error: undefined
        }

        if (result === null) {
            this.value = prevValue // NOTE: Calls popup twice
            return;
        }

        const warnings = Array.isArray(result) ? result.filter((info) => info.type === "warning") : [];
        const errors = Array.isArray(result) ? result?.filter((info) => info.type === "error") : [];

        if (result === false) errors.push({ message: 'Cell is invalid' })

        if (errors.length) {
            info.error = ''
            if (this.type === 'table' && errors.length > 1) info.title = `${errors.length} errors found on this nested table.`
            else info.title = errors.map(({ message }) => message).join("\n"); // Class switching handled automatically
        } else if (warnings.length) {
            info.warning = ''
            if (this.type === 'table' && warnings.length > 1) info.title = `${warnings.length} warnings found on this nested table.`
            else info.title = warnings.map(({ message }) => message).join("\n");
        }

        this.onValidate(info)

        if (typeof result === 'function') result() // Run if returned value is a function

        return info
    };

    setInput(value: any) {
        this.interacted = persistentInteraction
        this.value = value
        // if (this.input) this.input.set(value)  // Ensure all operations are undoable
        // else this.#value = value // Silently set value if not rendered yet
    }

    #value
    firstUpdated() {
        this.value = this.#value
    }

    updated() {
        this.validate() // Validate immediately when placed in the DOM
    }

    #cls: any

    interacted: boolean | symbol = false

    // input = new TableCellBase({ })

    input: TableCellBase

    render() {

        let cls = TableCellBase

        this.interacted = this.interacted === persistentInteraction

        if (this.schema.type === "array") {
            const items = this.schema.items
            if (items && items.type === "object") {
                cls = NestedInputCell
                this.type = "table"
            } else {
                cls = ArrayCell
                this.type = "array"
            }
        }
        else if (this.schema.format === "date-time") {
            cls = DateTimeCell
            this.type = "date-time"
        } else if (this.schema.type === "object") {
            cls = NestedInputCell
            this.type = "table"
        }

        // Only actually rerender if new class type
        if (cls !== this.#cls) {
            this.input = new cls({
                onChange: async (v) => {
                    if (this.input.interacted) this.interacted = true
                    const result = await this.validate()
                    if (result) this.#value = v
                },
                toggle: (v) => this.toggle(v),
                info: this.info,
                schema: this.schema,
                nestedProps: {
                    validateOnChange: this.validateOnChange,
                    ignore: this.ignore
                }
            })
        }

        this.#cls = cls

        return this.input
    }
}

customElements.get("nwb-table-cell") || customElements.define("nwb-table-cell", TableCell);
