import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: 'src/dist',
    lib: {
      entry: {
        index: 'src/index.js',
      },
      fileName: (_, name) => `${name}.js`,
      formats: ['es'],
    },
  },
});
