import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class InterviewsRepository {

  async addInterview(payload) {
    const id = `interview-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO interviews(id, company_id, user_id, job_id, application_id, scheduled_at, duration_minutes, interview_type, location, meeting_link, meeting_platform, notes, status, created_by)
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING id`,
      values: [
        id,
        payload.company_id,
        payload.user_id,
        payload.job_id,
        payload.application_id || null,
        payload.scheduled_at,
        payload.duration_minutes || 60,
        payload.interview_type || null,
        payload.location || null,
        payload.meeting_link || null,
        payload.meeting_platform || null,
        payload.notes || null,
        payload.status || "scheduled",
        payload.created_by,
      ],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async updateInterview(id, payload) {
    const fields = [];
    const values = [];
    let index = 1;

    if (payload.scheduled_at !== undefined) {
      fields.push(`scheduled_at = $${index++}`);
      values.push(payload.scheduled_at);
    }
    if (payload.duration_minutes !== undefined) {
      fields.push(`duration_minutes = $${index++}`);
      values.push(payload.duration_minutes);
    }
    if (payload.location !== undefined) {
      fields.push(`location = $${index++}`);
      values.push(payload.location);
    }
    if (payload.interview_type !== undefined) {
      fields.push(`interview_type = $${index++}`);
      values.push(payload.interview_type);
    }
    if (payload.meeting_link !== undefined) {
      fields.push(`meeting_link = $${index++}`);
      values.push(payload.meeting_link);
    }
    if (payload.meeting_platform !== undefined) {
      fields.push(`meeting_platform = $${index++}`);
      values.push(payload.meeting_platform);
    }
    if (payload.notes !== undefined) {
      fields.push(`notes = $${index++}`);
      values.push(payload.notes);
    }
    if (payload.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(payload.status);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = {
      text: `UPDATE interviews SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${index} RETURNING id`,
      values,
    };

    const result = await pool.query(query);
    return result.rows[0]?.id || null;
  }

  async deleteInterview(id) {
    const query = { text: "DELETE FROM interviews WHERE id = $1 RETURNING id", values: [id] };
    const result = await pool.query(query);
    return result.rows[0]?.id || null;
  }

  async getInterviewById(id) {
    const query = { text: "SELECT * FROM interviews WHERE id = $1", values: [id] };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async getInterviewsByCompany(companyId) {
    const query = {
      text: "SELECT * FROM interviews WHERE company_id = $1 ORDER BY scheduled_at DESC",
      values: [companyId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getInterviewsByUser(userId) {
    const query = {
      text: "SELECT * FROM interviews WHERE user_id = $1 ORDER BY scheduled_at DESC",
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getInterviewsByApplication(applicationId) {
    const query = {
      text: "SELECT * FROM interviews WHERE application_id = $1 ORDER BY scheduled_at DESC",
      values: [applicationId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async checkConflicts(companyId, scheduledAt, durationMinutes, excludeId) {
    const query = {
      text: `SELECT COUNT(*) as count FROM interviews
             WHERE company_id = $1
             AND status NOT IN ('cancelled', 'completed')
             AND (scheduled_at, scheduled_at + (duration_minutes || ' minutes')::INTERVAL)
                 OVERLAPS ($2::TIMESTAMP, $2::TIMESTAMP + ($3 || ' minutes')::INTERVAL)
             ${excludeId ? "AND id != $4" : ""}`,
      values: excludeId
        ? [companyId, scheduledAt, durationMinutes, excludeId]
        : [companyId, scheduledAt, durationMinutes],
    };
    const result = await pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  async addReminder(payload) {
    const id = `reminder-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO interview_reminders(id, interview_id, reminder_type) VALUES($1, $2, $3) RETURNING id",
      values: [id, payload.interview_id, payload.reminder_type],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getPendingReminders() {
    const query = {
      text: `SELECT ir.*, i.scheduled_at, i.user_id, i.company_id
             FROM interview_reminders ir
             JOIN interviews i ON i.id = ir.interview_id
             WHERE ir.sent_at IS NULL AND i.scheduled_at > NOW()`,
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async markReminderSent(id) {
    const query = {
      text: "UPDATE interview_reminders SET sent_at = NOW() WHERE id = $1 RETURNING id",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id || null;
  }

  async completeInterview(id) {
    const query = {
      text: "UPDATE interviews SET status = 'completed', updated_at = NOW() WHERE id = $1 RETURNING id",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id || null;
  }

  async markNoShow(id) {
    const query = {
      text: "UPDATE interviews SET status = 'no_show', updated_at = NOW() WHERE id = $1 RETURNING id",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id || null;
  }
}

export default new InterviewsRepository();
