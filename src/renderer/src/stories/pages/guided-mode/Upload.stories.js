import { globalState, PageTemplate } from "./storyStates";

export default {
    title: "Pages/Guided Mode/Upload",
    parameters: {
        chromatic: { disableSnapshot: false },
    }
};


export const Default = PageTemplate.bind({});
Default.args = {
    activePage: "conversion/upload",
    globalState
};
