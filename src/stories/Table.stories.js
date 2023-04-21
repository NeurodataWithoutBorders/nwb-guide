import { Table } from './Table.js';

import schema from '../../schemas/base_metadata_schema.json'

export default {
  title: 'Components/Table',
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};

const Template = (args) => new Table(args);

const data = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'].reduce((acc, key) => {
  acc[key] = {
    subject_id: Math.random().toString(36).substring(7),
  }
  return acc
}, {})

export const Default = Template.bind({});
Default.args = {
  schema: schema.properties.Subject, 
  data,
  validateOnChange: () => true // Always validate as true
}