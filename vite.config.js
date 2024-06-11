/// <reference types='vitest' />
import { defineConfig } from "vite";
import ViteYaml from "@modyfi/vite-plugin-yaml";

export default defineConfig({
  plugins: [ViteYaml()],
  test: {
    environment: "jsdom",
    setupFiles: ["dotenv/config"],
    testTimeout: 4 * 60 * 1000,
  },
});
