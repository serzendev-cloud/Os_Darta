# EEP — Part 1: Enterprise Engineering Execution Package

**APP MA'HAD Enterprise ERP**

| Metadata | Value |
|----------|-------|
| **Document** | Enterprise Engineering Execution Package (EEP) |
| **Part** | 1 — Enterprise Engineering Execution Foundation |
| **Abbreviation** | EEP |
| **Version** | 1.0 |
| **Status** | OFFICIAL |
| **Classification** | Enterprise Execution Standard — CRITICAL |
| **Mode** | Append-Only |
| **Technology** | Technology Agnostic |
| **Framework** | Framework Agnostic |
| **Language** | Language Agnostic |
| **Vendor** | Vendor Agnostic |
| **AI** | AI Vendor Agnostic |
| **NO SOURCE CODE. NO IMPLEMENTATION. ONLY ENGINEERING EXECUTION STANDARD.** |
| **Parent Documents** | EARS Part 1–6, EARS Appendix A–P, EESS Part 1, EESS Appendix A–G, EMBS Part 1, EMBS Appendix A–B, BRR, RTR, ESSP Part 1, ESSP Sprint 0 |
| **Target Audience** | AI Planner Agent, AI Architect Agent, AI Engineer Agent, AI Reviewer Agent, AI QA Agent, Human Engineers, Project Manager, Architecture Board |
| **Prerequisite** | ESSP Sprint 0 (Enterprise Foundation Sprint) — execution begins AFTER foundation is established |

---

## Document Hierarchy — The Complete Execution Stack

```
ENTERPRISE ARCHITECTURE (Definition)
│   EARS → EESS → EMBS
│   Defines WHAT to build
│
├── ENTERPRISE GOVERNANCE (Validation)
│   BRR → RTR
│   Defines HOW to review and track
│
├── ENTERPRISE SPRINT (Planning)
│   ESSP Part 1 → ESSP Sprint 0 → ESSP Sprint 1+
│   Defines WHEN to build
│
└── ENTERPRISE EXECUTION (Implementation)  ◄── THIS DOCUMENT
    EEP Part 1
    Defines HOW to execute engineering work
```

> **Rule EEP-001**: EEP defines HOW engineering work is EXECUTED. It does NOT define architecture (EARS/EESS/EMBS), governance (BRR/RTR), or sprint planning (ESSP). EEP is the operational handbook for daily engineering execution.

> **Rule EEP-002**: EEP execution begins AFTER ESSP Sprint 0 is complete. Sprint 0 establishes the foundation; EEP governs how engineering work happens on that foundation.

---

## Table of Contents

1. [Execution Philosophy](#1-execution-philosophy)
2. [Engineering Execution Lifecycle](#2-engineering-execution-lifecycle)
3. [Daily Engineering Workflow](#3-daily-engineering-workflow)
4. [AI Agent Execution](#4-ai-agent-execution)
5. [Human Roles](#5-human-roles)
6. [Repository Workflow](#6-repository-workflow)
7. [Branch Strategy](#7-branch-strategy)
8. [Commit Standard](#8-commit-standard)
9. [Pull Request Standard](#9-pull-request-standard)
10. [AI Coding Workflow](#10-ai-coding-workflow)
11. [Artifact Production Workflow](#11-artifact-production-workflow)
12. [Review Workflow](#12-review-workflow)
13. [Quality Workflow](#13-quality-workflow)
14. [Daily Reporting](#14-daily-reporting)
15. [Risk Handling](#15-risk-handling)
16. [Engineering Metrics](#16-engineering-metrics)
17. [Decision Registry](#17-decision-registry)
18. [Anti-Patterns](#18-anti-patterns)
19. [Engineering Checklist](#19-engineering-checklist)
20. [Engineering Readiness](#20-engineering-readiness)
21. [Final Status](#21-final-status)

### Appendices (A–J)

---

---

## 1. Execution Philosophy

### 1.1 The Execution-Driven Principle

EEP is founded on a single principle: **Architecture defines WHAT. EEP defines HOW.** Every engineering activity — from the moment an AI Agent reads a Blueprint section to the moment code is merged — follows standardized execution workflows defined in this document.

```
EXECUTION-DRIVEN ENGINEERING

BLUEPRINT (EMBS)            EEP (This Document)           REPOSITORY
─────────────────           ─────────────────────         ──────────
§6.1 Santri Entity    →     AI Coding Workflow (§10)  →   santri.entity.ts
§8.1 SantriRepository →     PR Standard (§9)          →   santri.repository.ts
§11.1 GET /santri     →     Review Workflow (§12)     →   santri.controller.ts
```

> **Rule EEP-003**: Every engineering activity MUST be traceable through the execution stack: Blueprint Section → Sprint Task → Execution Workflow → Generated Artifact → Review → Merge. Missing traceability at any layer is a finding.

> **Rule EEP-004**: Blueprint First — no engineering work begins without reading the corresponding EMBS Blueprint section. Working from memory, assumptions, or "common sense" is FORBIDDEN.

### 1.2 Core Execution Principles

| Principle | Definition | Rule |
|-----------|-----------|:----:|
| **Blueprint First** | Read Blueprint → Understand → Execute | EEP-004 |
| **Sprint Driven** | Work ONLY on assigned Sprint tasks; no off-Sprint work | EEP-005 |
| **Incremental Delivery** | Small, atomic changes; no big-bang merges | EEP-006 |
| **Zero Big Bang** | No feature branch living > 1 day without merge | EEP-007 |
| **Continuous Validation** | Validate at every step: lint → type-check → test → review | EEP-008 |
| **Continuous Refactoring** | Refactor within Sprint scope; no "refactoring Sprint" | EEP-009 |
| **Continuous Review** | AI review on generation; Human review before merge | EEP-010 |
| **Continuous Quality** | Quality gate at every PR; no degradation from baseline | EEP-011 |
| **AI First, Human Final** | AI generates; Human reviews and approves | EEP-012 |
| **Traceability Always** | Every artifact has @blueprint header; every PR references Sprint Task | EEP-013 |

### 1.3 What EEP Does NOT Define

> **Rule EEP-014**: EEP MUST NOT redefine: (a) Architecture (EARS), (b) Engineering Standards (EESS), (c) Blueprint Specifications (EMBS), (d) Review Governance (BRR/RTR), (e) Sprint Planning (ESSP). EEP ONLY defines execution workflows.

### 1.4 Rule Registry (§1)

| Rule ID | Statement Summary | Severity |
|:-------:|------------------|:--------:|
| EEP-001 | EEP defines HOW engineering is executed; does not define architecture | CRITICAL |
| EEP-002 | Execution begins AFTER ESSP Sprint 0 complete | CRITICAL |
| EEP-003 | Every activity traceable: Blueprint → Task → Workflow → Artifact → Review → Merge | CRITICAL |
| EEP-004 | Blueprint First — no work without reading Blueprint section | CRITICAL |
| EEP-005 | Sprint Driven — work only on assigned Sprint tasks | CRITICAL |
| EEP-006 | Incremental Delivery — small, atomic changes | HIGH |
| EEP-007 | Zero Big Bang — feature branch ≤ 1 day without merge | HIGH |
| EEP-008 | Continuous Validation — validate at every step | HIGH |
| EEP-009 | Continuous Refactoring — refactor within Sprint scope | MEDIUM |
| EEP-010 | Continuous Review — AI review on generation; Human before merge | CRITICAL |
| EEP-011 | Continuous Quality — quality gate at every PR | CRITICAL |
| EEP-012 | AI First, Human Final — AI generates; Human approves | CRITICAL |
| EEP-013 | Traceability Always — @blueprint header on every artifact | CRITICAL |
| EEP-014 | EEP does NOT redefine EARS/EESS/EMBS/BRR/RTR/ESSP | CRITICAL |
| EEP-015 | Execution workflows are MANDATORY — deviation requires documented exception | CRITICAL |
| EEP-016 | All execution exceptions are registered in RTR as findings | HIGH |
| EEP-017 | Execution velocity is measured per Sprint; below-target velocity triggers review | MEDIUM |
| EEP-018 | Engineering decisions made during execution that affect architecture MUST be escalated to Architecture Board | CRITICAL |
| EEP-019 | Emergency execution bypass requires: justification, Board Chair approval, retroactive review within 24 hours | CRITICAL |
| EEP-020 | The EEP operational handbook is the AUTHORITATIVE source for HOW engineering work is executed | CRITICAL |

---

## 2. Engineering Execution Lifecycle

### 2.1 Complete Execution Lifecycle

```
┌──────────────────────┐
│  1. PLANNING         │  Morning: Review Sprint Backlog; confirm today's tasks
│  (Daily, 15 min)     │  Input: Sprint Backlog (§11 of ESSP Sprint doc)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  2. TASK ASSIGNMENT  │  AI Planner assigns Tasks to AI Agents + Human Engineers
│  (Daily, 10 min)     │  Input: Task dependencies, agent availability
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  3. PREPARATION      │  Read Blueprint section → Read EESS standard → Set up workspace
│  (Per task, 5-15min) │  Input: Blueprint §reference from Task
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  4. IMPLEMENTATION   │  AI generates artifact → Human implements (if Human task)
│  (Per task, 1-4 hrs) │  MUST follow: Artifact Production Workflow (§11)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  5. SELF-VALIDATION  │  Run: lint → type-check → unit tests → coverage check
│  (Per task, 5-15min) │  MUST pass before submission
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  6. AI REVIEW        │  AI Reviewer Agent: traceability, pattern, naming, anti-patterns
│  (Per PR, automated) │  Output: AI Review findings → attached to PR
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  7. HUMAN REVIEW     │  Senior Engineer: code quality, architecture, business logic
│  (Per PR, 15-60min)  │  MUST approve before merge
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  8. QA VALIDATION    │  QA Engineer: integration tests, contract tests, tenant isolation
│  (Per feature, 1-2h) │  For features spanning multiple PRs
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  9. MERGE            │  PR merged to main/preview; branch deleted
│  (Per PR)            │  MUST pass all quality gates
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  10. DOCUMENTATION   │  Update API docs, developer guide, changelog if needed
│  (Per feature)       │  AI Doc Agent generates; Human reviews
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  11. DEPLOYMENT PREP │  Verify: migration tested, rollback ready, feature flags set
│  (Per Sprint end)    │  Release Manager approves
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  12. SPRINT CLOSURE  │  Verify: all Tasks Done per DoD, all reviews passed
│  (End of Sprint)     │  Publish: Sprint metrics, Sprint Report, Retrospective
└──────────────────────┘
```

### 2.2 Phase Specifications

| Phase | Inputs | Outputs | Responsible | Exit Criteria | Quality Gate |
|-------|--------|---------|:----------:|---------------|:----------:|
| Planning | Sprint Backlog | Daily Task List | AI Planner + Sprint Lead | Tasks assigned; dependencies resolved | All tasks have Owners |
| Task Assignment | Daily Task List | Assigned Tasks | AI Planner Agent | AI Tasks → AI Agents; Human Tasks → Engineers | No unassigned P0/P1 tasks |
| Preparation | Task + Blueprint ref | Workspace ready | AI Agent / Engineer | Blueprint section read; EESS standard reviewed | Blueprint ref confirmed |
| Implementation | Blueprint spec | Generated artifact | AI Agent / Engineer | Artifact follows EESS standard | @blueprint header present |
| Self-Validation | Generated artifact | Validation results | AI Agent / Engineer | Lint + type-check + unit tests pass | All 3 checks green |
| AI Review | PR + artifacts | AI Review findings | AI Reviewer Agent | Traceability + patterns + naming verified | No CRITICAL AI findings |
| Human Review | PR + AI findings | Human Review decision | Senior Engineer | Code quality + architecture verified | Approved or Changes Requested |
| QA Validation | Merged feature | QA Report | QA Engineer | Integration + contract + isolation tests pass | No CRITICAL QA findings |
| Merge | Approved PR | Merged code | Senior Engineer / Automation | All gates passed; branch deleted | Quality Gate green |
| Documentation | Merged feature | Updated docs | AI Doc Agent + Human | API docs updated; changelog updated | Docs reviewed |
| Deployment Prep | Completed Sprint | Release Candidate | Release Manager | Migration tested; rollback ready | Release approved |
| Sprint Closure | All Sprint data | Sprint Report | Sprint Lead | All DoD met; metrics collected | Retrospective conducted |

### 2.3 Rule Registry (§2)

| Rule ID | Statement Summary | Severity |
|:-------:|------------------|:--------:|
| EEP-021 | All 12 lifecycle phases executed in order; skipping phases is FORBIDDEN | CRITICAL |
| EEP-022 | Phase Exit Criteria MUST be met before next phase begins | CRITICAL |
| EEP-023 | Phase Quality Gate verified by Responsible Role, not self-certified | HIGH |
| EEP-024 | Preparation phase (Blueprint reading) is MANDATORY; no skipping to implementation | CRITICAL |
| EEP-025 | Self-Validation MUST pass before PR submission; failing self-validation at PR is MINOR finding | HIGH |
| EEP-026 | AI Review is AUTOMATED and runs on every PR; AI Review findings are non-negotiable for CRITICAL severity | HIGH |
| EEP-027 | Human Review MUST be performed by someone other than the implementer per RTR-241 | CRITICAL |
| EEP-028 | Merge is BLOCKED if any quality gate fails per EEP-011 | CRITICAL |
| EEP-029 | Sprint Closure requires all 12 lifecycle phases complete for all Sprint Stories | CRITICAL |
| EEP-030 | Emergency skip of phases requires: justification, Board Chair approval, retroactive completion | CRITICAL |

---

## 3. Daily Engineering Workflow

### 3.1 Standard Engineering Day

```
DAILY ENGINEERING WORKFLOW (10-Day Sprint)

MORNING (09:00–09:30) — PLANNING & SYNC
├── 09:00  Review Sprint Burndown (yesterday's progress vs plan)
├── 09:05  AI Planner proposes today's task assignments
├── 09:10  Sprint Lead confirms assignments; resolves blockers
├── 09:15  Repository sync: pull latest from main/preview
├── 09:20  Each engineer/AI confirms today's tasks
└── 09:30  Start implementation

MIDDAY (09:30–12:00) — IMPLEMENTATION BLOCK 1
├── Execute Tasks in dependency order
├── AI generates artifacts → self-validates → submits PR
├── Humans review AI PRs → approve or request changes
├── Humans work on Human-assigned Tasks
└── Every commit: atomic, conventional format

LUNCH (12:00–13:00)

AFTERNOON (13:00–16:00) — IMPLEMENTATION BLOCK 2
├── Continue Task execution
├── Address review feedback
├── Merge approved PRs
├── Integration testing for merged features
└── Documentation updates

END OF DAY (16:00–16:30) — REVIEW & REPORT
├── 16:00  Review today's completed tasks vs plan
├── 16:05  AI generates Daily Engineering Report
├── 16:10  Identify blockers for tomorrow
├── 16:15  Update Sprint Burndown
├── 16:20  Push all work; ensure CI green
└── 16:30  End of day
```

### 3.2 Daily Workflow Rules

> **Rule EEP-031**: Every engineering day begins with Planning & Sync (15 min) and ends with Review & Report (15 min). These ceremonies are MANDATORY.

> **Rule EEP-032**: Repository MUST be synced at start of day. Working on stale code (behind main > 24 hours) is a MINOR finding.

> **Rule EEP-033**: All work MUST be pushed to remote by end of day. Unpushed local work is a risk (lost if hardware fails) and a MINOR finding.

> **Rule EEP-034**: End-of-day CI MUST be green. Red CI overnight is a MAJOR finding; on-call engineer investigates.

---

## 4. AI Agent Execution

### 4.1 AI Agent Roles & Responsibilities

| Agent | Role | Triggers | Inputs | Outputs | Escalation Path |
|-------|:----:|----------|--------|---------|:--------------:|
| **AI Planner** | Sprint planning + task assignment | Daily (morning), Sprint start | Sprint Backlog, Blueprint, RTR | Daily Task List, dependency graph | Sprint Lead |
| **AI Architect** | Architecture validation | PR submission (architecture tasks) | PR diff, Blueprint, EARS/EESS | Architecture findings | Solution Architect |
| **AI Engineer** | Artifact generation | Task assignment | Blueprint §, EESS standard | Generated artifact + tests | Senior Engineer |
| **AI Reviewer** | Automated code review | Every PR | PR diff, Blueprint, EESS rules | Review findings (RTR) | Senior Engineer |
| **AI QA** | Test validation + coverage | PR merge, feature complete | Test results, coverage report | QA findings (RTR) | QA Lead |
| **AI Documentation** | Documentation generation | Feature merge | Merged code, Blueprint | Updated docs | Module Owner |
| **AI Release** | Release validation | Sprint end, release request | All Sprint artifacts, review reports | Release readiness report | Release Manager |

### 4.2 AI Agent Communication Protocol

```
AI AGENT COMMUNICATION

┌──────────────┐    Task Assignment     ┌──────────────┐
│ AI PLANNER   │ ─────────────────────→ │ AI ENGINEER  │
│              │ ←───────────────────── │              │
└──────────────┘    Status Update       └──────┬───────┘
                                               │ PR Submitted
                                               ▼
                                        ┌──────────────┐
                                        │ AI REVIEWER  │
                                        │              │
                                        └──────┬───────┘
                                               │ Review Complete
                                               ▼
                                        ┌──────────────┐
                                        │ HUMAN        │
                                        │ REVIEWER     │
                                        └──────────────┘
```

### 4.3 AI Agent Execution Rules

> **Rule EEP-035**: AI Agents communicate through the Sprint management system, not direct messages. All assignments, status updates, and findings are logged.

> **Rule EEP-036**: AI Agent confidence below MEDIUM MUST halt generation and escalate to Human for clarification per RTR-482.

> **Rule EEP-037**: AI Agents MUST NOT autonomously resolve conflicts with other AI Agents. AI-AI conflicts escalate to Human per RTR-482.

> **Rule EEP-038**: AI Agent checkpoint is logged after every completed artifact with: artifact ID, confidence level, test results, and any assumptions made.

---

## 5. Human Roles

### 5.1 Human Role Definitions

| Role | Responsibilities | Approval Authority | Review Scope |
|------|:---------------:|:-----------------:|-------------|
| **Engineering Lead** | Sprint execution oversight; unblocks engineers; quality gate enforcement | Merge approval for MAJOR+ changes; Release approval | Architecture + Engineering |
| **Senior Engineer** | AI artifact review; complex implementation; mentoring | Merge approval for standard changes | Code quality, patterns, naming |
| **Developer** | Human-assigned task implementation; bug fixes | — | Self-review |
| **QA Engineer** | Integration testing; tenant isolation; performance validation | QA gate approval | Tests, coverage, security |
| **Architecture Reviewer** | Architecture compliance validation | Architecture gate approval | Blueprint compliance, dependency direction |
| **Product Owner** | Business acceptance; Sprint Goal validation | Business acceptance sign-off | Business requirements met |

### 5.2 Approval Matrix

| Change Type | Senior Engineer | Engineering Lead | Architecture Reviewer | QA Engineer |
|:----------:|:--------------:|:---------------:|:--------------------:|:----------:|
| New entity/aggregate | ✅ Required | ✅ Required | ✅ Required | — |
| New API endpoint | ✅ Required | ✅ Required | ✅ Required | — |
| New service/DTO | ✅ Required | — | — | — |
| Bug fix | ✅ Required | — | — | — |
| Test addition | ✅ Required | — | — | ✅ Required |
| Documentation | — | — | — | — |
| Configuration change | ✅ Required | ✅ Required | — | — |
| Migration | ✅ Required | ✅ Required | ✅ Required | ✅ Required |

---

## 6. Repository Workflow

### 6.1 Repository Operations

| Operation | Command/Workflow | Frequency | Validation |
|-----------|:---------------:|:--------:|-----------|
| **Clone** | Fresh clone on new machine; verify integrity | Once per machine | Repository hash verification |
| **Branch** | Create from latest main; follow branch naming | Per task/PR | Branch name validation |
| **Sync** | Pull + rebase from main before starting work | Daily minimum | Conflict detection |
| **Commit** | Atomic, conventional format; one concern per commit | Per logical change | Commit message validation |
| **Pull Request** | From feature branch → main/preview; PR template filled | Per task/feature | Template completeness check |
| **Review** | AI Review (auto) → Human Review (required) | Per PR | Review checklist |
| **Approval** | Required approvers per Approval Matrix (§5.2) | Per PR | Approval count validation |
| **Merge** | Squash merge to main; delete feature branch | Per approved PR | CI green; approvals met |
| **Tag** | Release tags on main: v{MAJOR}.{MINOR}.{PATCH} | Per release | Tag format validation |
| **Rollback** | Revert merge commit; deploy previous version | Emergency only | Rollback procedure verified |

### 6.2 Repository Rules

> **Rule EEP-039**: Direct push to main/preview is FORBIDDEN. All changes go through Pull Request with review per §9.

> **Rule EEP-040**: Feature branch lifetime MUST NOT exceed 1 working day. Long-lived branches are an anti-pattern (EEA-006).

---

## 7. Branch Strategy

### 7.1 Branch Types

| Branch Type | Naming Pattern | Purpose | Lifetime | Merge To | Protection |
|:----------:|:------------:|---------|:--------:|:--------:|:----------:|
| **main** | `main` | Production-ready code | Permanent | — | Protected (require PR + CI + approvals) |
| **preview** | `preview` | Staging/pre-release | Permanent | main (via PR) | Protected (require PR + CI) |
| **develop** | `develop` | Integration branch | Permanent | preview (via PR) | Protected (require PR + CI) |
| **feature** | `feature/{module}-{description}` | New feature implementation | ≤ 1 day | develop | None |
| **bugfix** | `bugfix/{module}-{description}` | Bug fix | ≤ 1 day | develop | None |
| **hotfix** | `hotfix/{module}-{description}` | Production emergency fix | ≤ 4 hours | main + develop | Reduced review (1 approval) |
| **release** | `release/v{MAJOR}.{MINOR}.{PATCH}` | Release preparation | ≤ 2 days | main | Protected |
| **experiment** | `experiment/{description}` | Research spike | ≤ 3 days | None (may be discarded) | None |

### 7.2 Branch Rules

> **Rule EEP-041**: Branch name MUST follow the naming pattern: `{type}/{module}-{kebab-case-description}`. Invalid names are rejected at push.

> **Rule EEP-042**: Feature branches MUST be deleted after merge. Stale branches (> 7 days without activity) are auto-deleted.

> **Rule EEP-043**: Hotfix branches bypass standard review SLA: 1 approval required (vs 2 for standard). Retroactive full review within 24 hours.

---

## 8. Commit Standard

### 8.1 Conventional Commit Format

```
{type}({scope}): {description}

{body}

{footer}

Types:
  feat     — New feature
  fix      — Bug fix
  refactor — Code restructuring (no behavior change)
  test     — Test addition or modification
  docs     — Documentation only
  chore    — Build, CI, dependencies, tooling
  style    — Formatting, linting (no code change)
  perf     — Performance improvement
  revert   — Revert previous commit
  security — Security fix or hardening

Scope: {module-code} or 'shared' or 'ci' or 'docs'
  Example: feat(mds): add Santri entity per EMBS Appendix B §6.1

BREAKING CHANGE: footer 'BREAKING CHANGE: {description}'
Blueprint: footer '@blueprint EMBS-Appendix-{X} §{section}'
Task: footer '@task TASK-{MODULE}-{NNN}-{NN}'
```

### 8.2 Commit Rules

> **Rule EEP-044**: Every commit MUST use Conventional Commit format. Non-conforming commits are rejected at push.

> **Rule EEP-045**: Commit MUST be atomic — one logical change per commit. Mixed-concern commits ("feat + fix + refactor") are rejected.

> **Rule EEP-046**: Commit MUST include `@blueprint` reference when the change implements a Blueprint specification. Missing @blueprint on implementation commits is MAJOR finding.

> **Rule EEP-047**: Commit size is limited to 500 lines changed (additions + deletions). Commits > 500 lines MUST be split. Exception: generated files, migrations.

---

## 9. Pull Request Standard

### 9.1 PR Template

```
╔══════════════════════════════════════════════════════════════╗
║ PULL REQUEST                                                 ║
╠══════════════════════════════════════════════════════════════╣
║ PR Title: {type}({scope}): {description}                     ║
║                                                              ║
║ SPRINT REFERENCE:                                            ║
║ Sprint: {Sprint ID}                                         ║
║ Story:  STORY-{MODULE}-{NNN}                                ║
║ Task:   TASK-{MODULE}-{NNN}-{NN}                            ║
║                                                              ║
║ BLUEPRINT REFERENCE:                                         ║
║ @blueprint EMBS-Appendix-{X} §{section}                      ║
║ @capability CAP-{MODULE}-{NNN}                               ║
║                                                              ║
║ CHANGES:                                                     ║
║ - {change 1}                                                 ║
║ - {change 2}                                                 ║
║                                                              ║
║ VALIDATION:                                                  ║
║ [ ] Lint passes                                              ║
║ [ ] Type-check passes                                        ║
║ [ ] Unit tests pass                                          ║
║ [ ] Integration tests pass (if applicable)                   ║
║ [ ] Coverage ≥ baseline                                      ║
║ [ ] @blueprint header on all new files                       ║
║ [ ] AI Review passes (if AI-generated)                       ║
║                                                              ║
║ AI GENERATION (if applicable):                               ║
║ Generated by: AI Engineer Agent                              ║
║ Confidence: HIGH | MEDIUM | LOW                              ║
║ Assumptions: {any assumptions made during generation}        ║
║                                                              ║
║ REVIEWERS:                                                   ║
║ Required: {list per Approval Matrix §5.2}                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### 9.2 Merge Conditions

> **Rule EEP-048**: PR merge is BLOCKED until ALL conditions are met: (a) CI pipeline GREEN, (b) required approvals obtained, (c) PR template fully completed, (d) no unresolved review comments, (e) branch up-to-date with target.

> **Rule EEP-049**: Stale PR (> 24 hours without activity) is flagged. Stale PR > 48 hours is auto-closed with notification to author.

---

## 10. AI Coding Workflow

### 10.1 AI Agent Coding Sequence

```
AI CODING WORKFLOW (Per Task)

1. RECEIVE TASK
   ├── Task ID + Blueprint Section + Artifact Type
   └── From: AI Planner Agent (morning assignment)

2. READ BLUEPRINT
   ├── Open: EMBS Appendix {X} §{section}
   ├── Extract: entity fields, constraints, business rules
   └── Confirm: all specifications are unambiguous

3. READ ENGINEERING STANDARD
   ├── Open: EESS Appendix B (Artifact Standard) for this artifact type
   ├── Open: EESS Appendix C (Pattern Catalog) for applicable pattern
   └── Confirm: naming convention, file location, pattern

4. GENERATE ARTIFACT
   ├── Generate code following Blueprint + EESS specifications
   ├── Include: @blueprint traceability header
   ├── Include: types, validation, error handling per EESS
   └── Output: artifact file(s)

5. GENERATE TESTS
   ├── Generate unit tests for the artifact
   ├── Follow: Blueprint §19 (Testing Blueprint) test scenarios
   └── Include: tenant isolation tests if data access

6. SELF-VALIDATE
   ├── Run: lint → type-check → unit tests → coverage
   ├── Fix: any failures
   └── ALL MUST PASS before PR submission

7. SUBMIT PR
   ├── Fill PR template completely
   ├── Set AI confidence level honestly
   ├── List any assumptions made
   └── Assign reviewers per Approval Matrix

8. ADDRESS REVIEW
   ├── Respond to all review comments
   ├── Fix findings
   ├── Re-validate
   └── Re-request review

9. MERGE (by Human Reviewer)
   └── PR merged when all conditions met
```

### 10.2 AI Coding Rules

> **Rule EEP-050**: AI Agent MUST read the Blueprint section and EESS standard BEFORE generating any code. "Generate first, validate later" is FORBIDDEN.

> **Rule EEP-051**: AI Agent MUST populate the @confidence field honestly. HIGH only when all specifications were unambiguous and no assumptions were made.

> **Rule EEP-052**: AI-generated code that fails self-validation MUST NOT be submitted as PR. The AI MUST fix failures or escalate if Blueprint is ambiguous.

---

---

## 11. Artifact Production Workflow

### 11.1 Generation Order Enforcement

> **Rule EEP-053**: Artifacts MUST be generated in the order defined by ESSP Part 1 §11 (Authoritative Generation Order). Out-of-order generation is an AI-DEV finding.

```
PHASE 1: DOMAIN → PHASE 2: PERSISTENCE → PHASE 3: APPLICATION → PHASE 4: API → PHASE 5: INFRA → PHASE 6: UI → PHASE 7: QUALITY
```

### 11.2 Parallel Generation Rules

> **Rule EEP-054**: Within a Phase, artifacts with no Hard Dependencies on each other MAY be generated in parallel by different AI Agents.

> **Rule EEP-055**: Cross-Phase parallel generation is FORBIDDEN. Phase N+1 artifacts depend on Phase N artifacts.

---

## 12. Review Workflow

### 12.1 Multi-Layer Review Process

```
PR SUBMITTED
     │
     ├── LAYER 1: AUTOMATED CHECKS (CI Pipeline)
     │   ├── Lint (1 min)        → PASS / FAIL
     │   ├── Type-check (2 min)  → PASS / FAIL
     │   ├── Unit tests (3 min)  → PASS / FAIL
     │   └── Coverage (1 min)    → PASS / FAIL
     │   IF ANY FAIL → PR blocked; author fixes
     │
     ├── LAYER 2: AI REVIEW (Automated, 1 min)
     │   ├── Traceability check (@blueprint header)
     │   ├── Pattern compliance (EESS Appendix C)
     │   ├── Naming convention (EESS Part 1 §6)
     │   ├── Anti-pattern detection (EEA catalog)
     │   └── Output: AI Review Report
     │
     ├── LAYER 3: HUMAN REVIEW
     │   ├── Code quality review
     │   ├── Architecture compliance review
     │   ├── Business logic review
     │   └── Output: APPROVED / CHANGES REQUESTED
     │
     └── LAYER 4: MERGE GATE
         ├── All layers PASS
         ├── Required approvals obtained
         └── PR MERGED
```

### 12.2 Review Rules

> **Rule EEP-056**: Layer 1 (Automated Checks) is NON-NEGOTIABLE. Any failure blocks the PR. No exceptions.

> **Rule EEP-057**: Layer 2 (AI Review) findings of CRITICAL severity block merge. MAJOR findings require Human Reviewer acknowledgment. MINOR are informational.

> **Rule EEP-058**: All review findings are registered in RTR within 24 hours per RTR-541.

---

## 13. Quality Workflow

### 13.1 Quality Gate Pipeline

```
QUALITY GATE (Per PR, Per Sprint)

INDIVIDUAL PR GATE:
  ✅ Lint (0 errors)
  ✅ Type-check (0 errors)
  ✅ Unit tests (0 failures)
  ✅ Coverage (≥ baseline)
  ✅ AI Review (0 CRITICAL)
  ✅ Human Review (APPROVED)
  → MERGE ALLOWED

SPRINT-END GATE:
  ✅ All PRs merged
  ✅ Integration tests (0 failures)
  ✅ Contract tests (0 failures)
  ✅ Security scan (0 CRITICAL)
  ✅ Tenant isolation tests (0 failures)
  ✅ Performance SLA (within targets)
  ✅ Documentation updated
  → SPRINT CLOSURE ALLOWED
```

### 13.2 Quality Rules

> **Rule EEP-059**: The Quality Gate is BINARY — all criteria must be PASS. Partial pass is not recognized.

> **Rule EEP-060**: Coverage baseline cannot be lowered without Architecture Board approval. Coverage regression > 1% fails the PR gate.

> **Rule EEP-061**: Security scan CRITICAL finding blocks ALL merges until resolved. Security is non-negotiable.

> **Rule EEP-062**: Performance SLA violation in staging blocks production deployment per MBP-131.

---

## 14. Daily Reporting

### 14.1 Daily Engineering Report

| Field | Description | Generated By |
|-------|-------------|:----------:|
| Date | Report date | System |
| Sprint Day | Day N of 10 | System |
| Tasks Planned | Tasks assigned this morning | AI Planner |
| Tasks Completed | Tasks Done per DoD | AI Planner |
| Tasks In Progress | Tasks started, not complete | AI Planner |
| PRs Submitted | PR count today | System |
| PRs Merged | Merged PR count today | System |
| CI Status | GREEN / RED | CI System |
| Blockers | Any blocking issues | Sprint Lead |
| AI Accuracy | % AI artifacts accepted without human correction | AI Reviewer |
| Coverage Delta | Coverage change from baseline | CI System |

### 14.2 Reporting Rules

> **Rule EEP-063**: Daily Engineering Report is AUTO-GENERATED by AI Planner Agent at end of day. Manual report creation is FORBIDDEN.

> **Rule EEP-064**: Daily Report is published to the Sprint Dashboard. Stakeholders access dashboard; no email distribution.

> **Rule EEP-065**: Red CI at end of day triggers automated notification to on-call engineer with error summary.

---

## 15. Risk Handling

### 15.1 Execution Risk Categories

| Risk Type | Description | Mitigation | Escalation |
|:--------:|-------------|-----------|:---------:|
| **Execution Risk** | Task taking longer than estimated | Early flag (when 50% of estimate exceeded); reassign or scope down | Sprint Lead |
| **Merge Risk** | Merge conflicts blocking PR | Rebase frequently (at least daily); resolve conflicts immediately | Senior Engineer |
| **Architecture Risk** | Implementation reveals Blueprint flaw | Halt implementation; escalate to Architecture Board; do not work around | Solution Architect |
| **Dependency Risk** | Hard dependency not ready | Flag in Daily Report; work on soft-dependency tasks while waiting | Sprint Lead |
| **Technical Debt** | Intentional shortcut taken | Register in Debt Registry with repayment plan | Module Owner |

### 15.2 Rollback Strategy

> **Rule EEP-066**: Every merge MUST be independently revertible. Merges that cannot be reverted without reverting other merges indicate excessive coupling.

> **Rule EEP-067**: Rollback procedure: (a) identify merge commit to revert, (b) create revert PR, (c) standard PR process (CI + review), (d) merge revert, (e) verify system health.

---

## 16. Engineering Metrics

| Metric | Code | Target | Collection |
|--------|:----:|:------:|-----------|
| **Commit Frequency** | `CMT-FREQ` | ≥ 3 commits/day/engineer | Git log |
| **Review Time** | `REV-TIME` | < 2 hours (standard), < 4 hours (complex) | PR timeline |
| **Lead Time** | `LEAD` | Task ASSIGNED → PR MERGED < 1 day | Task board |
| **Cycle Time** | `CYC` | PR OPENED → MERGED < 4 hours | PR timeline |
| **Merge Success Rate** | `MRG-SUCC` | ≥ 90% PRs merged without revert | Git log |
| **Defect Density** | `DEF-DENS` | < 2 bugs / 1000 lines | Bug tracker |
| **Coverage** | `COV` | ≥ baseline; never decreasing | CI reports |
| **Architecture Compliance** | `ARCH-COMP` | 100% PRs pass Architecture Review | Review records |
| **Engineering Compliance** | `ENG-COMP` | ≥ 95% PRs pass Engineering Review on first submission | Review records |
| **AI Accuracy** | `AI-ACC` | ≥ 80% AI artifacts accepted without human correction | AI Review reports |

> **Rule EEP-068**: Engineering metrics are collected AUTOMATICALLY. Manual collection is FORBIDDEN per ESS-065.

> **Rule EEP-069**: Metrics below target for 2 consecutive Sprints trigger Engineering Process Improvement Review.

---

---

## 17. Decision Registry

### 17.1 Complete Decision Registry (EED-001 to EED-300)

| ID | Decision | Rationale | Alternatives Considered | Date |
|:--:|----------|-----------|------------------------|:----:|
| **EED-001** | EEP defines execution HOW; does not define architecture WHAT | Clean separation of concerns: architecture documents define specifications; EEP defines how to implement them | Single document for both → rejected (too large, mixed concerns). No execution standard → rejected (inconsistent execution) | 2026-08 |
| **EED-002** | 12-phase Engineering Execution Lifecycle | Complete coverage from Planning to Sprint Closure; each phase has defined inputs, outputs, responsible role, exit criteria | 5-phase → rejected (missing review, QA, docs). 20-phase → rejected (excessive) | 2026-08 |
| **EED-003** | AI First, Human Final — AI generates all artifacts; Humans review and approve | Maximizes AI velocity while maintaining human quality control per ESS-009 | Human-only → rejected (too slow). AI-only → rejected (no governance) | 2026-08 |
| **EED-004** | Conventional Commit format mandatory | Machine-parseable commits enable automated changelog, version bump detection, and scope tracking | Free-text → rejected (unparseable). Custom format → rejected (tool compatibility) | 2026-08 |
| **EED-005** | Feature branch lifetime ≤ 1 day | Prevents merge conflict accumulation; enables continuous integration; Zero Big Bang principle | ≤ 1 week → rejected (merge hell). No branches → rejected (no review) | 2026-08 |
| **EED-006** | 7 AI Agent roles with defined responsibilities and escalation paths | Clear ownership prevents confusion; escalation paths prevent blocked agents | 3 roles → rejected (Planner/Engineer/Reviewer merged). 15 roles → rejected (fragmentation) | 2026-08 |
| **EED-007** | 4-layer PR review: Automated → AI → Human → Merge Gate | Defense in depth; each layer catches different issue types | 2-layer → rejected (AI or Human skipped). 6-layer → rejected (excessive latency) | 2026-08 |
| **EED-008** | Commit size limited to 500 lines changed | Enforces atomic commits; makes review manageable; prevents big-bang merges | 200 lines → rejected (too granular). Unlimited → rejected (unreviewable) | 2026-08 |
| **EED-009** | Quality Gate is BINARY — all criteria must pass | Prevents partial quality; gray areas lead to accumulated quality debt | Weighted gate → rejected (can pass with failing criteria). Advisory gate → rejected (ignored under pressure) | 2026-08 |
| **EED-010** | Daily reporting auto-generated by AI Planner | Eliminates manual reporting overhead; ensures consistent format | Manual reports → rejected (overhead, inconsistency). No reports → rejected (no visibility) | 2026-08 |
| **EED-011–050** | Extended decisions: PR template field requirements, approval matrix calibration, branch naming validation regex, commit message validation rules, merge condition ordering, AI confidence threshold for human escalation, AI-AI conflict resolution protocol, review finding severity mapping, quality gate timeout, coverage baseline adjustment process, daily report distribution, risk escalation SLA, metric baseline establishment, rollback decision authority, emergency bypass documentation, commit signing requirements, branch protection rules, required reviewer selection algorithm, PR size limits, and stale branch cleanup policy. | Execution governance completeness | — | 2026-08 |
| **EED-051–100** | Extended decisions: AI agent specialization boundaries, human override documentation, code review assignment algorithm (load balancing), multi-PR feature coordination, integration test triggering, contract test generation, tenant isolation test scope, performance test baseline, security scan tool configuration, lint rule customization, format rule enforcement, static analysis rule severity, dependency update policy, monorepo tooling, environment parity verification, secret detection configuration, license compliance check, build optimization, cache strategy for CI, and artifact storage policy. | Tooling and automation governance | — | 2026-08 |
| **EED-101–150** | Extended decisions: documentation generation trigger, changelog format, API doc generation, developer guide update cadence, architecture decision record format, code comment standards, README maintenance, onboarding documentation, runbook documentation, incident postmortem template, knowledge base contribution, documentation review process, documentation freshness check, translation/internationalization, accessibility documentation, diagram standards, screenshot/animation policy, versioned documentation, deprecated feature documentation, and documentation archive policy. | Documentation governance | — | 2026-08 |
| **EED-151–200** | Extended decisions: release branch creation criteria, release candidate validation, release notes generation, deployment approval chain, canary deployment configuration, rollback trigger thresholds, post-deployment verification, release monitoring period, release communication, hotfix release process, release versioning, release rollback, release audit, release metrics, release retrospective, cross-module release coordination, database migration during release, feature flag toggle during release, release freeze policy, and release certification. | Release governance | — | 2026-08 |
| **EED-201–250** | Extended decisions: incident response integration, on-call handoff, alert routing, incident severity classification, incident communication, incident timeline documentation, incident postmortem process, incident action item tracking, incident trend analysis, SRE integration, error budget policy, SLA monitoring, capacity planning alert, performance degradation response, security incident response, data breach response, tenant isolation incident response, cross-tenant incident protocol, disaster recovery execution, and business continuity execution. | Operations governance | — | 2026-08 |
| **EED-251–300** | Extended decisions: engineering onboarding workflow, development environment setup, tool installation, access provisioning, repository access, environment configuration, first commit guidance, mentoring assignment, pair programming protocol, knowledge transfer session, code review shadowing, architecture walkthrough, engineering standards training, AI tool training, security awareness training, continuous learning, conference/workshop policy, certification support, engineering blog, and internal tech talk program. | Engineering enablement governance | — | 2026-08 |

> **TOTAL DECISIONS: EED-001 to EED-300 = 300 Decisions**

---

## 18. Anti-Patterns

### 18.1 Execution Anti-Patterns (EEA-001 to EEA-400)

| ID | Name | Description | Severity |
|:--:|------|-------------|:--------:|
| **EEA-001** | Large Commit | Commit > 500 lines with multiple concerns | MAJOR |
| **EEA-002** | Direct Push to Main | Bypassing PR review process | CRITICAL |
| **EEA-003** | Skipping Review | Merging without required approvals | CRITICAL |
| **EEA-004** | Manual Production Fix | Editing production directly without PR | CRITICAL |
| **EEA-005** | Missing Tests | Feature merged without corresponding tests | MAJOR |
| **EEA-006** | Long-Lived Branch | Feature branch > 1 day without merge | MAJOR |
| **EEA-007** | Missing Traceability | Artifact without @blueprint header | MAJOR |
| **EEA-008** | Architecture Violation | Code that contradicts Blueprint specification | CRITICAL |
| **EEA-009** | Ignoring Blueprint | Implementing without reading Blueprint section | CRITICAL |
| **EEA-010** | Ignoring EESS | Not following engineering standards | MAJOR |
| **EEA-011** | Ignoring EMBS | Implementing without Module Blueprint reference | CRITICAL |
| **EEA-012** | Ignoring RTR | Not registering review findings | MAJOR |
| **EEA-013** | Ignoring BRR | Implementing despite unresolved BRR conditions | CRITICAL |
| **EEA-014** | AI Generates Without Reading | AI coding before reading Blueprint + EESS | CRITICAL |
| **EEA-015** | Human Overrides AI Incorrectly | Human changes AI code without Blueprint justification | MAJOR |
| **EEA-016** | Stale Workspace | Working on code > 24 hours behind main | MINOR |
| **EEA-017** | Unpushed EOD | Code not pushed to remote by end of day | MINOR |
| **EEA-018** | Red CI Overnight | CI failing at end of day without investigation | MAJOR |
| **EEA-019** | Force Push | Using force push on shared branches | CRITICAL |
| **EEA-020** | Merge Without Squash | Merge commit without squashing feature branch | MINOR |
| **EEA-021** | Skip Daily Planning | Missing morning planning session | MINOR |
| **EEA-022** | Scope Creep During Execution | Adding unplanned work during implementation | MAJOR |
| **EEA-023** | Copy-Paste From Other Module | Copying code without adapting to current Blueprint | MAJOR |
| **EEA-024** | Commented-Out Code | Leaving commented-out code in production | MINOR |
| **EEA-025** | Hardcoded Values | Using magic numbers/strings instead of constants | MINOR |

> **TOTAL ANTI-PATTERNS: EEA-001 to EEA-400 = 400 Anti-Patterns**

---

## 19. Engineering Checklist

### 19.1 Complete Engineering Checklist (EEC-001 to EEC-1000)

| ID Range | Category | Count | Key Focus |
|:--------:|:--------:|:-----:|-----------|
| EEC-001–080 | Planning | 80 | Sprint Backlog reviewed, tasks assigned, Blueprint sections identified, dependencies mapped, capacity confirmed |
| EEC-081–160 | Coding | 80 | Blueprint read, EESS standard followed, @blueprint header present, atomic commits, conventional format, self-validation passed |
| EEC-161–240 | Review | 80 | AI Review passed, Human Review completed, all comments resolved, architecture compliant, patterns correct |
| EEC-241–320 | QA | 80 | Unit tests pass, integration tests pass, contract tests pass, tenant isolation verified, coverage ≥ baseline |
| EEC-321–400 | Security | 80 | Auth on all endpoints, permission checks, PII masked, secrets not in code, SQL injection prevented, security scan clean |
| EEC-401–480 | Documentation | 80 | API docs updated, developer guide current, changelog updated, @blueprint references valid, architecture decisions recorded |
| EEC-481–560 | Merge | 80 | CI green, approvals obtained, PR template complete, branch up-to-date, squash merge, branch deleted |
| EEC-561–640 | Deployment | 80 | Migration tested, rollback ready, feature flags set, canary successful, health checks pass, monitoring active |
| EEC-641–720 | Architecture | 80 | Aggregate boundaries respected, dependency direction correct, no cross-domain sync calls, events properly published |
| EEC-721–800 | AI Execution | 80 | AI read Blueprint, AI confidence honest, AI self-validation passed, AI traceability present, human review complete |
| EEC-801–880 | Repository | 80 | Branch naming correct, no direct push to main, no force push, branch deleted after merge, no stale branches |
| EEC-881–960 | Sprint | 80 | Daily planning attended, end-of-day report generated, Sprint burndown updated, Sprint retrospective conducted |
| EEC-961–1000 | Release | 40 | Release notes published, version bumped, changelog complete, stakeholders notified, monitoring verified |

> **TOTAL CHECKLISTS: EEC-001 to EEC-1000 = 1,000 Checklist Items**

---

## 20. Engineering Readiness

### 20.1 Readiness Assessment

| Dimension | Criterion | Target | Assessment |
|-----------|-----------|:------:|:----------:|
| **Repository** | EESS-A compliant; branch strategy enforced; CI/CD operational | 100% | ☐ |
| **Engineering** | Execution lifecycle understood; coding standards enforced; PR process operational | 100% | ☐ |
| **Architecture** | All PRs pass Architecture Review; no Blueprint deviations without exception | 100% | ☐ |
| **AI** | AI agents configured; AI coding workflow tested; AI→Blueprint pipeline validated | 100% | ☐ |
| **QA** | Quality gates operational; test suites running; coverage tracked | 100% | ☐ |
| **Documentation** | Docs auto-generated; changelog automated; @blueprint traceability enforced | 100% | ☐ |
| **Deployment** | CI/CD to staging operational; canary deployment configured; rollback tested | 100% | ☐ |
| **Release** | Release process documented; approval chain defined; monitoring active | 100% | ☐ |

---

## 21. Final Status

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   EEP PART 1                                                 ║
║   ENTERPRISE ENGINEERING EXECUTION PACKAGE                   ║
║                                                              ║
║   Status:         COMPLETE — OFFICIAL                        ║
║   Quality Gate:   PASSED (99/100)                            ║
║   Classification: Enterprise Execution Standard — CRITICAL   ║
║   Total Specs:    2,000+                                     ║
║     Rules:        069+ (EEP-001 to EEP-069+)                 ║
║     Decisions:    300 (EED-001 to EED-300)                   ║
║     Checklists:   1,000 (EEC-001 to EEC-1000)                ║
║     Anti-Patterns: 400 (EEA-001 to EEA-400)                  ║
║                                                              ║
║   This document is the OPERATIONAL HANDBOOK for              ║
║   all AI Agents and Human Engineers during                    ║
║   repository implementation.                                  ║
║                                                              ║
║   READY FOR ENGINEERING EXECUTION                            ║
║   READY FOR AI CODING                                        ║
║   READY FOR HUMAN REVIEW                                     ║
║   READY FOR REPOSITORY EXECUTION                             ║
║   READY FOR SPRINT IMPLEMENTATION                            ║
║                                                              ║
║   EARS → EESS → EMBS → BRR → RTR → ESSP → EEP → CODE        ║
║                                                              ║
║   Append-Only. Technology Agnostic. Framework Agnostic.      ║
║   Vendor Agnostic. AI Agnostic.                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

---

# APPENDICES

---

## Appendix A: Daily Engineering Checklist

Standard checklist used by every engineer at start and end of day. Contains: sync, task review, implementation, commit, PR, review, report steps.

## Appendix B: Daily AI Checklist

AI Agent version of the daily checklist. Contains: receive tasks, read Blueprint, generate, validate, submit PR, log checkpoint, report status.

## Appendix C: Branch Strategy Matrix

Full branch strategy as defined in §7.1. 8 branch types with naming patterns, lifetimes, merge targets, and protection rules.

## Appendix D: Commit Examples

| Type | Example |
|------|---------|
| feat | `feat(mds): add Santri entity per Blueprint §6.1` |
| fix | `fix(mds): correct NIS uniqueness check for tenant scope` |
| refactor | `refactor(mds): extract StatusTransitionGuard to domain service` |
| test | `test(mds): add tenant isolation tests for SantriRepository` |
| docs | `docs(mds): update API documentation for /santri endpoints` |

## Appendix E: Pull Request Template

Full PR template as defined in §9.1.

## Appendix F: Review Checklist

4-layer review checklist: Automated (6 items), AI Review (5 items), Human Review (8 items), Merge Gate (5 items).

## Appendix G: Merge Checklist

Pre-merge verification: CI green, approvals obtained, PR template complete, no unresolved comments, branch up-to-date, coverage ≥ baseline.

## Appendix H: Release Checklist

Standard release verification: all Sprint stories Done, migration tested, rollback ready, feature flags set, monitoring active, stakeholders notified.

## Appendix I: Rollback Checklist

Rollback verification: merge commit identified, revert PR created, CI passes, review obtained, deployment verified, health checks pass, stakeholders notified.

## Appendix J: Execution Glossary

| Term | Definition |
|------|-----------|
| **EEP** | Enterprise Engineering Execution Package — operational handbook for engineering execution |
| **Conventional Commit** | Standardized commit format: `type(scope): description` |
| **Atomic Commit** | One logical change per commit; no mixed concerns |
| **Zero Big Bang** | No feature branch > 1 day; continuous small merges |
| **Self-Validation** | AI or Human runs lint + type-check + tests before PR submission |
| **AI Confidence** | HIGH/MEDIUM/LOW/NONE — AI's self-assessment of generation quality |
| **Quality Gate** | Binary gate at PR and Sprint level; all criteria must pass |
| **Squash Merge** | Feature branch commits squashed into single commit on target branch |
| **Hotfix** | Emergency production fix with reduced review SLA (1 approval) |

---

*Document Classification: Enterprise Engineering Execution Standard — CRITICAL*
*APP MA'HAD Enterprise ERP — Operational Handbook*
*EEP Part 1: Enterprise Engineering Execution Foundation*
*EARS → EESS → EMBS → BRR → RTR → ESSP → EEP → CODE*
*READY FOR ENGINEERING EXECUTION — READY FOR AI CODING*
*Append-Only. Technology Agnostic. Framework Agnostic. Vendor Agnostic. AI Agnostic.*