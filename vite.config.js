/// <reference types='vitest' />
import { defineConfig } from "vite";
import ViteYaml from "@modyfi/vite-plugin-yaml";

export default defineConfig({
    plugins: [ViteYaml()],
    test: {
        environment: "jsdom",
        setupFiles: ["dotenv/config"],
        testTimeout: 4 * 60 * 1000,
        coverage: {
            include: ["src"],
            exclude: [
                "**/assets",

                // No Electron code should be tested
                "**/electron/main",
                "**/electron/preload",

                // No test for the rendered pages (composed of components)
                "**/components/pages",

                // Most of the code is conditionally run (Electron only)
                "src/schemas/dandi-upload.schema.ts",
                "src/schemas/interfaces.info.ts",
                "src/schemas/timezone.schema.ts",
                "src/electron/frontend/utils/electron.js",
                "src/electron/frontend/utils/auto-update.js"
            ],
        }
    },
});
