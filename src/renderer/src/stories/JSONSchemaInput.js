import { LitElement, css, html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { FilesystemSelector } from "./FileSystemSelector";

import { BasicTable } from "./BasicTable";
import { header, tempPropertyKey, tempPropertyValueKey } from "./forms/utils";

import { Button } from "./Button";
import { List } from "./List";
import { Modal } from "./Modal";

import { capitalize } from "./forms/utils";
import { JSONSchemaForm, getIgnore } from "./JSONSchemaForm";
import { Search } from "./Search";
import tippy from "tippy.js";
import { merge } from "./pages/utils";
import { OptionalSection } from "./OptionalSection";

const dateTimeRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

function resolveDateTime(value) {
    if (typeof value === "string") {
        const match = value.match(dateTimeRegex);
        if (match) return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
        return value;
    }

    return value;
}

export function createTable(fullPath, { onUpdate, onThrow, overrides = {} }) {
    const name = fullPath.slice(-1)[0];
    const path = fullPath.slice(0, -1);

    const schema = this.schema;
    const validateOnChange = this.validateOnChange;

    const ignore = this.form?.ignore ? getIgnore(this.form?.ignore, path) : {};

    const commonValidationFunction = async (tableBasePath, path, parent, newValue, itemPropSchema) => {
        const warnings = [];
        const errors = [];

        const name = path.slice(-1)[0];
        const completePath = [...tableBasePath, ...path.slice(0, -1)];

        const result = await (validateOnChange
            ? this.onValidate
                ? this.onValidate()
                : this.form?.triggerValidation
                  ? this.form.triggerValidation(
                        name,
                        completePath,
                        false,
                        this,
                        itemPropSchema,
                        { ...parent, [name]: newValue },
                        {
                            onError: (error) => {
                                errors.push(error); // Skip counting errors
                            },
                            onWarning: (warning) => {
                                warnings.push(warning); // Skip counting warnings
                            },
                        }
                    ) // NOTE: No pattern properties support
                  : ""
            : true);

        const returnedValue = errors.length ? errors : warnings.length ? warnings : result;

        return returnedValue;
    };

    const commonTableMetadata = {
        onStatusChange: () => this.form?.checkStatus && this.form.checkStatus(), // Check status on all elements
        validateEmptyCells: this.validateEmptyValue,
        deferLoading: this.form?.deferLoading,
        onLoaded: () => {
            if (this.form) {
                if (this.form.nLoaded) this.form.nLoaded++;
                if (this.form.checkAllLoaded) this.form.checkAllLoaded();
            }
        },
        onThrow: (...args) => onThrow(...args),
    };

    const addPropertyKeyToSchema = (schema) => {
        const schemaCopy = structuredClone(schema);

        const schemaItemsRef = schemaCopy["items"];

        if (!schemaItemsRef.properties) schemaItemsRef.properties = {};
        if (!schemaItemsRef.required) schemaItemsRef.required = [];

        schemaItemsRef.properties[tempPropertyKey] = { title: "Property Key", type: "string", pattern: name };
        if (!schemaItemsRef.order) schemaItemsRef.order = [];
        schemaItemsRef.order.unshift(tempPropertyKey);

        schemaItemsRef.required.push(tempPropertyKey);

        return schemaCopy;
    };

    const createNestedTable = (id, value, { name: propName = id, nestedSchema = schema } = {}) => {
        const schemaCopy = addPropertyKeyToSchema(nestedSchema);

        const resultPath = [...path];

        const schemaPath = [...fullPath];

        // THIS IS AN ISSUE
        const rowData = Object.entries(value).map(([key, value]) => {
            return !schemaCopy["items"]
                ? { [tempPropertyKey]: key, [tempPropertyValueKey]: value }
                : { [tempPropertyKey]: key, ...value };
        });

        if (propName) {
            resultPath.push(propName);
            schemaPath.push(propName);
        }

        const allRemovedKeys = new Set();

        const keyAlreadyExists = (key) => Object.keys(value).includes(key);

        const previousValidValues = {};

        function resolvePath(path, target) {
            return path
                .map((key, i) => {
                    const ogKey = key;
                    const nextKey = path[i + 1];
                    if (key === tempPropertyKey) key = target[tempPropertyKey];
                    if (nextKey === tempPropertyKey) key = [];

                    target = target[ogKey] ?? {};

                    if (nextKey === tempPropertyValueKey) return target[tempPropertyKey]; // Grab next property key
                    if (key === tempPropertyValueKey) return [];

                    return key;
                })
                .flat();
        }

        function setValueOnAccumulator(row, acc) {
            const key = row[tempPropertyKey];

            if (!key) return acc;

            if (tempPropertyValueKey in row) {
                const propValue = row[tempPropertyValueKey];
                if (Array.isArray(propValue))
                    acc[key] = propValue.reduce((acc, row) => setValueOnAccumulator(row, acc), {});
                else acc[key] = propValue;
            } else {
                const copy = { ...row };
                delete copy[tempPropertyKey];
                acc[key] = copy;
            }

            return acc;
        }

        const nestedIgnore = this.form?.ignore ? getIgnore(this.form?.ignore, schemaPath) : {};

        merge(overrides.ignore, nestedIgnore);

        merge(overrides.schema, schemaCopy, { arrays: true });

        const tableMetadata = {
            keyColumn: tempPropertyKey,
            schema: schemaCopy,
            data: rowData,
            ignore: nestedIgnore, // According to schema

            onUpdate: function (path, newValue) {
                const oldKeys = Object.keys(value);

                if (path.slice(-1)[0] === tempPropertyKey && keyAlreadyExists(newValue)) return; // Do not overwrite existing keys

                const result = this.data.reduce((acc, row) => setValueOnAccumulator(row, acc), {});

                const newKeys = Object.keys(result);
                const removedKeys = oldKeys.filter((k) => !newKeys.includes(k));
                removedKeys.forEach((key) => allRemovedKeys.add(key));
                newKeys.forEach((key) => allRemovedKeys.delete(key));
                allRemovedKeys.forEach((key) => (result[key] = undefined));

                // const resolvedPath = resolvePath(path, this.data)
                return onUpdate.call(this, [], result); // Update all table data
            },

            validateOnChange: function (path, parent, newValue) {
                const rowIdx = path[0];
                const currentKey = this.data[rowIdx]?.[tempPropertyKey];

                const updatedPath = resolvePath(path, this.data);

                const resolvedKey = previousValidValues[rowIdx] ?? currentKey;

                // Do not overwrite existing keys
                if (path.slice(-1)[0] === tempPropertyKey && resolvedKey !== newValue) {
                    if (keyAlreadyExists(newValue)) {
                        if (!previousValidValues[rowIdx]) previousValidValues[rowIdx] = resolvedKey;

                        return [
                            {
                                message: `Key already exists.<br><small>This value is still ${resolvedKey}.</small>`,
                                type: "error",
                            },
                        ];
                    } else delete previousValidValues[rowIdx];
                }

                const toIterate = updatedPath.filter((value) => typeof value === "string");

                const itemPropsSchema = toIterate.reduce(
                    (acc, key) => acc?.properties?.[key] ?? acc?.items?.properties?.[key],
                    schemaCopy
                );

                return commonValidationFunction([], updatedPath, parent, newValue, itemPropsSchema, 1);
            },
            ...commonTableMetadata,
        };

        const table = this.renderTable(id, tableMetadata, fullPath);
        return table; // Try rendering as a nested table with a fake property key (otherwise use nested forms)
    };

    const schemaCopy = structuredClone(schema);

    // Possibly multiple tables
    if (isEditableObject(schema, this.value)) {
        // One table with nested tables for each property
        const data = getEditableItems(this.value, this.pattern, { name, schema: schemaCopy }).reduce(
            (acc, { key, value }) => {
                acc[key] = value;
                return acc;
            },
            {}
        );

        const table = createNestedTable(name, data, { schema });
        if (table) return table;
    }

    const nestedIgnore = getIgnore(ignore, fullPath);

    Object.assign(nestedIgnore, overrides.ignore ?? {});

    merge(overrides.ignore, nestedIgnore);

    merge(overrides.schema, schemaCopy, { arrays: true });

    // Normal table parsing
    const tableMetadata = {
        schema: schemaCopy,
        data: this.value,

        ignore: nestedIgnore, // According to schema

        onUpdate: function () {
            return onUpdate.call(this, fullPath, this.data); // Update all table data
        },

        validateOnChange: (...args) => commonValidationFunction(fullPath, ...args),

        ...commonTableMetadata,
    };

    const table = (this.table = this.renderTable(name, tableMetadata, path)); // Try creating table. Otherwise use nested form

    if (table) {
        const tableEl = table === true ? new BasicTable(tableMetadata) : table;
        const tables = this.form?.tables;
        if (tables) tables[name] = tableEl;
        return tableEl;
    }
}

// Schema or value indicates editable object
export const isEditableObject = (schema, value) =>
    schema.type === "object" || (value && typeof value === "object" && !Array.isArray(value));

export const isAdditionalProperties = (pattern) => pattern === "additional";
export const isPatternProperties = (pattern) => pattern && !isAdditionalProperties(pattern);

export const getEditableItems = (value = {}, pattern, { name, schema } = {}) => {
    let items = Object.entries(value);

    const allowAdditionalProperties = isAdditionalProperties(pattern);

    if (isPatternProperties(pattern)) {
        const regex = new RegExp(name);
        items = items.filter(([key]) => regex.test(key));
    } else if (allowAdditionalProperties) {
        const props = Object.keys(schema.properties ?? {});
        items = items.filter(([key]) => !props.includes(key));

        const patternProps = Object.keys(schema.patternProperties ?? {});
        patternProps.forEach((key) => {
            const regex = new RegExp(key);
            items = items.filter(([k]) => !regex.test(k));
        });
    } else if (schema.properties) items = items.filter(([key]) => key in schema.properties);

    items = items.filter(([key]) => !key.includes("__")); // Remove secret properties

    return items.map(([key, value]) => {
        return { key, value };
    });
};

const isFilesystemSelector = (name = "", format) => {
    if (Array.isArray(format)) return format.map((f) => isFilesystemSelector(name, f)).every(Boolean) ? format : null;

    const matched = name.match(/(.+_)?(.+)_paths?/);
    if (!format && matched) format = matched[2] === "folder" ? "directory" : matched[2];
    return ["file", "directory"].includes(format) ? format : null; // Handle file and directory formats
};

function getFirstFocusableElement(element) {
    const root = element.shadowRoot || element;
    const focusableElements = getKeyboardFocusableElements(root);
    if (focusableElements.length === 0) {
        for (let child of root.children) {
            const focusableElement = getFirstFocusableElement(child);
            if (focusableElement) return focusableElement;
        }
    }
    return focusableElements[0];
}

function getKeyboardFocusableElements(element = document) {
    const root = element.shadowRoot || element;
    return [
        ...root.querySelectorAll('a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])'),
    ].filter(
        (focusableElement) =>
            !focusableElement.hasAttribute("disabled") && !focusableElement.getAttribute("aria-hidden")
    );
}

export class JSONSchemaInput extends LitElement {
    static get styles() {
        return css`
            * {
                box-sizing: border-box;
            }

            :host {
                margin-top: 1.45rem;
            }

            :host(.invalid) .guided--input {
                background: rgb(255, 229, 228) !important;
            }

            main {
                display: flex;
                margin-top: 0.5rem;
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
                opacity: 0.5;
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

            .nan-handler {
                display: flex;
                align-items: center;
                margin-left: 5px;
                white-space: nowrap;
            }

            .nan-handler span {
                margin-left: 5px;
                font-size: 12px;
            }

            .schema-input.list {
                width: 100%;
            }

            .guided--form-label {
                display: block;
                width: 100%;
                margin: 0;
                color: black;
                font-weight: 600;
                font-size: 1.2em !important;
            }

            .guided--form-label.centered {
                text-align: center;
            }

            .guided--form-label.header {
                font-size: 1.5em !important;
            }

            .required label:after {
                content: " *";
                color: #ff0033;
            }

            :host(:not([validateemptyvalue])) .required label:after {
                color: gray;
            }

            .required.conditional label:after {
                color: transparent;
            }

            hr {
                display: block;
                height: 1px;
                border: 0;
                border-top: 1px solid #ccc;
                padding: 0;
                margin-bottom: 1em;
            }
        `;
    }

    static get properties() {
        return {
            schema: { type: Object, reflect: false },
            validateEmptyValue: { type: Boolean, reflect: true },
            required: { type: Boolean, reflect: true },
        };
    }

    // schema,
    // parent,
    // path,
    // form,
    // pattern
    // showLabel
    controls = [];
    // required;
    validateOnChange = true;

    constructor(props) {
        super();
        Object.assign(this, props);
        if (props.validateEmptyValue === false) this.validateEmptyValue = true; // False is treated as required but not triggered if empty
    }

    // onUpdate = () => {}
    // onValidate = () => {}

    updateData(value, forceValidate = false) {
        if (!forceValidate) {
            // Update the actual input element
            const inputElement = this.getElement();
            if (inputElement.type === "checkbox") inputElement.checked = value;
            else if (inputElement.classList.contains("list")) {
                const list = inputElement.children[0];
                inputElement.children[0].items = this.#mapToList({
                    value,
                    list,
                }); // NOTE: Make sure this is correct
            } else if (inputElement instanceof Search) inputElement.shadowRoot.querySelector("input").value = value;
            else inputElement.value = value;
        }

        const { path: fullPath } = this;
        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];

        this.#updateData(fullPath, value);
        this.#triggerValidation(name, path); // NOTE: Is asynchronous

        return true;
    }

    getElement = () => this.shadowRoot.querySelector(".schema-input");

    #activateTimeoutValidation = (name, path, hooks) => {
        this.#clearTimeoutValidation();
        this.#validationTimeout = setTimeout(() => {
            this.onValidate
                ? this.onValidate()
                : this.form?.triggerValidation
                  ? this.form.triggerValidation(name, path, undefined, this, undefined, undefined, hooks)
                  : "";
        }, 1000);
    };

    #clearTimeoutValidation = () => {
        if (this.#validationTimeout) clearTimeout(this.#validationTimeout);
    };

    #validationTimeout = null;
    #updateData = (fullPath, value, forceUpdate, hooks = {}) => {
        this.onUpdate
            ? this.onUpdate(value)
            : this.form?.updateData
              ? this.form.updateData(fullPath, value, forceUpdate)
              : "";

        const path = [...fullPath];
        const name = path.splice(-1)[0];

        this.value = value; // Update the latest value

        if (hooks.willTimeout !== false) this.#activateTimeoutValidation(name, path, hooks);
    };

    #triggerValidation = async (name, path) => {
        this.#clearTimeoutValidation();
        return this.onValidate
            ? this.onValidate()
            : this.form?.triggerValidation
              ? this.form.triggerValidation(name, path, undefined, this)
              : "";
    };

    updated() {
        const inputElement = this.getElement();
        if (inputElement) inputElement.dispatchEvent(new Event("change"));
    }

    render() {
        const { schema } = this;

        const input = this.#render();

        if (input === null) return null; // Hide rendering

        return html`
            <div class="${this.required || this.conditional ? "required" : ""} ${
                this.conditional ? "conditional" : ""
            }">

                ${
                    this.showLabel
                        ? html`<label class="guided--form-label"
                              >${(schema.title ? unsafeHTML(schema.title) : null) ??
                              header(this.path.slice(-1)[0])}</label
                          >`
                        : ""
                }
                </label>
                <main>${input}${this.controls ? html`<div id="controls">${this.controls}</div>` : ""}</main>
                <p class="guided--text-input-instructions">
                    ${
                        schema.description
                            ? html`${unsafeHTML(capitalize(schema.description))}${schema.description.slice(-1)[0] ===
                              "."
                                  ? ""
                                  : "."}`
                            : ""
                    }
                </p>
            </div>
        `;
    }

    #onThrow = (...args) => (this.onThrow ? this.onThrow(...args) : this.form?.onThrow(...args));

    #list;
    #mapToList({ value = this.value, schema = this.schema, list } = {}) {
        const { path: fullPath } = this;
        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];

        const canAddProperties = isEditableObject(this.schema, this.value);

        if (canAddProperties) {
            const editable = getEditableItems(this.value, this.pattern, { name, schema });

            return editable.map(({ key, value }) => {
                return {
                    key,
                    value,
                    controls: [
                        new Button({
                            label: "Edit",
                            size: "small",
                            onClick: () =>
                                this.#createModal({
                                    key,
                                    schema: isAdditionalProperties(this.pattern) ? undefined : schema,
                                    results: value,
                                    list: list ?? this.#list,
                                }),
                        }),
                    ],
                };
            });
        } else {
            const resolved = value ?? [];
            return resolved
                ? resolved.map((value) => {
                      return { value };
                  })
                : [];
        }
    }

    #modal;

    #createModal({ key, schema = {}, results, list, label } = {}) {
        const schemaCopy = structuredClone(schema);

        const createNewObject = !results && (schemaCopy.type === "object" || schemaCopy.properties);

        // const schemaProperties = Object.keys(schema.properties ?? {});
        // const additionalProperties = Object.keys(results).filter((key) => !schemaProperties.includes(key));
        // // const additionalElement = html`<label class="guided--form-label">Additional Properties</label><small>Cannot edit additional properties (${additionalProperties}) at this time</small>`

        const allowPatternProperties = isPatternProperties(this.pattern);
        const allowAdditionalProperties = isAdditionalProperties(this.pattern);
        const createNewPatternProperty = allowPatternProperties && createNewObject;

        // Add a property name entry to the schema
        if (createNewPatternProperty) {
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

        const isObject = schemaCopy.type === "object" || schemaCopy.properties; // NOTE: For formatted strings, this is not an object

        // NOTE: Will be replaced by single instances
        let updateTarget = results ?? (isObject ? {} : undefined);

        submitButton.onClick = async () => {
            await nestedModalElement.validate();

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
            if (createNewPatternProperty) {
                const key = value.__;
                delete value.__;
                list.add({ key, value });
            } else list.add({ key, value });

            this.#modal.toggle(false);
        };

        this.#modal = new Modal({
            header: label ? `${header(label)} Editor` : key ? header(key) : `Property Editor`,
            footer: submitButton,
            showCloseButton: createNewObject,
        });

        const div = document.createElement("div");
        div.style.padding = "25px";

        const inputTitle = header(schemaCopy.title ?? label ?? "Value");

        const nestedModalElement = isObject
            ? new JSONSchemaForm({
                  schema: schemaCopy,
                  results: updateTarget,
                  validateEmptyValues: false,
                  onUpdate: (internalPath, value) => {
                      if (!createNewObject) {
                          const path = [key, ...internalPath];
                          this.#updateData(path, value, true); // Live updates
                      }
                  },
                  renderTable: this.renderTable,
                  onThrow: this.#onThrow,
              })
            : new JSONSchemaForm({
                  schema: {
                      properties: {
                          [tempPropertyKey]: {
                              ...schemaCopy,
                              title: inputTitle,
                          },
                      },
                      required: [tempPropertyKey],
                  },
                  validateEmptyValues: false,
                  results: updateTarget,
                  onUpdate: (_, value) => {
                      if (createNewObject) updateTarget[key] = value;
                      else updateTarget = value;
                  },
                  // renderTable: this.renderTable,
                  // onThrow: this.#onThrow,
              });

        div.append(nestedModalElement);

        this.#modal.append(div);

        document.body.append(this.#modal);

        setTimeout(() => this.#modal.toggle(true));

        return this.#modal;
    }

    #getType = (value = this.value) => (Array.isArray(value) ? "array" : typeof value);

    #handleNextInput = (idx) => {
        const next = Object.values(this.form.inputs)[idx];
        if (next) {
            const firstFocusableElement = getFirstFocusableElement(next);
            if (firstFocusableElement) {
                if (firstFocusableElement.tagName === "BUTTON") return this.#handleNextInput(idx + 1);
                firstFocusableElement.focus();
            }
        }
    };

    #moveToNextInput = (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            if (this.form?.inputs) {
                const idx = Object.values(this.form.inputs).findIndex((input) => input === this);
                this.#handleNextInput(idx + 1);
            }

            ev.target.blur();
        }
    };

    #render() {
        const { validateOnChange, schema, path: fullPath } = this;
        
        // Do your best to fill in missing schema values
        if (!("type" in schema)) schema.type = this.#getType();

        const resolvedFullPath = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const path = [...resolvedFullPath];
        const name = path.splice(-1)[0];

        const isArray = schema.type === "array"; // Handle string (and related) formats / types
        
        const canAddProperties = isEditableObject(this.schema, this.value);

        if (this.renderCustomHTML) {
            const custom = this.renderCustomHTML(name, schema, path, {
                onUpdate: this.#updateData,
                onThrow: this.#onThrow,
            });
            if (custom || custom === null) return custom;
        }

        // Handle file and directory formats
        const createFilesystemSelector = (format) => {
            const filesystemSelectorElement = new FilesystemSelector({
                type: format,
                value: this.value,
                onSelect: (paths = []) => {
                    const value = paths.length ? paths : undefined;
                    this.#updateData(fullPath, value);
                },
                onChange: (filePath) => validateOnChange && this.#triggerValidation(name, path),
                onThrow: (...args) => this.#onThrow(...args),
                dialogOptions: this.form?.dialogOptions,
                dialogType: this.form?.dialogType,
                multiple: isArray,
            });
            filesystemSelectorElement.classList.add("schema-input");
            return filesystemSelectorElement;
        };
        

        // Transform to single item if maxItems is 1
        if (isArray && schema.maxItems === 1) {
            return new JSONSchemaInput({
                value: this.value?.[0],
                schema: schema.items,
                path: fullPath,
                validateEmptyValue: this.validateEmptyValue,
                required: this.required,
                validateOnChange: () => validateOnChange ? this.#triggerValidation(name, path) : '',
                form: this.form,
                onUpdate: (value) => this.#updateData(fullPath, [ value ]),
            })
        }


        if (isArray || canAddProperties) {
            // if ('value' in this && !Array.isArray(this.value)) this.value = [ this.value ]

            const allowPatternProperties = isPatternProperties(this.pattern);
            const allowAdditionalProperties = isAdditionalProperties(this.pattern);

            // Provide default item types
            if (isArray) {
                const hasItemsRef = "items" in schema && "$ref" in schema.items;
                if (!("items" in schema)) schema.items = {};
                if (!("type" in schema.items) && !hasItemsRef) schema.items.type = this.#getType(this.value?.[0]);
            }

            const itemSchema = this.form?.getSchema ? this.form.getSchema("items", schema) : schema["items"];

            const fileSystemFormat = isFilesystemSelector(name, itemSchema?.format);
            if (fileSystemFormat) return createFilesystemSelector(fileSystemFormat);
            // Create tables if possible
            else if (itemSchema?.type === "string" && !itemSchema.properties) {
                const list = new List({
                    items: this.value,
                    emptyMessage: "No items",
                    onChange: ({ items }) => {
                        this.#updateData(fullPath, items.length ? items.map((o) => o.value) : undefined);
                        if (validateOnChange) this.#triggerValidation(name, path);
                    },
                });

                if (itemSchema.enum) {
                    const search = new Search({
                        options: itemSchema.enum.map((v) => {
                            return {
                                key: v,
                                value: v,
                                label: itemSchema.enumLabels?.[v] ?? v,
                                keywords: itemSchema.enumKeywords?.[v],
                                description: itemSchema.enumDescriptions?.[v],
                                link: itemSchema.enumLinks?.[v],
                            };
                        }),
                        value: this.value,
                        listMode: schema.strict === false ? "click" : "append",
                        showAllWhenEmpty: false,
                        onSelect: async ({ label, value }) => {
                            if (!value) return;
                            if (schema.uniqueItems && this.value && this.value.includes(value)) return;
                            list.add({ content: label, value });
                        },
                    });

                    search.style.height = "auto";
                    return html`<div style="width: 100%;">${search}${list}</div>`;
                } else {
                    const input = document.createElement("input");
                    input.classList.add("guided--input");
                    input.placeholder = "Provide an item for the list";

                    const submitButton = new Button({
                        label: "Submit",
                        primary: true,
                        size: "small",
                        onClick: () => {
                            const value = input.value;
                            if (!value) return;
                            if (schema.uniqueItems && this.value && this.value.includes(value)) return;
                            list.add({ value });
                            input.value = "";
                        },
                    });

                    return html`<div style="width: 100%;">
                        <div style="display: flex; gap: 10px; align-items: center;">${input}${submitButton}</div>
                        ${list}
                    </div>`;
                }
            } else if (itemSchema?.type === "object" && this.renderTable) {
                const instanceThis = this;

                function updateFunction(path, value = this.data) {
                    return instanceThis.#updateData(path, value, true, {
                        willTimeout: false, // Since there is a special validation function, do not trigger a timeout validation call
                        onError: (e) => e,
                        onWarning: (e) => e,
                    });
                }

                const table = createTable.call(this, resolvedFullPath, {
                    onUpdate: updateFunction,
                    onThrow: this.#onThrow,
                }); // Ensure change propagates

                if (table) return table;
            }

            const addButton = new Button({
                size: "small",
            });

            addButton.innerText = `Add ${canAddProperties ? "Property" : "Item"}`;

            const buttonDiv = document.createElement("div");
            Object.assign(buttonDiv.style, { width: "fit-content" });
            buttonDiv.append(addButton);

            const disableButton = ({ message, submessage }) => {
                addButton.setAttribute("disabled", true);
                tippy(buttonDiv, {
                    content: `<div style="padding: 10px;">${message} <br><small>${submessage}</small></div>`,
                    allowHTML: true,
                });
            };

            const list = (this.#list = new List({
                items: this.#mapToList(),

                // Add edit button when new items are added
                // NOTE: Duplicates some code in #mapToList
                transform: (item) => {
                    if (canAddProperties) {
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

            if (allowAdditionalProperties)
                disableButton({
                    message: "Additional properties cannot be added at this time.",
                    submessage: "They don't have a predictable structure.",
                });

            addButton.onClick = () =>
                this.#createModal({ label: name, list, schema: allowPatternProperties ? schema : itemSchema });

            return html`
                <div class="schema-input list" @change=${() => validateOnChange && this.#triggerValidation(name, path)}>
                    ${list} ${buttonDiv}
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
                        description: schema.enumDescriptions?.[v],
                        link: schema.enumLinks?.[v],
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
                    listMode: "input",
                    onSelect: async ({ value, key }) => {
                        const result = value ?? key;
                        this.#updateData(fullPath, result);
                        if (validateOnChange) await this.#triggerValidation(name, path);
                    },
                });

                search.classList.add("schema-input");
                search.onchange = () => validateOnChange && this.#triggerValidation(name, path); // Ensure validation on forced change

                search.addEventListener("keydown", this.#moveToNextInput);

                return search;
            }

            const enumItems = [...schema.enum];

            const noSelection = "No Selection";
            if (!this.required) enumItems.unshift(noSelection);

            const selectedItem = enumItems.find((item) => this.value === item);

            return html`
                <select
                    class="guided--input schema-input"
                    @input=${(ev) => {
                        const index = ev.target.value;
                        const value = enumItems[index];
                        this.#updateData(fullPath, value === noSelection ? undefined : value);
                    }}
                    @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
                    @keydown=${this.#moveToNextInput}
                >
                    <option disabled selected value>${schema.placeholder ?? "Select an option"}</option>
                    ${enumItems.map(
                        (item, i) =>
                            html`<option
                                value=${i}
                                ?selected=${selectedItem === item || (selectedItem === -1 && item === noSelection)}
                            >
                                ${schema.enumLabels?.[item] ?? item}
                            </option>`
                    )}
                </select>
            `;
        } else if (schema.type === "boolean") {

            const optional = new OptionalSection({
                value: this.value ?? false,
                size: "small",
                onChange: (value) => {
                    this.#updateData(fullPath, value);
                    if (validateOnChange) this.#triggerValidation(name, path);
                }
            })

            optional.classList.add("schema-input");
            return optional
            
        } else if (schema.type === "string" || schema.type === "number" || schema.type === "integer") {
            const isInteger = schema.type === "integer";
            if (isInteger) schema.type = "number";
            const isNumber = schema.type === "number";

            const isRequiredNumber = isNumber && this.required;

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
                    @keydown=${this.#moveToNextInput}
                ></textarea>`;
            // Handle other string formats
            else {
                const isDateTime = schema.format === "date-time";

                const type = isDateTime
                    ? "datetime-local"
                    : schema.format ?? (schema.type === "string" ? "text" : schema.type);

                const value = isDateTime ? resolveDateTime(this.value) : this.value;

                return html`
                    <input
                        class="guided--input schema-input ${schema.step === null ? "hideStep" : ""}"
                        type="${type}"
                        step=${isNumber && schema.step ? schema.step : ""}
                        placeholder="${schema.placeholder ?? ""}"
                        .value="${value ?? ""}"
                        @input=${(ev) => {
                            let value = ev.target.value;
                            let newValue = value;

                            // const isBlank = value === '';

                            if (isInteger) value = newValue = parseInt(value);
                            else if (isNumber) value = newValue = parseFloat(value);

                            if (isNumber) {
                                if ("min" in schema && newValue < schema.min) newValue = schema.min;
                                else if ("max" in schema && newValue > schema.max) newValue = schema.max;

                                if (isNaN(newValue)) newValue = undefined;
                            }

                            if (schema.transform) newValue = schema.transform(newValue, this.value, schema);

                            // // Do not check pattern if value is empty
                            // if (schema.pattern && !isBlank) {
                            //     const regex = new RegExp(schema.pattern)
                            //     if (!regex.test(isNaN(newValue) ? value : newValue)) newValue = this.value // revert to last value
                            // }

                            if (isNumber && newValue !== value) {
                                ev.target.value = newValue;
                                value = newValue;
                            }

                            if (isRequiredNumber) {
                                const nanHandler = ev.target.parentNode.querySelector(".nan-handler");
                                if (!(newValue && Number.isNaN(newValue))) nanHandler.checked = false;
                            }

                            this.#updateData(fullPath, value);
                        }}
                        @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
                        @keydown=${this.#moveToNextInput}
                    />
                    ${isRequiredNumber
                        ? html`<div class="nan-handler"><input
                        type="checkbox"
                        ?checked=${this.value === null}
                        @change=${(ev) => {
                            const siblingInput = ev.target.parentNode.previousElementSibling;
                            if (ev.target.checked) {
                                this.#updateData(fullPath, null);
                                siblingInput.setAttribute("disabled", true);
                            } else {
                                siblingInput.removeAttribute("disabled");
                                const ev = new Event("input");
                                siblingInput.dispatchEvent(ev);
                            }
                            this.#triggerValidation(name, path);
                        }}
                    ></input><span>I Don't Know</span></div>`
                        : ""}
                `;
            }
        }

        // Print out the immutable default value
        return html`<pre>${schema.default ? JSON.stringify(schema.default, null, 2) : "No default value"}</pre>`;
    }
}

customElements.get("jsonschema-input") || customElements.define("jsonschema-input", JSONSchemaInput);
