import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env"), quiet: true });

import { connectRabbitMQ, getChannel } from "./shared/rabbitmq.js";
import ApplicationService from "./application.service.js";
import MailSender from "./MailSender.js";
import Listener from "./Listener.js";
import logger from "./shared/logger.js";
import InterviewReminderService from "./interview-reminder.service.js";

const startConsumer = async () => {
  await connectRabbitMQ();

  const channel = getChannel();
  const queue = "application_created";

  const listener = new Listener(new ApplicationService(), new MailSender());

  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(1);

  logger.log(`Consumer listening on queue "${queue}"...`);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      await listener.listen(msg);
      channel.ack(msg);
    } catch (error) {
      logger.error("Failed to process message:", error.message);
      if (msg.fields.redelivered) {
        channel.nack(msg, false, false);
      } else {
        channel.nack(msg, false, true);
      }
    }
  });

  const interviewQueue = "interview_scheduled";
  await channel.assertQueue(interviewQueue, { durable: true });
  channel.consume(interviewQueue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      logger.log("Interview scheduled event received:", payload);
      channel.ack(msg);
    } catch (error) {
      logger.error("Failed to process interview_scheduled:", error.message);
      if (msg.fields.redelivered) {
        channel.nack(msg, false, false);
      } else {
        channel.nack(msg, false, true);
      }
    }
  });
  logger.log(`Consumer listening on queue "${interviewQueue}"...`);

  const reminderService = new InterviewReminderService();
  const REMINDER_INTERVAL = 5 * 60 * 1000;

  const pollReminders = async () => {
    try {
      await reminderService.processReminders();
    } catch (error) {
      logger.error("Interview reminder poll failed:", error.message);
    }
  };

  await pollReminders();
  setInterval(pollReminders, REMINDER_INTERVAL);
  logger.log("Interview reminder polling started (interval: 5m)");
};

startConsumer();