import { InstanceManager } from './InstanceManager';

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: 'Components/Instance Manager',
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};


const Template = (args) => new InstanceManager(args);

export const Primary = Template.bind({});

const instances = {
  '001': 'This is some text 1',
}

const convertToElement = (_, o) => {
  const div = document.createElement('div')
  div.innerHTML = `${JSON.stringify(o)}`
  return div
}

const drillObjects = (o) => {
  const keys = Object.keys(o)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = o[key]
    if (typeof value === 'object') drillObjects(value)
    else o[key] = convertToElement(key, value)
  }
  return o
}

Primary.args = {
    header: 'Subject One',
    instances,
    onAdded: (path) => {
      return convertToElement(path.join('/'), `This is some text for a new key: ${path.join('/')}`)
    }
}