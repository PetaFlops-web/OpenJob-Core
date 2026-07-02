/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("user_sessions", {
    id: { type: "VARCHAR(50)", notNull: true, primaryKey: true },
    user_id: { type: "VARCHAR(50)", notNull: true, references: "users(id)", onDelete: "CASCADE" },
    refresh_token: { type: "VARCHAR(500)", notNull: false },
    device_info: { type: "JSONB", notNull: false },
    ip_address: { type: "INET", notNull: false },
    location: { type: "VARCHAR(100)", notNull: false },
    is_active: { type: "BOOLEAN", notNull: true, default: true },
    created_at: { type: "TIMESTAMP", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
    last_active_at: { type: "TIMESTAMP", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });
  pgm.addIndex("user_sessions", "user_id");
  pgm.addIndex("user_sessions", "is_active");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("user_sessions");
};
