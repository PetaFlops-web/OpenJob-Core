import amqp from 'amqplib';
import logger from "../utils/logger.js";

let connection = null;
let channel = null;
let _ready = false;

export const connectRabbitMQ = async () => {
  connection = await amqp.connect({
    hostname: process.env.RABBITMQ_HOST || "localhost",
    port: process.env.RABBITMQ_PORT || 5672,
    username: process.env.RABBITMQ_USERNAME || "guest",
    password: process.env.RABBITMQ_PASSWORD || "guest",
    vhost: process.env.RABBITMQ_VHOST || "/",
  });

  connection.on("close", () => {
    _ready = false;
    logger.warn("RabbitMQ connection closed");
  });

  connection.on("error", (err) => {
    _ready = false;
    logger.error("RabbitMQ connection error:", err.message);
  });

  channel = await connection.createConfirmChannel();
  _ready = true;
  return channel;
};

export const isChannelReady = () => _ready && channel !== null;

export const getChannel = () => {
  if (!_ready || !channel) throw new Error("RabbitMQ channel not ready");
  return channel;
};

export const closeRabbitMQ = async () => {
  _ready = false;
  await channel?.close();
  await connection?.close();
};
