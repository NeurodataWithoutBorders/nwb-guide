import { defineConfig } from "electron-vite";

import ViteYaml from "@modyfi/vite-plugin-yaml";

import { resolve } from "path";

const htmlRoot = "src/electron/frontend";

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/electron/main/main.ts"),
        },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/electron/preload/preload.js"),
        },
      },
    },
  },
  renderer: {
    root: `./${htmlRoot}`,
    plugins: [ViteYaml()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, htmlRoot, "index.html"),
        },
        output: {
          dir: resolve(__dirname, "build", "renderer"),
        },
      },
    },
  },
});
