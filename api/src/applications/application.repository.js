import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class ApplicationsRepository {

  async addNewApplication(payload) {
    const idApplication = `application-${nanoid(16)}`;
    const query = {
      text: `INSERT INTO application(id, job_id, user_id, status, document_id, ats_score, created_at)
           VALUES($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, job_id, user_id, status, document_id, ats_score, created_at`,
      values: [idApplication, payload.job_id, payload.user_id, "pending", payload.document_id || null, payload.ats_score || null],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async checkDuplicateApplication(job_id, user_id) {
    const query = {
      text: "SELECT * FROM application WHERE job_id = $1 AND user_id = $2",
      values: [job_id, user_id],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getAllApplications() {
    const query = {
      text: "SELECT * FROM application",
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getApplicationById(id) {
    const query = {
      text: "SELECT * FROM application WHERE id = $1",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getApplicationByUserId(id) {
    const query = {
      text: `
        SELECT a.*,
          json_build_object(
            'id', j.id,
            'title', j.title,
            'company', json_build_object('id', c.id, 'name', c.name, 'location', c.location)
          ) AS job
        FROM application a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE a.user_id = $1
      `,
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getApplicationByJobId(id) {
    const query = {
      text: "SELECT * FROM application WHERE job_id = $1",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async updateApplicationById(id, payload) {
    const query = {
      text: "UPDATE application SET user_id = COALESCE($1, user_id), job_id = COALESCE($2, job_id), status = COALESCE($3, status), document_id = COALESCE($4, document_id), ats_score = COALESCE($5, ats_score) WHERE id = $6",
      values: [
        payload.user_id || null,
        payload.job_id || null,
        payload.status || null,
        payload.document_id || null,
        payload.ats_score || null,
        id,
      ],
    };
    await pool.query(query);
  }

  async deleteApplicationById(id) {
    const query = {
      text: "DELETE FROM application WHERE id = $1 RETURNING id",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id;
  }
}

export default new ApplicationsRepository();