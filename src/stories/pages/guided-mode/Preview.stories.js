import { globalState, PageTemplate } from "./storyStates";

export default {
    title: "Pages/Guided Mode/Preview",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
};

export const Default = PageTemplate.bind({});
Default.args = {
    activePage: "conversion/preview",
    globalState,
};
