import { html } from "lit";
import { Page } from "../../Page.js";
import getSubjectSchema from "../../../../../../../schemas/subject.schema";
import { validateOnChange } from "../../../../validation/index.js";
import { Table } from "../../../Table.js";

import { updateResultsFromSubjects } from "./utils";
import { merge } from "../../utils.js";
import { preprocessMetadataSchema } from "../../../../../../../schemas/base-metadata.schema";
import { Button } from "../../../Button.js";
import { createGlobalFormModal } from "../../../forms/GlobalFormModal";
import { header } from "../../../forms/utils";

import globalIcon from "../../../assets/global.svg?raw";

export class GuidedSubjectsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        subtitle: "Enter all metadata known about each experiment subject",
        controls: [
            new Button({
                icon: globalIcon,
                label: "Edit Global Metadata",
                onClick: () => {
                    this.#globalModal.form.results = structuredClone(this.info.globalState.project.Subject ?? {});
                    this.#globalModal.open = true;
                },
            }),
        ],
    };

    // Abort save if subject structure is invalid
    beforeSave = () => {
        try {
            this.table.validate();
        } catch (error) {
            this.notify(error.message, "error");
            throw error;
        }

        const localState = this.table.data;

        // Create map of original names to new names
        const nameMap = {};
        for (let key in this.#originalState) {
            const renamed = Object.keys(localState).find(
                (k) => localState[k].identifier === this.#originalState[key].identifier
            );
            nameMap[key] = renamed;
        }

        // Remove identifiers
        for (let key in localState) delete localState[key].identifier;

        // Local state is the source of truth
        this.info.globalState.subjects = localState;

        const { results, subjects } = this.info.globalState;

        const sourceDataObject = Object.keys(this.info.globalState.interfaces).reduce((acc, key) => {
            acc[key] = {};
            return acc;
        }, {});

        // Modify the results object to track new subjects / sessions
        updateResultsFromSubjects(results, subjects, sourceDataObject, nameMap); // NOTE: This directly mutates the results object
    };

    footer = {};

    updated() {
        const add = this.query("#addButton");
        add.onclick = () => this.table.table.alter("insert_row_below");
        super.updated(); // Call if updating data
    }

    #globalModal;

    connectedCallback() {
        super.connectedCallback();

        const schema = preprocessMetadataSchema(undefined, true).properties.Subject;

        const modal = (this.#globalModal = createGlobalFormModal.call(this, {
            header: "Global Subject Metadata",
            key: "Subject",
            validateEmptyValues: null,
            schema,
            formProps: {
                validateOnChange: (localPath, parent, path) => {
                    return validateOnChange(localPath, parent, ["Subject", ...path]);
                },
            },
        }));
        document.body.append(modal);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#globalModal) this.#globalModal.remove();
    }

    #originalState = {};

    render() {
        const subjects = (this.localState = structuredClone(this.info.globalState.subjects ?? {}));

        // Ensure all the proper subjects are in the global state
        const toHave = Object.keys(this.info.globalState.results);
        const toRemove = Object.keys(subjects).filter((sub) => !toHave.includes(sub));
        toRemove.forEach((sub) => delete subjects[sub]);
        toHave.forEach((sub) => (subjects[sub] = subjects[sub] ?? {}));

        this.#originalState = structuredClone(subjects);

        for (let subject in subjects) {
            const sessions = Object.keys(this.info.globalState.results[subject]);
            subjects[subject].sessions = sessions;
            subjects[subject].identifier = this.#originalState[subject].identifier = Symbol("subject"); // Add identifier to subject
        }

        this.table = new Table({
            schema: {
                type: "array",
                items: getSubjectSchema(),
            },
            data: subjects,
            globals: this.info.globalState.project.Subject,
            keyColumn: "subject_id",
            validateEmptyCells: ["subject_id", "sessions"],
            contextMenu: {
                ignore: ["row_below"],
            },
            onThrow: (message, type) => this.notify(message, type),
            onOverride: (name) => {
                this.notify(`<b>${header(name)}</b> has been overridden with a global value.`, "warning", 3000);
            },
            onUpdate: () => {
                this.unsavedUpdates = "conversions";
            },
            validateOnChange: (localPath, parent, v) => {
                const name = localPath[localPath.length - 1];
                if (name === "sessions") {
                    if (v?.length) return true;
                    else {
                        return [
                            {
                                message: "Sessions must have at least one entry",
                                type: "error",
                            },
                        ];
                    }
                } else {
                    delete parent.sessions; // Delete sessions from parent copy
                    return validateOnChange(localPath, parent, ["Subject"], v);
                }
            },
        });

        return html`
            <div style="display: flex; justify-content: center; flex-wrap: wrap;">
                <div style="width: 100%;">${this.table}</div>
                <nwb-button id="addButton">Add Subject</nwb-button>
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-subjects-page") ||
    customElements.define("nwbguide-guided-subjects-page", GuidedSubjectsPage);
