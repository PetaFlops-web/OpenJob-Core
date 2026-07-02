import { getChannel, isChannelReady } from "./export.config.js";
import logger from "../utils/logger.js";

export const sendMessage = async (queue, message) => {
  if (!isChannelReady()) throw new Error("RabbitMQ channel not ready");
  const channel = getChannel();
  await channel.assertQueue(queue, { durable: true });

  return new Promise((resolve, reject) => {
    const ok = channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    if (!ok) {
      // write buffer full — wait for drain before confirming
      channel.once("drain", () => {
        channel.waitForConfirms()
          .then(() => {
            logger.log(`Message confirmed on queue "${queue}":`, message);
            resolve();
          })
          .catch(reject);
      });
    } else {
      channel.waitForConfirms()
        .then(() => {
          logger.log(`Message confirmed on queue "${queue}":`, message);
          resolve();
        })
        .catch(reject);
    }
  });
};
