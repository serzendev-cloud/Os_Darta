# Quality Gates Framework
**APP MA'HAD Enterprise SaaS ERP — Quality Enforcement Gates**

This framework defines the structured, incremental Quality Gates required for merging code changes into the codebase.

---

## 1. Quality Gates Hierarchy

```
[Level 4: Mandatory CI Green]
         ▲
[Level 3: Mandatory Tests (Unit & Contract)]
         ▲
[Level 2: Mandatory TypeScript Clean (tsc --noEmit)]
         ▲
[Level 1: No New Lint Errors (ESLint flat config)]
         ▲
[Level 0: Current State (Baseline)]
```

---

## 2. Base Gate Level Definitions

### 2.1 Level 0: Current State (Baseline Baseline)
- **Description**: Defines the baseline state of the repository prior to implementing new work packages.
- **Rules**:
  - The master branch is considered the reference baseline.
  - All existing code must compile and pass existing configurations.
- **Verification**: `git diff origin/main` to identify target change sets.

### 2.2 Level 1: No New Lint Errors
- **Description**: Statically enforces code style, quality conventions, and security constraints.
- **Rules**:
  - Zero new ESLint errors or warnings are permitted in the modified files.
  - Custom AST rules (e.g. `local-rules/enforce-tenant-id-param`) must check and validate all Drizzle query chains.
- **Verification Command**: `npx eslint <changed-files>`

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
  - The complete GitHub Actions pipeline (Lint, Typecheck, Test, and Build) must run and pass cleanly.
  - The Next.js production build must bundle without error.
- **Verification Commands**:
  - Pipeline check: GitHub Actions run status.
  - Build check: `npm run build`

---

## 3. Governance Quality Gates

In addition to compilation and build verification levels, the repository enforces specific architectural gates:

### 3.1 Definition of Ready Gate
- **Purpose**: Prevent Work Packages from beginning implementation without clear design and approval.
- **Entry Criteria**: Work package defined in project planning documents.
- **Exit Criteria**: All checklist items of the DoR (business approval, architectural design, dependency matrices, frozen scope) are complete and signed off.
- **Automation Possibility**: Semi-automated (tracked via markdown checklist verification script).
- **Responsible Role**: Lead Product Manager & Senior Architect.

### 3.2 Architecture Review Gate
- **Purpose**: Verify that proposed features align with the multi-tenant SaaS architecture.
- **Entry Criteria**: DoR gate successfully cleared.
- **Exit Criteria**: Engineering design document approved with designated system components.
- **Automation Possibility**: Manual review.
- **Responsible Role**: Senior Principal Systems Architect.

### 3.3 Repository Ownership Gate
- **Purpose**: Guarantee that changes to core directories have been authorized by core owners.
- **Entry Criteria**: Changes touch folders under `src/core/`, `tools/`, or middleware.
- **Exit Criteria**: Pull request approved and signed off by the designated Architect.
- **Automation Possibility**: Fully automated (enforced via GitHub `CODEOWNERS` rules).
- **Responsible Role**: Senior Principal Systems Architect.

### 3.4 ADR Verification Gate
- **Purpose**: Ensure all key architectural choices are permanently documented.
- **Entry Criteria**: Scope includes modifications to databases, cache systems, event buses, or auth handlers.
- **Exit Criteria**: An ADR file exists in `docs/architecture/` with Approved status.
- **Automation Possibility**: Automated lint check verifying the presence of ADR references in pull request descriptions.
- **Responsible Role**: Senior Principal Systems Architect.

### 3.5 Backward Compatibility Gate
- **Purpose**: Prevent API or runtime database breaking changes from causing system downtime.
- **Entry Criteria**: Scope includes database schemas or public API contracts changes.
- **Exit Criteria**: Verified that modifications are additive or backward-compatible (no dropped fields or endpoints).
- **Automation Possibility**: Automated schema diff and contract validations.
- **Responsible Role**: Lead Database Engineer & Senior QA.

### 3.6 Breaking Change Gate
- **Purpose**: Ensure any necessary breaking change follows the multi-phase deprecation cycle.
- **Entry Criteria**: Incompatibility with legacy configurations or structures is unavoidable.
- **Exit Criteria**: Implementation sequence conforms to the 3-phase migration process (Dual Write -> Read New -> Drop Old).
- **Automation Possibility**: Manual audit of execution sequence steps.
- **Responsible Role**: Senior Principal Systems Architect.

### 3.7 Technical Debt Gate
- **Purpose**: Ensure new technical debt is documented and net-zero constraints are preserved.
- **Entry Criteria**: PR contains minor code smells or unimplemented optimizations.
- **Exit Criteria**: Debt registered in the Technical Debt Register; net-zero balance verified.
- **Automation Possibility**: Semi-automated (using static markers like `TODO: debt` parsed by lint tasks).
- **Responsible Role**: Senior Principal Systems Architect.

### 3.8 AI Governance Gate
- **Purpose**: Constrain AI agent activities to prevent architecture inventions or unauthorized folder modifications.
- **Entry Criteria**: Commits or changes generated by an AI assistant.
- **Exit Criteria**: Automated diff validation confirms no modifications to protected folders or deleted code modules without approved planning tickets.
- **Automation Possibility**: Fully automated (pre-commit script checking branch patterns and AST file modification paths).
- **Responsible Role**: Senior Principal Systems Architect.

---

## 4. Enforcement & Blockers
- **Build Blocking**: Failure of any active quality gate level blocks the branch pull request and prevents merging.
- **Emergency Bypass**: Quality gates may only be bypassed under an active Sev-1 Hotfix situation with double-signature approval from the Architect.
