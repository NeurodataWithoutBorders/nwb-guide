import { InspectorList } from "../../src/electron/frontend/core/components/preview/inspector/InspectorList";
import testInspectorList from "../inputs/inspector_output.json";

export default {
    title: "Components/Inspector List",
};

const Template = (args) => new InspectorList(args);

export const Default = Template.bind({});
Default.args = {
    items: testInspectorList,
};
