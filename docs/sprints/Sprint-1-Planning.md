# Sprint 1 Master Planning Charter
**APP MA'HAD Enterprise SaaS ERP — Core Business Product Development**

---

## 1. Context & Executive Summary

Sprint 0 ("Engineering Foundation") has been completed and tagged under `sprint-0-v0.1.0-engineering-foundation-complete`. The repository possesses permanent enterprise governance, automated CI/CD baseline auditing, custom AST linter rules, and multi-tenant infrastructure abstractions.

**Sprint 1** transitions the project into **Core Business Product Development**. Sprint 0 foundation is locked and immutable.

---

## 2. Sprint 1 Goals & Success Criteria

### 2.1 Primary Sprint Goal
Deliver a fully operational, multi-tenant core engine covering **Identity & Tenant Session Management**, **Academic Master Data**, **Santri Core Domain Lifecycle**, **Asrama Management**, **Financial Ledger Engine**, and **Executive Monitoring Dashboards**.

### 2.2 Business Goal
Provide Pesantren administrators (*Mudir*, *Ustadz*, *Musyrif*, *Wali Santri*) with a multi-tenant SaaS workspace enabling end-to-end management of student registration, dormitory placement, academic structures, and billing ledgers.

### 2.3 Technical Goal
Enforce 100% tenant data isolation (`tenant_id`) across all API routes, Drizzle ORM queries, and Redis caching layers using zero-trust static AST verification and contract boundary testing.

### 2.4 Success Criteria
1. All 6 Sprint 1 Work Packages (`WP-101` through `WP-106`) pass 100% of acceptance criteria.
2. `npm run lint:ci` passes with zero new technical debt regressions.
3. `npx tsc --noEmit` compiles with zero errors.
4. `npm run test:run` and `npm run test:contracts` pass with 100% success rate.
5. Next.js production build (`npm run build`) bundles cleanly.

---

## 3. Product Vision Alignment

- **APP MA'HAD Enterprise Vision**: Delivers a SaaS platform capable of scaling to 100+ Pesantren tenants over a 10-year horizon.
- **Multi-Tenant SaaS Vision**: Strictly isolates tenant data using Drizzle ORM query filters (`tenantId`) and Supabase RLS boundaries.
- **Pesantren Domain Alignment**: Adheres strictly to authentic Islamic Pesantren terminology (*Madrasah*, *Jenjang*, *Tingkat*, *Santri*, *Wali*, *Musyrif*, *Asrama*, *Kamar*).

---

## 4. Repository Strategy & Workflow

### 4.1 Branching Strategy
- **Base Branch**: `preview`
- **Feature Branches**: `sprint-1/wp-101`, `sprint-1/wp-102`, `sprint-1/wp-103`, `sprint-1/wp-104`, `sprint-1/wp-105`, `sprint-1/wp-106`

### 4.2 Merge & Review Policy
- Pull requests must carry the designated label (e.g. `feature:wp-101`).
- Approval requires green CI pipeline status (Baseline Audit, Typecheck, Unit Tests, Contract Tests, Build).
- Architectural changes require sign-off from Senior Principal Systems Architect.

### 4.3 Release & Tagging Strategy
- Sprint 1 Milestone Release Tag: `sprint-1-v0.2.0-core-product-complete`

---

## 5. Engineering & Capacity Planning

### 5.1 Technical Debt Allocation Budget
- **Budget**: Exactly **10% of total engineering capacity** is reserved for refactoring historical debt entries in `docs/engineering/Technical-Debt-Register.md` during routine feature development.

### 5.2 AI Agent Collaboration Policy
- AI Agents MUST NOT automatically update `.eslint-baseline.json` or modify protected governance documents.
- AI Agents MUST respect tenant isolation rules and follow the Drizzle AST linter constraints.

---

## 6. Definition of Ready (DoR) & Exit Criteria

### 6.1 Definition of Ready (DoR) Checklist
- [x] Business & Product scope approved.
- [x] Architecture design artifact created (`Sprint-1-Architecture-Blueprint.md`).
- [x] Dependency matrix defined (`Sprint-1-Dependency-Matrix.md`).
- [x] Acceptance criteria written for all Work Packages.
- [x] Clean working tree on `preview` branch.

### 6.2 Sprint Exit Criteria
1. All mandatory Work Packages (`WP-101` to `WP-106`) merged to `preview`.
2. CI pipeline status is **GREEN**.
3. Level A Quality Gate satisfied (`npm run lint:ci` passes).
4. No new technical debt introduced.

---

## 7. Chief Engineering Final Decision

$$\mathbf{FINAL\ DECISION:\ READY\ FOR\ SPRINT\ 1}$$

- **Justification**: The planning workshop has successfully authored all 6 master planning documents. All DoR requirements are satisfied, architecture boundaries are locked, and execution dependencies are mapped.
