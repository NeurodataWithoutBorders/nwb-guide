import { Main } from './Main.js';

export default {
  title: 'Components/Main',
};

const Template = (args) => new Main(args);

export const Default = Template.bind({});
Default.args = {}
