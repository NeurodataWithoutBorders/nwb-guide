import { defineConfig } from "electron-vite";

import ViteYaml from "@modyfi/vite-plugin-yaml";

import { resolve } from "path";

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
        root: "./src/electron/renderer",
        plugins: [ViteYaml()],
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, "index.html"),
                },
            },
        },
    },
});
