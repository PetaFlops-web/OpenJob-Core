import app from "./src/app.js";
import setupWebSocket from "./src/ws/websocket.js";
import "dotenv/config";
import { connectRabbitMQ, closeRabbitMQ } from "./src/export/export.config.js";
import { initI18n } from "./src/i18n/setup.js";
import logger from "./src/utils/logger.js";

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || 3000;

const startServer = async () => {
  await initI18n();
  await connectRabbitMQ();

  const server = app.listen(port, () => {
    logger.log(JSON.stringify({
      level: "info",
      type: "startup",
      timestamp: new Date().toISOString(),
      message: `Server running on http://${host}:${port}`,
      environment: process.env.NODE_ENV || "development",
      docs: `http://${host}:${port}/docs`,
      health: `http://${host}:${port}/health`,
    }),);
  });
  await setupWebSocket(server);

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.log(JSON.stringify({
      level: "info",
      type: "shutdown",
      signal,
      timestamp: new Date().toISOString(),
      message: "Received shutdown signal, gracefully closing...",
    }),);

    server.close(async () => {
      await closeRabbitMQ();
      logger.log("Server shut down gracefully.");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();
