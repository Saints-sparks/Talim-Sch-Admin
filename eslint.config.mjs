import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "node_modules/",
      ".next/",
      "storybook-static/",
      "coverage/",
      "*.config.*",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "unused-imports": unusedImports,
      "react-hooks": reactHooks,
    },
    rules: {
      // Auto-fixable: removes entire unused import lines
      "unused-imports/no-unused-imports": "error",
      // Auto-fixable: prefixes unused vars with _ (skips imports, handled above)
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // Disable the TS rule in favour of the unused-imports version
      "@typescript-eslint/no-unused-vars": "off",

      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // React hooks rules (needed so eslint-disable comments don't error)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
