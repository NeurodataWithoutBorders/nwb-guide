import { Table } from './Table.js';

import subjectSchema from '../../../../schemas/subject.schema'

export default {
  title: 'Components/Table',
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};

const Template = (args) => new Table(args);

const data = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'].reduce((acc, key) => {
  acc[key] = {
    weight: (60*Math.random()).toFixed(2),
    sessions: [1]
  }
  return acc
}, {})


export const Default = Template.bind({});
Default.args = {
  schema: subjectSchema,
  data,
  keyColumn: 'subject_id',
  validateOnChange: () => true // Always validate as true
}
