import pool from "../database/pool.js";
import { createClient } from "redis";
import { isChannelReady } from "../export/export.config.js";

/**
 * GET /health
 *
 * Returns the health status of the API and all dependent services:
 * - PostgreSQL (database)
 * - Redis (cache)
 * - RabbitMQ (message broker)
 *
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns the status of the API and all dependent services (database, cache, message broker)
 *     security: []
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: One or more services are down
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */

let redisClient = null;

const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) return redisClient;
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });
  redisClient.on("error", () => { redisClient = null; });
  await redisClient.connect();
  return redisClient;
};

const checkDatabase = async () => {
  try {
    const result = await pool.query("SELECT 1");
    return result.rowCount === 1 ? "up" : "down";
  } catch {
    return "down";
  }
};

const checkRedis = async () => {
  try {
    const client = await getRedisClient();
    const pong = await client.ping();
    return pong === "PONG" ? "up" : "down";
  } catch {
    redisClient = null;
    return "down";
  }
};

const checkRabbitMQ = () => {
  return isChannelReady() ? "up" : "down";
};

const healthCheckHandler = async (req, res) => {
  const [dbStatus, redisStatus, rabbitmqStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    Promise.resolve(checkRabbitMQ()),
  ]);

  const services = {
    database: dbStatus,
    redis: redisStatus,
    rabbitmq: rabbitmqStatus,
  };

  const allUp = Object.values(services).every((s) => s === "up");

  res.status(allUp ? 200 : 503).json({
    status: allUp ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services,
  });
};

export default healthCheckHandler;
