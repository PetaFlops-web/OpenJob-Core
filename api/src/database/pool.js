import pg from "pg";

const pool = new pg.Pool({ connectionTimeoutMillis: 3000 });

export default pool;
