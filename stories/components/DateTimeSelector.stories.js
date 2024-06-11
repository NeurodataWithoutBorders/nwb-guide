import { DateTimeSelector } from "../../src/electron/frontend/core/components/DateTimeSelector";

export default {
  title: "Components/DateTime Selector",
};

const Template = (args) => new DateTimeSelector(args);

export const Default = Template.bind({});
export const Limited = Template.bind({});
Limited.args = {
  min: "2024-01-01T00:00",
  max: "2024-12-31T23:59",
};
