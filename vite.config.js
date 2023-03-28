import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "frontend/dist",
    lib: {
      entry: {
        index: 'frontend/index.js',
      },
      fileName: (_, name) => `${name}.js`,
      formats: ['es'],
    },
  },
});
