# Technical Debt Management Strategy
**APP MA'HAD Enterprise SaaS ERP — Technical Debt Policy**

This document establishes the official lifecycle, categorization, allocation, and reduction strategies for technical debt within this repository.

---

## 1. Technical Debt Baseline & Ratcheting Policy (CIP-WP-009)

To ensure historical technical debt is burned down systematically without stalling active feature delivery, the repository enforces an **Immutable Baseline & Controlled Ratcheting Engine**:

- **Baseline Snapshot**: Historical errors and warnings are recorded in `.eslint-baseline.json`.
- **Zero New Debt Rule**: CI executes `npm run lint:ci` on every pull request. If any new error or warning is introduced beyond `.eslint-baseline.json`, CI fails immediately.
- **Ratcheting Process**: When historical debt items are refactored during sprint maintenance, the Architect executes `npm run lint:baseline` to ratchet down `.eslint-baseline.json` counters.
- **Prohibition**: Automatic or un-reviewed baseline updates are strictly banned.

---

## 2. Technical Debt Lifecycle

The technical debt lifecycle consists of six distinct phases:

```
[1. Identify] ──> [2. Register] ──> [3. Prioritize]
                                          │
[6. Close]   <── [5. Verify]    <── [4. Allocate]
```

1. **Identify**: Code smells, warnings, bypass overrides, or outdated dependencies are detected.
2. **Register**: The item is logged in `docs/engineering/Technical-Debt-Register.md` with descriptions and impact notes.
3. **Prioritize**: The item is scored based on urgency, risk, and refactoring effort.
4. **Allocate**: The task is assigned to a developer during sprint planning.
5. **Verify**: The refactored code passes `npm run lint:ci`, `tsc --noEmit`, and tests.
6. **Close**: The baseline is ratcheted down via `npm run lint:baseline` and the item is closed.

---

## 3. Debt Registration Guideline
When registering technical debt, developers must provide:
- **ID**: `DEBT-XXX`
- **Location**: Affected files or modules.
- **Description**: What is the structural issue or deviation.
- **Justification**: Why it was introduced (if applicable).
- **Impact**: Risk of leaving it unresolved (e.g. performance bottleneck, maintenance friction).
- **Refactor Action**: Proposed technical steps to resolve the debt.

---

## 4. Prioritization Matrix (Quadrant Model)

Prioritization is calculated using the Urgency vs. Effort matrix:

| High Urgency / Low Effort | High Urgency / High Effort |
|---|---|
| **Quadrant 1 (Immediate)**: High risk, easy fix (e.g. missing error logs, lint warnings). | **Quadrant 2 (Sprint Planned)**: High risk, structural change (e.g. refactoring Drizzle schemas). |
| **Quadrant 3 (Boyscout)**: Low risk, easy fix (e.g. formatting, comments, naming). | **Quadrant 4 (Deferred)**: Low risk, high effort (e.g. migrating core CSS design tokens). |
| **Low Urgency / Low Effort** | **Low Urgency / High Effort** |

---

## 5. Technical Debt Aging Policy
To prevent registered technical debt from accumulating indefinitely, strict aging thresholds are enforced:

- **Quadrant 1 Debt (Immediate)**:
  - **Maximum Age**: **2 Sprints**.
  - **Overdue Penalty**: Automatically escalates to **Severity 1 (Blocker)**, preventing any further pull request merges until resolved.
- **Quadrant 2 Debt (Sprint Planned)**:
  - **Maximum Age**: **4 Sprints**.
  - **Overdue Penalty**: Automatically escalates to **Severity 2 (Major)**, blocking all PRs inside the affected module scope.
- **Quadrant 3 Debt (Boyscout)**:
  - **Review Cycle**: Evaluated at the end of **every Sprint** to decide if any item needs promotion to Quadrant 1.
- **Quadrant 4 Debt (Deferred)**:
  - **Review Cycle**: Optional/Unscheduled review (evaluated on major releases).

---

## 6. Technical Debt Metrics
We measure, track, and report on the following indicators to maintain a healthy repository:

1. **Current Debt Count ($C_d$)**: Total number of active, unresolved technical debt entries in `.eslint-baseline.json`.
2. **Resolved Debt ($R_d$)**: Total number of technical debt items closed during the active sprint.
3. **Debt Velocity ($V_d$)**: The rate at which technical debt is retired (Resolved Debt per Sprint).
4. **Debt Aging ($A_d$)**: Average time (in days/sprints) a technical debt item remains open.
5. **Repository Health Score ($H_{repo}$)**: Target must remain above **$90\%$** to allow standard feature sprints.

---

## 7. Debt Reduction Strategies

### 7.1 The Boy Scout Rule
- Developers must always leave the code cleaner than they found it.
- When working on a file for business logic, resolve any minor code smells or warnings in the same file immediately.

### 7.2 Sprint Allocation Capacity
- In every standard Execution Sprint, a minimum of **10% of total engineering capacity** must be allocated to resolving items from Quadrant 1 and Quadrant 2 in the Technical Debt Register.

---

## 8. Exit & Closure Criteria
An item is eligible for closure and removal from the active debt register only when it meets the following criteria:
- The refactored code passes `npm run lint:ci` without regressions.
- Baseline is updated via `npm run lint:baseline`.
- TypeScript compiles cleanly (`tsc --noEmit`) and production build succeeds.
- Review approved by Senior Principal Systems Architect.
