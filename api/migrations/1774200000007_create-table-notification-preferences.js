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
  pgm.createTable("notification_preferences", {
    user_id: { type: "VARCHAR(50)", notNull: true, primaryKey: true, references: "users(id)", onDelete: "CASCADE" },
    email_application: { type: "BOOLEAN", notNull: true, default: true },
    email_interview: { type: "BOOLEAN", notNull: true, default: true },
    push_application: { type: "BOOLEAN", notNull: true, default: true },
    push_interview: { type: "BOOLEAN", notNull: true, default: true },
    websocket_enabled: { type: "BOOLEAN", notNull: true, default: true },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("notification_preferences");
};
