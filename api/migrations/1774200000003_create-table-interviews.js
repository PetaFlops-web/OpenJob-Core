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
  pgm.createTable("interviews", {
    id: { type: "VARCHAR(50)", notNull: true, primaryKey: true },
    application_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "application(id)",
      onDelete: "CASCADE",
    },
    company_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "companies(id)",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    job_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "jobs(id)",
      onDelete: "CASCADE",
    },
    scheduled_at: { type: "TIMESTAMP", notNull: true },
    duration_minutes: { type: "INTEGER", notNull: true, default: 60 },
    timezone: { type: "VARCHAR(50)", notNull: false, default: "Asia/Jakarta" },
    interview_type: { type: "VARCHAR(20)", notNull: false },
    location: { type: "VARCHAR(255)", notNull: false },
    meeting_link: { type: "VARCHAR(500)", notNull: false },
    meeting_platform: { type: "VARCHAR(20)", notNull: false },
    status: {
      type: "VARCHAR(20)",
      notNull: true,
      default: "scheduled",
    },
    notes: { type: "TEXT", notNull: false },
    reminder_sent: { type: "BOOLEAN", notNull: true, default: false },
    created_by: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users(id)",
    },
    created_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addIndex("interviews", "application_id");
  pgm.addIndex("interviews", "company_id");
  pgm.addIndex("interviews", "user_id");
  pgm.addIndex("interviews", "job_id");
  pgm.addIndex("interviews", "scheduled_at");
  pgm.addIndex("interviews", "status");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("interviews");
};
