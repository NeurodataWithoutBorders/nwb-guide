import { LitElement, css, html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { FilesystemSelector } from "./FileSystemSelector";

import { BasicTable } from "./BasicTable";
import { header, tempPropertyKey } from "./forms/utils";

import { Button } from "./Button";
import { List } from "./List";
import { Modal } from "./Modal";

import { capitalize } from "./forms/utils";
import { JSONSchemaForm, getIgnore } from "./JSONSchemaForm";
import { Search } from "./Search";
import tippy from "tippy.js";

const isEditableObject = (schema) => schema.type === "object";
const isAdditionalProperties = (pattern) => pattern === "additional";
const isPatternProperties = (pattern) => pattern && !isAdditionalProperties(pattern);

export const getEditableItems = (value, pattern, { name, schema } = {}) => {
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
    } else items.filter(([key]) => key in schema.properties);

    items = items.filter(([key]) => !key.includes("__")); // Remove secret properties

    return items.map(([key, value]) => {
        return { key, value };
    });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isFilesystemSelector = (name, format) => {
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
    ].filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
}

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

            .nan-handler label {
                margin-left: 5px;
                font-size: 12px;
            }

            .schema-input.list {
                width: 100%;
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
                : this.form
                  ? this.form.triggerValidation(name, path, undefined, this, undefined, undefined, hooks)
                  : "";
        }, 1000);
    };

    #clearTimeoutValidation = () => {
        if (this.#validationTimeout) clearTimeout(this.#validationTimeout);
    };

    #validationTimeout = null;
    #updateData = (fullPath, value, forceUpdate, hooks = {}) => {
        this.onUpdate ? this.onUpdate(value) : this.form ? this.form.updateData(fullPath, value, forceUpdate) : "";

        const path = [...fullPath];
        const name = path.splice(-1)[0];

        this.value = value; // Update the latest value

        if (hooks.willTimeout !== false) this.#activateTimeoutValidation(name, path, hooks);
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

    #list;
    #mapToList({ value = this.value, schema = this.schema, list } = {}) {
        const { path: fullPath } = this;
        const path = typeof fullPath === "string" ? fullPath.split("-") : [...fullPath];
        const name = path.splice(-1)[0];

        const canAddProperties = isEditableObject(this.schema);

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
                            onClick: () => {
                                this.#createModal({
                                    key,
                                    schema: isAdditionalProperties(this.pattern) ? undefined : schema,
                                    results: value,
                                    list: list ?? this.#list,
                                });
                            },
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

        return items;
    }

    #schemaElement;
    #modal;

    async #createModal({ key, schema = {}, results, list } = {}) {
        const createNewObject = !results;

        // const schemaProperties = Object.keys(schema.properties ?? {});
        // const additionalProperties = Object.keys(results).filter((key) => !schemaProperties.includes(key));
        // // const additionalElement = html`<label class="guided--form-label">Additional Properties</label><small>Cannot edit additional properties (${additionalProperties}) at this time</small>`

        const allowPatternProperties = isPatternProperties(this.pattern);
        const allowAdditionalProperties = isAdditionalProperties(this.pattern);
        const creatNewPatternProperty = allowPatternProperties && createNewObject;

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
                  validateOnChange: allowAdditionalProperties,
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

    #getType = (value = this.value) => (Array.isArray(value) ? "array" : typeof value);

    #handleNextInput = (idx) => {
        const next = this.form.inputs[idx];
        if (next) {
            const el = getFirstFocusableElement(next);
            if (el) {
                if (el.tagName === "BUTTON") return this.#handleNextInput(idx + 1);
                el.focus();
                // if (el.tagName === 'INPUT') return
                // else el.blur()
            }
        }
    };

    #moveToNextInput = (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            if (this.form) {
                const idx = this.form.inputs.findIndex((input) => input === this);
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

        const canAddProperties = isEditableObject(this.schema);

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

        if (isArray || canAddProperties) {
            // if ('value' in this && !Array.isArray(this.value)) this.value = [ this.value ]

            const allowPatternProperties = isPatternProperties(this.pattern);
            const allowAdditionalProperties = isAdditionalProperties(this.pattern);

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

            // Provide default item types
            if (isArray) {
                const hasItemsRef = "items" in schema && "$ref" in schema.items;
                if (!("items" in schema)) schema.items = {};
                if (!("type" in schema.items) && !hasItemsRef) schema.items.type = this.#getType(this.value?.[0]);
            }

            const itemSchema = this.form ? this.form.getSchema("items", schema) : schema["items"];

            const fileSystemFormat = isFilesystemSelector(name, itemSchema?.format);
            if (fileSystemFormat) return createFilesystemSelector(fileSystemFormat);
            // Create tables if possible
            else if (itemSchema?.type === "object" && this.form.createTable) {
                const ignore = this.form?.ignore ? getIgnore(this.form?.ignore, resolvedFullPath) : {};

                const instanceThis = this;

                function commonUpdateFunction(path, value = this.data) {
                    return instanceThis.#updateData(path, value, true, {
                        willTimeout: false, // Since there is a special validation function, do not trigger a timeout validation call
                        onError: (e) => e,
                        onWarning: (e) => e,
                    }); // Ensure change propagates to all forms
                }

                const commonValidationFunction = async (
                    tableBasePath,
                    path,
                    parent,
                    newValue,
                    baseSchema = itemSchema,
                    skip = 0
                ) => {
                    const warnings = [];
                    const errors = [];

                    const name = path.slice(-1)[0];
                    const completePath = [...tableBasePath, ...path.slice(0, -1)];

                    const toIterate = path.slice(skip);

                    const itemPropSchema = toIterate.reduce((acc, key) => {
                        // if (acc?.patternProperties) {
                        //     const pattern = Object.keys(acc.patternProperties).find((pattern) => new RegExp(pattern).test(key));
                        //     if (pattern) return acc.patternProperties[pattern];
                        // }
                        return acc?.properties?.[key] ?? acc?.items?.properties?.[key];
                    }, baseSchema);

                    const result = await (validateOnChange
                        ? this.onValidate
                            ? this.onValidate()
                            : this.form
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

                const createNestedTable = (propName, value) => {
                    const rowData = Object.entries(value).map(([key, value]) => {
                        return { [tempPropertyKey]: key, ...value };
                    });

                    const schemaCopy = structuredClone(itemSchema);
                    if (!schemaCopy.properties) schemaCopy.properties = {};
                    if (!schemaCopy.required) schemaCopy.required = [];
                    schemaCopy.properties[tempPropertyKey] = { title: "Property Key", type: "string", pattern: name };
                    schemaCopy.order = [tempPropertyKey];
                    schemaCopy.required.push(tempPropertyKey);

                    const resultPath = [...path, propName];
                    const schemaPath = [...resolvedFullPath, propName];

                    const allRemovedKeys = new Set();

                    const keyAlreadyExists = (key) => Object.keys(value).includes(key);

                    let previousValidValues = {};

                    const tableMetadata = {
                        schema: schemaCopy,
                        data: rowData,
                        ignore: this.form?.ignore ? getIgnore(this.form?.ignore, schemaPath) : {}, // According to schema

                        onUpdate: function (path, newValue) {
                            const oldKeys = Object.keys(value);

                            if (path.slice(-1)[0] === tempPropertyKey && keyAlreadyExists(newValue)) return; // Do not overwrite existing keys

                            const result = this.data.reduce((acc, row) => {
                                const key = row[tempPropertyKey];
                                if (key) {
                                    const copy = { ...row };
                                    delete copy[tempPropertyKey];
                                    acc[key] = copy;
                                }
                                return acc;
                            }, {});

                            const newKeys = Object.keys(result);
                            const removedKeys = oldKeys.filter((k) => !newKeys.includes(k));
                            removedKeys.forEach((key) => allRemovedKeys.add(key));
                            newKeys.forEach((key) => allRemovedKeys.delete(key));
                            allRemovedKeys.forEach((key) => (result[key] = undefined));

                            return commonUpdateFunction.call(this, resultPath, result); // According to
                        },

                        validateOnChange: function (path, parent, newValue) {
                            const rowIdx = path[0];
                            const currentKey = this.data[rowIdx][tempPropertyKey];
                            const updatedPath = [this.data[rowIdx][tempPropertyKey], ...path.slice(1)]; // Replace row with key

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

                            return commonValidationFunction(resultPath, updatedPath, parent, newValue, schemaCopy, 1);
                        },
                        ...commonTableMetadata,
                    };

                    const table = (this.table = this.form.createTable(propName, tableMetadata, resolvedFullPath)); // Try creating table. Otherwise use nested form
                    if (table) {
                        return html`
                            <h3>${header(propName)}</h3>
                            ${(this.form.tables[`${resolvedFullPath.slice(-1)[0]}.${propName}`] =
                                table === true ? new BasicTable(tableMetadata) : table)}
                        `;
                    }
                };

                // Possibly multiple tables
                if (isEditableObject(this.schema)) {
                    const data = getEditableItems(this.value, this.pattern, { name, schema }).reduce(
                        (acc, { key, value }) => {
                            acc[key] = value;
                            return acc;
                        },
                        {}
                    );

                    const tables = Object.entries(data)
                        .map(([patternPropName, patternPropValue]) =>
                            createNestedTable(patternPropName, patternPropValue)
                        )
                        .filter((value) => !!value);

                    if (tables.length) {
                        disableButton({
                            message: "New top-level pattern properties cannot be added at this time.",
                            submessage: "They need a unique key to be specified.",
                        });

                        return html` <div style="width: 100%;">${tables} ${buttonDiv}</div> `;
                    }
                }

                // Normal table parsing

                const tableMetadata = {
                    schema: itemSchema,
                    data: this.value,

                    ignore,

                    onUpdate: function () {
                        return commonUpdateFunction.call(this, fullPath);
                    },

                    validateOnChange: (...args) => commonValidationFunction(fullPath, ...args, 1),

                    ...commonTableMetadata,
                };

                const table = (this.table = this.form.createTable(name, tableMetadata, fullPath)); // Try creating table. Otherwise use nested form

                if (table) return (this.form.tables[name] = table === true ? new BasicTable(tableMetadata) : table);
            }

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

            addButton.addEventListener("click", () => {
                this.#createModal({ list, schema: allowPatternProperties ? schema : itemSchema });
            });

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

                search.addEventListener("keydown", this.#moveToNextInput);

                return search;
            }

            return html`
                <select
                    class="guided--input schema-input"
                    @input=${(ev) => this.#updateData(fullPath, schema.enum[ev.target.value])}
                    @change=${(ev) => validateOnChange && this.#triggerValidation(name, path)}
                    @keydown=${this.#moveToNextInput}
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
                        ?checked=${this.value && Number.isNaN(this.value)}
                        @change=${(ev) => {
                            const siblingInput = ev.target.parentNode.previousElementSibling;
                            if (ev.target.checked) {
                                this.#updateData(fullPath, NaN);
                                siblingInput.setAttribute("disabled", true);
                            } else {
                                siblingInput.removeAttribute("disabled");
                                const ev = new Event("input");
                                siblingInput.dispatchEvent(ev);
                            }
                        }}
                    ></input><label>I Don't Know</label></div>`
                        : ""}
                `;
            }
        }

        // Print out the immutable default value
        return html`<pre>${schema.default ? JSON.stringify(schema.default, null, 2) : "No default value"}</pre>`;
    }
}

customElements.get("jsonschema-input") || customElements.define("jsonschema-input", JSONSchemaInput);
