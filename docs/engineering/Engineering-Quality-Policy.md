# Engineering Quality Policy
**APP MA'HAD Enterprise SaaS ERP — Repository Engineering v3.3**

This policy outlines the permanent quality standards, coding rules, and repository governance requirements for the Mahad ERP repository.

---

## 1. Engineering Principles

### 1.1 Simplicity & Readability
- All code must be self-documenting, clean, and modular.
- Complex operations must be accompanied by block comments explaining the design rationale and business rules.

### 1.2 Multi-Tenant Security by Design
- Every database query must enforce strict multi-tenant boundary checks.
- Bypassing the tenant context or omitting the `tenantId` filter is strictly prohibited. All queries are inspected statically via AST rules.

### 1.3 Testability & Modularity
- Core infrastructure logic must be decoupled and modularized to allow for isolated unit testing.
- Business endpoints must specify rigid API schema contracts and undergo automated contract testing.

---

## 2. Zero-Growth Technical Debt Policy
- **Net-Zero Debt Rule**: No PR may increase the repository's net technical debt. Any technical debt introduced by new business requirements must be balanced by refactoring corresponding legacy code in the same scope.
- **Deprecation Policy**: Use of deprecated APIs, packages, or code functions is strictly banned. Any legacy patterns must be updated immediately upon touch.

---

## 3. Definition of Ready (DoR)
A Work Package SHALL NOT enter the implementation phase unless ALL of the following conditions are satisfied:
- [ ] **Business Requirements**: Approved by Product/Business Owner.
- [ ] **Architecture**: Approved by the Senior Principal Systems Architect.
- [ ] **Dependencies**: Upstream and downstream dependencies identified and verified.
- [ ] **Repository Baseline**: Clean working directory on the target branch.
- [ ] **Risk Assessment**: Potential bottlenecks and regression risks logged.
- [ ] **Implementation Plan**: Approved and registered in the artifacts.
- [ ] **Acceptance Criteria**: Formally defined using EARS conventions.
- [ ] **Scope**: Locked and frozen (no scope creep permitted).
- [ ] **Engineering Review**: Completed and signed off.

---

## 4. Definition of Done (DoD)
A Work Package or feature implementation is considered "Done" if and only if:
1. **Compilation**: TypeScript checks pass cleanly without type errors (`npx tsc --noEmit`).
2. **Linting**: ESLint checks return zero errors and zero warnings.
3. **Tests**: All unit and contract tests pass with 100% success.
4. **Build**: Next.js production bundle compiles successfully (`npm run build`).
5. **Review**: The code has been reviewed and approved by the Senior Principal Systems Architect.

---

## 5. Repository Ownership Matrix
Different areas of the repository carry different authorization levels:

| Repository Area | Contents | Owner Role | Authorization Level |
|---|---|---|---|
| **Business Modules** | Feature business logic, UI components, pages | Developer | Direct PR creation |
| **Shared Libraries** | Utility modules, schemas, formatting | Senior Engineer | Senior Review Required |
| **Core Framework** | `src/core/`, `tools/`, middleware, auth, tenant context | Architect | Architect Approval Required |

> [!IMPORTANT]
> Modifying protected areas (such as `src/core/`, `tools/`, middleware, authentication, and shared tenant contexts) requires explicit approval and review from the Senior Principal Systems Architect.

---

## 6. Coding & Language Policies

### 6.1 Lint Policy
- The ESLint configuration (`eslint.config.mjs`) is lock-frozen.
- Bypassing rules with `eslint-disable` is forbidden in production source files.

### 6.2 TypeScript Policy
- Strict type checking must remain active (`strict: true`).
- Use of the explicit `any` type is banned in production code. Use `unknown` or concrete interfaces.

### 6.3 React Compiler & Rendering Purity
- React components must maintain rendering purity.
- Hook dependencies (`useEffect`, `useMemo`, `useCallback`) must be specified exhaustively.

---

## 7. Architecture Decision Record (ADR) Policy
Mandatory ADR registration is required for modifications touching:
- Core Architecture layout
- Database Schema and Migrations
- Caching strategy (Redis/Memory)
- Authentication and Authorization
- Event Bus, Queue, and Messaging systems
- Security policies
- Repository structures and Shared frameworks

### 7.1 ADR Contents
Every ADR must document:
1. **Purpose**: The architectural problem being solved.
2. **Decision**: The selected technical path.
3. **Alternatives**: Other considered options and trade-offs.
4. **Consequences**: Technical impacts, performance trade-offs, and maintenance debt.
5. **Status**: Proposed / Approved / Deprecated.
6. **Owner**: The lead authoring engineer.

---

## 8. Architecture Freeze Policy
During an active **Architecture Freeze**:
- Large-scale refactoring, framework replacements (e.g. state managers), ORM replacements (e.g. replacing Drizzle), repository restructuring, public API renaming, or core package movement are **strictly prohibited**.
- **Exception**: Permitted only when a corresponding ADR is approved and Chief Engineering approval is explicitly granted.

---

## 9. Breaking Change Management
Direct destructive database schema or API modifications are prohibited. Any breaking change must undergo a mandatory multi-phase migration lifecycle:

```
[Phase 1: Add Structure] ──> [Write Both] ──> [Read Old / Deprecation Warning]
                                   │
[Phase 3: Read New Only] <── [Remove Old / Clean] <── [Phase 2: Read New / Write Both]
```

- **Phase 1 (Dual Write, Read Old)**: Add the new column/API field. Enable code to write to both old and new areas, but read from the old area. Trigger deprecation warnings.
- **Phase 2 (Dual Write, Read New)**: Switch read operations to the new area. Continue dual-writing. Run migration verification scripts.
- **Phase 3 (Single Write, Read New)**: Remove write operations from the old structure, drop the deprecated DB column/API field, and clean up code paths.

---

## 10. Backward Compatibility Policy
- **APIs**: Rest endpoints and payload schemas must maintain backward compatibility for at least one major sprint release.
- **Database**: Schemas must support rolling deployments without downtime.
- **Configurations & Migrations**: Config schemas must support legacy properties.
- **Requirement**: No production breaking changes may be introduced without ADR approval.

---

## 11. AI Engineering Governance
AI Agents collaborating on this repository must adhere to the following rules:

### 1.1 AI Agents SHALL NOT:
- Invent undocumented architectural components.
- Delete files or modules without explicit approval.
- Rename public APIs or modify database schemas without corresponding migrations.
- Alter the repository folder structure or UI architecture.
- Modify files in protected folders (`src/core/`, `tools/`, `middleware/`).
- Introduce new frameworks or packages.
- Bypass CI/CD pipeline failures or suppress ESLint warnings.

### 1.2 AI Agents SHALL:
- Adhere to the Definition of Ready and Definition of Done gates.
- Respect Repository Ownership rules and obtain Architect approval.
- Prioritize code reuse over building new utilities (Reuse before Build).
- Produce ADR files for any architectural decisions.
- Maintain backward compatibility and architectural consistency.

---

## 12. Technical Debt & Severity Classifications

### 12.1 Severity Scale
- **Blocker (Severity 1)**: Build failures, security breaches (tenant isolation leaks), or compilation errors. Requires immediate stop and resolution.
- **Major (Severity 2)**: Missing unit/contract tests, architecture violations, or lint errors. Blocks PR merge.
- **Minor (Severity 3)**: Code smells, formatting deviations, or suboptimal implementations. Must be tracked in the debt register.

---

## 13. Engineering Constitution
These governance documents represent the authoritative engineering standards for this repository. 

In case of conflicting rules or instructions, the following **priority order** must be followed:
1. **Architecture Decision Records (ADR)**
2. **Engineering Quality Policy**
3. **Quality Gates Framework**
4. **Technical Debt Strategy**
5. **Implementation Plans**

All contributors, whether Human or AI, must comply with these directives without exception.
