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
  results: {
    name: 'name',
  },
  schema: {
    properties: {
      name: {
        type: 'string',
      },
      warn: {
        type: 'string',
      },
      nested: defaultSchema
    },
  },
  ignore: ['ignored'],
  required: {
    name: true
  },

  validateOnChange: (name, parentInfo, path) => {
    if (name === 'name' && parentInfo[name] !== 'name') return [
      {
        type: 'error',
        message: 'Name must be "name"',
      }
    ]

    if (name === 'warn' && parentInfo[name] !== 'warn') return [
      {
        type: 'warning',
        message: 'Warn must be "warn"',
      }
    ]
  }
};

const linked = ['age', 'date_of_birth']
export const Linked = Template.bind({});
Linked.args = {
  schema: {
    properties: {
      name: {
        type: 'string',
      },
      required: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
      date_of_birth: {
        type: 'string',
        format: 'date-time'
      }
    },
    required: ['required']
  },
  conditionalRequirements: [
    {
      name: 'Subject Age',
      properties: [['age'], ['date_of_birth']]
    }
  ],
  validateOnChange: (name, parentInfo) => {
    const bothUnspecified = !parentInfo['age'] && !parentInfo['date_of_birth']

    if (bothUnspecified && linked.includes(name)) return [
      {
        type: 'error',
        message: 'Age or date of birth must be specified',
      }
    ]

  }
}


// ...this.info.globalState.metadata,
// validateOnChange
