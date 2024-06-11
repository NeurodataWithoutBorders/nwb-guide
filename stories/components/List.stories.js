import { List } from "../../src/electron/frontend/core/components/List";

export default {
  title: "Components/List",
};

const Template = (args) => new List(args);

const generateString = () =>
  Math.floor(Math.random() * Date.now()).toString(36);

export const Default = Template.bind({});
Default.args = {
  items: [
    { value: "test" },
    { value: Array.from({ length: 1000 }).map(generateString).join("") },
  ],
};

export const WithKeys = Template.bind({});
WithKeys.args = {
  items: [{ key: "TestKey", value: "test" }],
};

export const Empty = Template.bind({});
Empty.args = {
  emptyMessage: "This is empty",
  unordered: true,
  items: [],
};

export const EmptyKeys = Template.bind({});
EmptyKeys.args = {
  emptyMessage: "This is empty",
  items: [],
};
