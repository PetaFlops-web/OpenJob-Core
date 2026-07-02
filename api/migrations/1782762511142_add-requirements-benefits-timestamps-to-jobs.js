/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns("jobs", {
    requirements: { type: "TEXT", notNull: false },
    benefits: { type: "TEXT", notNull: false },
    created_at: { type: "TIMESTAMPTZ", notNull: false, default: pgm.func("NOW()") },
    updated_at: { type: "TIMESTAMPTZ", notNull: false, default: pgm.func("NOW()") },
  });
};

export const down = (pgm) => {
  pgm.dropColumns("jobs", ["requirements", "benefits", "created_at", "updated_at"]);
};
