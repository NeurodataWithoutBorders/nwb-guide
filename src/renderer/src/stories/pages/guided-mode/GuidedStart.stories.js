import { globalState, PageTemplate } from "./storyStates";

export default {
    title: "Pages/Guided Mode/Start",
    parameters: {
        chromatic: { disableSnapshot: false },
    }
};


export const Default = PageTemplate.bind({});
Default.args = {
    activePage: "conversion/start",
    globalState
};
