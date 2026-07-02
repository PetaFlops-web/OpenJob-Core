export const up = (pgm) => {
  pgm.sql(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) REFERENCES users(id)`);
  pgm.addIndex("documents", "user_id");
};

export const down = (pgm) => {
  pgm.dropIndex("documents", "user_id");
  pgm.sql(`ALTER TABLE documents DROP COLUMN IF EXISTS user_id`);
};
