import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  pluginJs.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    ignores: [
      "node_modules/",
      "documents/",
      "migrations/",
    ],
    rules: {
      "indent": "off",
      "quotes": "off",
      "semi": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
      "no-console": "warn",
    },
  },
];
