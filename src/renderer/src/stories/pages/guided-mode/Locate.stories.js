import { globalState, PageTemplate } from "./storyStates";

export default {
    title: "Pages/Guided Mode/Locate",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
};

export const Invalid = PageTemplate.bind({});
Invalid.args = {
    activePage: "conversion/locate",
    globalState,
};

export const Valid = PageTemplate.bind({});

const validGlobalState = structuredClone(globalState);
validGlobalState.structure.results = {
    interface: {
        base_directory: "/Users/garrettflynn/NWB_GUIDE/tutorial/Dataset",
        format_string_path: "{subject_id}/{subject_id}_{session_id}/{subject_id}_{session_id}_phy",
    },
};

Valid.args = {
    activePage: "conversion/locate",
    globalState: validGlobalState,
};
