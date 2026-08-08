# Technical Debt Register
**APP MA'HAD Enterprise SaaS ERP — Historical Debt Inventory & Ratcheting Baseline**

This document serves as the official repository-wide inventory tracking pre-existing historical technical debt recorded in `.eslint-baseline.json`.

---

## 1. Executive Summary & Baseline Metrics

- **Baseline Snapshot File**: `.eslint-baseline.json`
- **Initial Audit Date**: 2026-08-08
- **Recorded Historical Errors ($E_{\text{base}}$)**: **173**
- **Recorded Historical Warnings ($W_{\text{base}}$)**: **210**
- **Unique Signature Tuples**: **158**
- **Repository Health Score ($H_{\text{repo}}$)**: **$72.2\%$**
- **Progressive Quality Gate Level**: **Level A (Zero New Debt)**

---

## 2. Historical Debt Inventory by Module

| Module Area | Directory Path | Error Count | Warning Count | Primary Rules Triggered | Target Sprint |
|---|---|---|---|---|---|
| **App Pages & Routes** | `src/app/` | 82 | 114 | `@typescript-eslint/no-explicit-any`, `react-hooks/exhaustive-deps` | Sprint 1–2 |
| **UI Components** | `src/components/` | 45 | 58 | `@typescript-eslint/no-unused-vars`, `import/no-anonymous-default-export` | Sprint 2–3 |
| **Services & Infrastructure** | `src/lib/` | 31 | 24 | `@typescript-eslint/no-explicit-any`, `no-var` | Sprint 1 |
| **Developer Tools** | `tools/` | 15 | 14 | `no-console` | Sprint 3 |

---

## 3. Active Historical Debt Entries

### 3.1 DEBT-HIST-001: Legacy Any Type Annotations in App Routes
- **Location**: `src/app/dashboard/`
- **Description**: Widespread use of `any` parameter types in page data fetching props.
- **Severity**: **Quadrant 2 (High Risk / High Effort)**
- **Target Sprint**: Sprint 1
- **Refactor Action**: Replace explicit `any` with concrete domain types imported from `@/types`.

### 3.2 DEBT-HIST-002: React Hook Exhaustive Dependencies Warnings
- **Location**: `src/components/`
- **Description**: Missing callback or state identifiers in `useEffect` dependency arrays.
- **Severity**: **Quadrant 1 (High Risk / Low Effort)**
- **Target Sprint**: Sprint 1
- **Refactor Action**: Wrap internal state dependencies or memoize callbacks.

### 3.3 DEBT-HIST-003: Unused Variable Declarations
- **Location**: `src/lib/`
- **Description**: Imported utilities or destructured state variables that are never read.
- **Severity**: **Quadrant 3 (Low Risk / Low Effort - Boyscout)**
- **Target Sprint**: Sprint 2
- **Refactor Action**: Remove unused variables during routine file updates.

---

## 4. Ratcheting & Burn-Down Trajectory

```
Sprint 0 Baseline: [173 Errors / 210 Warnings] ──> Level A Active
                                │
Sprint 1 Target  : [100 Errors / 120 Warnings] ──> Level B Active
                                │
Sprint 2 Target  : [30 Errors / 40 Warnings]   ──> Level C Active
                                │
Sprint 3 Target  : [0 Errors / 0 Warnings]     ──> Level D (Zero Debt Achieved)
```

- **Ratcheting Rule**: Whenever a developer refactors historical code, the Chief Engineer executes `npm run lint:baseline` to ratchet down the `.eslint-baseline.json` counters, preventing historical debt from creeping back in.
