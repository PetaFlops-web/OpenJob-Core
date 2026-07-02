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
  pgm.createTable("company_availability", {
    id: { type: "VARCHAR(50)", notNull: true, primaryKey: true },
    company_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "companies(id)",
      onDelete: "CASCADE",
    },
    day_of_week: { type: "INTEGER", notNull: true },
    start_time: { type: "TIME", notNull: true },
    end_time: { type: "TIME", notNull: true },
    is_active: { type: "BOOLEAN", notNull: true, default: true },
    created_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addIndex("company_availability", "company_id");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("company_availability");
};
