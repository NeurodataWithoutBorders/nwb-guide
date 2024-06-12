import { Search } from "../../src/electron/frontend/core/components/Search";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
    title: "Components/Search",
    // tags: ['autodocs'],
};

const Template = (args) => new Search(args);

export const Default = Template.bind({});
Default.args = {
    disabledLabel: "Interface not supported",
    options: [
        {
            label: "SpikeGLXRecording",
            keywords: ["extracellular electrophysiology", "voltage", "recording", "neuropixels"],
        },
        {
            label: "DeepLabCut",
            keywords: ["DLC", "tracking", "pose estimation"],
        },
    ],
};

export const Categories = Template.bind({});
Categories.args = {
    disabledLabel: "Interface not supported",
    options: [
        {
            label: "SpikeGLXConverter",
            category: "Converter",
            keywords: ["extracellular electrophysiology", "voltage", "recording", "neuropixels"],
        },
        {
            label: "SpikeGLXRecording",
            category: "Interface",
            keywords: ["extracellular electrophysiology", "voltage", "recording", "neuropixels"],
        },
        {
            label: "DeepLabCut",
            category: "Interface",
            keywords: ["DLC", "tracking", "pose estimation"],
        },
    ],
};
