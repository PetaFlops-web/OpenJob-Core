import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class CompaniesRepository {
  constructor() {}

  async addNewCompany(payload) {
    const idCompany = `company-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO companies(
        id, name, location, description, website, industry, company_size, logo_url,
        address, phone, email, founded_year, user_id
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      values: [
        idCompany,
        payload.name,
        payload.location,
        payload.description ?? "",
        payload.website ?? null,
        payload.industry ?? null,
        payload.company_size ?? null,
        payload.logo_url ?? null,
        payload.address ?? null,
        payload.phone ?? null,
        payload.email ?? null,
        payload.founded_year ?? null,
        payload.user_id,
      ],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async updateCompanyById(id, payload) {
    const query = {
      text: `UPDATE companies SET
        name = $1, location = $2, description = $3,
        website = $4, industry = $5, company_size = $6, logo_url = $7,
        address = $8, phone = $9, email = $10, founded_year = $11
        WHERE id = $12 RETURNING id`,
      values: [
        payload.name, payload.location, payload.description,
        payload.website ?? null, payload.industry ?? null,
        payload.company_size ?? null, payload.logo_url ?? null,
        payload.address ?? null, payload.phone ?? null,
        payload.email ?? null, payload.founded_year ?? null, id,
      ],
    };
    const result = await pool.query(query);

    if (!result.rows[0]?.id) return null;

    return result.rows[0]?.id;
  }

  async updateCompanyLogoById(id, logoUrl) {
    const query = {
      text: "UPDATE companies SET logo_url = $1 WHERE id = $2 RETURNING id",
      values: [logoUrl, id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id;
  }

  async deleteCompanyById(id) {
    const query = {
      text: "DELETE FROM companies WHERE id = $1 RETURNING id",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id;
  }

  async getAllCompanies() {
    const query = `
      SELECT c.*,
        (SELECT COUNT(*) FROM jobs WHERE company_id = c.id AND status IN ('active', 'open'))::int AS job_count
      FROM companies c
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getCompanyById(id) {
    const query = {
      text: `
        SELECT c.*,
          (SELECT COUNT(*) FROM jobs WHERE company_id = c.id AND status IN ('active', 'open'))::int AS job_count
        FROM companies c WHERE c.id = $1
      `,
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows[0]) {
      return null;
    }

    return result.rows[0];
  }
}

export default new CompaniesRepository();
