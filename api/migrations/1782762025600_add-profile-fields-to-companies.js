/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumns("companies", {
    website: { type: "TEXT", notNull: false },
    industry: { type: "VARCHAR(100)", notNull: false },
    company_size: { type: "VARCHAR(100)", notNull: false },
    logo_url: { type: "TEXT", notNull: false },
    address: { type: "TEXT", notNull: false },
    phone: { type: "VARCHAR(30)", notNull: false },
    email: { type: "VARCHAR(255)", notNull: false },
    founded_year: { type: "INTEGER", notNull: false },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumns("companies", [
    "website",
    "industry",
    "company_size",
    "logo_url",
    "address",
    "phone",
    "email",
    "founded_year",
  ]);
};
