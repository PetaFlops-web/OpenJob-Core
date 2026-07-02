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
  pgm.createTable("subscription_plans", {
    id: {
      type: "VARCHAR(50)",
      notNull: true,
      primaryKey: true,
    },
    name: {
      type: "VARCHAR(100)",
      notNull: true,
    },
    tier: {
      type: "VARCHAR(20)",
      notNull: true,
    },
    job_quota: {
      type: "INTEGER",
      notNull: true,
      default: 0,
    },
    application_quota: {
      type: "INTEGER",
      notNull: true,
      default: 0,
    },
    featured_job_limit: {
      type: "INTEGER",
      notNull: true,
      default: 0,
    },
    price: {
      type: "INTEGER",
      notNull: true,
      default: 0,
    },
    duration_days: {
      type: "INTEGER",
      notNull: true,
      default: 30,
    },
    features: {
      type: "JSONB",
      notNull: false,
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
    updated_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("subscription_plans");
};
