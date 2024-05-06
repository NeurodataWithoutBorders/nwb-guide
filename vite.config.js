/// <reference types='vitest' />
import { defineConfig } from "vite";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ["dotenv/config"],
        testTimeout: 4 * 60 * 1000,
    },
});
