import { globalState, PageTemplate } from "./storyStates";

export default {
    title: "Pages/Guided Mode/Home",
    parameters: {
        chromatic: { disableSnapshot: false },
    }
};


export const Default = PageTemplate.bind({});
Default.args = {
    activePage: "conversion",
    globalState
};
