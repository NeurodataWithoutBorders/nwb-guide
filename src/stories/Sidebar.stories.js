import { Sidebar } from './sidebar.js';

export default {
  title: 'Components/Sidebar',
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};

const Template = (args) => new Sidebar(args);

export const Default = Template.bind({});
Default.args = {
  primary: true,
  label: 'Sidebar',
};
