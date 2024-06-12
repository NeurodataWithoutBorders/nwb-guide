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

                // No test for the rendered pages, as they're composed of components
                "**/components/pages",

                // Electron Only (for the most part)
                "src/schemas/dandi-upload.schema.ts",
                "src/schemas/interfaces.info.ts",
                "src/schemas/timezone.schema.ts",
                "src/electron/frontend/utils/electron.ts",
                "src/electron/frontend/utils/auto-update.ts",

                // High-Level App Configuration
                "src/electron/frontend/core/index.ts",
                "src/electron/frontend/core/pages.js",
                "src/electron/frontend/core/dependencies.js",
                "src/electron/frontend/core/globals.js",
                "src/electron/frontend/core/errors.ts",

                // Server Communication
                "src/electron/frontend/core/server",
                "src/electron/frontend/utils/run.ts",
                "src/electron/frontend/utils/progress.ts",

                // Pure Native Rendering Interaction
                "src/electron/frontend/utils/table.ts",

                // Unclear how to test
                "src/electron/frontend/utils/popups.ts",
                "src/electron/frontend/utils/download.ts",
                "src/electron/frontend/utils/upload.ts",

            ],
        },
    },
});
