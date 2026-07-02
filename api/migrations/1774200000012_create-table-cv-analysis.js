export const up = (pgm) => {
  pgm.createTable("cv_analysis", {
    id: { type: "VARCHAR(50)", notNull: true, primaryKey: true },
    document_id: { type: "VARCHAR(50)", notNull: true, references: "documents(id)", onDelete: "CASCADE" },
    user_id: { type: "VARCHAR(50)", notNull: true, references: "users(id)", onDelete: "CASCADE" },
    ats_score: { type: "FLOAT", notNull: true, default: 0 },
    skills: { type: "JSONB", notNull: true, default: "[]" },
    experience_years: { type: "FLOAT", notNull: true, default: 0 },
    education_level: { type: "VARCHAR(50)", notNull: true, default: "" },
    raw_text: { type: "TEXT", notNull: false },
    created_at: { type: "TIMESTAMP", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });
  pgm.addIndex("cv_analysis", "document_id");
  pgm.addIndex("cv_analysis", "user_id");
};

export const down = (pgm) => {
  pgm.dropTable("cv_analysis");
};
