import pool from "../database/pool.js";

class MFARepository {

  async getMFASettings(userId) {
    const query = { text: "SELECT * FROM mfa_settings WHERE user_id = $1", values: [userId] };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async upsertMFASettings(userId, payload) {
    const query = {
      text: `INSERT INTO mfa_settings(user_id, secret, enabled, backup_codes)
             VALUES($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET secret = COALESCE($2, mfa_settings.secret), enabled = COALESCE($3, mfa_settings.enabled), backup_codes = COALESCE($4, mfa_settings.backup_codes)
             RETURNING user_id`,
      values: [userId, payload.secret || null, payload.enabled ?? false, payload.backup_codes || null],
    };
    const result = await pool.query(query);
    return result.rows[0]?.user_id;
  }

  async disableMFA(userId) {
    const query = { text: "DELETE FROM mfa_settings WHERE user_id = $1", values: [userId] };
    await pool.query(query);
  }
}

export default new MFARepository();
