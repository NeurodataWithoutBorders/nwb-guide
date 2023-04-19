import { JSONSchemaForm } from './JSONSchemaForm';

export default {
  title: 'Components/JSON Schema Form',
  // Set controls
  argTypes: {
    mode: {
      options: ['default', 'accordion'],
      control: {
        type: 'select',
      }
    }
  }
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
    },
  },
  required: ['test']
}

export const Nested = Template.bind({});
Nested.args = {
  mode: 'default',
  schema: {
    title: 'Nested',
    properties: {
      nested: defaultSchema
    }
  },
};
