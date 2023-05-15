import { Table } from "./Table.js";

import subjectSchema from "../../../../schemas/subject.schema";
import { SimpleTable } from "./SimpleTable.js";
import { BasicTable } from "./BasicTable.js";

export default {
    title: "Components/Table",
    parameters: {
        chromatic: { disableSnapshot: true },
    },
};

const Template = (args) => new Table(args);

const subjects = 100;
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
    validateOnChange: (key, parent, value) => {
        return !!value;
    }, // Always validate as true
    onLoaded: () => {
        console.log("Loaded!");
    },
};

const BasicTableTemplate = (args) => new BasicTable(args);

export const Basic = BasicTableTemplate.bind({});
Basic.args = {
    name: "basic_table_test",
    schema: subjectSchema,
    data,
    keyColumn: "subject_id",
    validateOnChange: (key, parent, value) => !!value, // Always validate as true
};
