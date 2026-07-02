import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class NotificationsRepository {

  async addNotification(payload) {
    const id = `notif-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO notifications(id, user_id, type, title, message, data) VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
      values: [id, payload.user_id, payload.type, payload.title, payload.message, payload.data ? JSON.stringify(payload.data) : null],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getNotificationsByUser(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const countQuery = {
      text: "SELECT COUNT(*) AS total FROM notifications WHERE user_id = $1",
      values: [userId],
    };
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total, 10);

    const query = {
      text: "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      values: [userId, limit, offset],
    };
    const result = await pool.query(query);

    return {
      rows: result.rows,
      total,
    };
  }

  async getUnreadCount(userId) {
    const query = {
      text: "SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND read = false",
      values: [userId],
    };
    const result = await pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  async markAsRead(id) {
    const query = {
      text: "UPDATE notifications SET read = true, read_at = NOW() WHERE id = $1 RETURNING id",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id;
  }

  async markAllAsRead(userId) {
    const query = {
      text: "UPDATE notifications SET read = true, read_at = NOW() WHERE user_id = $1 AND read = false RETURNING id",
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows.map((row) => row.id);
  }

  async deleteNotification(id) {
    const query = {
      text: "DELETE FROM notifications WHERE id = $1 RETURNING id",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id;
  }

  async getNotificationById(id) {
    const query = {
      text: "SELECT * FROM notifications WHERE id = $1",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async getPreferences(userId) {
    const query = {
      text: "SELECT * FROM notification_preferences WHERE user_id = $1",
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async upsertPreferences(userId, payload) {
    const fields = [];
    const values = [];
    const placeholders = [];
    let index = 1;

    // Always include user_id
    values.push(userId);
    placeholders.push(`$${index++}`);

    const allowedFields = ["email_application", "email_interview", "push_application", "push_interview", "websocket_enabled"];

    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        fields.push(field);
        values.push(payload[field]);
        placeholders.push(`$${index++}`);
      }
    }

    if (fields.length === 0) return this.getPreferences(userId);

    const columns = ["user_id", ...fields];
    const insertPlaceholders = placeholders.map((p, i) => {
      if (i === 0) return p;
      return p;
    });

    const updateSet = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");

    const query = {
      text: `INSERT INTO notification_preferences(${columns.join(", ")}) VALUES(${insertPlaceholders.join(", ")}) ON CONFLICT (user_id) DO UPDATE SET ${updateSet} RETURNING *`,
      values,
    };

    const result = await pool.query(query);
    return result.rows[0];
  }
}

export default new NotificationsRepository();
