import { Accordion } from "./Accordion";

export default {
    title: "Components/Accordion",
};

const Template = (args) => new Accordion(args);

const base = {
    name: "NWBFile",
    open: true,
    status: "valid",
    content: "Whatever you want",
    subtitle: "General NWB File Properties",
};

export const Basic = Template.bind({});
Basic.args = {
    ...base,
    content: "Whatever you want",
};

export const Valid = Template.bind({});
Valid.args = {
    ...base,
    status: "valid",
    content: "WOOHOO!",
};

export const Warning = Template.bind({});
Warning.args = {
    ...base,
    status: "warning",
    content: "OOO",
};

export const Error = Template.bind({});
Error.args = {
    ...base,
    status: "error",
    content: "BOO",
};
