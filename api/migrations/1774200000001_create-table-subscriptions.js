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
  pgm.createTable("subscriptions", {
    id: {
      type: "VARCHAR(50)",
      notNull: true,
      primaryKey: true,
    },
    company_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "companies(id)",
      onDelete: "CASCADE",
    },
    plan_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "subscription_plans(id)",
      onDelete: "RESTRICT",
    },
    status: {
      type: "VARCHAR(20)",
      notNull: true,
      default: "active",
    },
    start_date: {
      type: "TIMESTAMP",
      notNull: true,
    },
    end_date: {
      type: "TIMESTAMP",
      notNull: true,
    },
    payment_id: {
      type: "VARCHAR(100)",
      notNull: false,
    },
    payment_gateway: {
      type: "VARCHAR(20)",
      notNull: false,
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

  pgm.addIndex("subscriptions", "company_id");
  pgm.addIndex("subscriptions", "status");
  pgm.addIndex("subscriptions", "end_date");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("subscriptions");
};
