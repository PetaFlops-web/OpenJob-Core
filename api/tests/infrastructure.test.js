import { describe, it, expect, beforeAll, afterAll } from "vitest";
import amqp from "amqplib";
import { createClient } from "redis";
import CacheService, { closeCacheService } from "../src/cache/redis.service.js";
import { connectRabbitMQ, getChannel, closeRabbitMQ, isChannelReady } from "../src/export/export.config.js";
import { sendMessage } from "../src/export/producer.js";
import logger from "../src/utils/logger.js";

// Probe availability once at module load, before any describe/it is collected.
const redisAvailable = await (async () => {
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      connectTimeout: 3000,
      reconnectStrategy: () => false,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });
  try {
    await client.connect();
    await client.quit();
    return true;
  } catch {
    return false;
  }
})();

const rabbitAvailable = await (async () => {
  try {
    const conn = await amqp.connect({
      hostname: process.env.RABBITMQ_HOST || "localhost",
      port: process.env.RABBITMQ_PORT || 5672,
      username: process.env.RABBITMQ_USERNAME || "guest",
      password: process.env.RABBITMQ_PASSWORD || "guest",
      vhost: process.env.RABBITMQ_VHOST || "/",
    });
    await conn.close();
    return true;
  } catch {
    return false;
  }
})();

if (!redisAvailable) logger.warn("Redis not available — skipping Redis tests");
if (!rabbitAvailable) logger.warn("RabbitMQ not available — skipping RabbitMQ tests");

describe("Infrastructure Services", () => {
  describe("Redis", () => {
    let redisClient;

    beforeAll(async () => {
      if (!redisAvailable) return;
      redisClient = createClient({
        socket: {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
          connectTimeout: 3000,
          reconnectStrategy: (retries) => {
            if (retries >= 2) return new Error("Redis reconnect limit reached");
            return Math.min(retries * 200, 1000);
          },
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });
      redisClient.on("error", (err) => logger.error("Redis error:", err));
      await redisClient.connect();
    });

    afterAll(async () => {
      if (redisClient?.isOpen) {
        await redisClient.quit();
      }
    });

    it.skipIf(!redisAvailable)("should connect to Redis successfully", async () => {
      expect(redisClient.isOpen).toBe(true);
    });

    it.skipIf(!redisAvailable)("should respond to PING command", async () => {
      const pong = await redisClient.ping();
      expect(pong).toBe("PONG");
    });

    it.skipIf(!redisAvailable)("should set and get a value", async () => {
      const testKey = "test:key";
      const testValue = "test-value-123";

      await redisClient.set(testKey, testValue, { EX: 10 });
      const retrieved = await redisClient.get(testKey);

      expect(retrieved).toBe(testValue);

      await redisClient.del(testKey);
    });

    it.skipIf(!redisAvailable)("should delete a key", async () => {
      const testKey = "test:delete";
      await redisClient.set(testKey, "value");

      const deleted = await redisClient.del(testKey);
      expect(deleted).toBe(1);

      const retrieved = await redisClient.get(testKey);
      expect(retrieved).toBeNull();
    });
  });

  describe("RabbitMQ", () => {
    let connection;
    let channel;

    beforeAll(async () => {
      if (!rabbitAvailable) return;
      connection = await amqp.connect({
        hostname: process.env.RABBITMQ_HOST || "localhost",
        port: process.env.RABBITMQ_PORT || 5672,
        username: process.env.RABBITMQ_USERNAME || "guest",
        password: process.env.RABBITMQ_PASSWORD || "guest",
        vhost: process.env.RABBITMQ_VHOST || "/",
      });
      channel = await connection.createChannel();
    });

    afterAll(async () => {
      if (channel) await channel.close().catch(() => {});
      if (connection) await connection.close().catch(() => {});
    });

    it.skipIf(!rabbitAvailable)("should connect to RabbitMQ successfully", async () => {
      expect(connection).toBeDefined();
      expect(channel).toBeDefined();
    });

    it.skipIf(!rabbitAvailable)("should assert and check a queue", async () => {
      const queueName = "test_queue_" + Date.now();
      const result = await channel.assertQueue(queueName, { durable: true });

      expect(result.queue).toBe(queueName);
      expect(result.messageCount).toBe(0);

      await channel.deleteQueue(queueName);
    });

    it.skipIf(!rabbitAvailable)("should send and receive a message", async () => {
      const queueName = "test_message_queue_" + Date.now();
      await channel.assertQueue(queueName, { durable: true });

      const testMessage = { test: "data", timestamp: Date.now() };
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(testMessage)), {
        persistent: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const msg = await channel.get(queueName, { noAck: true });
      expect(msg).toBeDefined();
      expect(JSON.parse(msg.content.toString())).toEqual(testMessage);

      await channel.deleteQueue(queueName);
    });

    it.skipIf(!rabbitAvailable)("should check RabbitMQ management API (if available)", async () => {
      const managementPort = process.env.RABBITMQ_MGMT_PORT || 15672;

      try {
        const response = await fetch(
          `http://localhost:${managementPort}/api/overview`,
          {
            headers: {
              Authorization: "Basic " + Buffer.from("guest:guest").toString("base64"),
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          expect(data.rabbitmq_version).toBeDefined();
        } else {
          logger.log("RabbitMQ Management API not accessible (optional)");
        }
      } catch {
        logger.log("RabbitMQ Management API not available (optional)");
      }
    });
  });

  describe("App CacheService", () => {
    afterAll(async () => {
      await closeCacheService();
    });

    it.skipIf(!redisAvailable)("should set and get a value through the app CacheService", async () => {
      const cache = new CacheService();
      const key = `app-cache-test-${Date.now()}`;
      const value = JSON.stringify({ ok: true, ts: Date.now() });

      await cache.set(key, value, 10);
      const result = await cache.get(key);

      expect(result).toBe(value);

      await cache.delete(key);
    });

    it.skipIf(!redisAvailable)("should return null for missing key", async () => {
      const cache = new CacheService();
      const result = await cache.get(`missing-key-${Date.now()}`);
      expect(result).toBeNull();
    });

    it.skipIf(!redisAvailable)("should delete a key and return 1 for existing", async () => {
      const cache = new CacheService();
      const key = `app-delete-test-${Date.now()}`;
      await cache.set(key, "val", 10);

      const delResult = await cache.delete(key);
      expect(delResult).toBe(1);

      const after = await cache.get(key);
      expect(after).toBeNull();
    });

    it.skipIf(!redisAvailable)("should return 0 when deleting a non-existent key", async () => {
      const cache = new CacheService();
      const delResult = await cache.delete(`nonexistent-${Date.now()}`);
      expect(delResult).toBe(0);
    });
  });

  describe("App Producer & Consumer", () => {
    let appChannel;

    beforeAll(async () => {
      if (!rabbitAvailable) return;
      await connectRabbitMQ();
      appChannel = getChannel();
    });

    afterAll(async () => {
      await closeRabbitMQ().catch(() => {});
    });

    it.skipIf(!rabbitAvailable)("should report channel ready after connect", () => {
      expect(isChannelReady()).toBe(true);
    });

    it.skipIf(!rabbitAvailable)("should publish a message through app producer and receive it", async () => {
      const queueName = `app_producer_test_${Date.now()}`;
      const testPayload = { test: "app-producer", ts: Date.now() };

      await sendMessage(queueName, testPayload);

      const msg = await appChannel.get(queueName, { noAck: true });
      expect(msg).toBeTruthy();
      expect(JSON.parse(msg.content.toString())).toEqual(testPayload);

      await appChannel.deleteQueue(queueName);
    });

    it.skipIf(!rabbitAvailable)("should consume and ack a message correctly", async () => {
      const queueName = `app_consumer_ack_test_${Date.now()}`;
      const testPayload = { application_id: "app-test-123" };

      await sendMessage(queueName, testPayload);

      const msg = await appChannel.get(queueName, { noAck: false });
      expect(msg).toBeTruthy();
      appChannel.ack(msg);

      const msg2 = await appChannel.get(queueName, { noAck: true });
      expect(msg2).toBeFalsy();

      await appChannel.deleteQueue(queueName);
    });
  });
});
