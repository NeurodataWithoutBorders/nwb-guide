import { InspectorList } from "./InspectorList";
import testInspectorList from './test.json'

export default {
    title: "Components/Inspector List",
};

const Template = (args) => new InspectorList(args);

export const Default = Template.bind({});
Default.args = {
    items: testInspectorList
};