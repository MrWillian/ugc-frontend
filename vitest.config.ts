import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": path.join(rootDir, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    // e2e/ holds Playwright specs; they are run by `npm run e2e`, not vitest.
    exclude: ["**/node_modules/**", "**/.worktrees/**", "**/dist/**", "e2e/**"],
  },
});
