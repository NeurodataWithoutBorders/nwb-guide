import { LitElement, css, html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import { Accordion } from "./Accordion";

import { checkStatus } from "../validation";
import { header } from "./forms/utils";
import { resolve } from "../promises";
import { merge } from "./pages/utils";
import { resolveProperties } from "./pages/guided-mode/data/utils";

import { JSONSchemaInput } from "./JSONSchemaInput";
import { InspectorListItem } from "./preview/inspector/InspectorList";

import { Validator } from "jsonschema";
import { successHue, warningHue, errorHue } from "./globals";

var validator = new Validator();

const isObject = (item) => {
    return item && typeof item === "object" && !Array.isArray(item);
};

const selfRequiredSymbol = Symbol();

const componentCSS = `

    * {
      box-sizing: border-box;
    }

    :host {
      display: inline-block;
      width:100%;
    }

    #empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        color: gray;
    }


    p {
      margin: 0 0 1em;
      line-height: 1.4285em;
    }

    .guided--form-label {
      display: block;
      width: 100%;
      margin: 1.45rem 0 0 0;
      color: black;
      font-weight: 600;
    }

    .form-section:first-child .guided--form-label {
      margin-top: 0;
    }

    jsonschema-input {
        margin-top: 0.5rem;
    }

    .guided--form-label {
      font-size: 1.2em !important;
    }

    .guided--form-label.centered {
      text-align: center;
    }

    .guided--form-label.header {
      font-size: 1.5em !important;
    }

    .link {
      margin-top: 20px;
      border: 1px solid black;
      border-radius: 4px;
      position: relative;
    }

    .link > div {
      padding: 20px;
    }

    .link::before {
      box-sizing: border-box;
      display: block;
      width: 100%;
      color: white;
      background: black;
      padding: 10px;
      content: ''attr(data-name)'';
      font-weight: bold;
    }

    .link::after {
        box-sizing: border-box;
        display: block;
        width: 10px;
        height: 10px;
        background: hsl(${successHue}, 100%, 70%) !important;
        border-radius: 50%;
        position: absolute;
        top: 0;
        right: 0;
        content: '';
        margin: 15px;
      }

    .link.error::after {
        background: hsl(${errorHue}, 100%, 70%) !important;
    }

    .link.warning::after {
        background: hsl(${warningHue}, 100%, 70%) !important;
    }

    hr {
    margin: 1em 0 1.5em 0;
    }

    pre {
        white-space: pre-wrap;       /* Since CSS 2.1 */
        white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
        white-space: -pre-wrap;      /* Opera 4-6 */
        white-space: -o-pre-wrap;    /* Opera 7 */
        word-wrap: break-word;       /* Internet Explorer 5.5+ */
        font-family: unset;
        color: DimGray;
    }

  .required label:after {
    content: "*";
    color: #ff0033;

  }

  :host(:not([validateemptyvalues])) .required label:after {
    color: gray;

  }


  .required.conditional label:after {
    color: transparent;
  }

  h4 {
    margin: 0;
    margin-bottom: 5px;
    padding-bottom: 5px;
    border-bottom: 1px solid gainsboro;
  }

    .guided--text-input-instructions {
        font-size: 13px;
        width: 100%;
        padding-top: 4px;
        color: dimgray !important;
        margin: 0 0 1em;
        line-height: 1.4285em;
    }

    nwb-accordion {
        margin-bottom: 0.5em;
    }

    [disabled]{
        opacity: 0.5;
        pointer-events: none;
    }

    small {
        font-size: 0.8em;
    }
`;

document.addEventListener("dragover", (dragEvent) => {
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
});

export class JSONSchemaForm extends LitElement {
    static get styles() {
        return css([componentCSS]);
    }

    static get properties() {
        return {
            schema: { type: Object, reflect: false },
            results: { type: Object, reflect: false },
            required: { type: Object, reflect: false },
            dialogType: { type: String, reflect: false },
            dialogOptions: { type: Object, reflect: false },
            globals: { type: Object, reflect: false },
            validateEmptyValues: { type: Boolean, reflect: true },
        };
    }

    base = [];
    #nestedForms = {};
    inputs = [];

    tables = {};
    #nErrors = 0;
    #nWarnings = 0;

    #toggleRendered;
    #rendered;
    #updateRendered = (force) =>
        force || this.#rendered === true
            ? (this.#rendered = new Promise(
                  (resolve) => (this.#toggleRendered = () => resolve((this.#rendered = true)))
              ))
            : this.#rendered;

    resolved = {}; // Keep track of actual resolved values—not just what the user provides as results

    constructor(props = {}) {
        super();

        this.#rendered = this.#updateRendered(true);

        this.identifier = props.identifier;
        this.schema = props.schema ?? {};
        this.results = (props.base ? structuredClone(props.results) : props.results) ?? {}; // Deep clone results in nested forms
        this.globals = props.globals ?? {};

        this.ignore = props.ignore ?? [];
        this.required = props.required ?? {};
        this.dialogOptions = props.dialogOptions;
        this.dialogType = props.dialogType;
        this.deferLoading = props.deferLoading ?? false;

        this.showPath = props.showPath ?? false;

        this.controls = props.controls ?? {};

        this.transformErrors = props.transformErrors;

        this.emptyMessage = props.emptyMessage ?? "No properties to render";

        this.onlyRequired = props.onlyRequired ?? false;
        this.showLevelOverride = props.showLevelOverride ?? false;

        this.groups = props.groups ?? []; // NOTE: We assume properties only belong to one conditional requirement group

        this.validateEmptyValues = props.validateEmptyValues ?? true;

        if (props.onInvalid) this.onInvalid = props.onInvalid;
        if (props.sort) this.sort = props.sort;

        if (props.validateOnChange) this.validateOnChange = props.validateOnChange;
        if (props.onThrow) this.onThrow = props.onThrow;
        if (props.onLoaded) this.onLoaded = props.onLoaded;
        if (props.onUpdate) this.onUpdate = props.onUpdate;
        if (props.createTable) this.createTable = props.createTable;
        if (props.onOverride) this.onOverride = props.onOverride;

        if (props.onStatusChange) this.onStatusChange = props.onStatusChange;

        if (props.base) this.base = props.base;
    }

    getTable = (path) => {
        if (typeof path === "string") path = path.split(".");

        if (path.length === 1) return this.tables[path[0]]; // return table if accessible

        const copy = [...path];
        const tableName = copy.pop();

        return this.getForm(copy).getTable(tableName);
    };
    v;
    getForm = (path) => {
        if (typeof path === "string") path = path.split(".");
        const form = this.#nestedForms[path[0]];
        if (!path.length || !form) return this; // No nested form with this name. Returning self.

        return form.getForm(path.slice(1));
    };

    getInput = (path) => {
        if (typeof path === "string") path = path.split(".");

        const container = this.shadowRoot.querySelector(`#${path.join("-")}`);

        if (!container) {
            if (path.length > 1) return this.getForm(path[0]).getInput(path.slice(1));
            else return;
        }
        return container?.querySelector("jsonschema-input");
    };

    #requirements = {};

    attributeChangedCallback(changedProperties, oldValue, newValue) {
        super.attributeChangedCallback(changedProperties, oldValue, newValue);
        if (changedProperties === "options") this.requestUpdate();
    }

    getGlobalValue(path) {
        if (typeof path === "string") path = path.split(".");
        const resolved = this.#get(path, this.globals);
        return resolved;
    }

    // Track resolved values for the form (data only)
    updateData(localPath, value, forceUpdate = false) {
        const path = [...localPath];
        const name = path.pop();

        const reducer = (acc, key) => (key in acc ? acc[key] : (acc[key] = {})); // NOTE: Create nested objects if required to set a new path

        const resultParent = path.reduce(reducer, this.results);
        const resolvedParent = path.reduce(reducer, this.resolved);
        const hasUpdate = resolvedParent[name] !== value;

        const globalValue = this.getGlobalValue(localPath);

        // NOTE: Forms with nested forms will handle their own state updates
        if (this.isUndefined(value)) {
            // Continue to resolve and re-render...
            if (globalValue) {
                value = resolvedParent[name] = globalValue;
                const input = this.getInput(localPath);
                if (input) {
                    input.updateData(globalValue);
                    this.onOverride(name, globalValue, path);
                }
            } else resolvedParent[name] = undefined;

            resultParent[name] = undefined; // NOTE: Will be removed when stringified
        } else {
            resultParent[name] = value === globalValue ? undefined : value; // Retain association with global value
            resolvedParent[name] =
                isObject(value) && isObject(resolvedParent) ? merge(value, resolvedParent[name]) : value; // Merge with existing resolved values
        }

        if (hasUpdate || forceUpdate) this.onUpdate(localPath, value); // Ensure the value has actually changed
    }

    #addMessage = (name, message, type) => {
        if (Array.isArray(name)) name = name.join("-"); // Convert array to string
        const container = this.shadowRoot.querySelector(`#${name} .${type}`);
        const item = new InspectorListItem(message);
        container.appendChild(item);
    };

    #clearMessages = (localPath, type) => {
        if (Array.isArray(localPath)) localPath = localPath.join("-"); // Convert array to string
        const container = this.shadowRoot.querySelector(`#${localPath} .${type}`);

        if (container) {
            const nChildren = container.children.length;
            container.innerHTML = "";

            // Track errors and warnings
            if (type === "errors") this.#nErrors -= nChildren;
            if (type === "warnings") this.#nWarnings -= nChildren;
        }
    };

    status;
    checkStatus = () => {
        checkStatus.call(this, this.#nWarnings, this.#nErrors, [
            ...Object.entries(this.#nestedForms)
                .filter(([k, v]) => {
                    const accordion = this.#accordions[k];
                    return !accordion || !accordion.disabled;
                })
                .map(([_, v]) => v),
            ...Object.values(this.tables),
        ]);
    };

    throw = (message) => {
        this.onThrow(message, this.identifier);
        throw new Error(message);
    };

    validate = async (resolved = this.resolved) => {
        const result = await validator.validate(resolved, this.schema);

        // Check if any required inputs are missing
        const requiredButNotSpecified = await this.#validateRequirements(resolved); // get missing required paths
        const isValid = !requiredButNotSpecified.length;

        // Check if all inputs are valid
        const flaggedInputs = this.shadowRoot ? this.shadowRoot.querySelectorAll(".invalid") : [];

        const allErrors = Array.from(flaggedInputs)
            .map((inputElement) => {
                return Array.from(inputElement.nextElementSibling.children).map((li) => li.message);
            })
            .flat();

        const nMissingRequired = allErrors.reduce((acc, curr) => {
            return (acc += curr.includes(this.#isARequiredPropertyString) ? 1 : 0);
        }, 0);

        // Print out a detailed error message if any inputs are missing
        let message = isValid
            ? ""
            : requiredButNotSpecified.length === 1
              ? `<b>${header(requiredButNotSpecified[0])}</b> is not defined`
              : `${requiredButNotSpecified.length} required inputs are not specified properly`;
        if (requiredButNotSpecified.length !== nMissingRequired)
            console.warn("Disagreement about the correct error to throw...");

        // if (!isValid && allErrors.length && nMissingRequired === allErrors.length) message = `${nMissingRequired} required inputs are not defined.`;

        // Check if all inputs are valid
        if (flaggedInputs.length) {
            flaggedInputs[0].focus();
            if (!message) {
                if (flaggedInputs.length === 1)
                    message = `<b>${header(flaggedInputs[0].path.join("."))}</b> is not valid`;
                else message = `${flaggedInputs.length} invalid form values`;
            }
            message += `${
                this.base.length ? ` in the <b>${this.base.join(".")}</b> section` : ""
            }. Please check the highlighted fields.`;
        }

        if (message) this.throw(message);

        // Validate nested forms (skip disabled)
        for (let name in this.#nestedForms) {
            const accordion = this.#accordions[name];
            if (!accordion || !accordion.disabled)
                await this.#nestedForms[name].validate(resolved ? resolved[name] : undefined); // Validate nested forms too
        }

        try {
            for (let key in this.tables) await this.tables[key].validate(resolved ? resolved[key] : undefined); // Validate nested tables too
        } catch (error) {
            this.throw(error.message);
        }

        return true;
    };

    #get = (path, object = this.resolved, omitted = []) => {
        // path = path.slice(this.base.length); // Correct for base path
        if (!path) throw new Error("Path not specified");
        return path.reduce(
            (acc, curr) => (acc = acc?.[curr] ?? acc?.[omitted.find((str) => acc[str])]?.[curr]),
            object
        );
    };

    #checkRequiredAfterChange = async (localPath) => {
        const path = [...localPath];
        const name = path.pop();
        const isValid = await this.triggerValidation(name, path, false);
        if (!isValid) return true;
    };

    getSchema(path, schema = this.schema) {
        if (typeof path === "string") path = path.split(".");

        // NOTE: Still must correct for the base here
        if (this.base.length) {
            const base = this.base.slice(-1)[0];
            const indexOf = path.indexOf(base);
            if (indexOf !== -1) path = path.slice(indexOf + 1);
        }

        const resolved = this.#get(path, schema, ["properties"]);
        if (resolved["$ref"]) return this.getSchema(resolved["$ref"].split("/").slice(1)); // NOTE: This assumes reference to the root of the schema

        return resolved;
    }

    #renderInteractiveElement = (name, info, required, path = []) => {
        let isRequired = required[name];

        const localPath = [...path, name];
        const externalPath = [...this.base, ...localPath];

        const resolved = this.#get(path, this.resolved);
        const value = resolved[name];

        const isConditional = this.#getLink(externalPath) || typeof isRequired === "function"; // Check the two possible ways of determining if a field is conditional

        if (isConditional && !isRequired)
            isRequired = required[name] = async () => {
                const isRequiredAfterChange = await this.#checkRequiredAfterChange(localPath);
                if (isRequiredAfterChange) {
                    return true;
                } else {
                    const linkResults = await this.#applyToLinkedProperties(this.#checkRequiredAfterChange, localPath); // Check links
                    if (linkResults.includes(true)) return true;
                    // Handle updates when no longer required
                    else return false;
                }
            };

        const interactiveInput = new JSONSchemaInput({
            info,
            path: localPath,
            value,
            form: this,
            controls: this.controls[name],
            required: isRequired,
            validateEmptyValue: this.validateEmptyValues,
        });

        this.inputs.push(interactiveInput);

        return html`
            <div
                id=${localPath.join("-")}
                class="form-section ${isRequired || isConditional ? "required" : ""} ${isConditional
                    ? "conditional"
                    : ""}"
            >
                <label class="guided--form-label">${info.title ?? header(name)} </label>
                ${this.showPath
                    ? html` <small
                          >${externalPath
                              .slice(0, -1)
                              .map((str) => header(str ?? ""))
                              .join(".")}</small
                      >`
                    : ""}
                ${interactiveInput}
                <div class="errors"></div>
                <div class="warnings"></div>
                <div class="info"></div>
            </div>
        `;
    };

    load = () => {
        if (!this.#loaded) Object.values(this.tables).forEach((t) => t.load());
    };

    #loaded = false;
    nLoaded = 0;

    checkAllLoaded = () => {
        const expected = [...Object.keys(this.#nestedForms), ...Object.keys(this.tables)].length;
        if (this.nLoaded === expected) {
            this.#loaded = true;
            this.onLoaded();
        }
    };

    // willValidateWhenEmpty = (k) =>  (Array.isArray(this.validateEmptyValues) && this.validateEmptyValues.includes(k)) || this.validateEmptyValues;

    #validateRequirements = async (resolved = this.resolved, requirements = this.#requirements, parentPath) => {
        let invalid = [];

        for (let name in requirements) {
            let isRequired = requirements[name];

            if (this.#accordions[name]?.disabled) continue; // Skip disabled accordions

            // // NOTE: Uncomment to block checking requirements inside optional properties
            // if (!requirements[name][selfRequiredSymbol] && !resolved[name]) continue; // Do not continue checking requirements if absent and not required

            if (typeof isRequired === "function") isRequired = await isRequired.call(this.resolved);
            if (isRequired) {
                let path = parentPath ? `${parentPath}-${name}` : name;

                // if (typeof isRequired === "object" && !Array.isArray(isRequired))
                //     invalid.push(...(await this.#validateRequirements(resolved[name], isRequired, path)));
                // else
                if (this.isUndefined(resolved[name]) && this.validateEmptyValues) invalid.push(path);
            }
        }

        return invalid;
    };

    // Checks missing required properties and throws an error if any are found
    onInvalid = () => {};
    onLoaded = () => {};
    onUpdate = () => {};
    onOverride = () => {};

    // #deleteExtraneousResults = (results, schema) => {
    //     for (let name in results) {
    //         if (!schema.properties || !(name in schema.properties)) delete results[name];
    //         else if (results[name] && typeof results[name] === "object" && !Array.isArray(results[name]))
    //             this.#deleteExtraneousResults(results[name], schema.properties[name]);
    //     }
    // };

    #getRenderable = (schema = {}, required, path, recursive = false) => {
        const entries = Object.entries(schema.properties ?? {});

        const isArrayOfArrays = (arr) => !!arr.find((v) => Array.isArray(v));

        const flattenRecursedValues = (arr) => {
            const newArr = [];
            arr.forEach((item) => {
                if (isArrayOfArrays(item)) newArr.push(...item);
                else newArr.push(item);
            });

            return newArr;
        };

        const isRenderable = (key, value) => {
            if (recursive && value.properties) return this.#getRenderable(value, required[key], [...path, key], true);
            else return [key, value];
        };

        const res = entries
            .map(([key, value]) => {
                if (!value.properties && key === "definitions") return false; // Skip definitions
                if (
                    this.ignore.find((keyToIgnore) => {
                        if (typeof keyToIgnore === "string") return keyToIgnore === key;
                        else return keyToIgnore.test(key);
                    })
                )
                    return false;
                if (this.showLevelOverride >= path.length) return isRenderable(key, value);
                if (required[key]) return isRenderable(key, value);
                if (this.#getLink([...this.base, ...path, key])) return isRenderable(key, value);
                if (!this.onlyRequired) return isRenderable(key, value);
                return false;
            })
            .filter((result) => !!result);

        return flattenRecursedValues(res); // Flatten on the last pass
    };

    validateOnChange = () => {};
    onStatusChange = () => {};
    onThrow = () => {};
    createTable = () => {};

    #getLink = (args) => {
        if (typeof args === "string") args = args.split("-");
        const group = this.#getGroup(args);
        if (!group) return;
        return group.validate ? group : undefined;
    };

    #getGroup = (args) => {
        if (typeof args === "string") args = args.split("-");
        const group = this.groups.find((linked) => linked.properties.find((link) => link.join("-") === args.join("-")));
        return group;
    };

    #applyToLinkedProperties = (fn, externalPath) => {
        const links = this.#getLink(externalPath)?.properties;
        if (!links) return [];
        return Promise.all(
            links
                .map((link) => {
                    const linkEl = this.shadowRoot.getElementById(`${link.join("-")}`);
                    return fn(link, linkEl);
                })
                .flat()
        );
    };

    // Check if all links are not required anymore
    #isLinkResolved = async (pathArr) => {
        return (
            await this.#applyToLinkedProperties((link) => {
                const isRequired = this.#isRequired(link.slice((this.base ?? []).length));
                if (typeof isRequired === "function") return !isRequired.call(this.resolved);
                else return !isRequired;
            }, pathArr)
        ).reduce((a, b) => a && b, true);
    };

    #isRequired = (path) => {
        if (typeof path === "string") path = path.split("-");
        // path = path.slice(this.base.length); // Remove base path
        let res = path.reduce((obj, key) => obj && obj[key], this.#requirements);

        if (typeof res === "object") res = res[selfRequiredSymbol];
        return res;
    };

    #getGroupElement = (externalPath) => {
        const link = this.#getGroup(externalPath);
        if (!link) return;
        return this.shadowRoot.querySelector(`[data-name="${link.name}"]`);
    };

    isUndefined(value) {
        return value === undefined || value === "";
    }

    #isARequiredPropertyString = `is a required property`;

    // Assume this is going to return as a Promise—even if the change function isn't returning one
    triggerValidation = async (name, path = [], checkLinks = true) => {
        const parent = this.#get(path, this.resolved);

        const pathToValidate = [...(this.base ?? []), ...path];
        const localPath = [...path, name]; // Use basePath to augment the validation
        const externalPath = [...this.base, name];
        const schema = this.getSchema(localPath);

        const jsonSchemaErrors = await v
            .validate(parent[name], this.schema.properties[name])
            .errors.map((error) => ({ type: "error", message: `${header(name)} ${error.message}.` }));

        const valid =
            !this.validateEmptyValues && parent[name] === undefined
                ? true
                : await this.validateOnChange(name, parent, pathToValidate);

        const isRequired = this.#isRequired(localPath);

        let warnings = Array.isArray(valid)
            ? valid.filter((info) => info.type === "warning" && (!isRequired || !info.missing))
            : [];

        const errors = [
            ...(Array.isArray(valid)
                ? valid?.filter((info) => info.type === "error" || (isRequired && info.missing))
                : []), // Derived Errors
            ...jsonSchemaErrors, // JSON Schema Errors
        ];

        const info = Array.isArray(valid) ? valid?.filter((info) => info.type === "info") : [];

        const isUndefined = this.isUndefined(parent[name]);

        const hasLinks = this.#getLink(externalPath);
        if (hasLinks) {
            if (checkLinks) {
                if (!(await this.#isLinkResolved(externalPath))) {
                    errors.push(...warnings); // Move warnings to errors if the element is linked
                    warnings = [];

                    // Clear old errors and warnings on linked properties
                    this.#applyToLinkedProperties((path) => {
                        const internalPath = path.slice((this.base ?? []).length);
                        this.#clearMessages(internalPath, "errors");
                        this.#clearMessages(internalPath, "warnings");
                    }, externalPath);
                }
            }
        }

        if (!errors.length) {
            if (isUndefined) {
                // Throw at least a basic warning if a non-linked property is required and missing
                if (!hasLinks && isRequired) {
                    const schema = this.getSchema(localPath);

                    if (this.validateEmptyValues) {
                        errors.push({
                            message: `${schema.title ?? header(name)} ${this.#isARequiredPropertyString}.`,
                            type: "error",
                            missing: true,
                        });
                    } else {
                        warnings.push({
                            message: `${schema.title ?? header(name)} is a suggested property.`,
                            type: "warning",
                            missing: true,
                        });
                    }
                }
            }

            // Validate Regex Pattern automatically
            else if (schema.pattern) {
                const regex = new RegExp(schema.pattern);
                if (!regex.test(parent[name])) {
                    errors.push({
                        message: `${schema.title ?? header(name)} does not match the required pattern (${
                            schema.pattern
                        }).`,
                        type: "error",
                    });
                }
            }
        }

        // Clear old errors and warnings
        this.#clearMessages(localPath, "errors");
        this.#clearMessages(localPath, "warnings");
        this.#clearMessages(localPath, "info");

        const isFunction = typeof valid === "function";
        const isValid =
            valid === true ||
            valid == undefined ||
            isFunction ||
            (Array.isArray(valid) && !valid.find((error) => error.type === "error"));

        if (!isValid && errors.length === 0) errors.push({ type: "error", message: "Invalid value detected" });

        const resolvedErrors = errors
            .map((error) => {
                // Non-Strict Rule
                if (schema.strict === false && error.message.includes("is not one of enum values")) return;

                // Custom Error Transformations
                if (this.transformErrors) {
                    const res = this.transformErrors(error, externalPath, parent[name]);
                    if (res === false) return;
                }

                return error;
            })
            .filter((v) => !!v);

        // Track errors and warnings
        this.#nErrors += resolvedErrors.length;
        this.#nWarnings += warnings.length;
        this.checkStatus();

        // Show aggregated errors and warnings (if any)
        warnings.forEach((info) => this.#addMessage(localPath, info, "warnings"));
        info.forEach((info) => this.#addMessage(localPath, info, "info"));

        const input = this.getInput(localPath);

        const groupEl = this.#getGroupElement(externalPath);

        if (groupEl) {
            groupEl.classList[resolvedErrors.length ? "add" : "remove"]("error");
            groupEl.classList[warnings.length ? "add" : "remove"]("warning");
        }

        if (isValid && resolvedErrors.length === 0) {
            input.classList.remove("invalid");

            await this.#applyToLinkedProperties((path, element) => {
                element.classList.remove("required", "conditional"); // Links manage their own error and validity states, but only one needs to be valid
            }, localPath);

            if (isFunction) valid(); // Run if returned value is a function

            return true;
        } else {
            // Add new invalid classes and errors
            input.classList.add("invalid");

            // Only add the conditional class for linked elements
            await this.#applyToLinkedProperties(
                (name, element) => element.classList.add("required", "conditional"),
                [...path, name]
            );

            resolvedErrors.forEach((info) => this.#addMessage(localPath, info, "errors"));
            // element.title = errors.map((info) => info.message).join("\n"); // Set all errors to show on hover

            return false;
        }
    };

    #accordions = {};

    #render = (schema, results, required = {}, path = []) => {
        let isLink = Symbol("isLink");
        // Filter non-required properties (if specified) and render the sub-schema
        const renderable = this.#getRenderable(schema, required, path);

        // // Filter non-required properties (if specified) and render the sub-schema
        // const renderable = path.length ? this.#getRenderable(schema, required) : Object.entries(schema.properties ?? {})

        if (renderable.length === 0) return html`<div id="empty">${this.emptyMessage}</div>`;

        let renderableWithLinks = renderable.reduce((acc, [name, info]) => {
            const externalPath = [...this.base, ...path, name];
            const link = this.#getGroup(externalPath); // Use the base path to find a link
            if (link) {
                if (!acc.find(([_, info]) => info === link)) {
                    const entry = [link.name, link];
                    entry[isLink] = true;
                    acc.push(entry);
                }
            } else acc.push([name, info]);

            return acc;
        }, []);

        const sorted = renderableWithLinks

            // Sort alphabetically
            .sort(([name], [name2]) => {
                const header1 = header(name);
                const header2 = header(name2);
                if (header1.toLowerCase() < header2.toLowerCase()) {
                    return -1;
                }
                if (header1.toLowerCase() > header2.toLowerCase()) {
                    return 1;
                }
                return 0;
            })

            // Sort required properties to the top
            .sort((e1, e2) => {
                const [name] = e1;
                const [name2] = e2;

                if (required[name] && !required[name2]) return -1; // first required
                if (!required[name] && required[name2]) return 1; // second required

                if (e1[isLink] && !e2[isLink]) return -1; // first link
                if (!e1[isLink] && e2[isLink]) return 1; // second link

                return 0; // Both required
            })

            // Prioritise properties without other properties (e.g. name over NWBFile)
            .sort((e1, e2) => {
                const [_, info] = e1;
                const [__, info2] = e2;

                if (e1[isLink] || e2[isLink]) return 0;

                if (info2.properties && info.properties) return 0;
                else if (info2.properties) return -1;
                else if (info.properties) return 1;
                else return 0;
            });

        if (schema.order) {
            sorted.sort(([name], [name2]) => {
                const index = schema.order.indexOf(name);
                const index2 = schema.order.indexOf(name2);
                if (index === -1) return 1;
                if (index2 === -1) return -1;
                return index - index2;
            });
        }

        const finalSort = this.sort ? sorted.sort(this.sort) : sorted;

        let rendered = finalSort.map((entry) => {
            const [name, info] = entry;

            // Render linked properties
            if (entry[isLink]) {
                const linkedProperties = info.properties.map((path) => {
                    const pathCopy = [...path].slice((this.base ?? []).length);
                    const name = pathCopy.pop();
                    return this.#renderInteractiveElement(name, schema.properties[name], required, pathCopy);
                });
                return html`
                    <div class="link" data-name="${info.name}">
                        <div>${linkedProperties}</div>
                    </div>
                `;
            }

            // Directly render the interactive property element
            if (!info.properties) return this.#renderInteractiveElement(name, info, required, path);

            const hasMany = renderable.length > 1; // How many siblings?

            const localPath = [...path, name];

            const enableToggle = document.createElement("input");
            const enableToggleContainer = document.createElement("div");
            Object.assign(enableToggleContainer.style, {
                position: "relative",
            });
            enableToggleContainer.append(enableToggle);

            // Check properties that will be rendered before creating the accordion
            const base = [...this.base, ...localPath];

            const explicitlyRequired = schema.required?.includes(name) ?? false;

            Object.assign(enableToggle, {
                type: "checkbox",
                checked: true,
                style: "margin-right: 10px; pointer-events:all;",
            });

            const headerName = header(info.title ?? name);

            const renderableInside = this.#getRenderable(info, required[name], localPath, true);

            const __disabled = this.results.__disabled ?? (this.results.__disabled = {});
            const __interacted = __disabled.__interacted ?? (__disabled.__interacted = {});

            const hasInteraction = __interacted[name]; // NOTE: This locks the specific value to what the user has chosen...

            const { __disabled: __tempDisabledGlobal = {} } = this.getGlobalValue(localPath.slice(0, -1));

            const __disabledGlobal = structuredClone(__tempDisabledGlobal); // NOTE: Cloning ensures no property transfer

            let isGlobalEffect = !hasInteraction || (!hasInteraction && __disabledGlobal.__interacted?.[name]); // Indicate whether global effect is used

            const __disabledResolved = isGlobalEffect ? __disabledGlobal : __disabled;

            const isDisabled = !!__disabledResolved[name];

            enableToggle.checked = !isDisabled;

            const nestedResults = __disabled[name] ?? results[name] ?? this.results[name]; // One or the other will exist—depending on global or local disabling

            if (renderableInside.length) {
                this.#nestedForms[name] = new JSONSchemaForm({
                    identifier: this.identifier,
                    schema: info,
                    results: { ...nestedResults },
                    globals: this.globals?.[name],

                    onUpdate: (internalPath, value, forceUpdate) => {
                        const path = [...localPath, ...internalPath];
                        this.updateData(path, value, forceUpdate);
                    },

                    transformErrors: this.transformErrors,

                    required: required[name], // Scoped to the sub-schema
                    ignore: this.ignore,
                    showPath: this.showPath,
                    dialogOptions: this.dialogOptions,
                    dialogType: this.dialogType,
                    onlyRequired: this.onlyRequired,
                    showLevelOverride: this.showLevelOverride,
                    deferLoading: this.deferLoading,
                    groups: this.groups,
                    validateOnChange: (...args) => this.validateOnChange(...args),
                    onThrow: (...args) => this.onThrow(...args),
                    validateEmptyValues: this.validateEmptyValues,
                    onStatusChange: (status) => {
                        accordion.setStatus(status);
                        this.checkStatus();
                    }, // Forward status changes to the parent form
                    onInvalid: (...args) => this.onInvalid(...args),
                    onLoaded: () => {
                        this.nLoaded++;
                        this.checkAllLoaded();
                    },
                    createTable: (...args) => this.createTable(...args),
                    onOverride: (...args) => this.onOverride(...args),
                    base,
                });
            }

            const oldStates = this.#accordions[headerName];

            const accordion = (this.#accordions[headerName] = new Accordion({
                name: headerName,
                toggleable: hasMany,
                subtitle: html`<div style="display:flex; align-items: center;">
                    ${explicitlyRequired ? "" : enableToggleContainer}${renderableInside.length
                        ? `${renderableInside.length} fields`
                        : ""}
                </div>`,
                content: this.#nestedForms[name],

                // States
                open: oldStates?.open ?? !hasMany,
                disabled: isDisabled,
                status: oldStates?.status ?? "valid", // Always show a status
            }));

            accordion.id = name; // assign name to accordion id

            // Set enable / disable behavior
            const addDisabled = (name, parentObject) => {
                if (!parentObject.__disabled) parentObject.__disabled = {};

                // Do not overwrite cache of disabled values (with globals, for instance)
                if (parentObject.__disabled[name]) {
                    if (isGlobalEffect) return;
                }

                parentObject.__disabled[name] = parentObject[name] ?? (parentObject[name] = {}); // Track disabled values (or at least something)
            };

            const disable = () => {
                accordion.disabled = true;
                addDisabled(name, this.resolved);
                addDisabled(name, this.results);
                this.resolved[name] = this.results[name] = undefined; // Remove entry from results

                this.checkStatus();
            };

            const enable = () => {
                accordion.disabled = false;

                const { __disabled = {} } = this.results;
                const { __disabled: resolvedDisabled = {} } = this.resolved;

                if (__disabled[name]) this.updateData(localPath, __disabled[name]); // Propagate restored disabled values
                __disabled[name] = undefined; // Clear disabled value
                resolvedDisabled[name] = undefined; // Clear disabled value

                this.checkStatus();
            };

            enableToggle.addEventListener("click", (clickEvent) => {
                clickEvent.stopPropagation();
                const { checked } = clickEvent.target;

                // Reset parameters on interaction
                isGlobalEffect = false;
                Object.assign(enableToggle.style, {
                    accentColor: "unset",
                });

                const { __disabled = {} } = this.results;
                const { __disabled: resolvedDisabled = {} } = this.resolved;

                if (!__disabled.__interacted) __disabled.__interacted = {};
                if (!resolvedDisabled.__interacted) resolvedDisabled.__interacted = {};

                __disabled.__interacted[name] = resolvedDisabled.__interacted[name] = true; // Track that the user has interacted with the form

                checked ? enable() : disable();

                this.onUpdate(localPath, this.results[name]);
            });

            if (isGlobalEffect) {
                isDisabled ? disable() : enable();
                Object.assign(enableToggle.style, {
                    accentColor: "gray",
                });
            }

            return accordion;
        });

        return rendered;
    };

    #registerRequirements = (schema, requirements = {}, acc = this.#requirements) => {
        if (!schema) return;
        if (schema.required) schema.required.forEach((key) => (acc[key] = true));
        for (let key in requirements) acc[key] = requirements[key]; // Overwrite standard requirements with custom requirements
        if (schema.properties) {
            Object.entries(schema.properties).forEach(([key, value]) => {
                if (value.properties) {
                    let nextAccumulator = acc[key];
                    const isNotObject = typeof nextAccumulator !== "object";
                    if (!nextAccumulator || isNotObject)
                        nextAccumulator = acc[key] = { [selfRequiredSymbol]: !!nextAccumulator };
                    this.#registerRequirements(value, requirements[key], nextAccumulator);
                }
            });
        }
    };

    updated() {
        this.checkAllLoaded(); // Throw if no tables
        this.#toggleRendered(); // Toggle internal render state
    }

    #resetLoadState() {
        this.#loaded = false;
        this.nLoaded = 0;
        this.inputs = [];
    }

    // Check if everything is internally rendered
    get rendered() {
        const isRendered = resolve(this.#rendered, () =>
            Promise.all([...Object.values(this.#nestedForms), ...Object.values(this.tables)].map(({ rendered }) => rendered))
        );
        return isRendered;
    }

    render() {
        this.#updateRendered(); // Create a new promise to check on the rendered state

        this.#resetLoadState();

        const schema = this.schema ?? {};

        this.resolved = structuredClone(this.results); // Track resolved values as a copy of the user-specified results

        // Register default properties
        resolveProperties(schema.properties, this.resolved, this.globals);

        // // Delete extraneous results
        // this.#deleteExtraneousResults(this.results, this.schema);

        this.#registerRequirements(this.schema, this.required);

        return html`
            ${schema.description
                ? html`<h4>Description</h4>
                      <p class="guided--text-input-instructions">${unsafeHTML(schema.description)}</p>`
                : ""}
            ${this.#render(schema, this.resolved, this.#requirements)}
        `;
    }
}

customElements.get("nwb-jsonschema-form") || customElements.define("nwb-jsonschema-form", JSONSchemaForm);
