# Sprint 1 Execution Roadmap
**APP MA'HAD Enterprise SaaS ERP — Sprint Implementation Schedule**

---

## 1. Execution Phases & Timeline

```
[Phase 1: Session & Auth] ──> [Phase 2: Master Data & Santri] ──> [Phase 3: Parallel Operations] ──> [Phase 4: Milestone Sign-Off]
      (WP-101)                       (WP-102 -> WP-103)               (WP-104 & WP-105)                  (WP-106 & Tag v0.2.0)
```

---

## 2. Work Package Execution Order

### Phase 1: Foundation & Identity Setup
- **Step 1**: Execute `WP-101` (Identity & Tenant Session Context).
  - *Branch*: `sprint-1/wp-101`
  - *Verification*: Middleware correctly parses `x-tenant-id` header and sets session state.

### Phase 2: Core Domain Models
- **Step 2**: Execute `WP-102` (Academic Master Data Services).
  - *Branch*: `sprint-1/wp-102`
  - *Verification*: Drizzle tables for *Tahun Ajaran*, *Kelas*, and *Mapel* pass contract tests.
- **Step 3**: Execute `WP-103` (Santri Core Engine & Lifecycle State Machine).
  - *Branch*: `sprint-1/wp-103`
  - *Verification*: Santri lifecycle state machine unit tests pass with 100% success rate.

### Phase 3: Parallel Domain Operations
- **Step 4A (Track A)**: Execute `WP-104` (Asrama & Room Management).
  - *Branch*: `sprint-1/wp-104`
- **Step 4B (Track B)**: Execute `WP-105` (Financial Core & General Ledger Engine).
  - *Branch*: `sprint-1/wp-105`
  - *Verification*: Ledger debit/credit balance tests pass; Flip webhook listeners verified.

### Phase 4: Integration & Executive Dashboard
- **Step 5**: Execute `WP-106` (Executive Monitoring Dashboard & Audit Logging).
  - *Branch*: `sprint-1/wp-106`
  - *Verification*: Executive widgets display real-time aggregated metrics scoped to tenant.
- **Step 6**: Final Verification & Milestone Tagging (`sprint-1-v0.2.0-core-product-complete`).

---

## 3. Verification Checkpoints Per Phase

| Phase | Milestone Gate | Verification Command | Exit Criteria |
|---|---|---|---|
| **Phase 1** | Auth Session Gate | `npm run test:contracts` | Middleware extracts tenant context cleanly. |
| **Phase 2** | Academic & Santri Gate | `npm run test:run` | State machine and master data APIs pass tests. |
| **Phase 3** | Operations & Finance Gate | `npm run lint:ci` | Zero new AST linter errors; ledger balances. |
| **Phase 4** | Sprint 1 Final Milestone | `npm run build` | Next.js production build packages 74+ pages. |
