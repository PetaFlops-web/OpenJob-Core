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
  pgm.createTable("featured_jobs", {
    id: {
      type: "VARCHAR(50)",
      notNull: true,
      primaryKey: true,
    },
    job_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "jobs(id)",
      onDelete: "CASCADE",
    },
    company_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "companies(id)",
      onDelete: "CASCADE",
    },
    start_date: {
      type: "TIMESTAMP",
      notNull: true,
    },
    end_date: {
      type: "TIMESTAMP",
      notNull: true,
    },
    is_active: {
      type: "BOOLEAN",
      notNull: true,
      default: true,
    },
    created_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addIndex("featured_jobs", "job_id");
  pgm.addIndex("featured_jobs", "company_id");
  pgm.addIndex("featured_jobs", "end_date");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("featured_jobs");
};
