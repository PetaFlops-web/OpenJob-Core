import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class JobsRepository {

  async addNewJob(payload) {

    const idJob = `job-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO jobs(id, company_id, category_id, title, description, job_type, experience_level, location_type, location_city, salary_min, salary_max, is_salary_visible, status, requirements, benefits, created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) RETURNING id, created_at",
      values: [
        idJob,
        payload.company_id,
        payload.category_id,
        payload.title,
        payload.description,
        payload.job_type,
        payload.experience_level,
        payload.location_type,
        payload.location_city,
        payload.salary_min,
        payload.salary_max,
        payload.is_salary_visible,
        payload.status,
        JSON.stringify(payload.requirements ?? []),
        JSON.stringify(payload.benefits ?? []),
      ],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async updateJobById(id, payload) {
    const query = {
      text: `UPDATE jobs SET
      company_id = COALESCE($1, company_id),
      category_id = COALESCE($2, category_id),
      title = COALESCE($3, title),
      description = COALESCE($4, description),
      job_type = COALESCE($5, job_type),
      experience_level = COALESCE($6, experience_level),
      location_type = COALESCE($7, location_type),
      location_city = COALESCE($8, location_city),
      salary_min = COALESCE($9, salary_min),
      salary_max = COALESCE($10, salary_max),
      is_salary_visible = COALESCE($11, is_salary_visible),
      status = COALESCE($12, status),
      requirements = COALESCE($13, requirements),
      benefits = COALESCE($14, benefits),
      updated_at = NOW()
      WHERE id = $15 RETURNING id`,
      values: [
        payload.company_id ?? null,
        payload.category_id ?? null,
        payload.title ?? null,
        payload.description ?? null,
        payload.job_type ?? null,
        payload.experience_level ?? null,
        payload.location_type ?? null,
        payload.location_city ?? null,
        payload.salary_min ?? null,
        payload.salary_max ?? null,
        payload.is_salary_visible ?? null,
        payload.status ?? null,
        payload.requirements ? JSON.stringify(payload.requirements) : null,
        payload.benefits ? JSON.stringify(payload.benefits) : null,
        id,
      ],
    };

    const result = await pool.query(query);
    return result.rows[0]?.id;
  }

  async deleteJobById(id) {
    const query = {
      text: "DELETE FROM jobs WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows[0]?.id;
  }

  async getAllJobs() {
    const query = "SELECT * FROM jobs";
    const result = await pool.query(query);
    return result.rows;
  }

  async getJobsByCompany(id) {
    const query = {
      text: "SELECT * FROM jobs WHERE company_id = $1",
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  }

  async getJobByCategory(id) {
    const query = {
      text: "SELECT * FROM jobs WHERE category_id = $1",
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  }

  async getJobById(id) {
    const query = {
      text: `
        SELECT j.*,
          json_build_object(
            'id', c.id, 'name', c.name, 'location', c.location, 'description', c.description
          ) AS company,
          json_build_object('id', cat.id, 'name', cat.name) AS category
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN categories cat ON j.category_id = cat.id
        WHERE j.id = $1
      `,
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows[0];
  }

  async searchJobs(search, limit = 10, offset = 0) {
    const countQuery = {
      text: `
        SELECT COUNT(*) AS total
        FROM jobs
        WHERE title ILIKE $1
          OR description ILIKE $1
          OR job_type ILIKE $1
          OR experience_level ILIKE $1
          OR location_city ILIKE $1
      `,
      values: [`%${search}%`],
    };

    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total, 10);

    const query = {
      text: `
        SELECT *
        FROM jobs
        WHERE title ILIKE $1
          OR description ILIKE $1
          OR job_type ILIKE $1
          OR experience_level ILIKE $1
          OR location_city ILIKE $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `,
      values: [`%${search}%`, limit, offset],
    };

    const result = await pool.query(query);
    return { rows: result.rows, total };
  }
}

export default new JobsRepository();
