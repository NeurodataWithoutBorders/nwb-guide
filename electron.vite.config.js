import { defineConfig } from "electron-vite";

import ViteYaml from '@modyfi/vite-plugin-yaml';


// electron.vite.config.js
export default defineConfig({
    main: {},
    preload: {},
    renderer: {
        plugins: [ViteYaml()]
    },
});
