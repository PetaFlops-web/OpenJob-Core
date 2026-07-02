import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class AtsRepository {
  async saveCvAnalysis({ documentId, userId, atsScore, skills, experienceYears, educationLevel, rawText }) {
    const id = `cv-analysis-${nanoid(16)}`;
    const query = {
      text: `INSERT INTO cv_analysis(id, document_id, user_id, ats_score, skills, experience_years, education_level, raw_text)
             VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      values: [id, documentId, userId, atsScore, JSON.stringify(skills), experienceYears, educationLevel, rawText],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getCvAnalysisByDocumentId(documentId) {
    const query = {
      text: "SELECT * FROM cv_analysis WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1",
      values: [documentId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getCvAnalysisByUserId(userId) {
    const query = {
      text: `SELECT ca.*, d.file_url
             FROM cv_analysis ca
             LEFT JOIN documents d ON d.id = ca.document_id
             WHERE ca.user_id = $1
             ORDER BY ca.created_at DESC`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }
}

export default new AtsRepository();
