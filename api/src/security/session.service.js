import i18next from "i18next";
import pool from "../database/pool.js";
import { NotFoundError } from "../exceptions/index.js";


const getSessions = async (userId) => {
  const query = {
    text: "SELECT id, user_id, device_info, ip_address, location, is_active, created_at, last_active_at FROM user_sessions WHERE user_id = $1 AND is_active = true ORDER BY last_active_at DESC",
    values: [userId],
  };
  const result = await pool.query(query);
  return result.rows;
};

const revokeSession = async (sessionId, userId) => {
  const query = {
    text: "UPDATE user_sessions SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING id",
    values: [sessionId, userId],
  };
  const result = await pool.query(query);
  if (!result.rows[0]) throw new NotFoundError(i18next.t("error.notFound", { resource: i18next.t("resource.session") }));
  return result.rows[0].id;
};

const revokeOtherSessions = async (userId, currentSessionId) => {
  const query = {
    text: "UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND id != $2 AND is_active = true",
    values: [userId, currentSessionId],
  };
  await pool.query(query);
};

export { getSessions, revokeSession, revokeOtherSessions };
