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
  pgm.createTable("audit_logs", {
    id: { type: "BIGSERIAL", notNull: true, primaryKey: true },
    user_id: { type: "VARCHAR(50)", notNull: false },
    action: { type: "VARCHAR(100)", notNull: true },
    resource_type: { type: "VARCHAR(50)", notNull: false },
    resource_id: { type: "VARCHAR(50)", notNull: false },
    old_values: { type: "JSONB", notNull: false },
    new_values: { type: "JSONB", notNull: false },
    ip_address: { type: "INET", notNull: false },
    user_agent: { type: "TEXT", notNull: false },
    created_at: { type: "TIMESTAMP", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });
  pgm.addIndex("audit_logs", "user_id");
  pgm.addIndex("audit_logs", "action");
  pgm.addIndex("audit_logs", "created_at");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("audit_logs");
};
