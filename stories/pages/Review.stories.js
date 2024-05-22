import { globalState, PageTemplate } from "./storyStates";

export default {
    title: "Pages/Guided Mode/Review",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
};

export const Default = PageTemplate.bind({});
Default.args = {
    activePage: "//review",
    globalState,
};
