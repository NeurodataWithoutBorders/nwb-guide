import { LitElement, css } from "lit"
import { ArrayCell } from "./cells/array"
import { TableCellBase } from "./cells/base"
import { DateTimeCell } from "./cells/date-time"

type ValidationResult = {
    title?: string,
    warning?: string,
    error?: string
}

type ValidationFunction = (value: any) => any | any[]

type OnValidateFunction = (info: ValidationResult) => void

type TableCellProps = {
    value: string,
    schema: {[key: string]: any},
    validateOnChange?: ValidationFunction,
    onValidate?: OnValidateFunction,
}


export class TableCell extends LitElement {

    declare schema: TableCellProps['schema']

    static get styles() {
        return css`

            :host {
                display: flex;
                white-space: nowrap;
            }

            :host > * {
                padding: 5px;
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

    constructor({ value, schema, validateOnChange, onValidate }: TableCellProps) {
        super()
        this.#value = value
        this.schema = schema
        if (validateOnChange) this.validateOnChange = validateOnChange

        if (onValidate) this.onValidate = onValidate

        // Set Information from Schema
        if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            this.#validator = (value) => regex.test(value)
        }

        this.ondblclick = () => this.input.toggle(true)
        document.onclick = () => this.input.toggle(false)
    }

    get value() {
        return this.input.getValue()
    }

    set value(v) {
        this.input.set(v ?? '')
        this.#value = this.input.value // Ensure value is coerced
     }

    validateOnChange?: ValidationFunction
    onValidate: OnValidateFunction = () => {}

    #validator: ValidationFunction = () => true

    validate = async () => {

        const validator = this.validateOnChange ?? this.#validator

        let result = await validator(this.value)

        if (result === true) result = this.#validator(this.value)


        let info: ValidationResult = {
            title: undefined,
            warning: undefined,
            error: undefined
        }

        const warnings = Array.isArray(result) ? result.filter((info) => info.type === "warning") : [];
        const errors = Array.isArray(result) ? result?.filter((info) => info.type === "error") : [];

        if (result === false) errors.push({ message: 'Cell is invalid' })

        if (warnings.length) {
            info.warning = ''
            info.title = warnings.map((o) => o.message).join("\n");
        }

        if (errors.length) {
            info.error = ''
            info.title = errors.map((o) => o.message).join("\n"); // Class switching handled automatically
        }

        this.onValidate(info)

        return info
    };

    setInput(value: any) {
        this.input.set(value)  // Ensure all operations are undoable
    }

    #value
    firstUpdated() {
        this.value = this.#value
    }

    updated() {
        // const value = this.#value ?? ''
        // if (value !== this.value) this.setInput(value) // Ensure all operations are undoable
        this.validate()
    }

    #cls: any

    // input = new TableCellBase({ })

    input: TableCellBase

    render() {

        let cls = TableCellBase

        if (this.schema.type === "array") cls = ArrayCell
        else if (this.schema.format === "date-time") cls =  DateTimeCell

        // Only actually rerender if new class type
        if (cls !== this.#cls) {
            this.input = new cls({
                onChange: (v: any) => this.validate(),
                schema: this.schema
            })
        }

        this.#cls = cls

        return this.input
    }
}

customElements.get("nwb-table-cell") || customElements.define("nwb-table-cell", TableCell);
