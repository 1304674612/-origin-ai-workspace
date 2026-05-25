import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@origin/ui": resolve(__dirname, "packages/ui/src"),
      "@origin/shared": resolve(__dirname, "packages/shared/src"),
      "@origin/config": resolve(__dirname, "packages/config/src"),
    },
  },
});
