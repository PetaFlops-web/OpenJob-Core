import pool from "../database/pool.js";
import { nanoid } from "nanoid";

class DeveloperRepository {

  async createApiKey(payload) {
    const id = `apikey-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO api_keys(id, company_id, name, key_hash, key_prefix, permissions, rate_limit, expires_at)
             VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      values: [
        id,
        payload.company_id,
        payload.name,
        payload.key_hash,
        payload.key_prefix,
        JSON.stringify(payload.permissions || []),
        payload.rate_limit || 1000,
        payload.expires_at || null,
      ],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getApiKeys(companyId) {
    const query = {
      text: "SELECT id, company_id, name, key_prefix, permissions, rate_limit, last_used_at, expires_at, is_active, created_at FROM api_keys WHERE company_id = $1 ORDER BY created_at DESC",
      values: [companyId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getApiKeyByHash(keyHash) {
    const query = {
      text: "SELECT * FROM api_keys WHERE key_hash = $1",
      values: [keyHash],
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async getApiKeysByPrefix(keyPrefix) {
    const query = {
      text: "SELECT * FROM api_keys WHERE key_prefix = $1 AND is_active = true",
      values: [keyPrefix],
    };
    const result = await pool.query(query);
    return result.rows;
  }


  async getActiveApiKeys() {
    const query = {
      text: "SELECT * FROM api_keys WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())",
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getApiKeyById(id) {
    const query = {
      text: "SELECT * FROM api_keys WHERE id = $1",
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async revokeApiKey(id, companyId) {
    const query = {
      text: "UPDATE api_keys SET is_active = false WHERE id = $1 AND company_id = $2 RETURNING id",
      values: [id, companyId],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id || null;
  }

  async rotateApiKey(id, companyId, newKeyHash, newKeyPrefix) {
    const query = {
      text: "UPDATE api_keys SET key_hash = $1, key_prefix = $2, last_used_at = NULL WHERE id = $3 AND company_id = $4 RETURNING id",
      values: [newKeyHash, newKeyPrefix, id, companyId],
    };
    const result = await pool.query(query);
    return result.rows[0]?.id || null;
  }

  async updateLastUsed(id) {
    const query = {
      text: "UPDATE api_keys SET last_used_at = NOW() WHERE id = $1",
      values: [id],
    };
    await pool.query(query);
  }
}

export default new DeveloperRepository();
