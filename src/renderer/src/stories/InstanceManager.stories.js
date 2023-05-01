import { InstanceManager } from "./InstanceManager";
import { Modal } from "./Modal";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Components/Instance Manager",
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};

const Template = (args) => new InstanceManager(args);

export const Primary = Template.bind({});

const instances = {
  thisisalongidentifier: {
    content: "This has no status",
  },
  thisisanevenlongeridentifierwithincorrectinfo: {
    content: "This is very wrong",
    status: "error",
  },
  "002": {
    content: "This is kinda right",
    status: "warning",
  },
  "003": {
    content: "This is done",
    status: "valid",
  },
};

const convertToElement = (_, o) => {
  const div = document.createElement("div");
  div.innerHTML = `${JSON.stringify(o)}`;
  return div;
};

const drillObjects = (o) => {
  const keys = Object.keys(o);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = o[key];
    if (typeof value === "object") drillObjects(value);
    else o[key] = convertToElement(key, value);
  }
  return o;
};

Primary.args = {
  header: "Subject One",
  controls: [
    {
      name: "Preview",
      onClick: function (key, el) {
        const parent = el.parentNode;
        const modal = new Modal({
          header: "Preview",
          open: true,
          onClose: () => {
            modal.remove();
            parent.append(el);
          },
        });
        modal.append(el);
        document.body.appendChild(modal);
      },
    },
  ],
  instances,
  onAdded: (path) => {
    return convertToElement(path.join("/"), `This is some text for a new key: ${path.join("/")}`);
  },
};
