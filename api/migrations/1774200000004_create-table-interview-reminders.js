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
  pgm.createTable("interview_reminders", {
    id: { type: "VARCHAR(50)", notNull: true, primaryKey: true },
    interview_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "interviews(id)",
      onDelete: "CASCADE",
    },
    reminder_type: { type: "VARCHAR(20)", notNull: false },
    sent_at: { type: "TIMESTAMP", notNull: false },
    status: { type: "VARCHAR(20)", notNull: true, default: "pending" },
  });

  pgm.addIndex("interview_reminders", "interview_id");
  pgm.addIndex("interview_reminders", "status");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("interview_reminders");
};
