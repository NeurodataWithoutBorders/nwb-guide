import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.js',
      },
      fileName: (_, name) => `${name}.js`,
      formats: ['es'],
    },
    minify: false
  },
});
