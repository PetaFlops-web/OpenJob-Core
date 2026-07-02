import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class SkillsRepository {
  async findAllByUserId(userId) {
    const query = {
      text: "SELECT id, name, created_at FROM user_skills WHERE user_id = $1 ORDER BY created_at ASC",
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async findById(id, userId) {
    const query = {
      text: "SELECT id, name, created_at FROM user_skills WHERE id = $1 AND user_id = $2",
      values: [id, userId],
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async findByName(userId, name) {
    const query = {
      text: "SELECT id FROM user_skills WHERE user_id = $1 AND LOWER(name) = LOWER($2)",
      values: [userId, name],
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async create(userId, name) {
    const id = `skill-${nanoid(16)}`;
    const query = {
      text: `INSERT INTO user_skills (id, user_id, name) VALUES ($1, $2, $3)
             ON CONFLICT (user_id, name) DO NOTHING
             RETURNING id, name, created_at`,
      values: [id, userId, name],
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async delete(id, userId) {
    const query = {
      text: "DELETE FROM user_skills WHERE id = $1 AND user_id = $2 RETURNING id",
      values: [id, userId],
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async deleteAllByUserId(userId) {
    const query = {
      text: "DELETE FROM user_skills WHERE user_id = $1",
      values: [userId],
    };
    await pool.query(query);
  }
}

export default new SkillsRepository();
