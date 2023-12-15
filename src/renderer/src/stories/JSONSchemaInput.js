import { LitElement, css, html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { FilesystemSelector } from "./FileSystemSelector";

import { BasicTable } from "./BasicTable";
import { header } from "./forms/utils";

import { Button } from "./Button";
import { List } from "./List";
import { Modal } from "./Modal";

import { capitalize } from "./forms/utils";
import { JSONSchemaForm, getIgnore } from "./JSONSchemaForm";
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

            main {
                display: flex;
            }

            #controls {
                margin-left: 10px;
                flex-grow: 1;
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

    // schema,
    // parent,
    // path,
    // form,
    // pattern
    controls = [];
    required = false;
    validateOnChange = true;

    constructor(props) {
        super();
        Object.assign(this, props);
    }

    // onUpdate = () => {}
    // onValidate = () => {}

    updateData(value, forceValidate = false) {
        if (!forceValidate) {
            // Update the actual input element
            const el = this.getElement();
            if (el.type === "checkbox") el.checked = value;
            else if (el.classList.contains("list")) {
                const list = el.children[0];
                el.children[0].items = this.#mapToList({
                    value,
                    list,
                }); // NOTE: Make sure this is correct
            } else if (el instanceof Search) el.shadowRoot.querySelector("input").value = value;
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

    #activateTimeoutValidation = (name, path, hooks) => {
        this.#clearTimeoutValidation();
        this.#validationTimeout = setTimeout(() => {
            this.onValidate
                ? this.onValidate()
                : this.form
                  ? this.form.triggerValidation(name, path, undefined, this, undefined, undefined, hooks)
                  : "";
        }, 1000);
    };

    #clearTimeoutValidation = () => {
        if (this.#validationTimeout) clearTimeout(this.#validationTimeout);
    };

    #validationTimeout = null;
    #updateData = (fullPath, value, forceUpdate, hooks) => {
        this.onUpdate ? this.onUpdate(value) : this.form ? this.form.updateData(fullPath, value, forceUpdate) : "";

        const path = [...fullPath];
        const name = path.splice(-1)[0];

        this.value = value; // Update the latest value

        this.#activateTimeoutValidation(name, path, hooks);
    };

    #triggerValidation = async (name, path) => {
        this.#clearTimeoutValidation();
        return this.onValidate ? this.onValidate() : this.form ? this.form.triggerValidation(name, path, this) : "";
    };

    updated() {
        const el = this.getElement();
        if (el) {
            el.dispatchEvent(new Event("change"));
        }
    }

    render() {
        const { schema } = this;

        const input = this.#render();

        return html`
            <main>${input}${this.controls ? html`<div id="controls">${this.controls}</div>` : ""}</main>
            <p class="guided--text-input-instructions">
                ${schema.description
                    ? html`${unsafeHTML(capitalize(schema.description))}${schema.description.slice(-1)[0] === "."
                          ? ""
                          : "."}`
                    : ""}
            </p>
        `;
    }

    #onThrow = (...args) => (this.onThrow ? this.onThrow(...args) : this.form?.onThrow(...args));

    #isEditableObject = (schema = this.schema) => schema.type === "object";

    #list;
    #mapToList({ value = this.value, schema = this.schema, list } = {}) {
        const { path: fullPath } = this;
        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];

        const isEditableObject = this.#isEditableObject();
        const resolved = isEditableObject ? Object.values(value ?? {}) : value ?? [];
        let items = resolved
            ? resolved.map((value) => {
                  return { value };
              })
            : [];

        if (isEditableObject) {
            let regex;
            try {
                regex = new RegExp(name);
            } catch (e) {}

            items = Object.entries(this.value);

            if (regex) items = items.filter(([key]) => regex.test(key));
            else items.filter(([key]) => key in schema.properties);

            items = items.map(([key, value]) => {
                return {
                    key,
                    value,
                    controls: [
                        new Button({
                            label: "Edit",
                            size: "small",
                            onClick: () => {
                                this.#createModal({
                                    key,
                                    schema,
                                    results: value,
                                    list: list ?? this.#list,
                                });
                            },
                        }),
                    ],
                };
            });
        }

        return items;
    }

    #schemaElement;
    #modal;

    async #createModal({ key, schema, results, list } = {}) {
        const createNewObject = !results;

        const isPatternProperties = this.pattern;
        const creatNewPatternProperty = isPatternProperties && createNewObject;

        const schemaCopy = structuredClone(schema);

        // Add a property name entry to the schema
        if (creatNewPatternProperty) {
            schemaCopy.properties = {
                __: { title: "Property Name", type: "string", pattern: this.pattern },
                ...schemaCopy.properties,
            };
            schemaCopy.required = [...(schemaCopy.required ?? []), "__"];
        }

        if (this.#modal) this.#modal.remove();

        const submitButton = new Button({
            label: "Submit",
            primary: true,
        });

        const updateTarget = results ?? {};

        submitButton.addEventListener("click", async () => {
            if (this.#schemaElement instanceof JSONSchemaForm) await this.#schemaElement.validate();

            let value = updateTarget;

            if (schemaCopy?.format && schemaCopy.properties) {
                let newValue = schemaCopy?.format;
                for (let key in schemaCopy.properties) newValue = newValue.replace(`{${key}}`, value[key] ?? "").trim();
                value = newValue;
            }

            // Skip if not unique
            if (schemaCopy.uniqueItems && list.items.find((item) => item.value === value))
                return this.#modal.toggle(false);

            // Add to the list
            if (createNewObject) {
                if (creatNewPatternProperty) {
                    const key = value.__;
                    delete value.__;
                    list.add({ key, value });
                } else list.add({ key, value });
            } else list.requestUpdate();

            this.#modal.toggle(false);
        });

        this.#modal = new Modal({
            header: key ? header(key) : "Property Definition",
            footer: submitButton,
            showCloseButton: createNewObject,
        });

        const div = document.createElement("div");
        div.style.padding = "25px";

        const isObject = schemaCopy.type === "object" || schemaCopy.properties; // NOTE: For formatted strings, this is not an object

        this.#schemaElement = isObject
            ? new JSONSchemaForm({
                  schema: schemaCopy,
                  results: updateTarget,
                  onUpdate: (internalPath, value) => {
                      if (!createNewObject) {
                          const path = [key, ...internalPath];
                          this.#updateData(path, value, true); // Live updates
                      }
                  },
                  onThrow: this.#onThrow,
              })
            : new JSONSchemaInput({
                  schema: schemaCopy,
                  validateOnChange: false,
                  path: this.path,
                  form: this.form,
                  value: updateTarget,
                  onUpdate: (value) => {
                      if (createNewObject) updateTarget[key] = value;
                      else this.#updateData(key, value); // NOTE: Untested
                  },
              });

        div.append(this.#schemaElement);

        this.#modal.append(div);

        document.body.append(this.#modal);

        setTimeout(() => this.#modal.toggle(true));
    }

    #render() {
        const { validateOnChange, schema, path: fullPath } = this;

        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];

        const isArray = schema.type === "array"; // Handle string (and related) formats / types

        const isEditableObject = this.#isEditableObject();

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

        if (isArray || isEditableObject) {
            // if ('value' in this && !Array.isArray(this.value)) this.value = [ this.value ]

            const isPatternProperties = this.pattern;

            // Provide default item types
            if (!isPatternProperties) {
                const hasItemsRef = "items" in schema && "$ref" in schema.items;
                if (!("items" in schema)) schema.items = {};
                if (!("type" in schema.items) && !hasItemsRef) schema.items.type = "string";
            }

            const itemSchema = this.form ? this.form.getSchema("items", schema) : schema["items"];

            const fileSystemFormat = isFilesystemSelector(name, itemSchema?.format);
            if (fileSystemFormat) return createFilesystemSelector(fileSystemFormat);
            // Create tables if possible
            else if (itemSchema?.type === "object" && this.form.createTable) {
                const ignore = this.form?.ignore
                    ? getIgnore(this.form?.ignore, [...this.form.base, ...path, name])
                    : {};

                const tableMetadata = {
                    schema: itemSchema,
                    data: this.value,

                    ignore,

                    onUpdate: () => this.#updateData(fullPath, tableMetadata.data, true, { onError: () => {}, onWarning: () => {} }), // Ensure change propagates to all forms

                    // NOTE: This is likely an incorrect declaration of the table validation call
                    validateOnChange: async (key, parent, v) => {

                        const warnings = []
                        const errors = []

                        const result = 
                            await (validateOnChange &&
                            (this.onValidate
                                ? this.onValidate()
                                : this.form
                                  ? this.form.triggerValidation(
                                    key, 
                                    fullPath, 
                                    false, 
                                    this, 
                                    itemSchema.properties[key], 
                                    { ...parent, [key]: v },
                                    {
                                        onError: (error) => errors.push(error),

                                        onWarning: (warning) => errors.push(warning),
                                    }
                                ) // NOTE: No pattern properties support
                                  : ""))
                        

                        const returnedValue = errors.length ? errors : (warnings.length ? warnings : result)

                        return returnedValue
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

            const addButton = new Button({
                size: "small",
            });

            addButton.innerText = `Add ${isEditableObject ? "Property" : "Item"}`;

            addButton.addEventListener("click", () => {
                this.#createModal({ list, schema: isPatternProperties ? schema : itemSchema });
            });

            const list = (this.#list = new List({
                items: this.#mapToList(),
                transform: (item) => {
                    if (this.#isEditableObject()) {
                        const { key, value } = item;

                        item.controls = [
                            new Button({
                                label: "Edit",
                                size: "small",
                                onClick: () => {
                                    this.#createModal({
                                        key,
                                        schema,
                                        results: value,
                                        list,
                                    });
                                },
                            }),
                        ];
                    }
                },
                onChange: async ({ object, items }, { object: oldObject }) => {
                    if (this.pattern) {
                        const oldKeys = Object.keys(oldObject);
                        const newKeys = Object.keys(object);
                        const removedKeys = oldKeys.filter((k) => !newKeys.includes(k));
                        const updatedKeys = newKeys.filter((k) => oldObject[k] !== object[k]);
                        removedKeys.forEach((k) => this.#updateData([...fullPath.slice(1), k], undefined));
                        updatedKeys.forEach((k) => this.#updateData([...fullPath.slice(1), k], object[k]));
                    } else {
                        this.#updateData(fullPath, items.length ? items.map((o) => o.value) : undefined);
                    }

                    if (validateOnChange) await this.#triggerValidation(name, path);
                },
            }));

            return html`
                <div class="schema-input list" @change=${() => validateOnChange && this.#triggerValidation(name, path)}>
                    ${list} ${addButton}
                </div>
            `;
        }

        // Basic enumeration of properties on a select element
        if (schema.enum && schema.enum.length) {
            if (schema.strict === false) {
                // const category = categories.find(({ test }) => test.test(key))?.value;

                const options = schema.enum.map((v) => {
                    return {
                        key: v,
                        value: v,
                        category: schema.enumCategories?.[v],
                        label: schema.enumLabels?.[v] ?? v,
                        keywords: schema.enumKeywords?.[v],
                    };
                });

                const search = new Search({
                    options,
                    value: {
                        value: this.value,
                        key: this.value,
                        category: schema.enumCategories?.[this.value],
                        label: schema.enumLabels?.[this.value],
                        keywords: schema.enumKeywords?.[this.value],
                    },
                    showAllWhenEmpty: false,
                    listMode: "click",
                    onSelect: async ({ value, key }) => {
                        const result = value ?? key;
                        this.#updateData(fullPath, result);
                        if (validateOnChange) await this.#triggerValidation(name, path);
                    },
                });

                search.classList.add("schema-input");
                search.onchange = () => validateOnChange && this.#triggerValidation(name, path); // Ensure validation on forced change

                return search;
            }

            return html`
                <select
                    class="guided--input schema-input"
                    @input=${(ev) => this.#updateData(fullPath, schema.enum[ev.target.value])}
                    @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
                >
                    <option disabled selected value>${schema.placeholder ?? "Select an option"}</option>
                    ${schema.enum.map(
                        (item, i) =>
                            html`<option value=${i} ?selected=${this.value === item}>
                                ${schema.enumLabels?.[item] ?? item}
                            </option>`
                    )}
                </select>
            `;
        } else if (schema.type === "boolean") {
            return html`<input
                type="checkbox"
                class="schema-input"
                @input=${(ev) => this.#updateData(fullPath, ev.target.checked)}
                ?checked=${this.value ?? false}
                @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
            />`;
        } else if (schema.type === "string" || schema.type === "number" || schema.type === "integer") {
            const isInteger = schema.type === "integer";
            if (isInteger) schema.type = "number";
            const isNumber = schema.type === "number";

            const fileSystemFormat = isFilesystemSelector(name, schema.format);
            if (fileSystemFormat) return createFilesystemSelector(fileSystemFormat);
            // Handle long string formats
            else if (schema.format === "long" || isArray)
                return html`<textarea
                    class="guided--input guided--text-area schema-input"
                    type="text"
                    placeholder="${schema.placeholder ?? ""}"
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
                    schema.format === "date-time"
                        ? "datetime-local"
                        : schema.format ?? (schema.type === "string" ? "text" : schema.type);
                return html`
                    <input
                        class="guided--input schema-input ${schema.step === null ? "hideStep" : ""}"
                        type="${type}"
                        step=${isNumber && schema.step ? schema.step : ""}
                        placeholder="${schema.placeholder ?? ""}"
                        .value="${this.value ?? ""}"
                        @input=${(ev) => {
                            let value = ev.target.value;
                            let newValue = value;

                            // const isBlank = value === '';

                            if (isInteger) newValue = parseInt(value);
                            else if (isNumber) newValue = parseFloat(value);

                            if (isNumber) {
                                if ("min" in schema && newValue < schema.min) newValue = schema.min;
                                else if ("max" in schema && newValue > schema.max) newValue = schema.max;
                            }

                            if (schema.transform) newValue = schema.transform(newValue, this.value, schema);

                            // // Do not check patter if value is empty
                            // if (schema.pattern && !isBlank) {
                            //     const regex = new RegExp(schema.pattern)
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
        return html`<pre>${schema.default ? JSON.stringify(schema.default, null, 2) : "No default value"}</pre>`;
    }
}

customElements.get("jsonschema-input") || customElements.define("jsonschema-input", JSONSchemaInput);
