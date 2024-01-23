import type { StorybookConfig } from '@storybook/web-components-vite';

import ViteYaml from "@modyfi/vite-plugin-yaml";

const config: StorybookConfig = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
    addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
    framework: {
        name: "@storybook/web-components-vite",
        options: {},
    },
    docs: {
        autodocs: "tag",
    },
  async viteFinal(config, { configType }) {

    config.plugins.push(ViteYaml()) // Add YAML Loader to vite config

    return config
  },
};

export default config;