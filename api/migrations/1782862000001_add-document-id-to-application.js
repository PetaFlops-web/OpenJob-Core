export const up = (pgm) => {
  pgm.sql(`ALTER TABLE application ADD COLUMN IF NOT EXISTS document_id VARCHAR(50) REFERENCES documents(id)`);
  pgm.addIndex("application", "document_id");
};

export const down = (pgm) => {
  pgm.dropIndex("application", "document_id");
  pgm.sql(`ALTER TABLE application DROP COLUMN IF EXISTS document_id`);
};
