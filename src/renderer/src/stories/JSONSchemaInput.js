import { LitElement, css, html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { FilesystemSelector } from "./FileSystemSelector";

import { BasicTable } from "./BasicTable";
import { header } from "./forms/utils";

import { Button } from "./Button";
import { List } from "./List";
import { Modal } from "./Modal";

import { capitalize } from "./forms/utils";
import { JSONSchemaForm } from "./JSONSchemaForm";
import { Search } from "./Search";

const isFilesystemSelector = (name, format) => {
    if (Array.isArray(format)) return format.map((f) => isFilesystemSelector(name, f)).every(Boolean) ? format : null;

    const matched = name.match(/(.+_)?(.+)_paths?/);
    if (!format && matched) format = matched[2] === "folder" ? "directory" : matched[2];
    return ["file", "directory"].includes(format) ? format : null; // Handle file and directory formats
};

export class JSONSchemaInput extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                display: block;
            }

            :host(.invalid) .guided--input {
                background: rgb(255, 229, 228) !important;
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

            .guided--text-input-instructions {
                font-size: 13px;
                width: 100%;
                padding-top: 4px;
                color: dimgray !important;
                margin: 0 0 1em;
                line-height: 1.4285em;
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

    updateData(value, forceValidate = false) {
        if (this.value !== value && !forceValidate) {
            // Update the actual input element
            const el = this.getElement();
            if (el.type === "checkbox") el.checked = value;
            else if (el.classList.contains("list"))
                el.children[0].items = value
                    ? value.map((value) => {
                          return { value };
                      })
                    : [];
            else if (el instanceof Search) el.shadowRoot.querySelector("input").value = value;
            else el.value = value;
        }

        const { path: fullPath } = this;
        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];

        this.#triggerValidation(name, path);
        this.#updateData(fullPath, value);

        return true;
    }

    getElement = () => this.shadowRoot.querySelector(".schema-input");

    #activateTimeoutValidation = (name, path) => {
        this.#clearTimeoutValidation();
        this.#validationTimeout = setTimeout(() => {
            this.onValidate ? this.onValidate() : this.form ? this.form.triggerValidation(name, path) : "";
        }, 1000);
    };

    #clearTimeoutValidation = () => {
        if (this.#validationTimeout) clearTimeout(this.#validationTimeout);
    };

    #validationTimeout = null;
    #updateData = (fullPath, value, forceUpdate) => {
        this.onUpdate ? this.onUpdate(value) : this.form ? this.form.updateData(fullPath, value, forceUpdate) : "";

        const path = [...fullPath];
        const name = path.splice(-1)[0];

        this.value = value; // Update the latest value

        this.#activateTimeoutValidation(name, path);
    };

    #triggerValidation = (name, path) => {
        this.#clearTimeoutValidation();
        return this.onValidate ? this.onValidate() : this.form ? this.form.triggerValidation(name, path) : "";
    };

    updated() {
        const el = this.getElement();
        if (el) {
            el.dispatchEvent(new Event("change"));
        }
    }

    render() {
        const { info } = this;

        const input = this.#render();

        return html`
            ${input}
            <p class="guided--text-input-instructions">
                ${info.description
                    ? html`${unsafeHTML(capitalize(info.description))}${info.description.slice(-1)[0] === "."
                          ? ""
                          : "."}`
                    : ""}
            </p>
        `;
    }

    #onThrow = (...args) => (this.onThrow ? this.onThrow(...args) : this.form?.onThrow(...args));

    #render() {
        const { validateOnChange, info, path: fullPath } = this;

        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];

        const isArray = info.type === "array"; // Handle string (and related) formats / types

        const hasItemsRef = "items" in info && "$ref" in info.items;
        if (!("items" in info)) info.items = {};
        if (!("type" in info.items) && !hasItemsRef) info.items.type = "string";

        // Handle file and directory formats
        const createFilesystemSelector = (format) => {
            const el = new FilesystemSelector({
                type: format,
                value: this.value,
                onSelect: (filePath) => this.#updateData(fullPath, filePath),
                onChange: (filePath) => validateOnChange && this.#triggerValidation(name, path),
                onThrow: (...args) => this.#onThrow(...args),
                dialogOptions: this.form?.dialogOptions,
                dialogType: this.form?.dialogType,
                multiple: isArray,
            });
            el.classList.add("schema-input");
            return el;
        };

        if (isArray) {
            // if ('value' in this && !Array.isArray(this.value)) this.value = [ this.value ]

            const itemSchema = this.form ? this.form.getSchema("items", info) : info["items"];

            const fileSystemFormat = isFilesystemSelector(name, itemSchema.format);
            if (fileSystemFormat) return createFilesystemSelector(fileSystemFormat);
            // Create tables if possible
            else if (itemSchema.type === "object" && this.form.createTable) {
                const tableMetadata = {
                    schema: itemSchema,
                    data: this.value,

                    onUpdate: () => this.#updateData(fullPath, tableMetadata.data, true), // Ensure change propagates to all forms

                    // NOTE: This is likely an incorrect declaration of the table validation call
                    validateOnChange: (key, parent, v) => {
                        return (
                            validateOnChange &&
                            (this.onValidate
                                ? this.onValidate()
                                : this.form
                                  ? this.form.validateOnChange(key, parent, [...this.form.base, ...fullPath], v)
                                  : "")
                        );
                    },

                    onStatusChange: () => this.form?.checkStatus(), // Check status on all elements
                    validateEmptyCells: this.form?.validateEmptyValues,
                    deferLoading: this.form?.deferLoading,
                    onLoaded: () => {
                        if (this.form) {
                            this.form.nLoaded++;
                            this.form.checkAllLoaded();
                        }
                    },
                    onThrow: (...args) => this.#onThrow(...args),
                };

                const table = this.form.createTable(name, tableMetadata, fullPath); // Try creating table. Otherwise use nested form
                if (table) return (this.form.tables[name] = table === true ? new BasicTable(tableMetadata) : table);
            }

            const headerText = document.createElement("span");
            headerText.innerText = header(name);

            const addButton = new Button({
                size: "small",
            });

            addButton.innerText = "Add Item";

            let modal;

            let tempParent = {};

            const itemInfo = info.items;
            const formProperties = itemInfo.properties;

            let element;

            addButton.addEventListener("click", () => {
                if (modal) modal.remove();

                tempParent[name] = {}; // Wipe previous values

                modal = new Modal({
                    header: headerText,
                    footer: submitButton,
                });

                const div = document.createElement("div");
                div.style.padding = "25px";

                element = formProperties
                    ? new JSONSchemaForm({
                          schema: itemInfo,
                          results: tempParent[name],
                          onThrow: this.#onThrow,
                      })
                    : new JSONSchemaInput({
                          info: itemInfo,
                          validateOnChange: false,
                          path: this.path,
                          form: this.form,
                          onUpdate: (value) => (tempParent[name] = value),
                      });

                div.append(element);

                modal.append(div);

                document.body.append(modal);

                setTimeout(() => modal.toggle(true));
            });

            const list = new List({
                items: this.value
                    ? this.value.map((value) => {
                          return { value };
                      })
                    : [],
                onChange: async () => {
                    this.#updateData(fullPath, items.length ? ist.items.map((o) => o.value) : undefined);
                    if (validateOnChange) await this.#triggerValidation(name, path);
                },
            });

            const submitButton = new Button({
                label: "Submit",
                primary: true,
            });

            submitButton.addEventListener("click", async () => {
                let value = tempParent[name];

                if (formProperties) {
                    await element.validate();
                    if (itemInfo?.format) {
                        let newValue = itemInfo?.format;
                        for (let key in formProperties)
                            newValue = newValue.replace(`{${key}}`, value[key] ?? "").trim();
                        value = newValue;
                    }
                }

                if (info.uniqueItems) {
                    if (!list.items.find((item) => item.value === value)) list.add({ value });
                } else list.add({ value });
                modal.toggle(false);
            });

            return html`
                <div class="schema-input list" @change=${() => validateOnChange && this.#triggerValidation(name, path)}>
                    ${list} ${addButton}
                </div>
            `;
        }

        // Basic enumeration of properties on a select element
        if (info.enum && info.enum.length) {
            if (info.strict === false) {
                // const category = categories.find(({ test }) => test.test(key))?.value;

                const options = info.enum.map((v) => {
                    return {
                        key: v,
                        keywords: info.enumKeywords?.[v],
                    };
                });

                const search = new Search({
                    options,
                    value: this.value,
                    showAllWhenEmpty: false,
                    listMode: "click",
                    onSelect: async ({ value, key }) => {
                        const result = value ?? key;
                        this.#updateData(fullPath, result);
                        if (validateOnChange) await this.#triggerValidation(name, path);
                    },
                });

                search.classList.add("schema-input");
                return search;
            }

            return html`
                <select
                    class="guided--input schema-input"
                    @input=${(ev) => this.#updateData(fullPath, info.enum[ev.target.value])}
                    @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
                >
                    <option disabled selected value>${info.placeholder ?? "Select an option"}</option>
                    ${info.enum.map(
                        (item, i) =>
                            html`<option value=${i} ?selected=${this.value === item}>
                                ${info.enumLabels?.[item] ?? item}
                            </option>`
                    )}
                </select>
            `;
        } else if (info.type === "boolean") {
            return html`<input
                type="checkbox"
                class="schema-input"
                @input=${(ev) => this.#updateData(fullPath, ev.target.checked)}
                ?checked=${this.value ?? false}
                @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
            />`;
        } else if (info.type === "string" || info.type === "number" || info.type === "integer") {
            const isInteger = info.type === "integer";
            if (isInteger) info.type = "number";
            const isNumber = info.type === "number";

            const fileSystemFormat = isFilesystemSelector(name, info.format);
            if (fileSystemFormat) return createFilesystemSelector(fileSystemFormat);
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
                    @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
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
                        step=${isNumber && info.step ? info.step : ""}
                        placeholder="${info.placeholder ?? ""}"
                        .value="${this.value ?? ""}"
                        @input=${(ev) => {
                            let value = ev.target.value;
                            let newValue = value;

                            // const isBlank = value === '';

                            if (isInteger) newValue = parseInt(value);
                            else if (isNumber) newValue = parseFloat(value);

                            if (isNumber) {
                                if ("min" in info && value < info.min) newValue = info.min;
                                else if ("max" in info && value > info.max) newValue = info.max;
                            }

                            if (info.transform) newValue = info.transform(newValue, this.value, info);

                            // // Do not check patter if value is empty
                            // if (info.pattern && !isBlank) {
                            //     const regex = new RegExp(info.pattern)
                            //     if (!regex.test(isNaN(newValue) ? value : newValue)) newValue = this.value // revert to last value
                            // }

                            if (!isNaN(newValue) && newValue !== value) {
                                ev.target.value = newValue;
                                value = newValue;
                            }

                            this.#updateData(fullPath, value);
                        }}
                        @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
                    />
                `;
            }
        }

        // Print out the immutable default value
        return html`<pre>${info.default ? JSON.stringify(info.default, null, 2) : "No default value"}</pre>`;
    }
}

customElements.get("jsonschema-input") || customElements.define("jsonschema-input", JSONSchemaInput);
