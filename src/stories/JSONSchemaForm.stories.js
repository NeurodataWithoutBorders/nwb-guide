import { JSONSchemaForm } from './JSONSchemaForm';

export default {
  title: 'Components/JSON Schema Form'
};

const Template = (args) => new JSONSchemaForm(args);

const defaultSchema = {
  title: 'Test Title',
  description: 'This is a test description',
  properties: {
    test: {
      type: 'string',
      default: true
    },
    optional: {
      type: 'string',
      format: 'file',
    }
  },
  required: ['test']
}

export const Nested = Template.bind({});
Nested.args = {
  schema: {
    title: 'Nested',
    properties: {
      nested: defaultSchema
    }
  }
};
