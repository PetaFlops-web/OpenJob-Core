export const up = (pgm) => {
  pgm.addColumn("application", {
    created_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("application", "created_at");
};