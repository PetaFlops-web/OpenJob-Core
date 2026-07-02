import pg from "pg";
import MailSender from "./MailSender.js";
import { publishRealtimeEvent } from "./shared/realtime.js";
import { createRealtimePayload } from "./shared/realtime.js";

class InterviewReminderService {
  constructor() {
    this._pool = new pg.Pool();
    this._mailSender = new MailSender();
  }

  async processReminders() {
    const now = new Date();

    const query = {
      text: `
        SELECT ir.*, iv.scheduled_at, iv.user_id AS applicant_id,
               u.email AS user_email, u.name AS user_name,
               j.title AS job_title, c.name AS company_name
        FROM interview_reminders ir
        JOIN interviews iv ON ir.interview_id = iv.id
        JOIN users u ON iv.user_id = u.id
        JOIN jobs j ON iv.job_id = j.id
        JOIN companies c ON iv.company_id = c.id
        WHERE ir.reminder_sent = false
          AND iv.status = 'scheduled'
        ORDER BY iv.scheduled_at
      `,
    };

    const result = await this._pool.query(query);
    const reminders = result.rows;

    for (const reminder of reminders) {
      const scheduledAt = new Date(reminder.scheduled_at);
      const timeUntil = scheduledAt.getTime() - now.getTime();
      const minutesUntil = timeUntil / (1000 * 60);

      let shouldSend = false;
      let reminderLabel = "";

      if (reminder.reminder_type === "24h" && minutesUntil <= 24 * 60 && minutesUntil > 0) {
        shouldSend = true;
        reminderLabel = "24 jam";
      } else if (reminder.reminder_type === "1h" && minutesUntil <= 60 && minutesUntil > 0) {
        shouldSend = true;
        reminderLabel = "1 jam";
      } else if (reminder.reminder_type === "15m" && minutesUntil <= 15 && minutesUntil > 0) {
        shouldSend = true;
        reminderLabel = "15 menit";
      }

      if (shouldSend) {
        const formattedDate = scheduledAt.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const formattedTime = scheduledAt.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await this._sendReminderEmail(
          reminder,
          reminderLabel,
          formattedDate,
          formattedTime,
        );

        await publishRealtimeEvent({
          room: `user:${reminder.applicant_id}`,
          event: "interview_reminder",
          payload: createRealtimePayload({
            id: reminder.interview_id,
            type: "interview_reminder",
            message: `Interview reminder (${reminderLabel}): ${reminder.job_title}`,
            interview_id: reminder.interview_id,
            job_id: reminder.job_id,
            scheduled_at: reminder.scheduled_at,
          }),
        });

        await this._markReminderSent(reminder.id);
      }
    }
  }

  async _sendReminderEmail(reminder, reminderLabel, formattedDate, formattedTime) {
    const subject = `Pengingat Interview: ${reminder.job_title}`;
    const html = `
      <h2>Pengingat Interview</h2>
      <p>Interview Anda untuk posisi <strong>${reminder.job_title}</strong> di <strong>${reminder.company_name}</strong> akan dimulai dalam <strong>${reminderLabel}</strong>.</p>
      <table>
        <tr><td>Tanggal</td><td>: ${formattedDate}</td></tr>
        <tr><td>Waktu</td><td>: ${formattedTime}</td></tr>
      </table>
      <p>Mohon persiapkan diri Anda.</p>
    `;

    await this._mailSender.sendEmailGeneric(reminder.user_email, subject, html);
  }

  async _markReminderSent(reminderId) {
    const query = {
      text: "UPDATE interview_reminders SET reminder_sent = true WHERE id = $1",
      values: [reminderId],
    };

    await this._pool.query(query);
  }
}

export default InterviewReminderService;