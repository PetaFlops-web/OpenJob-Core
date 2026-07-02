import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.js"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      include: ["src/**/*.js"],
      exclude: [
        "src/middlewares/**",
        "src/routes/**",
        "src/swagger.js",
        "src/documents/storage/**",
      ],
    },
    testTimeout: 10000,
  },
});
