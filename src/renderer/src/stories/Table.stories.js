import { Table } from "./Table.js";

import subjectSchema from "../../../../schemas/subject.schema";
import { SimpleTable } from "./SimpleTable.js";

export default {
    title: "Components/Table",
    parameters: {
        chromatic: { disableSnapshot: true },
    },
};

const Template = (args) => new Table(args);

const subjects = 10;
const subjectIds = Array.from({ length: subjects }, (_, i) => i);

const data = subjectIds.reduce((acc, key) => {
    acc[key] = {
        weight: (60 * Math.random()).toFixed(2),
        sessions: [1],
    };
    return acc;
}, {});

export const Default = Template.bind({});
Default.args = {
    schema: subjectSchema,
    data,
    keyColumn: "subject_id",
    validateOnChange: () => true, // Always validate as true
};

const SimpleTemplate = (args) => new SimpleTable(args);
export const Simple = SimpleTemplate.bind({});
Simple.args = {
    schema: subjectSchema,
    data,
    keyColumn: "subject_id",
    // validateOnChange: (key, parent, value) => {
    //     if (key === 'subject_id' && !value) return true
    //     return false
    // }, // Always validate as true
};