import { LitElement, css } from "lit"

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
    onValidate?: OnValidateFunction
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

            [contenteditable] {
                padding: 5px;
                pointer-events: none;
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

        this.#div.append(this.input)

        // Set Information from Schema
        if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            this.#validator = (value) => regex.test(value)
        }


        this.input.setAttribute('contenteditable', true)
        this.ondblclick = () => {
            this.input.style.pointerEvents = 'all'
            this.input.focus()
        }

        document.onclick = () => this.input.style.pointerEvents = ''
        
        this.input.onchange = () => {
            const currentValue = this.input.innerText;
            this.value = currentValue
        }
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

    input = document.createElement('div')
    #div = document.createElement('div')

    setInput(value: any) {
        console.log('Set input', value)
        this.input.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, value);
        this.input.blur();
    }

    #value
    firstUpdated() {
        this.input.innerText = this.value ?? '' // Set directly without the undo feature
        this.#value = this.input.innerText // Ensure value is coerced
    }

    updated() {
        const value = this.#value ?? ''
        if (value !== this.input.innerText) this.setInput(value) // Ensure all operations are undoable
        this.validate()
    }

    render() {
        this.#value = this.value
        return this.#div
    }
}

customElements.get("nwb-table-cell") || customElements.define("nwb-table-cell", TableCell);
