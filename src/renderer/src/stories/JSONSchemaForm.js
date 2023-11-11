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

const isObject = (o) => {
    return o && typeof o === "object" && !Array.isArray(o);
};

export const getIgnore = (o, path) => {
    if (typeof path === "string") path = path.split(".");
    return path.reduce((acc, key) => {
        const info = acc[key] ?? {};

        return {
            ...info,
            "*": { ...(acc["*"] ?? {}), ...(info["*"] ?? {}) }, // Accumulate ignore values
        };
    }, o);
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
      margin: 1.45rem 0 0.45rem 0;
      color: black;
      font-weight: 600;
    }

    .form-section:first-child .guided--form-label {
      margin-top: 0;
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

    .link.required::after {
      box-sizing: border-box;
      display: block;
      width: 10px;
      height: 10px;
      background: #ff3d64;
      border-radius: 50%;
      position: absolute;
      top: 0;
      right: 0;
      content: '';
      margin: 15px;
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
    content: " *";
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
`;

document.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
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

        this.ignore = props.ignore ?? {};
        this.required = props.required ?? {};
        this.dialogOptions = props.dialogOptions;
        this.dialogType = props.dialogType;
        this.deferLoading = props.deferLoading ?? false;

        this.emptyMessage = props.emptyMessage ?? "No properties to render";

        this.onlyRequired = props.onlyRequired ?? false;
        this.showLevelOverride = props.showLevelOverride ?? false;

        this.conditionalRequirements = props.conditionalRequirements ?? []; // NOTE: We assume properties only belong to one conditional requirement group

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

        if (!container) return this.getForm(path[0]).getInput(path.slice(1));
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

    validate = async (resolved) => {
        // Check if any required inputs are missing
        const requiredButNotSpecified = await this.#validateRequirements(resolved); // get missing required paths
        const isValid = !requiredButNotSpecified.length;

        // Check if all inputs are valid
        const flaggedInputs = this.shadowRoot ? this.shadowRoot.querySelectorAll(".invalid") : [];

        const allErrors = Array.from(flaggedInputs)
            .map((el) => {
                return Array.from(el.nextElementSibling.children).map((li) => li.message);
            })
            .flat();

        const nMissingRequired = allErrors.reduce((acc, curr) => {
            return (acc += curr.includes(this.#isARequiredPropertyString) ? 1 : 0);
        }, 0);

        // Print out a detailed error message if any inputs are missing
        let message = isValid
            ? ""
            : requiredButNotSpecified.length === 1
            ? `<b>${requiredButNotSpecified[0]}</b> is not defined`
            : `${requiredButNotSpecified.length} required inputs are not specified properly`;
        if (requiredButNotSpecified.length !== nMissingRequired)
            console.warn("Disagreement about the correct error to throw...");

        // if (!isValid && allErrors.length && nMissingRequired === allErrors.length) message = `${nMissingRequired} required inputs are not defined.`;

        // Check if all inputs are valid
        if (flaggedInputs.length) {
            flaggedInputs[0].focus();
            if (!message) {
                console.log(flaggedInputs);
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
        } catch (e) {
            this.throw(e.message);
        }

        // NOTE: Ensure user is aware of any warnings before moving on
        // const activeWarnings = Array.from(this.shadowRoot.querySelectorAll('.warnings')).map(input => Array.from(input.children)).filter(input => input.length)

        // if (this.#nWarnings) {
        //   const warningText = activeWarnings.reduce((acc, children) => [...acc, ...children.map(el => el.innerText)], [])
        //   const result = await Swal.fire({
        //     title: `Are you sure you would like to submit your metadata with ${this.#nWarnings} warnings?`,
        //     html: `<small><ol style="text-align: left;">${warningText.map(v => `<li>${v}</li>`).join('')}</ol></small>`,
        //     icon: "warning",
        //     heightAuto: false,
        //     showCancelButton: true,
        //     confirmButtonColor: "#3085d6",
        //     cancelButtonColor: "#d33",
        //     confirmButtonText: "Complete Metadata Entry",
        //     cancelButtonText: "Cancel",
        //     focusCancel: true,
        //   });

        //   if (!result.isConfirmed) throw new Error('User cancelled metadata submission')
        // }

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
            required: isRequired,
            validateEmptyValue: this.validateEmptyValues,
        });

        // this.validateEmptyValues ? undefined : (el) => (el.value ?? el.checked) !== ""

        // const possibleInputs = Array.from(this.shadowRoot.querySelectorAll("jsonschema-input")).map(input => input.children)
        // const inputs = possibleInputs.filter(el => el instanceof HTMLElement);
        // const fileInputs = Array.from(this.shadowRoot.querySelectorAll("filesystem-selector") ?? []);
        // const allInputs = [...inputs, ...fileInputs];
        // const filtered = filter ? allInputs.filter(filter) : allInputs;
        // filtered.forEach((input) => input.dispatchEvent(new Event("change")));

        // console.log(interactiveInput)

        return html`
            <div
                id=${localPath.join("-")}
                class="form-section ${isRequired || isConditional ? "required" : ""} ${isConditional
                    ? "conditional"
                    : ""}"
            >
                <label class="guided--form-label">${info.title ?? header(name)}</label>
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

    #getRenderable = (schema = {}, required, ignore = {}, path, recursive = false) => {
        const entries = Object.entries(schema.properties ?? {});

        const isArrayOfArrays = (arr) => !!arr.find((v) => Array.isArray(v));

        const flattenRecursedValues = (arr) => {
            const newArr = [];
            arr.forEach((o) => {
                if (isArrayOfArrays(o)) newArr.push(...o);
                else newArr.push(o);
            });

            return newArr;
        };

        const isRenderable = (key, value) => {
            if (recursive && value.properties)
                return this.#getRenderable(value, required[key], getIgnore(ignore, key), [...path, key], true);
            else return [key, value];
        };

        const res = entries
            .map(([key, value]) => {
                if (!value.properties && key === "definitions") return false; // Skip definitions
                if (this.ignore["*"]?.[key]) return false; // Skip all properties with this name
                else if (this.ignore[key] === true) return false; // Skip this property
                if (this.showLevelOverride >= path.length) return isRenderable(key, value);
                if (required[key]) return isRenderable(key, value);
                if (this.#getLink([...this.base, ...path, key])) return isRenderable(key, value);
                if (!this.onlyRequired) return isRenderable(key, value);
                return false;
            })
            .filter((o) => !!o);

        return flattenRecursedValues(res); // Flatten on the last pass
    };

    validateOnChange = () => {};
    onStatusChange = () => {};
    onThrow = () => {};
    createTable = () => {};

    #getLink = (args) => {
        if (typeof args === "string") args = args.split("-");
        return this.conditionalRequirements.find((linked) =>
            linked.properties.find((link) => link.join("-") === args.join("-"))
        );
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

    #getLinkElement = (externalPath) => {
        const link = this.#getLink(externalPath);
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

        const valid =
            !this.validateEmptyValues && parent[name] === undefined
                ? true
                : await this.validateOnChange(name, parent, pathToValidate);

        const localPath = [...path, name]; // Use basePath to augment the validation
        const externalPath = [...this.base, name];

        const isRequired = this.#isRequired(localPath);

        let warnings = Array.isArray(valid)
            ? valid.filter((info) => info.type === "warning" && (!isRequired || !info.missing))
            : [];
        const errors = Array.isArray(valid)
            ? valid?.filter((info) => info.type === "error" || (isRequired && info.missing))
            : [];

        const info = Array.isArray(valid) ? valid?.filter((info) => info.type === "info") : [];

        const isUndefined = this.isUndefined(parent[name]);
        const schema = this.getSchema(localPath);

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
            (Array.isArray(valid) && !valid.find((o) => o.type === "error"));

        if (!isValid && errors.length === 0) errors.push({ type: "error", message: "Invalid value detected" });

        // Track errors and warnings
        this.#nErrors += errors.length;
        this.#nWarnings += warnings.length;
        this.checkStatus();

        // Show aggregated errors and warnings (if any)
        warnings.forEach((info) => this.#addMessage(localPath, info, "warnings"));
        info.forEach((info) => this.#addMessage(localPath, info, "info"));

        const input = this.getInput(localPath);

        if (isValid && errors.length === 0) {
            input.classList.remove("invalid");

            const linkEl = this.#getLinkElement(externalPath);
            if (linkEl) linkEl.classList.remove("required", "conditional");

            await this.#applyToLinkedProperties((path, element) => {
                element.classList.remove("required", "conditional"); // Links manage their own error and validity states, but only one needs to be valid
            }, localPath);

            if (isFunction) valid(); // Run if returned value is a function

            return true;
        } else {
            // Add new invalid classes and errors
            input.classList.add("invalid");

            const linkEl = this.#getLinkElement(externalPath);
            if (linkEl) linkEl.classList.add("required", "conditional");

            // Only add the conditional class for linked elements
            await this.#applyToLinkedProperties(
                (name, element) => element.classList.add("required", "conditional"),
                [...path, name]
            );

            errors.forEach((info) => this.#addMessage(localPath, info, "errors"));
            // element.title = errors.map((info) => info.message).join("\n"); // Set all errors to show on hover

            return false;
        }
    };

    #accordions = {};

    #render = (schema, results, required = {}, ignore = {}, path = []) => {
        let isLink = Symbol("isLink");
        // Filter non-required properties (if specified) and render the sub-schema
        const renderable = this.#getRenderable(schema, required, ignore, path);

        // // Filter non-required properties (if specified) and render the sub-schema
        // const renderable = path.length ? this.#getRenderable(schema, required) : Object.entries(schema.properties ?? {})

        if (renderable.length === 0) return html`<div id="empty">${this.emptyMessage}</div>`;

        let renderableWithLinks = renderable.reduce((acc, [name, info]) => {
            const externalPath = [...this.base, ...path, name];
            const link = this.#getLink(externalPath); // Use the base path to find a link

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
                if (name.toLowerCase() < name2.toLowerCase()) {
                    return -1;
                }
                if (name.toLowerCase() > name2.toLowerCase()) {
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

                if (info2.properties) return -1;
                else if (info.properties) return 1;
                else return 0;
            });

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

            const headerName = header(name);

            const renderableInside = this.#getRenderable(info, required[name], ignore, localPath, true);

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

                    required: required[name], // Scoped to the sub-schema
                    ignore: this.ignore,
                    dialogOptions: this.dialogOptions,
                    dialogType: this.dialogType,
                    onlyRequired: this.onlyRequired,
                    showLevelOverride: this.showLevelOverride,
                    deferLoading: this.deferLoading,
                    conditionalRequirements: this.conditionalRequirements,
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
            const addDisabled = (name, o) => {
                if (!o.__disabled) o.__disabled = {};

                // Do not overwrite cache of disabled values (with globals, for instance)
                if (o.__disabled[name]) {
                    if (isGlobalEffect) return;
                }

                o.__disabled[name] = o[name] ?? (o[name] = {}); // Track disabled values (or at least something)
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

            enableToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const { checked } = e.target;

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
    }

    // Check if everything is internally rendered
    get rendered() {
        const isRendered = resolve(this.#rendered, () =>
            Promise.all([...Object.values(this.#nestedForms), ...Object.values(this.tables)].map((o) => o.rendered))
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
            ${this.#render(schema, this.resolved, this.#requirements, this.ignore)}
        `;
    }
}

customElements.get("nwb-jsonschema-form") || customElements.define("nwb-jsonschema-form", JSONSchemaForm);
