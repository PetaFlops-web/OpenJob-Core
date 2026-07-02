import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class AvailabilityRepository {
  async setAvailability(payload) {
    const id = `availability-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO company_availability(id, company_id, day_of_week, start_time, end_time, is_active)
             VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
      values: [
        id,
        payload.company_id,
        payload.day_of_week,
        payload.start_time,
        payload.end_time,
        payload.is_active !== undefined ? payload.is_active : true,
      ],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getAvailability(companyId) {
    const query = {
      text: "SELECT * FROM company_availability WHERE company_id = $1 ORDER BY day_of_week, start_time",
      values: [companyId],
    };

    const result = await pool.query(query);
    return result.rows;
  }

  async deleteAvailability(id) {
    const query = {
      text: "DELETE FROM company_availability WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows[0]?.id;
  }
}

export default new AvailabilityRepository();
