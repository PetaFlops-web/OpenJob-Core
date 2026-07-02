import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class DocumentsRepository {

  async addNewDocument(payload) {
    const idDocument = `document-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO documents(id, file_url, user_id) VALUES($1, $2, $3) RETURNING id",
      values: [idDocument, payload.file_url, payload.user_id],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getAllDocuments(userId) {
    const query = {
      text: "SELECT id, user_id FROM documents WHERE user_id = $1 ORDER BY id",
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getDocumentById(id, userId = null) {
    const query = {
      text: "SELECT * FROM documents WHERE id = $1 AND ($2::varchar IS NULL OR user_id = $2)",
      values: [id, userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async deleteDocumentById(id, userId) {
    const query = {
      text: "DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id",
      values: [id, userId],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id;
  }
}

export default new DocumentsRepository();