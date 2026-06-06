import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  // Default: node (keeps existing service tests working).
  // Component tests opt into jsdom via @jest-environment jsdom docblock.
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
  ],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.stories.{ts,tsx}",
    "!src/app/**/layout.tsx",
    "!src/app/**/page.tsx",
    "!src/**/*.d.ts",
    "!src/test-utils/**",
  ],
  // Threshold reflects current baseline — raise incrementally as tests are added
  coverageThreshold: {
    global: { branches: 2, functions: 5, lines: 5, statements: 5 },
  },
};

export default createJestConfig(config);
