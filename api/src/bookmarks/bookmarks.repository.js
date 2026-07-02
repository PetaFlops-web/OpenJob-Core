import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class BookmarksRepository {

  async addNewBookmark(payload) {
    const idBookmark = `bookmark-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO bookmark(id, user_id, job_id) VALUES($1, $2, $3) RETURNING id",
      values: [idBookmark, payload.user_id, payload.job_id],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async countBookmarksById(user_id) {
    const query = {
      text: "SELECT COUNT(*)::INTEGER AS count FROM bookmark WHERE user_id = $1",
      values: [user_id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.count || 0;
  }

  async getBookmarkById(id) {
    const query = {
      text: "SELECT * FROM bookmark WHERE id = $1",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async deleteBookmarkById(id) {
    const query = {
      text: "DELETE FROM bookmark WHERE job_id = $1 RETURNING id",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id;
  }
}

export default new BookmarksRepository();
