export const up = (pgm) => {
  pgm.sql(`ALTER TABLE application ADD COLUMN IF NOT EXISTS ats_score FLOAT`);
};

export const down = (pgm) => {
  pgm.sql(`ALTER TABLE application DROP COLUMN IF EXISTS ats_score`);
};