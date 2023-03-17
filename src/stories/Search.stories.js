import { Search } from './Search';

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: 'Example/Search',
  // tags: ['autodocs'],
};

const Template = (args) => new Search(args);

export const Default = Template.bind({});
Default.args = {
  options: [
    {
      label: 'SpikeGLXRecording',
      keywords: [
        "extracellular electrophysiology",
        "voltage",
        "recording",
        "Neuropixels",
    ]
    },
    {
      label: 'DeepLabCut',
      keywords: ['DLC', 'tracking', 'pose estimation']
    },
  ]
};