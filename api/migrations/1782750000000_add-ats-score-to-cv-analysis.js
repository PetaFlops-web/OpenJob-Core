export const up = (pgm) => {
  // node-pg-migrate addColumn has no IF NOT EXISTS option; use raw SQL for fresh DB safety.
  pgm.sql(`ALTER TABLE cv_analysis ADD COLUMN IF NOT EXISTS ats_score FLOAT NOT NULL DEFAULT 0`);
};

export const down = (pgm) => {
  pgm.dropColumn("cv_analysis", "ats_score");
};
