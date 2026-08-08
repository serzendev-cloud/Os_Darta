# Sprint 1 Risk Assessment & Mitigation Plan
**APP MA'HAD Enterprise SaaS ERP — Technical & Operational Risk Analysis**

---

## 1. Executive Summary

This document identifies potential risks associated with **Sprint 1 Core Product Development** across technical, architectural, business, and operational dimensions, establishing proactive mitigation strategies.

---

## 2. Risk Register & Matrix

```
   HIGH    │                 [RSK-102]          [RSK-101]
           │             (Financial Balancing) (Tenant Data Leak)
  IMPACT   │
           │ [RSK-104]                          [RSK-103]
   LOW     │ (Mock DB Drift)                    (State Transition Skip)
           └──────────────────────────────────────────────────
                          LOW                 HIGH
                                PROBABILITY
```

| Risk ID | Risk Title | Category | Severity | Probability | Risk Description | Mitigation Strategy |
|---|---|---|---|---|---|---|
| **RSK-101** | Missing Tenant Isolation Filter | Architectural | **Critical** | Low | A developer omits `tenantId` in a new API route, exposing cross-tenant data. | Enforce static AST checking via `tools/eslint-rules/enforce-tenant-id-param.js` in `npm run lint:ci`. |
| **RSK-102** | Financial Ledger Imbalance | Business | **High** | Low | Double-entry general ledger debit and credit entries fail to balance. | Implement transaction boundaries and API contract tests (`tests/contracts/`). |
| **RSK-103** | Invalid Santri Lifecycle Transition | Domain | **Medium** | Low | Calon Santri transitions directly to LULUS state without passing AKTIF. | Enforce strict state machine transitions in `src/modules/santri/domain/state-machine.ts`. |
| **RSK-104** | Drizzle Schema & Mock Data Drift | Operational | **Low** | Medium | Local mock data structures become out of sync with Drizzle table definitions. | Run automated contract verification tests on every PR build step. |

---

## 3. Contingency & Escalation Protocols

1. **Trigger Condition 1**: AST Linter detects a missing `tenantId` parameter in a pull request.
   - *Protocol*: PR is automatically blocked by GitHub Actions CI pipeline with Exit Code 1.
2. **Trigger Condition 2**: General ledger transaction debit/credit totals mismatch during `WP-105`.
   - *Protocol*: Transaction rolls back immediately; error logged to multi-tenant audit log.
