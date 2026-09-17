import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";
import jsdoc from "eslint-plugin-jsdoc";

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
      jsdoc,
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

      // T2.8: `any` hides contract drift between the API and the UI.
      "@typescript-eslint/no-explicit-any": "error",
      "prefer-const": "error",
      // Diagnostics go through src/lib/logger.ts, which stays quiet in production.
      "no-console": "error",

      // React hooks rules (needed so eslint-disable comments don't error)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // Services and hooks are the app's API surface: every exported function
    // says what it takes, returns and throws.
    files: ["src/app/services/**/*.ts", "src/hooks/**/*.ts", "src/lib/*.ts"],
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: { FunctionDeclaration: true, ArrowFunctionExpression: true, FunctionExpression: true },
          contexts: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"],
        },
      ],
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns-description": "error",
    },
  },
  {
    // Tests, stories and the logger itself may talk to the console directly.
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx", "src/lib/logger.ts", "jest.setup.ts"],
    rules: { "no-console": "off", "@typescript-eslint/no-explicit-any": "off", "jsdoc/require-jsdoc": "off" },
  },
];
