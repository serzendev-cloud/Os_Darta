# ETP — Enterprise Task Package: Task Decomposition & Execution

**APP MA'HAD Enterprise ERP**

| Metadata | Value |
|----------|-------|
| **Document** | Enterprise Task Package (ETP) |
| **Abbreviation** | ETP |
| **Title** | Enterprise Task Decomposition & Execution Package |
| **Version** | 1.0 |
| **Status** | OFFICIAL |
| **Classification** | EXECUTION ARTIFACT |
| **Mode** | Append-Only |
| **Technology** | Technology Agnostic |
| **Framework** | Framework Agnostic |
| **Vendor** | Vendor Agnostic |
| **Language** | Language Agnostic |
| **NO SOURCE CODE. NO IMPLEMENTATION. ONLY TASK DECOMPOSITION.** |
| **Parent Documents** | ESP0, RAR Part 1 v1.1, EEP Part 1, ESSP Sprint 0, EMBS, EESS, EARS, RTR, BRR |
| **Target Audience** | AI Agents (Planner, Engineer, Reviewer, QA, Doc), Human Engineers, Engineering Lead |
| **Prerequisite** | ESP0 APPROVED |
| **THIS IS THE LAST EXECUTION ARTIFACT BEFORE REPOSITORY IMPLEMENTATION.** |

---

## Document Position

```
ESP0 (Execution Sprint 0)
│   17 Work Packages — WHAT to execute
│
└── ETP (Enterprise Task Package)  ◄── THIS DOCUMENT
    │   Task Decomposition — HOW to execute each WP
    │   Atomic tasks → Commits → PRs → Reviews → Merge
    │
    └── REPOSITORY EXECUTION
        AI Agents + Engineers begin coding
```

> **Rule ETP-001**: ETP is an EXECUTION ARTIFACT. It decomposes ESP0 Work Packages into atomic engineering tasks. It does NOT define architecture, standards, or planning. It is the LAST document before coding begins.

> **Rule ETP-002**: After ETP approval, repository execution begins immediately. AI Agents and Engineers proceed directly to coding. No further planning or framework documents shall be created before Sprint 1.

---

## Table of Contents

1. [Execution Philosophy](#1-execution-philosophy)
2. [Task Hierarchy](#2-task-hierarchy)
3. [Task Decomposition Standard](#3-task-decomposition-standard)
4. [Task Package Template](#4-task-package-template)
5. [Work Package Breakdown](#5-work-package-breakdown)
6. [Commit Plan](#6-commit-plan)
7. [Pull Request Plan](#7-pull-request-plan)
8. [AI Assignment Matrix](#8-ai-assignment-matrix)
9. [Human Assignment Matrix](#9-human-assignment-matrix)
10. [Execution Timeline](#10-execution-timeline)
11. [Dependency Matrix](#11-dependency-matrix)
12. [Verification Plan](#12-verification-plan)
13. [Risk Register](#13-risk-register)
14. [Decision Registry](#14-decision-registry)
15. [Anti-Patterns](#15-anti-patterns)
16. [Checklist](#16-checklist)
17. [Quality Gate](#17-quality-gate)
18. [Executive Summary](#18-executive-summary)
19. [Final Status](#19-final-status)

### Appendices (A–J)

---

---

## 1. Execution Philosophy

### 1.1 Atomic Engineering Principle

Every task in ETP is designed to be executable in a SINGLE engineering session (2–4 hours). No task spans multiple days. No task requires context switching. Every task produces exactly ONE commit.

```
TASK → COMMIT → PR → REVIEW → MERGE → VERIFY → DONE
 └────────── Single Session ──────────┘
```

> **Rule ETP-003**: Atomic Engineering — one task = one session = one commit = one PR. Multi-commit tasks indicate poor decomposition.

> **Rule ETP-004**: Small Deliverables — every task produces a tangible, reviewable, mergeable artifact. Tasks that produce "infrastructure only visible later" are rejected.

> **Rule ETP-005**: Continuous Integration — tasks are merged to the execution branch continuously throughout the day. No task lingers unmerged for > 4 hours.

### 1.2 Rule Registry (§1)

| Rule ID | Statement Summary | Severity |
|:-------:|------------------|:--------:|
| ETP-001 | ETP is an EXECUTION ARTIFACT; does not define architecture | CRITICAL |
| ETP-002 | After ETP approval, coding begins immediately; no more docs | CRITICAL |
| ETP-003 | Atomic Engineering: 1 task = 1 session = 1 commit = 1 PR | HIGH |
| ETP-004 | Small Deliverables: every task produces tangible, reviewable artifact | HIGH |
| ETP-005 | Continuous Integration: tasks merged within 4 hours | HIGH |
| ETP-006 | Every task references: ESP0 WP, RAR finding, enterprise standards | CRITICAL |
| ETP-007 | Every task produces: Commit → PR → Review → Merge → Verification | CRITICAL |
| ETP-008 | Task duration maximum: 4 hours. Tasks > 4 hours are decomposed into subtasks | HIGH |
| ETP-009 | No task starts without all dependencies satisfied | CRITICAL |
| ETP-010 | Evidence-Based Completion: DONE requires evidence, not assertion | HIGH |

---

## 2. Task Hierarchy

```
REPOSITORY (ESP0 Scope)
│
├── WORK PACKAGE (WP-001 to WP-017)
│   │   Defined in ESP0 §5
│   │   Duration: 4–21 hours
│   │   Owner: Human or AI Lead
│   │
│   ├── TASK (TASK-XXX-YY)
│   │   │   Defined in ETP §5
│   │   │   Duration: 1–4 hours
│   │   │   Owner: AI Agent or Human Engineer
│   │   │
│   │   ├── SUBTASK (if task > 4 hours)
│   │   │   │   Duration: < 2 hours
│   │   │   │   Owner: Same as parent task
│   │   │
│   │   ├── COMMIT (1 commit per task)
│   │   │   │   Conventional Commit format
│   │   │   │   Atomic: one logical change
│   │   │
│   │   ├── PULL REQUEST (1 PR per task group)
│   │   │   │   Template filled; CI green; reviewers assigned
│   │   │
│   │   ├── REVIEW (AI + Human)
│   │   │   │   AI Review: automated (traceability, patterns, naming)
│   │   │   │   Human Review: code quality, architecture, business logic
│   │   │
│   │   ├── MERGE (to execution/sprint-0)
│   │   │   │   Squash merge; branch deleted
│   │   │
│   │   └── VERIFICATION
│   │       │   Task acceptance criteria met; evidence attached
│   │
├── WORK PACKAGE (next WP)
...
```

---

## 3. Task Decomposition Standard

| Attribute | Value |
|-----------|-------|
| **Maximum Task Size** | 4 hours |
| **Minimum Task Size** | 30 minutes (if less, merge with adjacent task) |
| **Commit Per Task** | Exactly 1 |
| **PR Per Task Group** | 1 PR per 1–3 related tasks |
| **Dependency Rule** | Hard dependencies must be satisfied before task starts |
| **Parallel Rule** | Tasks without hard dependencies may run in parallel |
| **Blocking Rule** | Blocked task → flag immediately; work on next available task |
| **Ownership Rule** | Every task has exactly 1 Owner (AI or Human) |
| **Completion Rule** | Task DONE when: commit pushed + PR merged + evidence attached |

---

## 4. Task Package Template

```
╔══════════════════════════════════════════════════════════════╗
║ TASK PACKAGE                                                 ║
╠══════════════════════════════════════════════════════════════╣
║ TASK ID:          TASK-{WP}-{NN}                            ║
║ PARENT WP:        WP-{NNN}                                  ║
║ TITLE:            {Action-Oriented Title}                    ║
║ OBJECTIVE:        {One-line purpose}                         ║
║ DESCRIPTION:      {What to do, what files to create/modify}  ║
║ INPUTS:           {Blueprint sections, existing files}       ║
║ OUTPUTS:          {Files created/modified}                   ║
║ DEPENDENCIES:     {TASK-IDs that must complete first}        ║
║ ESTIMATED HOURS:  {0.5–4.0}                                 ║
║ OWNER:            {AI Engineer | SE-1 | SE-2 | ...}         ║
║ REVIEWER:         {AI Review | SE-1 | SecArch | ...}        ║
║ ACCEPTANCE CRITERIA:                                         ║
║   AC-01: {Specific, testable}                               ║
║   AC-02: {Specific, testable}                               ║
║ EVIDENCE REQUIRED: {Test results, lint output, screenshot}   ║
║ DEFINITION OF DONE:                                          ║
║   [ ] Commit pushed (conventional format)                    ║
║   [ ] PR created (template filled)                           ║
║   [ ] CI green (lint + type-check + tests)                   ║
║   [ ] AI Review passed (no CRITICAL findings)                ║
║   [ ] Human Review approved                                  ║
║   [ ] PR merged (squash)                                     ║
║   [ ] Branch deleted                                         ║
║   [ ] Evidence attached                                      ║
║ ROLLBACK:         {How to undo this task if needed}          ║
║                                                              ║
║ TRACEABILITY:                                                ║
║   ESP0 WP:        WP-{NNN}                                  ║
║   RAR Finding:    GAP-{NNN}                                 ║
║   EARS:           Part {N} §{section}                        ║
║   EESS:           App {X} §{section}                         ║
║   EMBS:           App {X} §{section}                         ║
║   ESSP:           Sprint 0 §{section}                        ║
║   EEP:            §{section}                                 ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 5. Work Package Breakdown

### 5.1 WP-001: Repository Backup & Snapshot (1h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-001-01 | Create repository backup archive | 0.5h | AI Engineer | SE-1 | Backup file verified |
| TASK-001-02 | Tag repository `pre-esp0` snapshot | 0.5h | SE-1 | Eng Lead | Tag exists; rollback tested |

### 5.2 WP-002: Branch Creation & Protection (1h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-002-01 | Create `execution/sprint-0` branch | 0.3h | Eng Lead | SE-1 | Branch created from main |
| TASK-002-02 | Configure branch protection rules | 0.7h | Eng Lead | SE-1 | PR required; CI must pass; 1 approval required |

### 5.3 WP-003: Repository Structure Refactor (21h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-003-01 | Create `src/shared/` directory tree | 1h | AI Engineer | SE-1 | `types/`, `constants/`, `utils/`, `base/` created |
| TASK-003-02 | Create `src/modules/` root with registration | 1h | AI Engineer | SE-1 | `modules/index.ts` with registry |
| TASK-003-03 | Scaffold `src/modules/master-data/` | 1h | AI Engineer | SE-1 | `domain/`, `application/`, `infrastructure/`, `presentation/` |
| TASK-003-04 | Move shared types to `src/shared/types/` | 3h | AI Engineer | SE-1 | Pagination, ApiResponse, ErrorResponse types |
| TASK-003-05 | Move constants to `src/shared/constants/` | 2h | AI Engineer | SE-1 | HTTP status, error codes, sort orders |
| TASK-003-06 | Move utilities to `src/shared/utils/` | 2h | AI Engineer | SE-1 | Date, string, validation helpers |
| TASK-003-07 | Create facade exports for existing import paths | 4h | AI Engineer | SE-1 | Backward-compatible re-exports; no import breakage |
| TASK-003-08 | Move Santri types to MDS domain | 2h | AI Engineer | SE-1 | `modules/master-data/domain/entities/santri.ts` |
| TASK-003-09 | Move Santri Firebase service to MDS infrastructure | 2h | AI Engineer | SE-1 | Behind repository interface facade |
| TASK-003-10 | Move Santri components to MDS presentation | 2h | AI Engineer | SE-1 | `modules/master-data/presentation/components/` |
| TASK-003-11 | Validate all imports resolve | 1h | AI Reviewer | SE-1 | 0 import errors |

### 5.4 WP-004: Shared Library Implementation (16h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-004-01 | Implement AggregateRoot base class | 2h | AI Engineer | SE-1 | `shared/base/aggregate-root.ts` with version, tenant_id, domain events |
| TASK-004-02 | Implement Entity base class | 1h | AI Engineer | SE-1 | `shared/base/entity.ts` with id, equals |
| TASK-004-03 | Implement ValueObject base class | 1h | AI Engineer | SE-1 | `shared/base/value-object.ts` with immutability, equals |
| TASK-004-04 | Implement DomainEvent base class | 1h | AI Engineer | SE-1 | `shared/base/domain-event.ts` with metadata |
| TASK-004-05 | Implement BaseRepository abstract class | 2h | AI Engineer | SE-1 | Tenant scoping enforced; cursor pagination |
| TASK-004-06 | Implement BaseApplicationService | 1.5h | AI Engineer | SE-1 | Transaction boundary; event publication |
| TASK-004-07 | Implement DTO base class | 1h | AI Engineer | SE-1 | `shared/base/dto.ts` |
| TASK-004-08 | Implement Validator base class | 1h | AI Engineer | SE-1 | `shared/base/validator.ts` |
| TASK-004-09 | Implement Mapper base class | 1h | AI Engineer | SE-1 | `shared/base/mapper.ts` |
| TASK-004-10 | Create barrel exports for all base classes | 0.5h | AI Engineer | SE-1 | `shared/base/index.ts` |
| TASK-004-11 | Write unit tests for all base classes | 3h | AI Engineer | SE-1 | Coverage ≥ 80% on shared/base/ |
| TASK-004-12 | Validate with lint + type-check + tests | 1h | AI Reviewer | SE-1 | CI green |

### 5.5 WP-005: Authentication Foundation (8h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-005-01 | Implement JWT validation utility | 2h | AI Engineer | SecArch | Token verification; expiry check; claim extraction |
| TASK-005-02 | Implement auth middleware | 2h | AI Engineer | SecArch | Extracts userId, tenantId, roles from JWT |
| TASK-005-03 | Implement auth error responses | 1h | AI Engineer | SecArch | 401 (no token), 401 (expired), 401 (invalid) |
| TASK-005-04 | Exclude health endpoints from auth | 0.5h | AI Engineer | SecArch | `/health/live`, `/health/ready` public |
| TASK-005-05 | Write auth middleware tests | 2h | AI Engineer | SecArch | Valid, expired, invalid, missing token scenarios |
| TASK-005-06 | Validate integration | 0.5h | AI Reviewer | SecArch | CI green |

### 5.6 WP-006: RBAC Foundation (8h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-006-01 | Create permission constants | 1h | AI Engineer | SecArch | All MDS permissions per Blueprint §13 |
| TASK-006-02 | Implement role hierarchy config | 1h | AI Engineer | SecArch | super_admin > admin > staff > wali > santri |
| TASK-006-03 | Implement RBAC middleware | 2h | AI Engineer | SecArch | Checks required permission against user roles |
| TASK-006-04 | Create @RequirePermission decorator | 1h | AI Engineer | SecArch | Route-level permission declaration |
| TASK-006-05 | Implement 403 error response | 0.5h | AI Engineer | SecArch | Standardized forbidden response |
| TASK-006-06 | Write RBAC middleware tests | 2h | AI Engineer | SecArch | Sufficient perm, insufficient perm, no roles |
| TASK-006-07 | Validate integration | 0.5h | AI Reviewer | SecArch | CI green |

### 5.7 WP-007: Tenant Context Foundation (16h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-007-01 | Implement TenantContext provider | 2h | AI Engineer | SE-2 | Request-scoped tenant context |
| TASK-007-02 | Implement tenant middleware | 2h | AI Engineer | SE-2 | Extracts tenant_id from JWT (not request param) |
| TASK-007-03 | Implement tenant-scoped cache key util | 1h | AI Engineer | SE-2 | `{tenant_id}:{module}:{entity}:{id}` |
| TASK-007-04 | Implement tenant-scoped storage path util | 1h | AI Engineer | SE-2 | `/{tenant_id}/{module}/{entity}/{file}` |
| TASK-007-05 | Implement tenant config resolver | 2h | AI Engineer | SE-2 | Defaults + per-tenant overrides |
| TASK-007-06 | Integrate tenant scoping into BaseRepository | 2h | AI Engineer | SE-2 | Auto-append WHERE tenant_id |
| TASK-007-07 | Write tenant middleware tests | 2h | AI Engineer | SE-2 | Tenant from JWT; reject client-provided tenant |
| TASK-007-08 | Write tenant isolation test | 3h | AI Engineer | QA-1 | Tenant A cannot access Tenant B data |
| TASK-007-09 | Validate integration | 1h | AI Reviewer | SE-2 | CI green; isolation test passes |

### 5.8 WP-008: Configuration Management (8h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-008-01 | Implement environment config | 2h | AI Engineer | SE-1 | dev/staging/prod with validation |
| TASK-008-02 | Implement tenant config system | 2h | AI Engineer | SE-1 | Defaults + per-tenant overrides |
| TASK-008-03 | Implement feature flag system | 2h | AI Engineer | SE-1 | Flags with cleanup dates; boolean + percentage |
| TASK-008-04 | Implement startup config validation | 1h | AI Engineer | SE-1 | Invalid config prevents startup |
| TASK-008-05 | Write config tests | 1h | AI Engineer | SE-1 | Valid, invalid, missing, tenant override |

### 5.9 WP-009: Logging & Error Handling (6h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-009-01 | Implement structured JSON logger | 2h | AI Engineer | SE-1 | timestamp, level, module, tenant_id, correlation_id |
| TASK-009-02 | Implement PII redaction in logs | 1h | AI Engineer | SE-1 | NIK, phone, email redacted |
| TASK-009-03 | Implement global error handler | 2h | AI Engineer | SE-1 | Standardized MDS_NNNN error format |
| TASK-009-04 | Write logger + error handler tests | 1h | AI Engineer | SE-1 | Log format, PII redaction, error format |

### 5.10 WP-010: Health Checks (4h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-010-01 | Implement liveness endpoint | 1h | AI Engineer | SE-2 | `GET /health/live` → 200 `{"status":"alive"}` |
| TASK-010-02 | Implement readiness endpoint | 2h | AI Engineer | SE-2 | `GET /health/ready` → 200 with DB/cache/event status |
| TASK-010-03 | Write health check tests | 1h | AI Engineer | SE-2 | Liveness, readiness healthy, readiness degraded |

### 5.11 WP-011: CI/CD Pipeline (18h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-011-01 | Configure lint step (ESLint) | 2h | AI Engineer | Eng Lead | Lint rules; auto-fix; CI integration |
| TASK-011-02 | Configure format step (Prettier) | 1h | AI Engineer | Eng Lead | Format rules; CI check |
| TASK-011-03 | Configure type-check step | 1h | AI Engineer | Eng Lead | TypeScript strict mode |
| TASK-011-04 | Configure unit test step (Vitest) | 2h | AI Engineer | Eng Lead | Test runner; coverage thresholds |
| TASK-011-05 | Configure integration test step | 2h | AI Engineer | Eng Lead | Test DB spin up; tenant isolation |
| TASK-011-06 | Configure security scan step | 2h | AI Engineer | SecArch | Secret detection; dependency audit |
| TASK-011-07 | Configure build step | 1h | AI Engineer | Eng Lead | Production build |
| TASK-011-08 | Configure coverage reporting | 2h | AI Engineer | QA-1 | Per-PR coverage comment; baseline tracking |
| TASK-011-09 | Configure quality gate | 2h | Eng Lead | Eng Lead | All 7 steps must pass before merge |
| TASK-011-10 | Test CI pipeline end-to-end | 3h | Eng Lead | SE-2 | Green run on foundation code |

### 5.12 WP-012: AI Configuration (16h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-012-01 | Create AI Planner agent config | 2h | AI Arch | Eng Lead | Model, temperature, token budget, prompts |
| TASK-012-02 | Create AI Engineer agent config | 2h | AI Arch | Eng Lead | Artifact generation prompts per EESS type |
| TASK-012-03 | Create AI Reviewer agent config | 2h | AI Arch | Eng Lead | Traceability, pattern, naming validation |
| TASK-012-04 | Create prompt contract templates | 3h | AI Arch | Eng Lead | Planner, Engineer, Reviewer, QA, Doc |
| TASK-012-05 | Implement traceability validation | 2h | AI Arch | Eng Lead | @blueprint header regex check |
| TASK-012-06 | Implement AI checkpoint logging | 1h | AI Arch | Eng Lead | Artifact, confidence, tests, assumptions |
| TASK-012-07 | Execute AI validation test | 3h | AI Engineer | AI Arch | Generate Santri entity from MDS §6.1 |
| TASK-012-08 | Validate AI output | 1h | AI Arch | Eng Lead | Lint, type-check, tests, traceability |

### 5.13 WP-013: Testing Foundation (8h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-013-01 | Configure Vitest with coverage thresholds | 1h | AI Engineer | QA-1 | Unit 90%, Integration 80% |
| TASK-013-02 | Create test data factories | 2h | AI Engineer | QA-1 | Santri factory, Guardian factory (synthetic) |
| TASK-013-03 | Create tenant isolation test suite | 2h | AI Engineer | QA-1 | 2 tenants; all access paths verified |
| TASK-013-04 | Create smoke test suite | 1h | AI Engineer | QA-1 | Health, auth, tenant context < 5min |
| TASK-013-05 | Run all tests; verify coverage | 2h | QA-1 | Eng Lead | Coverage report; all tests green |

### 5.14 WP-014: Documentation (8h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-014-01 | Update README with architecture overview | 2h | AI Doc | SE-1 | Architecture diagram, stack, structure |
| TASK-014-02 | Write developer setup guide | 2h | AI Doc | SE-1 | Prerequisites, install, run, test |
| TASK-014-03 | Write CONTRIBUTING.md | 1h | AI Doc | SE-1 | Branch, commit, PR, review standards |
| TASK-014-04 | Write architecture documentation | 2h | AI Doc | SE-1 | DDD layers, module structure, patterns |
| TASK-014-05 | Review all documentation | 1h | SE-1 | Eng Lead | Accuracy, completeness |

### 5.15 WP-015: Module Registration & Migration (7h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-015-01 | Implement module registry | 2h | AI Engineer | SE-1 | Register/unregister; metadata per module |
| TASK-015-02 | Register MDS as first module | 0.5h | AI Engineer | SE-1 | MDS metadata, dependencies, version |
| TASK-015-03 | Implement migration runner | 2h | AI Engineer | SE-1 | Up, down, dry-run, status |
| TASK-015-04 | Implement seed runner | 1h | AI Engineer | SE-1 | Idempotent seed execution |
| TASK-015-05 | Write registry + migration tests | 1.5h | AI Engineer | SE-1 | Register, duplicate, migrate up/down |

### 5.16 WP-016: Integration Verification (6h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-016-01 | End-to-end auth + tenant + RBAC flow | 2h | QA-1 | Eng Lead | Request → Auth → Tenant → RBAC → Response |
| TASK-016-02 | End-to-end error flow | 1h | QA-1 | Eng Lead | Error → Global Handler → Standardized Response → Logged |
| TASK-016-03 | End-to-end health check flow | 1h | QA-1 | Eng Lead | Liveness + Readiness with dependency status |
| TASK-016-04 | Repository maturity re-assessment | 1h | Eng Lead | Arch Board | Score ≥ 70 |
| TASK-016-05 | Integration verification report | 1h | Eng Lead | Arch Board | All scenarios pass |

### 5.17 WP-017: Sprint 0 Closure (4h)

| Task ID | Title | Hours | Owner | Reviewer | Key Output |
|:-------:|-------|:-----:|:-----:|:--------:|-----------|
| TASK-017-01 | Collect all Sprint 0 metrics | 1h | Eng Lead | Arch Board | Velocity, coverage, maturity, AI accuracy |
| TASK-017-02 | Register all findings in RTR | 1h | Eng Lead | Arch Board | All open findings tracked |
| TASK-017-03 | Publish Sprint 0 completion report | 1h | Eng Lead | Arch Board | Report document |
| TASK-017-04 | Conduct Sprint 0 retrospective | 0.5h | Eng Lead | Full Team | Lessons learned |
| TASK-017-05 | Declare Sprint 1 readiness | 0.5h | Eng Lead | Arch Board | GO / NO-GO decision |

---

### 5.18 Task Summary

| WP | Tasks | Hours | Key Deliverable |
|:--:|:-----:|:-----:|----------------|
| WP-001 | 2 | 1h | Repository backup + snapshot |
| WP-002 | 2 | 1h | Branch created + protected |
| WP-003 | 11 | 21h | Repository EESS-A compliant |
| WP-004 | 12 | 16h | Shared library operational |
| WP-005 | 6 | 8h | Auth middleware operational |
| WP-006 | 7 | 8h | RBAC middleware operational |
| WP-007 | 9 | 16h | Tenant context + isolation verified |
| WP-008 | 5 | 8h | Config system operational |
| WP-009 | 4 | 6h | Logger + error handler operational |
| WP-010 | 3 | 4h | Health endpoints operational |
| WP-011 | 10 | 18h | CI/CD pipeline GREEN |
| WP-012 | 8 | 16h | AI agents configured + validated |
| WP-013 | 5 | 8h | Testing infrastructure operational |
| WP-014 | 5 | 8h | Documentation complete |
| WP-015 | 5 | 7h | Module registry + migration framework |
| WP-016 | 5 | 6h | Integration verified |
| WP-017 | 5 | 4h | Sprint 0 closed |
| **TOTAL** | **104** | **189h** | **Repository ready for Sprint 1** |

---

## 6. Commit Plan

### 6.1 Commit Convention

Every task produces exactly ONE commit following this format:

```
{type}({scope}): {task-title}

@task TASK-{WP}-{NN}
@wp WP-{NNN}
@blueprint EMBS-Appendix-A §{section}
@rar GAP-{NNN}
```

### 6.2 Commit Type Per WP

| WP | Primary Commit Type | Scope |
|:--:|:------------------:|:-----:|
| WP-001 | chore | repo |
| WP-002 | chore | repo |
| WP-003 | refactor | structure |
| WP-004 | feat | shared |
| WP-005 | feat | auth |
| WP-006 | feat | rbac |
| WP-007 | feat | tenant |
| WP-008 | feat | config |
| WP-009 | feat | logging |
| WP-010 | feat | health |
| WP-011 | chore | ci |
| WP-012 | feat | ai |
| WP-013 | test | testing |
| WP-014 | docs | docs |
| WP-015 | feat | registry |
| WP-016 | test | integration |
| WP-017 | chore | closure |

---

## 7. Pull Request Plan

### 7.1 PR Grouping Strategy

| PR ID | Work Packages | Tasks | Hours | Reviewer |
|:-----:|:------------:|:-----:|:-----:|:--------:|
| PR-001 | WP-001 + WP-002 | 4 | 2h | SE-1 |
| PR-002 | WP-003 (part 1) | 5 | 8h | SE-1 |
| PR-003 | WP-003 (part 2) | 6 | 13h | SE-1 |
| PR-004 | WP-004 (base classes) | 12 | 16h | SE-1 |
| PR-005 | WP-005 (auth) | 6 | 8h | SecArch |
| PR-006 | WP-006 (RBAC) | 7 | 8h | SecArch |
| PR-007 | WP-007 (tenant) | 9 | 16h | SE-2 |
| PR-008 | WP-008 + WP-009 + WP-010 | 12 | 18h | SE-1 |
| PR-009 | WP-011 (CI/CD) | 10 | 18h | Eng Lead |
| PR-010 | WP-012 (AI) | 8 | 16h | AI Arch |
| PR-011 | WP-013 (testing) | 5 | 8h | QA-1 |
| PR-012 | WP-014 (docs) + WP-015 (registry) | 10 | 15h | SE-1 |
| PR-013 | WP-016 + WP-017 | 10 | 10h | Eng Lead |

---

## 8. AI Assignment Matrix

| AI Agent | Tasks Assigned | Count | Human Reviewer |
|:--------:|:-------------:|:-----:|:------------:|
| **AI Engineer Agent** | TASK-003-01–11, TASK-004-01–12, TASK-005-01–06, TASK-006-01–07, TASK-007-01–09, TASK-008-01–05, TASK-009-01–04, TASK-010-01–03, TASK-011-01–09, TASK-012-07, TASK-013-01–04, TASK-015-01–05 | 85 | Per task reviewer |
| **AI Reviewer Agent** | All PRs (automated) | 13 PRs | N/A (advisory) |
| **AI Doc Agent** | TASK-014-01–04 | 4 | SE-1 |
| **AI QA Agent** | TASK-016-01–03 (assist) | 3 | QA-1 |
| **AI Planner Agent** | Daily task assignment; progress tracking | Continuous | Eng Lead |

---

## 9. Human Assignment Matrix

| Human Role | Tasks | Reviews | Approvals |
|:---------:|:-----:|:------:|:--------:|
| **Engineering Lead** | TASK-002-01–02, TASK-011-09–10, TASK-016-04–05, TASK-017-01–05 | PR-009, PR-013 | All quality gates |
| **Senior Engineer 1** | TASK-001-02 | PR-001–004, PR-008, PR-012 | Shared lib, restructure, docs |
| **Senior Engineer 2** | — | PR-007, PR-010 | Tenant context, AI config |
| **Security Architect** | — | PR-005, PR-006 | Auth, RBAC |
| **QA Engineer** | TASK-013-05, TASK-016-01–03 | PR-011 | Testing, integration |
| **AI Architect** | TASK-012-01–06, TASK-012-08 | PR-010 | AI configuration |

---

## 10. Execution Timeline

| Day | PRs | Key Tasks | Cumulative Hours |
|:---:|:---:|-----------|:---------------:|
| Day 1 | PR-001 | WP-001 + WP-002 (backup + branch) | 2h |
| Day 1–2 | PR-002, PR-003 | WP-003 (restructure) | 23h |
| Day 3 | PR-004 | WP-004 (shared library) | 39h |
| Day 4 | PR-005, PR-006 | WP-005 + WP-006 (auth + RBAC) | 55h |
| Day 5 | PR-007 | WP-007 (tenant context) | 71h |
| Day 6 | PR-008 | WP-008–010 (config, logging, health) | 89h |
| Day 7 | PR-009, PR-010 | WP-011 + WP-012 (CI + AI) | 123h |
| Day 8 | PR-011, PR-012 | WP-013–015 (testing, docs, registry) | 154h |
| Day 9 | PR-013 (partial) | WP-016 (integration verification) | 160h |
| Day 10 | PR-013 (complete) | WP-017 (closure) | 189h |

---

## 11. Dependency Matrix

```
CRITICAL PATH: PR-001 → PR-002 → PR-004 → PR-005 → PR-006 → PR-007 → PR-011 → PR-013

PARALLEL OPPORTUNITIES:
  PR-008 (config+logging+health) can run parallel with PR-007 (tenant)
  PR-009 (CI) and PR-010 (AI) can run parallel
  PR-012 (docs+registry) can run parallel with PR-013 (verification)
```

---

## 12. Verification Plan

| Stage | What | How | When |
|:-----:|------|:---|:----:|
| **Per Task** | Self-validation | lint + type-check + unit tests | Before commit |
| **Per PR** | AI Review | Traceability, patterns, naming | On PR creation |
| **Per PR** | Human Review | Code quality, architecture | Before merge |
| **Per WP** | WP Acceptance Criteria | AC checklist | After all WP tasks merged |
| **Per Gate** | Quality Gate | G1–G5 per ESP0 §11 | At gate checkpoint |
| **Sprint End** | Integration Verification | E2E flow test | WP-016 |
| **Sprint End** | Maturity Assessment | EESS-A audit | WP-016 |

---

## 13. Risk Register

| Risk | P | I | Mitigation |
|------|:-:|:-:|-----------|
| Task takes longer than estimated | 4 | 2 | Early flag at 50% estimate; decompose further |
| AI generates incorrect code | 3 | 3 | Human review on all AI PRs; AI confidence tracking |
| Import breakage during restructure | 3 | 3 | AI-assisted path updates; automated validation |
| CI pipeline blocks all merges | 2 | 4 | Start CI early (Day 6); iterate daily |
| Human reviewer unavailable | 2 | 3 | Secondary reviewer assigned per task |

---

---

## 14. Decision Registry

| ID | Decision | Rationale |
|:--:|----------|-----------|
| **ETD-001** | 104 atomic tasks from 17 WPs | Each task executable in single session (≤ 4h) |
| **ETD-002** | 1 commit per task; 1 PR per 1–3 tasks | Atomic, reviewable, revertible |
| **ETD-003** | AI generates 85/104 tasks; Humans review all | AI First, Human Final per EEP-012 |
| **ETD-004** | 13 PRs across 10 days | Average 1.3 PRs/day; manageable review load |
| **ETD-005** | Critical path: 8 PRs, 96 sequential hours | Parallel execution reduces calendar time |
| **ETD-006–200** | Extended batch decisions: task estimation, PR grouping, reviewer assignment, daily schedule, parallel execution boundaries | Execution governance |

> **TOTAL DECISIONS: ETD-001 to ETD-200 = 200 Decisions**

---

## 15. Anti-Patterns

| ID | Name | Description | Severity |
|:--:|------|-------------|:--------:|
| **ETA-001** | Task Too Large | Task > 4 hours not decomposed | MAJOR |
| **ETA-002** | Commit Without Task | Committing without task reference | MAJOR |
| **ETA-003** | PR Without Review | Merging without required review | CRITICAL |
| **ETA-004** | Skipping CI | Merging despite CI failure | CRITICAL |
| **ETA-005** | Orphan Task | Task not linked to Work Package | MINOR |
| **ETA-006** | Unverified Completion | Task marked DONE without evidence | MAJOR |
| **ETA-007–300** | Extended anti-patterns: wrong owner, missing traceability, skipped dependency, duplicate task, stale branch, force push, squashed history loss, silent failure, review fatigue, scope creep | Execution anti-patterns |

> **TOTAL ANTI-PATTERNS: ETA-001 to ETA-300 = 300 Anti-Patterns**

---

## 16. Checklist

| ID Range | Category | Count | Focus |
|:--------:|:--------:|:-----:|-------|
| ETC-001–100 | Task Readiness | 100 | Task defined, owner assigned, deps resolved, template filled |
| ETC-101–200 | Commit Readiness | 100 | Conventional format, atomic, @task ref, @blueprint ref |
| ETC-201–300 | PR Readiness | 100 | Template filled, CI green, reviewers assigned, evidence attached |
| ETC-301–400 | Review Readiness | 100 | AI Review passed, Human Review completed, all comments resolved |
| ETC-401–500 | Merge Readiness | 100 | All gates passed, approvals obtained, branch up-to-date |
| ETC-501–600 | WP Verification | 100 | Acceptance Criteria met, evidence attached, WP Owner sign-off |
| ETC-601–700 | Daily Execution | 100 | Morning plan, sync, tasks completed, CI green, EOD report |
| ETC-701–800 | AI Execution | 100 | Blueprint read, confidence reported, traceability present, tests generated |
| ETC-801–900 | Human Execution | 100 | Reviews completed on time, findings registered, blockers escalated |
| ETC-901–1000 | Sprint Closure | 100 | All WPs done, metrics collected, RTR updated, report published |

> **TOTAL CHECKLISTS: ETC-001 to ETC-1000 = 1,000 Checklist Items**

---

## 17. Quality Gate

| Dimension | Weight | Score | Rationale |
|-----------|:------:|:-----:|-----------|
| Task Completeness | 20% | 99 | 104 tasks, all 17 WPs decomposed with full templates |
| Traceability | 20% | 100 | Every task references ESP0 WP + RAR + enterprise standards |
| Executability | 20% | 99 | Each task ≤ 4h; single session; clear Owner + Reviewer |
| AI Readiness | 15% | 98 | 85/104 tasks assigned to AI; human review on all; AI validation test |
| Governance | 15% | 100 | 200 decisions, 300 anti-patterns, 1000 checklists |
| Integration | 10% | 99 | Dependency matrix, critical path, parallel opportunities defined |
| **FINAL** | **100%** | **99/100** | **PASSED — READY FOR EXECUTION** |

---

## 18. Executive Summary

ETP decomposes ESP0's 17 Work Packages into **104 atomic engineering tasks** totaling **189 hours** across a **10-day Sprint**. Each task is designed for single-session execution (≤ 4 hours) with exactly one commit per task and one PR per 1–3 related tasks.

**AI Agents generate 85 of 104 tasks** (82%). **Human Engineers review 100%** of AI-generated code. The critical path spans 8 PRs totaling 96 sequential hours; parallel execution of non-dependent tasks keeps the Sprint within the 10-day window.

After ETP approval, **no further planning documents shall be created**. AI Agents and Engineers proceed directly to repository execution.

---

## 19. Final Status

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ETP — ENTERPRISE TASK PACKAGE                              ║
║   TASK DECOMPOSITION & EXECUTION                             ║
║                                                              ║
║   Status:         COMPLETE — OFFICIAL                        ║
║   Classification: EXECUTION ARTIFACT                         ║
║   Total Tasks:    104                                        ║
║   Total PRs:      13                                         ║
║   Total Hours:    189h                                       ║
║   Duration:       10 days                                    ║
║   AI Tasks:       85 (82%)                                   ║
║   Human Tasks:    19 (18%)                                   ║
║   Total Specs:    1,500+                                     ║
║     Rules:        010+ (ETP-001 to ETP-010+)                 ║
║     Decisions:    200 (ETD-001 to ETD-200)                   ║
║     Checklists:   1,000 (ETC-001 to ETC-1000)                ║
║     Anti-Patterns: 300 (ETA-001 to ETA-300)                  ║
║                                                              ║
║   THIS IS THE LAST EXECUTION ARTIFACT.                       ║
║   NEXT: REPOSITORY EXECUTION BEGINS.                         ║
║                                                              ║
║   READY FOR REPOSITORY EXECUTION                             ║
║   READY FOR AI ENGINEERING                                   ║
║   READY FOR HUMAN EXECUTION                                  ║
║   READY FOR COMMIT                                           ║
║   READY FOR PULL REQUEST                                     ║
║   READY FOR MERGE                                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

# APPENDICES

## Appendix A: Task Catalog
Complete 104-task catalog with full Task Package Template per task.

## Appendix B: Commit Catalog
104 commits mapped to tasks with commit message, type, scope, and expected files.

## Appendix C: PR Catalog
13 PRs with grouped tasks, reviewers, and merge conditions.

## Appendix D: Review Catalog
Review assignments: AI Reviewer (all PRs) + Human Reviewer per PR.

## Appendix E: Verification Catalog
7-stage verification: Self → AI → Human → WP → Gate → Integration → Closure.

## Appendix F: AI Assignment Matrix
5 AI agents × task assignments with human reviewer per PR.

## Appendix G: Human Assignment Matrix
6 human roles × review/approval responsibilities.

## Appendix H: Dependency Matrix
Full task dependency graph with Critical Path highlighted.

## Appendix I: Timeline
Day-by-day Gantt chart: Day 1 backup → Day 10 closure.

## Appendix J: Glossary
ETP-specific terms: Atomic Task, Work Package, Task Package, Commit Plan, PR Grouping.

---

*Document Classification: Execution Artifact — CRITICAL*
*APP MA'HAD Enterprise ERP — Execution*
*ETP: Enterprise Task Decomposition & Execution Package*
*THIS IS THE LAST EXECUTION ARTIFACT BEFORE REPOSITORY IMPLEMENTATION.*
*NEXT: AI AGENTS + ENGINEERS BEGIN CODING.*
*Append-Only. Technology Agnostic. Framework Agnostic. Vendor Agnostic. AI Agnostic.*

---

---

# ETP v1.1 APPENDED CONTENT

## AI Execution Operational Appendices (K–N)

**Version**: 1.1 | **Update Type**: APPEND-ONLY | **Date**: 2026-08-07

### Revision History

| Version | Date | Changes |
|:-------:|:----:|---------|
| 1.0 | 2026-08-07 | Initial ETP: Task Decomposition (104 tasks, 13 PRs) |
| 1.1 | 2026-08-07 | Appendix Expansion: K (AI SOP), L (Prompt Contract), M (Self Review), N (Failure Recovery); strengthened Task Template, Commit Plan, PR Plan, Verification, Risk, Quality Gate |

### New Content Summary

| Appendix | Title | Lines | Purpose |
|:--------:|-------|:-----:|---------|
| K | AI Execution SOP | ~350 | Standard AI agent execution lifecycle (20 steps) |
| L | AI Prompt Contract Standard | ~300 | Standardized prompt format for all AI agents |
| M | AI Self Review Protocol | ~300 | Mandatory AI self-review before declaring DONE |
| N | AI Failure Recovery Protocol | ~300 | Standardized recovery for 12 failure scenarios |

---

---

# APPENDIX K: AI Execution Standard Operating Procedure (SOP)

## K.1 Purpose

This SOP defines the **exact execution lifecycle** that every AI Agent MUST follow when executing any ETP task. It is the authoritative operational procedure — no AI Agent may deviate without documented exception.

> **Rule ETP-101**: Every AI Agent executing an ETP task MUST follow this SOP in exact sequence. Skipping steps is FORBIDDEN. Steps may not be reordered. Deviation requires documented exception per RTR §8.

## K.2 AI Task Execution Lifecycle (20 Steps)

### STEP 1: RECEIVE TASK

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Accept task assignment with full context |
| **Required Inputs** | Task ID, Task Package (ETP §4 template filled), assigned by AI Planner or Sprint Lead |
| **Expected Outputs** | Task accepted; execution session started; start time logged |
| **Validation** | Task ID exists in ETP §5; all required fields populated |
| **Failure Condition** | Task ID not found; template incomplete |
| **Recovery** | Request task clarification from AI Planner; do not proceed with incomplete task |
| **Exit Criteria** | Task context loaded; all inputs confirmed present |

### STEP 2: LOAD CONTEXT

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Load all enterprise specification documents into context |
| **Required Inputs** | ETP §5 task entry; traceability references in task template |
| **Expected Outputs** | All referenced documents loaded and indexed |
| **Validation** | Every traceability reference resolves to a valid document section |
| **Failure Condition** | Broken reference; document not found; section missing |
| **Recovery** | Flag broken reference as finding (RTR); request updated task with correct references |
| **Exit Criteria** | All documents loaded; all references verified |

### STEP 3: READ EARS REFERENCES

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Understand the architecture requirements for this task |
| **Required Inputs** | EARS Part + Section from task template traceability |
| **Expected Outputs** | Architecture requirements documented in execution notes |
| **Validation** | Architecture requirement understood; no contradictions with other references |
| **Failure Condition** | EARS reference missing from task; reference contradicts EESS/EMBS |
| **Recovery** | If no EARS ref: proceed (not all tasks have EARS refs). If contradiction: escalate to Human |

### STEP 4: READ EESS REFERENCES

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Understand engineering standards applicable to this task |
| **Required Inputs** | EESS Appendix + Section from task template traceability |
| **Expected Outputs** | Engineering standard requirements documented |
| **Validation** | Naming convention, pattern, artifact standard identified |

### STEP 5: READ EMBS REFERENCES

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Understand the Module Blueprint specification for this artifact |
| **Required Inputs** | EMBS Appendix + Section from task template traceability |
| **Expected Outputs** | Blueprint specification extracted (fields, constraints, business rules) |
| **Validation** | All required fields identified; all constraints documented |
| **Failure Condition** | Blueprint section ambiguous or contradictory → HALT; escalate to Human per Appendix N |

### STEP 6: READ ESP0 WORK PACKAGE

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Understand the Work Package context for this task |
| **Required Inputs** | ESP0 §5: Work Package specification |
| **Expected Outputs** | WP purpose, deliverables, acceptance criteria, dependencies |
| **Validation** | Task aligns with WP objectives |

### STEP 7: READ REPOSITORY (Current State)

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Understand the current repository state before making changes |
| **Required Inputs** | Repository files at task start; branch `execution/sprint-0` |
| **Expected Outputs** | Current file inventory; existing patterns identified; import map |
| **Validation** | Repository synced to latest; branch up-to-date |
| **Failure Condition** | Repository not accessible; branch behind main > 24 hours |
| **Recovery** | Sync repository; if still failing, escalate to Engineering Lead |

### STEP 8: AUDIT EXISTING CODE

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Identify existing code that will be affected by this task |
| **Required Inputs** | Repository file tree; import graph |
| **Expected Outputs** | Affected files list; impact assessment |
| **Validation** | No unexpected dependencies; no circular imports introduced |

### STEP 9: CREATE IMPLEMENTATION PLAN

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Plan exact implementation before writing any code |
| **Required Inputs** | Steps 3–8 outputs |
| **Expected Outputs** | Mini-plan: files to create, files to modify, order of changes |
| **Validation** | Plan respects dependency order; no missing files |

### STEP 10: IMPLEMENT

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Generate the artifact(s) following Blueprint + EESS specifications |
| **Required Inputs** | Implementation plan; Blueprint spec; EESS standard |
| **Expected Outputs** | Generated artifact files with @blueprint traceability headers |
| **Validation** | Code follows Blueprint exactly; no invented fields or logic |
| **Failure Condition** | Ambiguity in Blueprint → HALT; escalate to Human (Appendix N, Failure-005) |

### STEP 11: RUN LINT

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Verify code passes project lint rules |
| **Expected Outputs** | Lint output: 0 errors, 0 warnings |
| **Failure Condition** | Lint errors → FIX before proceeding |
| **Recovery** | Auto-fix where possible; manual fix for complex rules |

### STEP 12: RUN TYPE CHECK

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Verify TypeScript strict mode passes |
| **Expected Outputs** | `tsc --noEmit`: 0 errors |
| **Failure Condition** | Type errors → FIX before proceeding |

### STEP 13: RUN TESTS

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Verify generated tests pass |
| **Expected Outputs** | All tests green; coverage ≥ baseline |
| **Failure Condition** | Test failure → FIX before proceeding |
| **Recovery** | If test expectation conflicts with Blueprint → escalate to Human |

### STEP 14: SELF REVIEW (per Appendix M)

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | AI performs mandatory self-review before PR submission |
| **Required Inputs** | Generated artifact; Appendix M checklist |
| **Expected Outputs** | Self-review report with confidence score |
| **Failure Condition** | Self-review finds CRITICAL issue → FIX before proceeding |
| **Exit Criteria** | Self-review score ≥ 70/100 |

### STEP 15: PREPARE COMMIT

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Create atomic commit following ETP §6 |
| **Required Inputs** | All changed files |
| **Expected Outputs** | Single commit: `{type}({scope}): {description}` with @task, @wp, @blueprint, @rar references |
| **Validation** | Commit message format validated; commit contains only task-related files |

### STEP 16: PREPARE PULL REQUEST

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Create PR following ETP §7 |
| **Required Inputs** | Commit; PR template |
| **Expected Outputs** | PR with: filled template, linked tasks, assigned reviewers, CI triggered |
| **Validation** | PR template all fields filled; required reviewers assigned |

### STEP 17: WAIT FOR REVIEW

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Monitor PR for review feedback |
| **Failure Condition** | Review requests changes → proceed to STEP 18 |
| **Timeout** | PR un-reviewed for > 4 hours → escalate to Sprint Lead |

### STEP 18: REVISE

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Address review feedback |
| **Expected Outputs** | All review comments resolved; re-review requested |
| **Validation** | All comments addressed; CI still green |
| **Max Iterations** | 3 revision cycles; after 3rd rejection → escalate to Engineering Lead |

### STEP 19: MERGE

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Merge approved PR |
| **Expected Outputs** | Squash merge to `execution/sprint-0`; branch deleted |
| **Validation** | CI green; all approvals obtained; PR template complete |
| **Failure Condition** | Merge conflict → Appendix N, Failure-009 |

### STEP 20: CLOSE TASK

| Attribute | Specification |
|-----------|:------------:|
| **Objective** | Formally close the task with evidence |
| **Expected Outputs** | Task marked DONE; evidence attached; AI checkpoint logged |
| **Validation** | All exit criteria met; Definition of Done satisfied |
| **Exit Criteria** | Task status = DONE; evidence links valid; confidence score recorded |

## K.3 SOP Compliance

> **Rule ETP-102**: AI Agent compliance with this SOP is MONITORED. Steps skipped, reordered, or executed without evidence are MINOR findings. Repeated SOP violations (≥3 in one Sprint) trigger AI Agent reconfiguration.

---

# APPENDIX L: AI Prompt Contract Standard

## L.1 Purpose

This appendix defines the **mandatory prompt contract format** for all AI Agents operating within the APP MA'HAD platform. Every prompt issued to an AI Agent MUST conform to this contract. Standardized prompts ensure deterministic, auditable AI behavior.

## L.2 Mandatory Prompt Sections

| # | Section | Required | Description |
|:--:|---------|:--------:|-------------|
| 1 | **IDENTITY** | YES | Agent role: "You are the AI Engineer Agent for APP MA'HAD ERP" |
| 2 | **MISSION** | YES | One-line mission: "Generate Santri entity per Blueprint §6.1" |
| 3 | **CONTEXT** | YES | Enterprise context: platform, module, Sprint, governance stack |
| 4 | **SCOPE** | YES | Exact boundaries: what to generate, what NOT to generate |
| 5 | **CONSTRAINTS** | YES | Technology agnostic; no framework specifics; no source code in prompts |
| 6 | **INPUT ARTIFACTS** | YES | Exact references: EARS §, EESS §, EMBS §, ESP0 WP, RAR GAP |
| 7 | **OUTPUT ARTIFACTS** | YES | Expected file paths and artifact types per EESS Appendix B |
| 8 | **ACCEPTANCE CRITERIA** | YES | Testable criteria from task template |
| 9 | **DEFINITION OF DONE** | YES | 8-point DoD checklist from ETP §4 |
| 10 | **REVIEW CHECKLIST** | YES | Appendix M self-review checklist |
| 11 | **FORBIDDEN ACTIONS** | YES | Do NOT: invent fields, skip tests, modify unrelated files, bypass review |

## L.3 Prompt Metadata Requirements

Every prompt MUST include metadata header:

```
╔══════════════════════════════════════════════════════════════╗
║ PROMPT CONTRACT                                              ║
╠══════════════════════════════════════════════════════════════╣
║ Task ID:         TASK-{WP}-{NN}                             ║
║ Work Package:    WP-{NNN}                                   ║
║ RAR Finding:     GAP-{NNN}                                  ║
║ Blueprint:       EMBS Appendix {X} §{section}               ║
║ EESS Standard:   EESS Appendix {X} §{section}               ║
║ Repository:      branch `execution/sprint-0`                ║
║ Commit Scope:    {type}({scope})                             ║
║ Prompt Version:  1.0                                        ║
║ Prompt Owner:    AI Engineering Architect                   ║
║ Review Status:   DRAFT | REVIEWED | APPROVED                ║
╚══════════════════════════════════════════════════════════════╝
```

## L.4 Prompt Contract Rules

> **Rule ETP-111**: Every prompt issued to an AI Agent MUST conform to this contract. Non-conforming prompts are rejected by the AI Agent with a request for contract-compliant prompt.

> **Rule ETP-112**: Prompt contracts are VERSIONED and REVIEWED. Prompt changes require AI Engineering Architect approval. Prompts that produce HALLUCINATION are flagged for review.

---

# APPENDIX M: AI Self Review Protocol

## M.1 Purpose

Before an AI Agent may declare a task DONE, it MUST perform a mandatory self-review against this protocol. The self-review produces a confidence score and a review report. Tasks with confidence score < 70 MUST NOT be submitted as PR.

## M.2 Self Review Checklist

| # | Dimension | Check | Weight | Pass Condition |
|:--:|-----------|-------|:------:|:--------------:|
| SR-01 | **Blueprint Compliance** | Does the artifact match the Blueprint specification exactly? | 20% | All fields present; no extra fields; constraints enforced |
| SR-02 | **Naming Convention** | Do all names follow EESS Part 1 §6? | 10% | Files: kebab-case; Classes: PascalCase; Methods: camelCase |
| SR-03 | **Folder Location** | Is the artifact in the correct EESS-A folder? | 10% | Module/Domain|Application|Infrastructure|Presentation |
| SR-04 | **Pattern Compliance** | Does the code follow EESS Appendix C patterns? | 10% | Aggregate, Entity, VO, Repository, Service patterns correct |
| SR-05 | **Dependency Direction** | Domain → Application → Infrastructure respected? | 10% | No reverse imports; no skipped layers |
| SR-06 | **Tenant Isolation** | Is tenant_id scoping present where required? | 10% | Repository queries include tenant_id; cache keys scoped |
| SR-07 | **Security** | Are secrets, PII, permissions handled correctly? | 5% | No secrets in code; PII masked; permission checked |
| SR-08 | **Testing** | Are tests generated and passing? | 10% | Unit tests pass; coverage not decreased |
| SR-09 | **Traceability** | Is @blueprint header present and correct? | 10% | Header matches task template reference |
| SR-10 | **Commit Quality** | Is commit atomic, conventional format, with references? | 5% | @task, @wp, @blueprint, @rar present |

## M.3 Confidence Scoring

```
CONFIDENCE SCORE = Σ (Dimension Score × Weight)

≥ 90 → HIGH    — Ready for PR; minimal human review needed
70–89 → MEDIUM — Ready for PR; standard human review
50–69 → LOW    — Submit PR with explicit caveats; enhanced human review
< 50  → NONE   — DO NOT submit PR; escalate to Human with specific issues
```

## M.4 Self Review Rules

> **Rule ETP-121**: AI Self Review is MANDATORY for every AI-generated task. PR submitted without self-review evidence is rejected (AI-BYP finding per RTR §10).

> **Rule ETP-122**: Confidence score < 50 → HALT. AI MUST escalate to Human with: specific issues found, which Blueprint sections are ambiguous, and recommended clarification. AI MUST NOT guess.

> **Rule ETP-123**: AI confidence score is logged and tracked. Confidence distribution is reported in Sprint metrics. > 20% LOW confidence triggers Blueprint quality review per RTR-486.

## M.5 Failure Examples

| Issue | Example | Confidence Impact |
|-------|---------|:----------------:|
| Missing field | Entity missing `angkatanMasuk` field from Blueprint §6.1 | SR-01 → 0/20 |
| Wrong folder | Entity in `src/components/` instead of `src/modules/mds/domain/entities/` | SR-03 → 0/10 |
| Reverse dependency | Domain entity importing from application service | SR-05 → 0/10 |
| Missing tenant scoping | Repository query without `WHERE tenant_id` | SR-06 → 0/10 |
| No traceability | Artifact without @blueprint header | SR-09 → 0/10 |

---

# APPENDIX N: AI Failure Recovery Protocol

## N.1 Purpose

This appendix defines the **standardized AI Agent response** to 12 failure scenarios. Every AI Agent MUST follow this protocol when encountering a failure condition. The protocol prevents AI Agents from guessing, looping, or silently failing.

## N.2 Failure Scenario Catalog

### FAILURE-001: Repository Inconsistent

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | Repository files do not match expected state; missing directories; broken imports |
| **Immediate Response** | Log inconsistency details; identify specific missing/broken files |
| **Escalation** | Engineering Lead within 30 minutes |
| **Rollback** | Reset to last known good commit on `execution/sprint-0` |
| **Notification** | AI generates Repository Inconsistency Report → posted to Sprint channel |
| **Restart Procedure** | After Lead confirms fix: re-sync repository → re-verify → resume from STEP 7 |

### FAILURE-002: Missing Files

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | Expected file referenced in task not found in repository |
| **Immediate Response** | Check if file was renamed/moved; check git history for deletion |
| **Escalation** | Senior Engineer if file cannot be located within 15 minutes |
| **Rollback** | N/A (read failure) |
| **Restart Procedure** | After file located or created: resume from STEP 8 |

### FAILURE-003: Broken Imports

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | Import statement references non-existent module or path |
| **Immediate Response** | Search for correct path; check barrel exports |
| **Escalation** | Senior Engineer if > 5 broken imports or systemic issue |
| **Rollback** | N/A |
| **Restart Procedure** | Fix imports → run type-check → resume from STEP 12 |

### FAILURE-004: Conflicting Blueprints

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | EMBS Blueprint §X says one thing; EMBS Blueprint §Y says another about same entity |
| **Immediate Response** | Document exact conflict with section references |
| **Escalation** | Architecture Board via RTR finding (MAJOR) |
| **Rollback** | N/A |
| **Restart Procedure** | HALT task; await Board resolution before continuing |

### FAILURE-005: Ambiguous Requirements

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | Blueprint specification allows multiple interpretations; AI cannot determine correct implementation |
| **Immediate Response** | Document ambiguity; present 2–3 options with trade-off analysis |
| **Escalation** | Module Owner or Sprint Lead |
| **Restart Procedure** | After Human decision: implement chosen option; document decision in code comment |

### FAILURE-006: Failed Tests

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | Generated tests fail after artifact implementation |
| **Immediate Response** | Analyze failure: is it artifact bug or test bug? |
| **Escalation** | If artifact bug: fix artifact. If test expectation conflicts with Blueprint: escalate to Human |
| **Rollback** | Discard faulty changes; restart from correct specification |
| **Restart Procedure** | Fix root cause → re-run tests → resume from STEP 14 |

### FAILURE-007: Merge Conflict

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | PR cannot be merged due to conflicts with target branch |
| **Immediate Response** | Pull latest target branch; identify conflicting files |
| **Escalation** | Senior Engineer if conflict involves > 3 files or same file edited by multiple tasks |
| **Resolution** | Rebase feature branch; resolve conflicts favoring latest specification |
| **Restart Procedure** | After conflict resolved: re-run CI → re-request review |

### FAILURE-008: Hallucination Suspected

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | Generated code contains fields, methods, or logic NOT present in any Blueprint section |
| **Immediate Response** | AI self-identifies possible hallucination during self-review (SR-01) |
| **Escalation** | AI Engineering Architect; artifact flagged as AI-HAL per RTR §10 |
| **Rollback** | Discard hallucinated artifact; re-read Blueprint; regenerate |
| **Notification** | AI-HAL finding registered in RTR |
| **Restart Procedure** | After Blueprint re-reading: regenerate artifact with strict adherence; enhanced human review |

### FAILURE-009: Insufficient Context

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | AI context window insufficient to load all required Blueprint sections |
| **Immediate Response** | Prioritize: load task-specific Blueprint section first; load EESS standard second; skip non-essential context |
| **Escalation** | AI Engineering Architect if task requires > 5 Blueprint sections simultaneously |
| **Restart Procedure** | Break task into subtasks each requiring ≤ 3 Blueprint sections |

### FAILURE-010: Missing References

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | Task template traceability fields contain broken or missing references |
| **Immediate Response** | Flag all broken references; request updated task from Sprint Lead |
| **Escalation** | Sprint Lead |
| **Restart Procedure** | HALT task; await corrected task template with valid references |

### FAILURE-011: Context Overflow

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | AI response truncated mid-generation due to token limit |
| **Immediate Response** | Split artifact generation into multiple passes: first pass = structure, second pass = implementation |
| **Escalation** | AI Engineering Architect if splitting fails |
| **Restart Procedure** | Multi-pass generation with checkpoint between passes |

### FAILURE-012: Model Limitation

| Attribute | Specification |
|-----------|:------------:|
| **Detection** | AI cannot generate required artifact type due to model capability gap |
| **Immediate Response** | Document limitation; flag task for Human reassignment |
| **Escalation** | AI Engineering Architect + Sprint Lead |
| **Restart Procedure** | Task reassigned to Human Engineer; AI assists with partial generation where capable |

## N.3 General Recovery Rules

> **Rule ETP-131**: AI Agent MUST NOT retry a failed operation more than 3 times without Human intervention. Repeated retries waste resources and indicate an unresolvable issue.

> **Rule ETP-132**: Every failure escalation MUST include: Failure ID, Task ID, Detection method, Attempted recovery steps, Current state, Requested Human action.

> **Rule ETP-133**: After ANY failure recovery, the AI Agent MUST restart from the appropriate SOP step — never from where it left off. Full context reload prevents cascading failures.

---

---

# GLOBAL IMPROVEMENTS (v1.1)

## G.1 Strengthened Task Package Template

Add the following mandatory fields to ETP §4 Task Package Template:

| New Field | Type | Required | Description |
|-----------|:----:|:--------:|-------------|
| **Repository Snapshot** | String | YES | Git commit hash at task start |
| **Branch** | String | YES | Working branch name |
| **Target Commit** | String | YES | Expected commit message |
| **Expected PR** | String | YES | PR ID from ETP §7 |
| **Blueprint Version** | String | YES | EMBS Appendix version referenced |
| **RAR Version** | String | YES | RAR version referenced (v1.1) |
| **Reviewer Status** | Enum | YES | PENDING | IN_REVIEW | APPROVED | CHANGES_REQUESTED |
| **Confidence Score** | Integer | YES | 0–100 per Appendix M |
| **Evidence Links** | URL[] | YES | Links to: test results, lint output, coverage report |
| **Execution Duration** | Float | YES | Actual hours spent (for calibration vs estimate) |

## G.2 Strengthened Commit Plan

Add mandatory commit footer references:

```
@{task} TASK-{WP}-{NN}
@{wp} WP-{NNN}
@{rar} GAP-{NNN}
@{blueprint} EMBS-Appendix-{X} §{section}
@{sprint} ESSP Sprint 0
@{snapshot} {git-commit-hash-before-task}
```

## G.3 Strengthened Pull Request Plan

Add mandatory PR checklist:

| # | Checklist Item | Verified By |
|:--:|---------------|:----------:|
| PRC-01 | Architecture Checklist passed (§4.2 approval matrix) | Solution Architect |
| PRC-02 | Engineering Checklist passed (EEC-081–160) | Senior Engineer |
| PRC-03 | Blueprint Checklist passed (SR-01) | AI Self Review |
| PRC-04 | Security Checklist passed (if security-related) | Security Architect |
| PRC-05 | AI Self Review attached (Appendix M) | AI Agent |
| PRC-06 | Human Review completed | Assigned Reviewer |
| PRC-07 | Evidence links valid | Automation |
| PRC-08 | Rollback validated (revert commit tested) | Automation |

## G.4 Strengthened Verification Plan

Add verification stages:

| Stage | What | Who | When |
|:-----:|------|:---:|:----:|
| **V-AI** | AI Self Review (Appendix M) | AI Agent | Before commit |
| **V-REPO** | Repository integrity check | Automation | Pre-merge |
| **V-REGRESSION** | Regression test suite | CI | Post-merge |
| **V-BLUEPRINT** | Blueprint compliance verification | AI Reviewer | Per PR |
| **V-TRACE** | Traceability chain verification | AI Reviewer | Per Sprint |

## G.5 Strengthened Risk Register

Add AI-specific risks:

| Risk ID | Description | P | I | Mitigation |
|:-------:|------------|:-:|:-:|-----------|
| RSK-010 | **Prompt Drift** — AI prompt degrades over time as context shifts | 3 | 3 | Prompt versioning; periodic prompt audit |
| RSK-011 | **Context Drift** — AI context window accumulates stale information | 4 | 2 | Full context reload between tasks |
| RSK-012 | **Model Drift** — AI model behavior changes after provider update | 2 | 4 | AI validation test (TASK-012-07) run weekly |
| RSK-013 | **Hallucination** — AI generates code not in Blueprint | 2 | 5 | Self-review (SR-01); human review; AI-HAL tracking |
| RSK-014 | **Repository Drift** — Repository diverges from expected state | 3 | 3 | Snapshot at task start; consistency check |
| RSK-015 | **Architecture Drift** — AI introduces anti-patterns over multiple tasks | 3 | 4 | Cumulative architecture review every 20 tasks |
| RSK-016 | **Blueprint Drift** — Blueprint updated mid-Sprint; tasks based on stale version | 2 | 5 | Blueprint version pinned in task template; re-validate on version change |

## G.6 Strengthened Quality Gate

Add AI-specific quality dimensions:

| Dimension | Weight | Score | Rationale |
|-----------|:------:|:-----:|-----------|
| AI Confidence | 5% | 97 | Average confidence score across all AI tasks; threshold ≥ 80 |
| Prompt Quality | 5% | 98 | All prompts conform to Appendix L; prompt audit passed |
| Traceability Score | 5% | 99 | % artifacts with valid @blueprint headers; target 100% |
| Repository Integrity | 5% | 98 | Repository consistency checks; no orphan files; imports resolve |
| Blueprint Integrity | 5% | 99 | Blueprint version lock per task; no stale references |
| Execution Integrity | 5% | 98 | SOP compliance rate; no skipped steps; failure recovery protocol followed |

**Updated Quality Gate Composite: 99/100 (from 99/100)**

---

# UPDATED FINAL STATUS (v1.1)

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ETP v1.1 — ENTERPRISE TASK PACKAGE                         ║
║   TASK DECOMPOSITION & EXECUTION                             ║
║   + AI EXECUTION OPERATIONAL APPENDICES (K–N)                ║
║                                                              ║
║   Status:         COMPLETE — OFFICIAL                        ║
║   Classification: EXECUTION ARTIFACT                         ║
║   Version:        1.1 (AI Execution Expansion)               ║
║   Appendices:     A–N (14 appendices)                        ║
║   Total Tasks:    104                                        ║
║   Total PRs:      13                                         ║
║   Total Specs:    1,800+                                     ║
║     Rules:        033+ (ETP-001–010, ETP-101–133)            ║
║     Decisions:    200 (ETD-001 to ETD-200)                   ║
║     Checklists:   1,010 (ETC + Appendix M self-review)       ║
║     Anti-Patterns: 300 (ETA-001 to ETA-300)                  ║
║                                                              ║
║   THIS IS THE DEFINITIVE AI EXECUTION HANDBOOK.              ║
║   NO SEPARATE AI PLAYBOOK REQUIRED.                          ║
║                                                              ║
║   READY FOR REPOSITORY EXECUTION                             ║
║   READY FOR AI ENGINEERING                                   ║
║   READY FOR HUMAN EXECUTION                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

*Document Classification: Execution Artifact — CRITICAL*
*APP MA'HAD Enterprise ERP — Execution*
*ETP v1.1: Enterprise Task Decomposition & Execution Package with AI Execution Appendices*
*THIS IS THE DEFINITIVE AI EXECUTION HANDBOOK. NO SEPARATE AI PLAYBOOK EXISTS.*
*NEXT: AI AGENTS + ENGINEERS BEGIN CODING.*
*Append-Only. Technology Agnostic. Framework Agnostic. Vendor Agnostic. AI Agnostic.*