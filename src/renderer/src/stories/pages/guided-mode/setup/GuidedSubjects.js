import { html } from "lit";
import { Page } from "../../Page.js";
import subjectSchema from "../../../../../../../schemas/subject.schema";
import { validateOnChange } from "../../../../validation/index.js";
import { SimpleTable } from "../../../SimpleTable.js";
import { Table } from "../../../Table.js";

import { convertSubjectsToResults } from "./utils";

export class GuidedSubjectsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {
        onNext: () => {
            const { results, subjects } = this.info.globalState;

            try {
                this.table.validate();
            } catch (e) {
                this.notify(e.message, "error");
                throw e;
            }

            const noSessions = Object.keys(subjects).filter((sub) => !subjects[sub].sessions?.length);
            if (noSessions.length)
                return this.notify(
                    `${noSessions.length} subject${noSessions.length > 1 ? "s are" : " is"} missing Sessions entries`,
                    "error"
                );

            const sourceDataObject = Object.keys(this.info.globalState.interfaces).reduce((acc, key) => {
                acc[key] = {};
                return acc;
            }, {});

            convertSubjectsToResults(results, subjects, sourceDataObject); // NOTE: This directly mutates the results object

            this.onTransition(1);
        },
    };

    updated() {
        const add = this.query('#addButton')
        add.onclick = () => this.table.table.alter('insert_row_below')
    }

    render() {
        let subjects = this.info.globalState.subjects;
        if (!subjects) subjects = this.info.globalState.subjects = {}; // Ensure global subjects tracking

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
