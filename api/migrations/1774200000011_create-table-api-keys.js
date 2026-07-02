export const up = (pgm) => {
  pgm.createTable("api_keys", {
    id: { type: "VARCHAR(50)", notNull: true, primaryKey: true },
    company_id: { type: "VARCHAR(50)", notNull: true, references: "companies(id)", onDelete: "CASCADE" },
    name: { type: "VARCHAR(100)", notNull: false },
    key_hash: { type: "VARCHAR(255)", notNull: true },
    key_prefix: { type: "VARCHAR(10)", notNull: true },
    permissions: { type: "JSONB", notNull: false },
    rate_limit: { type: "INTEGER", notNull: true, default: 1000 },
    last_used_at: { type: "TIMESTAMP", notNull: false },
    expires_at: { type: "TIMESTAMP", notNull: false },
    is_active: { type: "BOOLEAN", notNull: true, default: true },
    created_at: { type: "TIMESTAMP", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });
  pgm.addIndex("api_keys", "company_id");
  pgm.addIndex("api_keys", "key_prefix");
};

export const down = (pgm) => {
  pgm.dropTable("api_keys");
};
