import pool from "../database/pool.js";

class ProfileRepository {

    async getProfileByUserId(userId) {
        const query = {
            text: "SELECT id, name, email, role, phone, location, bio, avatar, mfa_enabled FROM users WHERE id = $1",
            values: [userId],
        };

        const result = await pool.query(query);
        return result.rows[0];
    }

    async getProfileUserApplications(userId) {
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
            values: [userId],
        };
        const result = await pool.query(query);
        return result.rows;
    }

    async getProfileBookmarkedJobs(userId) {
        const query = {
            text: `
                SELECT b.id AS bookmark_id, j.*,
                  json_build_object('id', c.id, 'name', c.name, 'location', c.location) AS company,
                  json_build_object('id', cat.id, 'name', cat.name) AS category
                FROM bookmark b
                INNER JOIN jobs j ON b.job_id = j.id
                LEFT JOIN companies c ON j.company_id = c.id
                LEFT JOIN categories cat ON j.category_id = cat.id
                WHERE b.user_id = $1
            `,
            values: [userId],
        };
        const result = await pool.query(query);
        return result.rows;
    }

    async getProfileUserInterviews(userId) {
        const query = {
            text: "SELECT * FROM interviews WHERE user_id = $1 ORDER BY scheduled_at DESC",
            values: [userId],
        };

        const result = await pool.query(query);
        return result.rows;
    }

    async getProfileInterviewById(interviewId, userId) {
        const query = {
            text: "SELECT * FROM interviews WHERE id = $1 AND user_id = $2",
            values: [interviewId, userId],
        };

        const result = await pool.query(query);
        return result.rows[0];
    }
    async updateProfile(userId, data) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(data.name);
        }
        if (data.phone !== undefined) {
            fields.push(`phone = $${paramIndex++}`);
            values.push(data.phone);
        }
        if (data.location !== undefined) {
            fields.push(`location = $${paramIndex++}`);
            values.push(data.location);
        }
        if (data.bio !== undefined) {
            fields.push(`bio = $${paramIndex++}`);
            values.push(data.bio);
        }
        if (data.avatar !== undefined) {
            fields.push(`avatar = $${paramIndex++}`);
            values.push(data.avatar);
        }

        if (fields.length === 0) {
            return this.getProfileByUserId(userId);
        }

        values.push(userId);
        const query = {
            text: `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING id, name, email, role, phone, location, bio, avatar, mfa_enabled`,
            values,
        };

        const result = await pool.query(query);
        return result.rows[0];
    }
}

export default new ProfileRepository();