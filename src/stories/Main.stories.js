import { Main } from './Main.js';

export default {
  title: 'Main',
};

const Template = (args) => new Main(args);

export const Default = Template.bind({});
Default.args = {}
