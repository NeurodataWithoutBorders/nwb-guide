import { dashboard } from '../../pages.js';

// const options = Object.keys(dashboard.pagesById)

export default {
  title: 'Pages',
  parameters: {
    chromatic: { disableSnapshot: false },
  },
  // argTypes: {
  //   activePage: {
  //     options,
  //     control: { type: 'select' }
  //    },
  // },
};


const Template = (args = {}) => {
  for (let k in args) dashboard.setAttribute(k, args[k])
  return dashboard
};

export const Overview = Template.bind({});
Overview.args = {
  activePage: '/'
}


export const Documentation = Template.bind({});
Documentation.args = {
  activePage: 'docs'
}

export const Contact = Template.bind({});
Contact.args = {
  activePage: 'contact'
}
