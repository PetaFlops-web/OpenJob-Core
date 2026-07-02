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
  pgm.addColumns("users", {
    phone: {
      type: "VARCHAR(20)",
      notNull: false,
    },
    location: {
      type: "VARCHAR(100)",
      notNull: false,
    },
    bio: {
      type: "TEXT",
      notNull: false,
    },
    avatar: {
      type: "VARCHAR(255)",
      notNull: false,
    },
    mfa_enabled: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumns("users", ["phone", "location", "bio", "avatar", "mfa_enabled"]);
};
