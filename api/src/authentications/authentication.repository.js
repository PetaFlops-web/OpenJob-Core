import pool from "../database/pool.js";
import bcrypt from "bcryptjs";
class AuthenticationRepository {

  async token(token) {
    const query = {
      text: "INSERT INTO authentication VALUES($1)",
      values: [token],
    };
    await pool.query(query);
  }

  async verifyUserCredential({ email, password }) {
    const query = {
      text: "SELECT id, role, password FROM users WHERE email = $1",
      values: [email],
    };
    const result = await pool.query(query);
    if (!result.rows.length) {
      return false;
    }

    const { id, role, password: hashedPassword } = result.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);
    if (!match) {
      return false;
    }

    return { id, role };
  }

  async verifyRefreshToken(refreshToken) {
    const query = {
      text: "SELECT * FROM authentication WHERE token = $1",
      values: [refreshToken],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async deleteRefreshToken(refreshToken) {
    const query = {
      text: "DELETE FROM authentication WHERE token = $1",
      values: [refreshToken],
    }
    await pool.query(query);
  }
}

export default new AuthenticationRepository();
