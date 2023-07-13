import { List } from "./List";

export default {
    title: "Components/List",
};

const Template = (args) => new List(args);

export const Default = Template.bind({});
Default.args = {
    items: [{ value: "test" }],
};

export const WithKeys = Template.bind({});
WithKeys.args = {
    items: [{ key: "TestKey", value: "test" }],
};
