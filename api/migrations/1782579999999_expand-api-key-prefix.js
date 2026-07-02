export const up = (pgm) => {
  pgm.alterColumn("api_keys", "key_prefix", { type: "VARCHAR(64)", notNull: true });
};

export const down = (pgm) => {
  pgm.alterColumn("api_keys", "key_prefix", { type: "VARCHAR(10)", notNull: true });
};
