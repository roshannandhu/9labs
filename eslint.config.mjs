import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored React Bits components (copied from github.com/DavidHDev/react-bits)
    "src/components/reactbits/**",
    // Files Payload generates (pnpm generate:types, generate:importmap, payload migrate:create)
    "src/payload-types.ts",
    "src/migrations/**",
    "src/app/(payload)/admin/importMap.js",
  ]),
]);

export default eslintConfig;
