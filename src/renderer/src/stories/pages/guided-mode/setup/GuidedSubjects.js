import { html } from "lit";
import { Page } from "../../Page.js";
import { Table } from "../../../Table.js";
import subjectSchema from "../../../../../../../schemas/subject.schema";
import { validateOnChange } from "../../../../validation/index.js";

export class GuidedSubjectsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {
        onNext: () => {
            const { results, subjects } = this.info.globalState;

            const nUnresolved = Object.keys(this.table.unresolved).length;
            if (nUnresolved)
                return this.notify(
                    `${nUnresolved} subject${nUnresolved > 1 ? "s are" : " is"} missing a Subject ID value`,
                    "error"
                );

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

            const toRemove = Object.keys(results).filter((sub) => !Object.keys(subjects).includes(sub));
            for (let sub of toRemove) delete results[sub]; // Delete extra subjects from results

            for (let subject in subjects) {
                const { sessions = [] } = subjects[subject];
                let subObj = results[subject];

                if (!subObj) subObj = results[subject] = {};
                else {
                    const toRemove = Object.keys(subObj).filter((s) => !sessions.includes(s));
                    for (let s of toRemove) delete subObj[s]; // Delete extra sessions from results
                    if (!sessions.length && !Object.keys(subObj).length) delete results[subject]; // Delete subjects without sessions
                }

                for (let session of sessions) {
                    if (!(session in subObj))
                        subObj[session] = {
                            source_data: { ...sourceDataObject },
                            metadata: {
                                NWBFile: { session_id: session },
                                Subject: { subject_id: subject },
                            },
                        };
                }
            }

            this.onTransition(1);
        },
    };

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
            validateOnChange: (key, v, parent) => validateOnChange(key, parent, ["Subject"], v),
        });

        return html`
            <div class="title">
                <h1 class="guided--text-sub-step">Subjects</h1>
            </div>
            <div style="width: 100%;">${this.table}</div>
        `;
    }
}

customElements.get("nwbguide-guided-subjects-page") ||
    customElements.define("nwbguide-guided-subjects-page", GuidedSubjectsPage);
