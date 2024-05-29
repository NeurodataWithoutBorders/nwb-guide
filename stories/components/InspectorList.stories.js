import { InspectorList } from "../../src/electron/renderer/src/stories/preview/inspector/InspectorList";
import testInspectorList from "../inputs/inspector_output.json";

export default {
    title: "Components/Inspector List",
};

const Template = (args) => new InspectorList(args);

export const Default = Template.bind({});
Default.args = {
    items: testInspectorList,
};
