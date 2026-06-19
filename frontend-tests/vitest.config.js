import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["**/*.test.js"],
  },
  resolve: {
    alias: {
      "@static": path.resolve(__dirname, "../src/main/resources/static"),
    },
  },
});
