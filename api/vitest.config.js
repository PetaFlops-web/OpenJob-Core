import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.js"],
    env: {
      PGHOST: "localhost",
      PGPORT: "5433",
      PGDATABASE: "openjob_db",
      PGUSER: "openjob",
      PGPASSWORD: "openjob",
      ACCESS_TOKEN_KEY: "test-access-token-secret-min-32-characters",
      REFRESH_TOKEN_KEY: "test-refresh-token-secret-min-32-characters",
      REDIS_HOST: "localhost",
      REDIS_PORT: "6380",
      REDIS_PASSWORD: "openjob_redis_secret",
      RABBITMQ_HOST: "localhost",
      RABBITMQ_PORT: "5673",
      RABBITMQ_USERNAME: "guest",
      RABBITMQ_PASSWORD: "guest",
      RABBITMQ_VHOST: "/",
    },
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
