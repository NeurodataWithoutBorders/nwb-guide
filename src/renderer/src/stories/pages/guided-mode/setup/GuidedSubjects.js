import { html } from "lit";
import { Page } from "../../Page.js";
import { Table } from "../../../Table.js";
import nwbBaseSchema from "../../../../../../../schemas/base_metadata_schema.json";
import { validateOnChange } from "../../../../validation/index.js";

// Add unit to weight
nwbBaseSchema.properties.Subject.properties.weight.unit = "kg";

const removeSubset = (data, subset) => {
    const subsetData = subset.reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
    }, {});
    for (let key in subsetData) delete data[key];
    return subsetData;
};

export class GuidedSubjectsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {
        onNext: () => {
            const { results, subjects } = this.info.globalState;

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
                    if (!Object.keys(subObj).length) delete results[subject]; // Delete subjects without sessions
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

        const groupedKeys = ["age", "date_of_birth"];
        const standardOrder = { ...nwbBaseSchema.properties.Subject.properties };
        const grouped = removeSubset(standardOrder, groupedKeys);
        const required = removeSubset(standardOrder, nwbBaseSchema.properties.Subject.required);

        const schema = {
            ...nwbBaseSchema.properties.Subject,
            properties: {
                sessions: {
                    type: "array",
                    uniqueItems: true,
                    items: { type: "string" },
                },
                ...required,
                ...grouped,
                ...standardOrder,
            },
        };

        const subjectTable = new Table({
            schema,
            data: subjects,
            template: this.info.globalState.project.Subject,
            keyColumn: "subject_id",
            validateOnChange: (key, v, parent) => validateOnChange(key, parent, ["Subject"], v),
        });

        return html`
            <div id="guided-mode-starting-container" class="guided--main-tab">
                <div class="guided--panel" id="guided-intro-page" style="flex-grow: 1">
                    <div class="title">
                        <h1 class="guided--text-sub-step">Subjects</h1>
                    </div>
                    <div
                        style="
            width: 100%;
          "
                    >
                        ${subjectTable}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-subjects-page") ||
    customElements.define("nwbguide-guided-subjects-page", GuidedSubjectsPage);
