import { globalState, PageTemplate } from "./storyStates";

export default {
    title: "Pages/Guided Mode/Workflow",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
};

export const Default = PageTemplate.bind({});
Default.args = {
    activePage: "//worklflow",
    globalState,
};
