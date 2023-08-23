import { List } from "./List";

export default {
    title: "Components/List",
};

const Template = (args) => new List(args);

const generateString = () => Math.floor(Math.random() * Date.now()).toString(36)

export const Default = Template.bind({});
Default.args = {
    items: [{ value: "test" }, { value: (Array.from({length: 1000}).map(generateString).join(''))}],
};

export const WithKeys = Template.bind({});
WithKeys.args = {
    items: [{ key: "TestKey", value: "test" }],
};
