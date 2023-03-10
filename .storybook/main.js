/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: ["../frontend/**/*.mdx", "../frontend/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  framework: {
    name: "@storybook/web-components-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
