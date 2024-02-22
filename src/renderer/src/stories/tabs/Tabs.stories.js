import { Tabs } from "./Tabs";

export default {
    title: "Components/Tabs",
};

const Template = (args) => new Tabs(args);

const base = [
    {
        name: "NWBFile",
        status: {
            errors: 0,
            warnings: 0,
        },
        content: "NWBFile information",
        subtitle: "NWB File Properties",
    },
    {
        name: "Subject",
        status: {
            errors: 3,
            warnings: 0,
        },
        content: "Subject information",
        subtitle: "Subject Properties",
    },
    {
        name: "Ecephys",
        status: {
            errors: 0,
            warnings: 10,
        },
        content: "Ecephys information",
        subtitle: "Ecephys Properties",
    },
    {
        name: "Ophys",
        content: "Ophys information",
        subtitle: "Ophys Properties",
        status: {
            errors: true,
            warnings: false,
        },
    },
]

export const Basic = Template.bind({});
Basic.args = {
    items: base,
    selected: 1
};

// export const Valid = Template.bind({});
// Valid.args = {
//     ...base,
//     status: "valid",
//     content: "WOOHOO!",
// };

// export const Warning = Template.bind({});
// Warning.args = {
//     ...base,
//     status: "warning",
//     content: "OOO",
// };

// export const Error = Template.bind({});
// Error.args = {
//     ...base,
//     status: "error",
//     content: "BOO",
// };
