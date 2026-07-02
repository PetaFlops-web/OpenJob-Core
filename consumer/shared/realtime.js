import { createClient } from "redis";
import logger from "./logger.js";

let _publisher = null;

const getRedisUrl = () => {
  const pass = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : "";
  return process.env.REDIS_URL || `redis://${pass}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
};

const getPublisher = async () => {
  if (_publisher?.isOpen) return _publisher;

  _publisher = createClient({ url: getRedisUrl() });
  _publisher.on("error", (err) => {
    logger.warn("Realtime publisher Redis error:", err.message);
  });

  await _publisher.connect();
  return _publisher;
};

export const publishRealtimeEvent = async ({ room, event, payload }) => {
  try {
    const publisher = await getPublisher();
    await publisher.publish("websocket_events", JSON.stringify({
      room,
      event,
      payload,
    }));
  } catch (err) {
    logger.warn("Realtime publish failed:", err.message);
  }
};

export const closeRealtimePublisher = async () => {
  if (_publisher?.isOpen) {
    await _publisher.quit();
  }
};

export const createRealtimePayload = ({ id, type, message, ...data }) => ({
  id,
  type,
  message,
  created_at: new Date().toISOString(),
  data,
  ...data,
});