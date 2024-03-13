import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { onThrow } from "../../../../errors";

// ------------------------------------------------------------------------------
// ------------------------ Preform Configuration -------------------------------
// ------------------------------------------------------------------------------

const questions = {
    multiple_sessions: {
        type: "boolean",
        title: "Will this pipeline be run on multiple sessions?",
        default: false,
    },
    locate_data: {
        type: "boolean",
        title: "Would you like to locate these sessions programmatically?",
        dependencies: ["multiple_sessions"],
        default: false,
    },
};

// -------------------------------------------------------------------------------------------
// ------------------------ Derived from the above information -------------------------------
// -------------------------------------------------------------------------------------------

const dependents = Object.entries(questions).reduce((acc, [name, info]) => {
    acc[name] = [];

    if (info.dependencies) {
        info.dependencies.forEach((dep) => {
            if (!acc[dep]) acc[dep] = [];
            acc[dep].push(name);
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

    footer = {
        onNext: async () => {
            await this.form.validate();
            this.info.globalState.project.workflow = this.state;
            this.save();
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
            validateOnChange: function (name, parent, path, value) {
                dependents[name].forEach((dependent) => {
                    const dependencies = questions[dependent].dependencies;
                    const dependentEl = this.inputs[dependent];
                    if (dependencies.every((dep) => parent[dep])) dependentEl.removeAttribute("disabled");
                    else {
                        dependentEl.updateData(false);
                        dependentEl.setAttribute("disabled", true);
                    }
                });
            },
            onUpdate: () => (this.unsavedUpdates = true),
            onThrow,
            groups: [
                {
                    name: "Session Workflow",
                    properties: [["multiple_sessions"], ["locate_data"]],
                },
            ],
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
