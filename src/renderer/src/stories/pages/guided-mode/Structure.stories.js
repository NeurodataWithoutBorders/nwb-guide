import { globalState, PageTemplate } from "./storyStates";

export default {
    title: "Pages/Guided Mode/Structure",
    parameters: {
        chromatic: { disableSnapshot: false },
    }
};


export const Default = PageTemplate.bind({});
Default.args = {
    activePage: "conversion/structure",
    globalState
};
