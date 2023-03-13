import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'index.js',
      fileName: () => 'index.js',
      formats: ['iife'],
    },
  },
});
