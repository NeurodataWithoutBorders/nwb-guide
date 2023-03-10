import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: 'frontend/index.js',
      name: 'nwb-guide.js',
      fileName: () => 'nwb-guide.js',
      formats: ['iife'],
    },
  },

  server: {
    open: 'index.html'
  }
});
