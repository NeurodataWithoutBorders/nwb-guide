import { LitElement, css, html } from "lit"
import { ArrayRenderer } from "./renderers/array"
import { TableCellBase } from "./base"

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

    declare value: TableCellProps['value']
    declare schema: TableCellProps['schema']

    static get styles() {
        return css`

            :host {
                display: flex;
                white-space: nowrap;
            }

            :host > div {
                padding: 5px;
                width: 100%;
            }

            .editor {
                display: none;
            }

            :host([editing]) .renderer {
                display: none;
            }

            :host([editing]) .editor {
                display: block;
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

    static get properties() {
        return {
            value: { reflect: true }
        }
    }

    constructor({ value, schema, validateOnChange, onValidate }: TableCellProps) {
        super()
        this.value = value
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

    input = new TableCellBase({
        onOpen: () => this.setAttribute('editing', ''),
        onClose: () => this.removeAttribute('editing'),
        onChange: (v: any) => this.value = v
    })

    setInput(value: any) {
        this.input.set(value)
    }

    #value
    firstUpdated() {
        this.input.setText(this.value ?? '')
        this.#value = this.input.value // Ensure value is coerced
    }

    updated() {
        const value = this.#value ?? ''
        if (value !== this.input.value) this.setInput(value) // Ensure all operations are undoable
        this.validate()
    }

    render() {
        this.#value = this.value

        let renderer, editor = this.input;
        if (this.schema.type === "array") renderer = new ArrayRenderer(this.schema)
        if (renderer) renderer.value = this.value

        return html`
            <div>
                ${renderer ? html`<div class="renderer">${renderer}</div><div class="editor">${editor}</div>` : (editor)}
            </div>   
        `
    }
}

customElements.get("nwb-table-cell") || customElements.define("nwb-table-cell", TableCell);
