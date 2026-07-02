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
  pgm.createTable("user_skills", {
    id: { type: "VARCHAR(50)", notNull: true, primaryKey: true },
    user_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    name: { type: "VARCHAR(100)", notNull: true },
    created_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addIndex("user_skills", "user_id");
  pgm.addConstraint("user_skills", "user_skills_user_id_name_unique", {
    unique: ["user_id", "name"],
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("user_skills");
};
