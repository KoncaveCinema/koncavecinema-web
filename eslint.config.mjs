import pluginQuery from "@tanstack/eslint-plugin-query";
import prettier from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["warn", { fixStyle: "inline-type-imports" }],
      // Read the environment through src/env.ts so every variable is validated
      "no-restricted-properties": [
        "error",
        { object: "process", property: "env", message: 'Import { env } from "@/env" instead.' },
      ],
      // Performance rules: docs/architecture/performance.md
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "framer-motion",
              message: "Use Motion through @/components/motion.",
            },
            {
              name: "motion/react",
              importNames: ["motion"],
              message:
                "The full motion.* components bundle the whole engine. Use m from @/components/motion.",
            },
            {
              name: "axios",
              importNames: ["default"],
              message: "Call the API through @/lib/api (or @/lib/api/server in Server Components).",
            },
          ],
        },
      ],
    },
  },
  {
    // Files allowed to read process.env directly
    files: [
      "src/env.ts",
      "next.config.ts",
      "src/components/providers/**",
      "*.config.{ts,mts,mjs}",
      "scripts/**",
    ],
    rules: { "no-restricted-properties": "off" },
  },
  {
    // The API layer and its tests are the only places that use axios and Motion directly
    files: ["src/lib/api/**", "src/lib/motion/**", "src/components/motion/**"],
    rules: { "no-restricted-imports": "off" },
  },
  // Must stay last: turns off stylistic rules that Prettier owns
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "src/lib/api/schema.d.ts",
  ]),
]);
