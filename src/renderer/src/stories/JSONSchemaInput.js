import { LitElement, css, html } from "lit";
import { FilesystemSelector } from "./FileSystemSelector";

import { BasicTable } from "./BasicTable";
import { header } from "./forms/utils";

import { Button } from "./Button";
import { List } from "./List";
import { Modal } from "./Modal";

const filesystemQueries = ["file", "directory"];

export class JSONSchemaInput extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                display: block;
            }

            .guided--input {
                width: 100%;
                border-radius: 4px;
                padding: 10px 12px;
                font-size: 100%;
                font-weight: normal;
                border: 1px solid var(--color-border);
                transition: border-color 150ms ease-in-out 0s;
                outline: none;
                color: rgb(33, 49, 60);
                background-color: rgb(255, 255, 255);
            }

            .guided--input:disabled {
                color: dimgray;
                pointer-events: none;
            }

            .guided--input::placeholder {
                opacity: 0.5;
            }

            .guided--text-area {
                height: 5em;
                resize: none;
                font-family: unset;
            }
            .guided--text-area-tall {
                height: 15em;
            }
            .guided--input:hover {
                box-shadow: rgb(231 238 236) 0px 0px 0px 2px;
            }
            .guided--input:focus {
                outline: 0;
                box-shadow: var(--color-light-green) 0px 0px 0px 1px;
            }

            input[type="number"].hideStep::-webkit-outer-spin-button,
            input[type="number"].hideStep::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            /* Firefox */
            input[type="number"].hideStep {
                -moz-appearance: textfield;
            }
        `;
    }

    // info,
    // parent,
    // path,
    // form,
    required = false;
    validateOnChange = true;

    constructor(props) {
        super();
        Object.assign(this, props);
    }

    // onUpdate = () => {}
    // onValidate = () => {}

    updateData (value) {
        const { path: fullPath } = this;
        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];
        const el = this.getElement()
        this.#triggerValidation(name, el, path);
        this.#updateData(fullPath, value);
        if (el.type === 'checkbox') el.checked = value
        else el.value = value

        return true;
    };

    getElement = () => this.shadowRoot.querySelector('.schema-input')

    #updateData = (path, value) => {
        this.onUpdate ? this.onUpdate(value) : this.form ? this.form.updateData(path, value) : "";
        this.value = value // Update the latest value
    };

    #triggerValidation = (name, el, path) =>
        this.onValidate ? this.onValidate() : this.form ? this.form.triggerValidation(name, el, path) : "";

    render() {
        const { validateOnChange, info, path: fullPath } = this;

        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];

        const isArray = info.type === "array"; // Handle string (and related) formats / types

        const hasItemsRef = "items" in info && "$ref" in info.items;
        if (!("items" in info) || (!("type" in info.items) && !hasItemsRef)) info.items = { type: "string" };

        if (isArray) {
            // if ('value' in this && !Array.isArray(this.value)) this.value = [ this.value ]

            // Catch tables
            const itemSchema = this.form.getSchema("items", info);
            const isTable = itemSchema.type === "object";
            if (isTable) {
                const tableMetadata = {
                    schema: itemSchema,
                    data: this.value,
                    validateOnChange: (key, parent, v) => {
                        return validateOnChange && this.form.validateOnChange(key, parent, fullPath, v);
                    },
                    onStatusChange: () => this.form.checkStatus(), // Check status on all elements
                    validateEmptyCells: this.form.validateEmptyValues,
                    deferLoading: this.form.deferLoading,
                    onLoaded: () => {
                        this.form.nLoaded++;
                        this.form.checkAllLoaded();
                    },
                    onThrow: (...args) => this.form.onThrow(...args),
                };

                return (this.form.tables[name] =
                    this.form.renderTable(name, tableMetadata, fullPath) || new BasicTable(tableMetadata));
            }

            const headerText = document.createElement("span");
            headerText.innerText = header(name);

            const addButton = new Button({
                size: "small",
            });

            addButton.innerText = "Add Item";

            let modal;

            const tempParent = {};

            addButton.addEventListener("click", () => {
                if (modal) modal.remove();

                modal = new Modal({
                    header: headerText,
                    footer: submitButton,
                });

                const div = document.createElement("div");
                div.style.padding = "25px";

                div.append(
                    new JSONSchemaInput({
                        info: info.items,
                        validateOnChange: false,
                        path: this.path,
                        form: this.form,
                        onUpdate: (value) => (tempParent[name] = value),
                    })
                );

                modal.append(div);

                addButton.insertAdjacentElement("beforebegin", modal);

                setTimeout(() => modal.toggle(true));
            });

            const list = new List({
                items: this.value
                    ? this.value.map((value) => {
                          return { value };
                      })
                    : [],
                onChange: async () => {
                    this.#updateData(fullPath, list.items.length ? list.items.map((o) => o.value) : undefined);
                    if (validateOnChange) await this.#triggerValidation(name, list, path);
                },
            });

            const submitButton = new Button();
            submitButton.innerText = `Submit`;
            submitButton.addEventListener("click", function () {
                const value = tempParent[name];
                list.add({ value });
                modal.toggle(false);
            });

            return html` <div>${list} ${addButton}</div> `;
        }

        // Basic enumeration of properties on a select element
        if (info.enum) {
            return html`
                <select
                    class="guided--input schema-input"
                    @input=${(ev) => this.#updateData(fullPath, info.enum[ev.target.value])}
                    @change=${(ev) => validateOnChange && this.#triggerValidation(name, ev.target, path)}
                >
                    <option disabled selected value>${info.placeholder ?? "Select an option"}</option>
                    ${info.enum.map(
                        (item, i) => html`<option value=${i} ?selected=${this.value === item}>${item}</option>`
                    )}
                </select>
            `;
        } else if (info.type === "boolean") {
            return html`<input
                type="checkbox"
                class="schema-input"
                @input=${(ev) => this.#updateData(fullPath, ev.target.checked)}
                ?checked=${this.value ?? false}
                @change=${(ev) => validateOnChange && this.#triggerValidation(name, ev.target, path)}
            />`;
        } else if (info.type === "string" || info.type === "number") {
            let format = info.format;
            const matched = name.match(/(.+_)?(.+)_path/);
            if (!format && matched) format = matched[2] === "folder" ? "directory" : matched[2];

            // Handle file and directory formats
            if (filesystemQueries.includes(format)) {
                const el = new FilesystemSelector({
                    type: format,
                    value: this.value,
                    onSelect: (filePath) => this.#updateData(fullPath, filePath),
                    onChange: (filePath) => validateOnChange && this.#triggerValidation(name, el, path),
                    dialogOptions: this.form.dialogOptions,
                    dialogType: this.form.dialogType,
                });
                el.classList.add('schema-input')
                return el;
            }

            // Handle long string formats
            else if (info.format === "long" || isArray)
                return html`<textarea
                    class="guided--input guided--text-area schema-input"
                    type="text"
                    placeholder="${info.placeholder ?? ""}"
                    style="height: 7.5em; padding-bottom: 20px"
                    maxlength="255"
                    .value="${this.value ?? ""}"
                    @input=${(ev) => {
                        this.#updateData(fullPath, ev.target.value);
                    }}
                    @change=${(ev) => validateOnChange && this.#triggerValidation(name, ev.target, path)}
                ></textarea>`;
            // Handle other string formats
            else {
                const type =
                    info.format === "date-time"
                        ? "datetime-local"
                        : info.format ?? (info.type === "string" ? "text" : info.type);
                return html`
                    <input
                        class="guided--input schema-input ${info.step === null ? "hideStep" : ""}"
                        type="${type}"
                        step=${type === "number" && info.step ? info.step : ""}
                        placeholder="${info.placeholder ?? ""}"
                        .value="${this.value ?? ""}"
                        @input=${(ev) =>
                            this.#updateData(
                                fullPath,
                                info.type === "number" ? parseFloat(ev.target.value) : ev.target.value
                            )}
                        @change=${(ev) => validateOnChange && this.#triggerValidation(name, ev.target, path)}
                    />
                `;
            }
        }

        // Print out the immutable default value
        return html`<pre>${info.default ? JSON.stringify(info.default, null, 2) : "No default value"}</pre>`;
    }
}

customElements.get("jsonschema-input") || customElements.define("jsonschema-input", JSONSchemaInput);
