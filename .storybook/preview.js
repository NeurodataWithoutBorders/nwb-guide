/** @type { import('@storybook/web-components').Preview } */
const preview = {
  parameters: {
    chromatic: { disableSnapshot: true },
    backgrounds: {
      default: "light",
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
