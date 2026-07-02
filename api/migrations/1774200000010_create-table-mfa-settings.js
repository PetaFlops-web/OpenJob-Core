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
  pgm.createTable("mfa_settings", {
    user_id: { type: "VARCHAR(50)", notNull: true, primaryKey: true, references: "users(id)", onDelete: "CASCADE" },
    secret: { type: "VARCHAR(255)", notNull: false },
    enabled: { type: "BOOLEAN", notNull: true, default: false },
    backup_codes: { type: "TEXT[]", notNull: false },
    created_at: { type: "TIMESTAMP", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("mfa_settings");
};
