import { Button } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: 'Components/Button',
  tags: ['autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false },
  },
  argTypes: {
    backgroundColor: { control: 'color' },
    onClick: { action: 'onClick' },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
  },
};


const Template = (args) => new Button(args);

export const Primary = Template.bind({});

const base = {
  label: 'Button',
}

Primary.args = {
    ...base,
    primary: true,
}

export const Secondary = Template.bind({});

Secondary.args = {...base}

export const Large = Template.bind({});

Large.args = {
  ...base,
  size: 'large'
};

export const Small = Template.bind({});

Small.args = {
  ...base,
  size: 'small',
};
