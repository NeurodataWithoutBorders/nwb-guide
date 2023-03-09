import { MultiSelectForm } from './multiselect/index.js';

export default {
  title: 'Example/Multiselect Form'
};

const Template = (args) => new MultiSelectForm(args);

export const Default = Template.bind({});
Default.args = {
  header: "Test Header",
  options: {
    option1: {
      name: 'Option 1',
      modality: 'Modality 1',
      technique: 'Technique 1',
    },
    
    option2: {
      name: 'Option 2',
      modality: 'Modality 1',
      technique: 'Technique 1',
    },

    otheroption1: {
      name: 'Other Option 1',
      modality: 'Modality 2',
      technique: 'Technique 1',
    }
  }
};
