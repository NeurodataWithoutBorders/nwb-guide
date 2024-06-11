import { InstanceManager } from "../../src/electron/frontend/core/components/InstanceManager";
import { Modal } from "../../src/electron/frontend/core/components/Modal";

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
  category: {
    item: {
      content: "This is nested",
      status: "valid",
    },
  },
};

const convertToElement = (_, object) => {
  const div = document.createElement("div");
  div.innerHTML = `${JSON.stringify(object)}`;
  return div;
};

const drillObjects = (object) => {
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = object[key];
    if (typeof value === "object") drillObjects(value);
    else object[key] = convertToElement(key, value);
  }
  return object;
};

Primary.args = {
  header: "Subject One",
  controls: [
    {
      name: "Preview",
      onClick: function (key, contentElement) {
        const parent = contentElement.parentNode;
        const modal = new Modal({
          header: "Preview",
          open: true,
          onClose: () => {
            modal.remove();
            parent.append(contentElement);
          },
        });
        modal.append(contentElement);
        document.body.appendChild(modal);
      },
    },
  ],
  instances,
  onAdded: (path) => {
    return convertToElement(
      path.join("/"),
      `This is some text for a new key: ${path.join("/")}`,
    );
  },
};
