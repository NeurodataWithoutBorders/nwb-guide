import { html } from "lit";
import { Page } from "../../Page.js";
import subjectSchema from "../../../../../../../schemas/subject.schema";
import { validateOnChange } from "../../../../validation/index.js";
import { Table } from "../../../Table.js";

import { updateResultsFromSubjects } from "./utils";
import { merge } from "../../utils.js";

export class GuidedSubjectsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    header = {
        subtitle: "Enter all metadata known about each experiment subject",
    };

    beforeSave = () => {
        this.info.globalState.subjects = merge(this.localState, this.info.globalState.subjects); // Merge the local and global states

        try {
            this.table.validate();
        } catch (e) {
            this.notify(e.message, "error");
            throw e;
        }
    };

    // Only save if the subject structure is valid
    beforeTransition = () => {
        // this.save(); // Save on each transition (removed to prevent multiple validation notifications)

        const { results, subjects } = this.info.globalState;

        // Object.keys(subjects).forEach((sub) => {
        //     if (!subjects[sub].sessions?.length) {
        //         delete subjects[sub]
        //     }
        // });

        const noSessions = Object.keys(subjects).filter((sub) => !subjects[sub].sessions?.length);
        if (noSessions.length) {
            const error = `${noSessions.length} subject${
                noSessions.length > 1 ? "s are" : " is"
            } missing Sessions entries`;
            this.notify(error, "error");
            throw new Error(error);
        }

        const sourceDataObject = Object.keys(this.info.globalState.interfaces).reduce((acc, key) => {
            acc[key] = {};
            return acc;
        }, {});

        // Modify the results object to track new subjects / sessions
        updateResultsFromSubjects(results, subjects, sourceDataObject); // NOTE: This directly mutates the results object
    };

    footer = {
        next: "Generate Data Structure",
    };

    updated() {
        const add = this.query("#addButton");
        add.onclick = () => this.table.table.alter("insert_row_below");
        super.updated(); // Call if updating data
    }

    render() {
        const subjects = (this.localState = merge(this.info.globalState.subjects ?? {}, {}));

        // Ensure all the proper subjects are in the global state
        const toHave = Object.keys(this.info.globalState.results);
        const toRemove = Object.keys(subjects).filter((sub) => !toHave.includes(sub));
        toRemove.forEach((sub) => delete subjects[sub]);
        toHave.forEach((sub) => (subjects[sub] = subjects[sub] ?? {}));

        for (let subject in subjects) {
            const sessions = Object.keys(this.info.globalState.results[subject]);
            subjects[subject].sessions = sessions;
        }

        this.table = new Table({
            schema: subjectSchema,
            data: subjects,
            template: this.info.globalState.project.Subject,
            keyColumn: "subject_id",
            validateEmptyCells: false,
            contextMenu: {
                ignore: ["row_below"],
            },
            onUpdate: () => {
                this.unsavedUpdates = true;
            },
            validateOnChange: (key, parent, v) => {
                if (key === "sessions") return true;
                else {
                    delete parent.sessions; // Delete dessions from parent copy
                    return validateOnChange(key, parent, ["Subject"], v);
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
