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
  pgm.createTable("notifications", {
    id: { type: "VARCHAR(50)", notNull: true, primaryKey: true },
    user_id: { type: "VARCHAR(50)", notNull: true, references: "users(id)", onDelete: "CASCADE" },
    type: { type: "VARCHAR(50)", notNull: true },
    title: { type: "VARCHAR(255)", notNull: true },
    message: { type: "TEXT", notNull: false },
    data: { type: "JSONB", notNull: false },
    read: { type: "BOOLEAN", notNull: true, default: false },
    read_at: { type: "TIMESTAMP", notNull: false },
    created_at: { type: "TIMESTAMP", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });
  pgm.addIndex("notifications", "user_id");
  pgm.addIndex("notifications", "read");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("notifications");
};
