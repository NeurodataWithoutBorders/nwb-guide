import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";

// ------------------------------------------------------------------------------
// ------------------------ Preform Configuration -------------------------------
// ------------------------------------------------------------------------------

const questions = {
    multiple_sessions: {
        type: "boolean",
        title: "Will this pipeline be run on multiple sessions?",
        default: false,
    },
    subject_id: {
        type: "string",
        description: "Provide an identifier for your subject",
        dependencies: {
            multiple_sessions: {
                condition: [false, undefined],
                default: "",
                required: true,
            },
        },
    },
    session_id: {
        type: "string",
        description: "Provide an identifier for your session",
        dependencies: {
            multiple_sessions: {
                condition: [false, undefined],
                default: "",
                required: true,
            },
        },
    },
    locate_data: {
        type: "boolean",
        title: "Would you like to locate the source data programmatically?",
        dependencies: {
            multiple_sessions: {},
        },
        default: false,
    },

    base_directory: {
        type: "string",
        format: "directory",
        title: "Where is your data located?",
        description:
            "A single directory where all data is contained. Can override for specific data formats.<br><small>Leave blank if unknown</small>",
        dependencies: {
            locate_data: {},
        },
    },

    file_format: {
        type: "string",
        enum: ["hdf5", "zarr"],
        enumLabels: {
            hdf5: "HDF5",
            zarr: "Zarr",
        },
        strict: true,
        title: "What file format would you like to use?",
        description: "Choose a default file format for your data.",
        default: "hdf5"
    },

    backend_configuration: {
        type: "boolean",
        title: "Will you customize low-level data storage options?",
        description: "<span>Dataset chunking, compression, etc.</span><br><small>This also allows you to change file formats per-session</small>",
        default: false,
    },


    upload_to_dandi: {
        type: "boolean",
        title: "Will you publish data on DANDI?",
        default: true,
    },
};

const defaults = Object.entries(questions).reduce((acc, [name, info]) => {
    acc[name] = info.default;
    return acc;
}, {});

// -------------------------------------------------------------------------------------------
// ------------------------ Derived from the above information -------------------------------
// -------------------------------------------------------------------------------------------

const dependents = Object.entries(questions).reduce((acc, [name, info]) => {
    acc[name] = [];

    const deps = info.dependencies;

    if (deps) {
        if (Array.isArray(deps))
            deps.forEach((dep) => {
                if (!acc[dep]) acc[dep] = [];
                acc[dep].push({ name });
            });
        else
            Object.entries(deps).forEach(([dep, opts]) => {
                if (!acc[dep]) acc[dep] = [];
                acc[dep].push({ name, default: info.default, ...opts }); // Inherit default value
            });
    }
    return acc;
}, {});

const projectWorkflowSchema = {
    type: "object",
    properties: Object.entries(questions).reduce((acc, [name, info]) => {
        acc[name] = info;
        return acc;
    }, {}),
    order: Object.keys(questions),
    additionalProperties: false,
};

// ----------------------------------------------------------------------
// ------------------------ Preform Class -------------------------------
// ----------------------------------------------------------------------

export class GuidedPreform extends Page {
    constructor(...args) {
        super(...args);
        this.updateForm(); // Register nested pages on creation—not just with data
    }

    state = {};

    header = {
        subtitle: "Answer the following questions to simplify your workflow through the GUIDE",
    };

    #setWorkflow = () => this.info.globalState.project.workflow = merge(this.state, structuredClone(defaults))

    beforeSave = async () => {
        await this.form.validate();
        this.#setWorkflow()
    };

    footer = {
        onNext: async () => {
            await this.form.validate();
            await this.save();
            return this.to(1);
        },
    };

    updateForm = () => {
        const schema = structuredClone(projectWorkflowSchema);
        const projectState = this.info.globalState.project ?? {};
        if (!projectState.workflow) projectState.workflow = {};
        this.state = structuredClone(projectState.workflow);

        this.form = new JSONSchemaForm({
            schema,
            results: this.state,
            validateEmptyValues: false, // Only show errors after submission
            validateOnChange: function (name, parent, path, value) {
                
                dependents[name].forEach((dependent) => {
                    const dependencies = questions[dependent.name].dependencies;
                    const uniformDeps = Array.isArray(dependencies)
                        ? dependencies.map((name) => {
                              return { name };
                          })
                        : Object.entries(dependencies).map(([name, info]) => {
                              return { name, ...info };
                          });

                    const dependentEl = this.inputs[dependent.name];
                    const dependentParent = dependentEl.parentElement;

                    const attr = dependent.attribute ?? "hidden";

                    let condition = (v) => !!v;
                    if (!("condition" in dependent)) {
                    } else if (typeof dependent.condition === "boolean") condition = (v) => v == dependent.condition;
                    else if (Array.isArray(dependent.condition))
                        condition = (v) => dependent.condition.some((condition) => v == condition);
                    else console.warn("Invalid condition", dependent.condition);

                    // Is set to true
                    if (uniformDeps.every(({ name }) => condition(parent[name]))) {
                        dependentParent.removeAttribute(attr);
                        if ("required" in dependent) dependentEl.required = dependent.required;
                        if ("__cached" in dependent) dependentEl.updateData(dependent.__cached);
                    }

                    // Is set to false
                    else {
                        if (dependentEl.value !== undefined) dependent.__cached = dependentEl.value;
                        dependentEl.updateData(dependent.default);
                        dependentParent.setAttribute(attr, true);
                        if ("required" in dependent) dependentEl.required = !dependent.required;
                    }
                });

                const { upload_to_dandi, file_format } = parent;

                // Only check file format because of global re-render
                if (name === "file_format") {
                    if (upload_to_dandi === true && file_format === "zarr") return [
                        {
                            type: 'error',
                            message: "<h4 style='margin:0;'>Zarr files are not supported by DANDI</h4><span>Please change the file format to HDF5 or disable DANDI upload.</span>",
                        },
                    ]
                }

            },

            // Save all changes
            onUpdate: async (path, value) => {
                const willUpdateFlow = typeof value === "boolean";
                this.unsavedUpdates = true;
                this.#setWorkflow()
                if (willUpdateFlow) this.updateSections(); // Trigger section changes with new workflow
                await this.save({}, false); // Save new workflow and section changes
            },
            onThrow,
            // groups: [
            //     {
            //         name: "Session Workflow",
            //         properties: [["multiple_sessions"], ["locate_data"]],
            //     },
            // ],
        });

        return this.form;
    };

    render() {
        this.state = {}; // Clear local state on each render

        const form = this.updateForm();
        form.style.width = "100%";

        return html` ${form} `;
    }
}

customElements.get("nwbguide-guided-preform-page") ||
    customElements.define("nwbguide-guided-preform-page", GuidedPreform);
