export const up = (pgm) => {
  pgm.sql("ALTER TABLE interviews ALTER COLUMN scheduled_at TYPE TIMESTAMPTZ USING scheduled_at AT TIME ZONE 'UTC'");
};

export const down = (pgm) => {
  pgm.sql("ALTER TABLE interviews ALTER COLUMN scheduled_at TYPE TIMESTAMP USING scheduled_at AT TIME ZONE 'UTC'");
};
