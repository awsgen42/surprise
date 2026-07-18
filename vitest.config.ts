import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for the render-agnostic logic layer (Master Plan §7). The Playwright
// visual/integration harness lives in tooling/ and runs separately.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // store/save tests opt into jsdom via a per-file // @vitest-environment comment
  },
});
