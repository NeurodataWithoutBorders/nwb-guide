import { dashboard } from '../../../pages.js';

export default {
  title: 'Pages/Guided/Home',
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};


dashboard.main.onTransition('guided')

const Template = (args) => dashboard.main;

export const Default = Template.bind({});
Default.args = {}
