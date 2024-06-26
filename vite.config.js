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

                // Server Communication
                "src/electron/frontend/core/server",
                "src/electron/frontend/utils/run.ts",
                "src/electron/frontend/utils/progress.ts",

                // Pure Native Rendering Interaction
                "src/electron/frontend/utils/table.ts",

                // High-Level App Configuration
                "src/electron/frontend/core/index.ts",
                "src/electron/frontend/core/pages.js",
                "src/electron/frontend/core/notifications.ts",
                "src/electron/frontend/core/lotties.ts",
                "src/electron/frontend/core/globals.js",
                "src/electron/frontend/core/errors.ts",

                // Dashboard-Related Components
                "src/electron/frontend/core/components/Dashboard.js",
                "src/electron/frontend/core/components/Main.js",
                "src/electron/frontend/core/components/Footer.js",
                "src/electron/frontend/core/components/NavigationSidebar.js",
                "src/electron/frontend/core/components/StatusBar.js",
                "src/electron/frontend/core/components/sidebar.js",

                // Just rendering
                "src/electron/frontend/core/components/CodeBlock.js",

                // Depends on server communication
                "src/electron/frontend/core/components/NWBFilePreview.js",

                // Unclear how to test
                "src/electron/frontend/utils/popups.ts",
                "src/electron/frontend/utils/download.ts",
                "src/electron/frontend/utils/upload.ts",
                "src/electron/frontend/core/components/FileSystemSelector.js", // Uses Electron dialog
                "src/electron/frontend/core/components/DandiResults.js", // Needs DANDI API Key and network access (unless possibly with a static mocked response)
            ],
        },
    },
});
