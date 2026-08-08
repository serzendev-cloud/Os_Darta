# Quality Gates Framework
**APP MA'HAD Enterprise SaaS ERP — Quality Enforcement Gates**

This framework defines the structured, incremental Quality Gates required for merging code changes into the codebase.

---

## 1. Progressive Quality Gates Roadmap

```
[Level A: Zero New Debt] ──> [Level B: Warning Freeze] ──> [Level C: Debt Burn Down] ──> [Level D: Zero Debt]
  (npm run lint:ci)            (0 New Warnings)            (Baseline Ratcheted Down)      (Direct ESLint Strict)
```

- **Level A (Zero New Debt - Active Baseline)**: Enforced via `npm run lint:ci`. CI fails if any new ESLint errors or warnings are introduced beyond `.eslint-baseline.json`.
- **Level B (Warning Freeze)**: Warnings frozen; no new warnings permitted anywhere in the repository.
- **Level C (Progressive Burn Down - Ratcheting)**: Baseline file ratcheted down at the end of each Sprint using `npm run lint:baseline`.
- **Level D (Zero Technical Debt)**: Baseline count reaches 0 errors/warnings. Pipeline switches permanently to direct strict ESLint execution (`npm run lint`).

---

## 2. Base Gate Level Definitions

### 2.1 Level 0: Current State (Baseline Baseline)
- **Description**: Defines the baseline state of the repository prior to implementing new work packages.
- **Rules**:
  - The master branch is considered the reference baseline.
  - All existing code must compile and pass existing configurations.
- **Verification**: `git diff origin/main` to identify target change sets.

### 2.2 Level 1: Zero New Technical Debt (Baseline Audited)
- **Description**: Statically enforces code style, quality conventions, and baseline regression auditing.
- **Rules**:
  - Zero new ESLint errors or warnings are permitted beyond `.eslint-baseline.json`.
  - Custom AST rules (`local-rules/enforce-tenant-id-param`) must check and validate all Drizzle query chains.
- **Verification Command**: `npm run lint:ci`

### 2.3 Level 2: Mandatory TypeScript Clean
- **Description**: Enforces complete compilation type safety.
- **Rules**:
  - Strict type checking must compile successfully with zero errors.
  - Use of implicit or explicit `any` types is blocked.
- **Verification Command**: `npx tsc --noEmit`

### 2.4 Level 3: Mandatory Tests
- **Description**: Validates logic runtime correctness and schema boundaries.
- **Rules**:
  - Unit tests must be written for all core infrastructure services.
  - Contract validation tests (payload structures and responses) must run and pass for all API handlers.
- **Verification Commands**:
  - Unit tests: `npm run test:run`
  - Contract tests: `npm run test:contracts`

### 2.5 Level 4: Mandatory CI Green
- **Description**: The final automated build and packaging gate.
- **Rules**:
  - The complete GitHub Actions pipeline (Baseline Audit, Typecheck, Test, and Build) must run and pass cleanly.
  - The Next.js production build must bundle without error.
- **Verification Commands**:
  - Pipeline check: GitHub Actions run status.
  - Build check: `npm run build`

---

## 3. Enforcement & Blockers
- **Build Blocking**: Failure of any active quality gate level blocks the branch pull request and prevents merging.
- **Emergency Bypass**: Quality gates may only be bypassed under an active Sev-1 Hotfix situation with double-signature approval from the Architect.
