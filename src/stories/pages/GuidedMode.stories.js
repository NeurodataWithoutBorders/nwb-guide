import { dashboard } from '../../pages.js';

const options = Object.keys(dashboard.pagesById).filter(k => k.includes('guided'))

export default {
  title: 'Pages/Guided Mode',
  parameters: {
    chromatic: { disableSnapshot: false },
  },
  argTypes: {
    activePage: {
      options,
      control: { type: 'select' }
     },
  },
};

const globalState = {
  project: {},
  metadata: {
    schema: {
      properties: {
        Subject: {
          type: 'object',
          properties: {
            subject_id: {
              type: 'string',
              description: 'Enter a subject ID.',
            },
            species: {
              type: 'string',
              description: 'Enter a common species for your subjects.', 
            },
            age: {
              type: 'number',
              description: 'The age of the subject'
            },
            date_of_birth: {
              type: 'string',
              description: 'The date of birth of the subject'
            }
          },
          required: ['subject_id']
        }
      }
    }
  }
}


const Template = (args = {}) => {
  for (let k in args) dashboard[k] = args[k]
  return dashboard
};

export const Home = Template.bind({});
Home.args = {
  activePage: 'guided'
}


export const Start = Template.bind({});
Start.args = {
  activePage: 'guided/start'
}

export const NewDataset = Template.bind({});
NewDataset.args = {
  activePage: 'guided/details'
}

export const Structure = Template.bind({});
Structure.args = {
  activePage: 'guided/structure'
}

export const SourceData = Template.bind({});
SourceData.args = {
  activePage: 'guided/sourcedata'
}

export const Metadata = Template.bind({});
Metadata.args = {
  activePage: 'guided/metadata',
  // globalState
}
Metadata.args.globalState = globalState

export const ConversionOptions = Template.bind({});
ConversionOptions.args = {
  activePage: 'guided/options'
}

export const StubPreview = Template.bind({});
StubPreview.args = {
  activePage: 'guided/preview'
}

export const Results = Template.bind({});
Results.args = {
  activePage: 'guided/review'
}
