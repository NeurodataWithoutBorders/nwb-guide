/// <reference types='vitest' />
import { defineConfig } from "vite";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ["dotenv/config"],
        testTimeout: 3 *60 * 1000,
    },
});
