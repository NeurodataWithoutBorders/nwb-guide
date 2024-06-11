import { OptionalSection } from "../../src/electron/frontend/core/components/OptionalSection";

export default {
  title: "Components/Optional Section",
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};

const Template = (args) => new OptionalSection(args);

export const Default = Template.bind({});
Default.args = {
  content: "This is the content of the optional section.",
};
