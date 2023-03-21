import { Main } from './Main.js';

export default {
  title: 'Main',
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};

const Template = (args) => new Main(args);

export const Default = Template.bind({});
Default.args = {}
