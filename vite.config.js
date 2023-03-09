import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'nwb-guide.js',
      fileName: () => 'nwb-guide.js',
      formats: ['iife'],
    },
  },
});
