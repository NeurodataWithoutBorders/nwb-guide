import { LitElement, css, html } from "lit";
import { Accordion } from "./Accordion";

import { checkStatus } from "../validation";
import { capitalize, header } from "./forms/utils";
import { resolve } from "../promises";
import { merge } from "./pages/utils";
import { resolveProperties } from "./pages/guided-mode/data/utils";

import { JSONSchemaInput } from "./JSONSchemaInput";
import { InspectorListItem } from "./preview/inspector/InspectorList";

const componentCSS = `

    * {
      box-sizing: border-box;
    }

    :host {
      display: inline-block;
      width:100%;
    }

    p {
      margin: 0 0 1em;
      line-height: 1.4285em;
    }

    .invalid {
      background: rgb(255, 229, 228) !important;
    }

    .errors {
      color: #9d0b0b;
    }

    .errors > * {
      padding: 25px;
      background: #f8d7da;
      border: 1px solid #f5c2c7;
      border-radius: 4px;
      margin: 0 0 1em;
    }

    .warnings {
      color: #856404;
    }

    .warnings > * {
      padding: 25px;
      background: #fff3cd;
      border: 1px solid #ffeeba;
      border-radius: 4px;
      margin: 0 0 1em;
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

  .required.conditional label:after {
    color: transparent;
  }


  .guided--text-input-instructions {
    font-size: 13px;
    width: 100%;
    padding-top: 4px;
    color: dimgray !important;
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
            mode: { type: String, reflect: true },
            schema: { type: Object, reflect: false },
            results: { type: Object, reflect: false },
            required: { type: Object, reflect: false },
            dialogType: { type: String, reflect: false },
            dialogOptions: { type: Object, reflect: false },
        };
    }

    #base = [];
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
        this.mode = props.mode ?? "default";
        this.schema = props.schema ?? {};
        this.results = props.results ?? {};
        this.globals = props.globals ?? {};

        this.ignore = props.ignore ?? [];
        this.required = props.required ?? {};
        this.dialogOptions = props.dialogOptions ?? {};
        this.dialogType = props.dialogType ?? "showOpenDialog";
        this.deferLoading = props.deferLoading ?? false;

        this.onlyRequired = props.onlyRequired ?? false;
        this.showLevelOverride = props.showLevelOverride ?? false;

        this.conditionalRequirements = props.conditionalRequirements ?? []; // NOTE: We assume properties only belong to one conditional requirement group

        this.validateEmptyValues = props.validateEmptyValues ?? true;

        if (props.onInvalid) this.onInvalid = props.onInvalid;
        if (props.validateOnChange) this.validateOnChange = props.validateOnChange;
        if (props.onThrow) this.onThrow = props.onThrow;
        if (props.onLoaded) this.onLoaded = props.onLoaded;
        if (props.onUpdate) this.onUpdate = props.onUpdate;
        if (props.renderTable) this.renderTable = props.renderTable;

        if (props.onStatusChange) this.onStatusChange = props.onStatusChange;
        if (props.onUpdate) this.onUpdate = props.onUpdate;

        if (props.base) this.#base = props.base;
    }

    getTable = (path) => {
        if (typeof path === "string") path = path.split(".");
        if (path.length === 1) return this.tables[path[0]]; // return table if accessible

        const copy = [...path];
        const tableName = copy.pop();

        if (this.mode === "accordion") return this.getForm(copy).getTable(tableName);
        else return this.shadowRoot.getElementById(path.join("-")).children[1].shadowRoot.children[0]; // Get table from UI container, then JSONSchemaInput
    };

    getForm = (path) => {
        if (typeof path === "string") path = path.split(".");
        const form = this.#nestedForms[path[0]];
        if (!path.length || !form) return this; // No nested form with this name. Returning self.

        return form.getForm(path.slice(1));
    };

    getInput = (path) => {
        if (typeof path === "string") path = path.split(".");
        const container = this.shadowRoot.querySelector(`#${path.join("-")}`);
        if (!container) return;
        return container.querySelector("jsonschema-input");
    };

    #requirements = {};

    attributeChangedCallback(changedProperties, oldValue, newValue) {
        super.attributeChangedCallback(changedProperties, oldValue, newValue);
        if (changedProperties === "options") this.requestUpdate();
    }

    // Track resolved values for the form (data only)
    updateData(fullPath, value) {
        const path = [...fullPath];
        const name = path.pop();

        const reducer = (acc, key) => (key in acc ? acc[key] : (acc[key] = {})); // NOTE: Create nested objects if required to set a new path

        const resultParent = path.reduce(reducer, this.results);
        const resolvedParent = path.reduce(reducer, this.resolved);

        if (resolvedParent[name] !== value) this.onUpdate(fullPath, value); // Ensure the value has actually changed

        if (!value) {
            delete resultParent[name];
            delete resolvedParent[name];
        } else {
            resultParent[name] = value;
            resolvedParent[name] = value;
        }
    }

    #addMessage = (name, message, type) => {
        if (Array.isArray(name)) name = name.join("-"); // Convert array to string
        const container = this.shadowRoot.querySelector(`#${name} .${type}`);
        const item = new InspectorListItem({ message });
        container.appendChild(item);
    };

    #clearMessages = (fullPath, type) => {
        if (Array.isArray(fullPath)) fullPath = fullPath.join("-"); // Convert array to string
        const container = this.shadowRoot.querySelector(`#${fullPath} .${type}`);

        if (container) {
            const nChildren = container.children.length;
            container.innerHTML = "";

            // Track errors and warnings
            if (type === "errors") this.#nErrors -= nChildren;
            if (type === "warnings") this.#nWarnings -= nChildren;
        }
    };

    status;
    checkStatus = () =>
        checkStatus.call(this, this.#nWarnings, this.#nErrors, [
            ...Object.values(this.#nestedForms),
            ...Object.values(this.tables),
        ]);

    throw = (message) => {
        this.onThrow(message, this.identifier);
        throw new Error(message);
    };

    validate = async () => {
        // Check if any required inputs are missing
        const invalidInputs = await this.#validateRequirements(); // get missing required paths
        const isValid = !invalidInputs.length;

        // Print out a detailed error message if any inputs are missing
        let message = isValid ? "" : `${invalidInputs.length} required inputs are not specified properly.`;

        // Check if all inputs are valid
        const flaggedInputs = this.shadowRoot ? this.shadowRoot.querySelectorAll(".invalid") : [];

        if (flaggedInputs.length) {
            flaggedInputs[0].focus();
            if (!message) message = `${flaggedInputs.length} invalid form values.`;
            message += ` Please check the highlighted fields.`;
        }

        if (message) this.throw(message);

        for (let key in this.#nestedForms) await this.#nestedForms[key].validate(); // Validate nested forms too
        try {
            for (let key in this.tables) await this.tables[key].validate(); // Validate nested tables too
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

    #get = (path, object = this.resolved) => {
        // path = path.slice(this.#base.length); // Correct for base path
        return path.reduce((acc, curr) => (acc = acc[curr]), object);
    };

    #checkRequiredAfterChange = async (fullPath) => {
        const path = [...fullPath];
        const name = path.pop();
        const element = this.shadowRoot
            .querySelector(`#${fullPath.join("-")}`)
            .querySelector("jsonschema-input")
            .shadowRoot.querySelector(".guided--input");
        const isValid = await this.triggerValidation(name, element, path, false);
        if (!isValid) return true;
    };

    getSchema(path, schema = this.schema) {
        if (typeof path === "string") path = path.split(".");

        // NOTE: Still must correct for the base here
        if (this.#base.length) {
            const base = this.#base.slice(-1)[0];
            const indexOf = path.indexOf(base);
            if (indexOf !== -1) path = path.slice(indexOf + 1);
        }

        const resolved = path.reduce((acc, curr) => (acc = acc[curr]), schema);
        if (resolved["$ref"]) return this.getSchema(resolved["$ref"].split("/").slice(1)); // NOTE: This assumes reference to the root of the schema

        return resolved;
    }

    #renderInteractiveElement = (name, info, required, path = []) => {
        let isRequired = required[name];

        const fullPath = [...path, name];
        const externalPath = [...this.#base, ...fullPath];

        const resolved = this.#get(path, this.resolved);
        const value = resolved[name];

        const isConditional = this.#getLink(externalPath) || typeof isRequired === "function"; // Check the two possible ways of determining if a field is conditional

        if (isConditional && !isRequired)
            isRequired = required[name] = async () => {
                const isRequiredAfterChange = await this.#checkRequiredAfterChange(fullPath);
                if (isRequiredAfterChange) {
                    return true;
                } else {
                    const linkResults = await this.#applyToLinkedProperties(this.#checkRequiredAfterChange, fullPath); // Check links
                    if (linkResults.includes(true)) return true;
                    // Handle updates when no longer required
                    else return false;
                }
            };

        const interactiveInput = new JSONSchemaInput({
            info,
            parent,
            path: fullPath,
            value,
            form: this,
            required: isRequired,
        });

        interactiveInput.updated = () => {
            let input = interactiveInput.shadowRoot.querySelector(".schema-input");
            if (!input) input = interactiveInput.shadowRoot.querySelector("filesystem-selector");

            if (input) {
                if (this.validateEmptyValues || (input.value ?? input.checked) !== "")
                    input.dispatchEvent(new Event("change"));
            }
        };

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
                id=${fullPath.join("-")}
                class="form-section ${isRequired || isConditional ? "required" : ""} ${isConditional
                    ? "conditional"
                    : ""}"
            >
                <label class="guided--form-label">${header(name)}</label>
                ${interactiveInput}
                ${info.description
                    ? html`<p class="guided--text-input-instructions">
                          ${capitalize(info.description)}${info.description.slice(-1)[0] === "." ? "" : "."}
                      </p>`
                    : ""}
                <div class="errors"></div>
                <div class="warnings"></div>
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

    #validateRequirements = async (resolved = this.resolved, requirements = this.#requirements, parentPath) => {
        let invalid = [];

        for (let name in requirements) {
            let isRequired = requirements[name];
            if (typeof isRequired === "function") isRequired = await isRequired.call(this.resolved);
            if (isRequired) {
                let path = parentPath ? `${parentPath}-${name}` : name;

                if (typeof isRequired === "object" && !Array.isArray(isRequired))
                    invalid.push(...(await this.#validateRequirements(resolved[name], isRequired, path)));
                else if (!resolved[name]) invalid.push(path);
            }
        }

        return invalid;
    };

    // Checks missing required properties and throws an error if any are found
    onInvalid = () => {};
    onLoaded = () => {};
    onUpdate = () => {};

    #deleteExtraneousResults = (results, schema) => {
        for (let name in results) {
            if (!schema.properties || !(name in schema.properties)) delete results[name];
            else if (results[name] && typeof results[name] === "object" && !Array.isArray(results[name]))
                this.#deleteExtraneousResults(results[name], schema.properties[name]);
        }
    };

    #getRenderable = (schema = {}, required, path) => {
        const entries = Object.entries(schema.properties ?? {});

        return entries.filter(([key, value]) => {
            if (!value.properties && key === "definitions") return false; // Skip definitions
            if (this.ignore.includes(key)) return false;
            if (this.showLevelOverride >= path.length) return true;
            if (required[key]) return true;
            if (this.#getLink([...this.#base, ...path, key])) return true;
            if (!this.onlyRequired) return true;
            return false;
        });
    };

    validateOnChange = () => {};
    onStatusChange = () => {};
    onThrow = () => {};
    renderTable = () => {};
    onUpdate = () => {};

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
                const isRequired = this.#isRequired(link.slice((this.#base ?? []).length));
                if (typeof isRequired === "function") return !isRequired.call(this.resolved);
                else return !isRequired;
            }, pathArr)
        ).reduce((a, b) => a && b, true);
    };

    #isRequired = (path) => {
        if (typeof path === "string") path = path.split("-");
        // path = path.slice(this.#base.length); // Remove base path
        return path.reduce((obj, key) => obj && obj[key], this.#requirements);
    };

    #getLinkElement = (externalPath) => {
        const link = this.#getLink(externalPath);
        if (!link) return;
        return this.shadowRoot.querySelector(`[data-name="${link.name}"]`);
    };

    // Assume this is going to return as a Promise—even if the change function isn't returning one
    triggerValidation = async (name, element, path = [], checkLinks = true) => {
        const parent = this.#get(path, this.resolved);

        const valid =
            !this.validateEmptyValues && !(name in parent)
                ? true
                : await this.validateOnChange(name, parent, [...(this.#base ?? []), ...path]);

        const fullPath = [...path, name]; // Use basePath to augment the validation
        const externalPath = [...this.#base, name];

        const isRequired = this.#isRequired(fullPath);
        let warnings = Array.isArray(valid)
            ? valid.filter((info) => info.type === "warning" && (!isRequired || !info.missing))
            : [];
        const errors = Array.isArray(valid)
            ? valid?.filter((info) => info.type === "error" || (isRequired && info.missing))
            : [];

        const hasLinks = this.#getLink(externalPath);
        if (hasLinks) {
            if (checkLinks) {
                if (!(await this.#isLinkResolved(externalPath))) {
                    errors.push(...warnings); // Move warnings to errors if the element is linked
                    warnings = [];

                    // Clear old errors and warnings on linked properties
                    this.#applyToLinkedProperties((path) => {
                        const internalPath = path.slice((this.#base ?? []).length);
                        this.#clearMessages(internalPath, "errors");
                        this.#clearMessages(internalPath, "warnings");
                    }, externalPath);
                }
            }
        } else {
            // For non-links, throw a basic requirement error if the property is required
            if (!errors.length && isRequired && !parent[name]) {
                errors.push({ message: `${name} is a required property.`, type: "error", missing: true }); // Throw at least a basic error if the property is required
            }
        }

        // Clear old errors and warnings
        this.#clearMessages(fullPath, "errors");
        this.#clearMessages(fullPath, "warnings");

        // Track errors and warnings
        this.#nErrors += errors.length;
        this.#nWarnings += warnings.length;
        this.checkStatus();

        // Show aggregated errors and warnings (if any)
        warnings.forEach((info) => this.#addMessage(fullPath, info.message, "warnings"));

        const isFunction = typeof valid === "function";

        if (
            (valid === true || valid == undefined || isFunction || !valid.find((o) => o.type === "error")) &&
            errors.length === 0
        ) {
            element.classList.remove("invalid");

            const linkEl = this.#getLinkElement(externalPath);
            if (linkEl) linkEl.classList.remove("required", "conditional");

            await this.#applyToLinkedProperties((path, element) => {
                element.classList.remove("required", "conditional"); // Links manage their own error and validity states, but only one needs to be valid
            }, fullPath);

            if (isFunction) valid(); // Run if returned value is a function

            return true;
        } else {
            // Add new invalid classes and errors
            element.classList.add("invalid");

            const linkEl = this.#getLinkElement(externalPath);
            if (linkEl) linkEl.classList.add("required", "conditional");

            // Only add the conditional class for linked elements
            await this.#applyToLinkedProperties(
                (name, element) => element.classList.add("required", "conditional"),
                [...path, name]
            );

            errors.forEach((info) => this.#addMessage(fullPath, info.message, "errors"));
            // element.title = errors.map((info) => info.message).join("\n"); // Set all errors to show on hover

            return false;
        }
    };

    #render = (schema, results, required = {}, path = []) => {
        let isLink = Symbol("isLink");
        // Filter non-required properties (if specified) and render the sub-schema
        const renderable = this.#getRenderable(schema, required, path);

        // // Filter non-required properties (if specified) and render the sub-schema
        // const renderable = path.length ? this.#getRenderable(schema, required) : Object.entries(schema.properties ?? {})

        if (renderable.length === 0) return html`<p>No properties to render</p>`;

        let renderableWithLinks = renderable.reduce((acc, [name, info]) => {
            const externalPath = [...this.#base, ...path, name];
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

        let rendered = sorted.map((entry) => {
            const [name, info] = entry;

            // Render linked properties
            if (entry[isLink]) {
                const linkedProperties = info.properties.map((path) => {
                    const pathCopy = [...path].slice((this.#base ?? []).length);
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

            const fullPath = [...path, name];

            if (this.mode === "accordion" && hasMany) {
                const headerName = header(name);

                this.#nestedForms[name] = new JSONSchemaForm({
                    identifier: this.identifier,
                    schema: info,
                    results: results[name],
                    globals: this.globals?.[name],

                    onUpdate: (internalPath, value) => {
                        const path = [...fullPath, ...internalPath];
                        this.updateData(path, value);
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
                        accordion.setSectionStatus(headerName, status);
                        this.checkStatus();
                    }, // Forward status changes to the parent form
                    onInvalid: (...args) => this.onInvalid(...args),
                    onLoaded: () => {
                        this.nLoaded++;
                        this.checkAllLoaded();
                    },
                    renderTable: (...args) => this.renderTable(...args),
                    base: fullPath,
                });

                const accordion = new Accordion({
                    sections: {
                        [headerName]: {
                            subtitle: `${this.#getRenderable(info, required[name], fullPath).length} fields`,
                            content: this.#nestedForms[name],
                        },
                    },
                });

                accordion.id = name; // assign name to accordion id

                return accordion;
            }

            // Render properties in the sub-schema
            const rendered = this.#render(info, results?.[name], required[name], fullPath);
            return hasMany || path.length > 1
                ? html`
                      <div style="margin-top: 40px;">
                          <label class="guided--form-label header">${header(name)}</label>
                          <hr />
                          ${rendered}
                      </div>
                  `
                : rendered;
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
                    if (!nextAccumulator || typeof nextAccumulator !== "object") nextAccumulator = acc[key] = {};
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

        this.resolved = merge(this.results, {}); // Track resolved values as a copy of the user-specified results

        // Register default properties
        resolveProperties(schema.properties, this.resolved, this.globals);

        // // Delete extraneous results
        // this.#deleteExtraneousResults(this.results, this.schema);

        this.#registerRequirements(this.schema, this.required);

        return html`
            <div>
                ${false ? html`<h2>${schema.title}</h2>` : ""} ${false ? html`<p>${schema.description}</p>` : ""}
                ${this.#render(schema, this.resolved, this.#requirements)}
            </div>
        `;
    }
}

customElements.get("nwb-jsonschema-form") || customElements.define("nwb-jsonschema-form", JSONSchemaForm);
