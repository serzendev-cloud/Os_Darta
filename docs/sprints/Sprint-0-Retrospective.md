# Sprint 0 Retrospective
**APP MA'HAD Enterprise SaaS ERP — Engineering Foundation Phase**

---

## 1. What Went Well

1. **Precision Baseline Snapshot Engine**:
   - The creation of `.eslint-baseline.json` and `eslint-baseline-check.js` eliminated lint fatigue. Historical debt (197 errors / 210 warnings) is isolated, allowing new development to proceed with zero regressions.
2. **Custom Drizzle AST Linter**:
   - Static AST checking (`enforce-tenant-id-param`) successfully enforces multi-tenant `tenantId` parameter filtering across Drizzle query chains.
3. **Comprehensive Governance Constitution**:
   - Authored five permanent engineering governance policies (`Engineering-Quality-Policy.md`, `Quality-Gates.md`, `Technical-Debt-Strategy.md`, DoR, DoD).
4. **100% Green CI Pipeline Validation**:
   - All 16 test files (122 total unit & contract test cases), TypeScript typechecking, and Next.js production builds pass cleanly in GitHub Actions.

---

## 2. What Went Wrong

1. **Obsolete Unit Test Failures**:
   - *Issue*: `auth-store.ts` was refactored in a prior commit to remove Firebase Auth, but unit tests in `auth-store.test.ts` were not updated simultaneously, causing temporary CI failures.
2. **GitHub Actions OAuth Scope Friction**:
   - *Issue*: Pushing `.github/workflows/ci.yml` via IDE OAuth tokens failed due to missing GitHub OAuth workflow scope privileges.
3. **ESLint 9 Flat Config Compatibility**:
   - *Issue*: ESLint 9 flat config structure required wrapping custom local AST rules inside inline plugin objects to avoid `linter.defineRule` deprecation crashes.

---

## 3. Root Cause Analysis (RCA)

### RCA 1: Obsolete Test Assertions in `auth-store.test.ts`
- **Root Cause**: Code refactoring and test file updates occurred in separate steps without running local test execution before pushing.
- **Corrective Action**: Established policy that any commit modifying a store or service MUST run `npm run test:run` locally before staging.

### RCA 2: GitHub Workflow Push Rejection
- **Root Cause**: Security isolation by GitHub OAuth App permissions preventing IDE tokens from mutating pipeline workflows.
- **Corrective Action**: Workflow file modifications are documented with clear local shell push commands for human engineers.

---

## 4. Improvement Opportunities

1. **Pre-Commit Hook Integration**:
   - Introduce pre-commit hooks (`husky` / `lint-staged`) to execute `npm run lint:ci` and `npx tsc --noEmit` automatically before commit creation.
2. **Automated Sprint-End Ratcheting**:
   - Schedule an automated Sprint-end workflow to run `npm run lint:baseline` and open a PR with the ratcheted baseline file.
3. **Contract Test Expansion**:
   - Expand `tests/contracts/` coverage to include newly introduced Sprint 1 REST endpoints.

---

## 5. Risk Register

| Risk ID | Risk Description | Severity | Probability | Mitigation Strategy |
|---|---|---|---|---|
| **RSK-001** | Unratcheted Historical Debt Creep | Medium | Low | Mandatory Sprint-end baseline refresh via `npm run lint:baseline`. |
| **RSK-002** | Schema Drift Between Drizzle & DB | High | Low | Automated API Contract Testing (`tests/contracts/`). |
| **RSK-003** | Missing Tenant Filter in Dynamic SQL | Critical | Low | AST Linter enforcement (`local-rules/enforce-tenant-id-param`). |
| **RSK-004** | Breaking Changes in Next.js Upgrades | Medium | Medium | Strict adherence to Next.js 16 breaking change guides in `node_modules/next/dist/docs/`. |

---

## 6. Action Items for Sprint 1

- [ ] **ACT-001**: Execute `npm run test:run` locally prior to every pull request submission.
- [ ] **ACT-002**: Maintain zero-growth technical debt rule across all Sprint 1 feature branches.
- [ ] **ACT-003**: Conduct initial baseline ratcheting pass after refactoring historical route handlers in `src/app/api/`.
- [ ] **ACT-004**: Integrate Husky pre-commit hooks for automated baseline checks.
