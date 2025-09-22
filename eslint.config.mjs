import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default [
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  pluginJs.configs.recommended,
];
