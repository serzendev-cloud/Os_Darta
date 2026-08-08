import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import enforceTenantIdParam from "./tools/eslint-rules/enforce-tenant-id-param.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "local-rules": {
        rules: {
          "enforce-tenant-id-param": enforceTenantIdParam,
        }
      }
    },
    rules: {
      "local-rules/enforce-tenant-id-param": "error",
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
