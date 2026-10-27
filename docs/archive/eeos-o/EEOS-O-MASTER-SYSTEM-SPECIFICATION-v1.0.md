# EEOS-O (Executive Engineering Orchestration — Orchestrator)
## Master System Specification v1.0 — Architecture & Orchestration Engine

**Document Identifier**: `EEOS-O-MASTER-SYSTEM-SPECIFICATION-v1.0`  
**Classification**: Authoritative Engineering Specification  
**Status**: DESIGN BASELINE — PENDING PRODUCT OWNER & MANDOR RATIFICATION  
**Author**: Lead Systems Analyst (EEOS-O System Architecture Group)  
**Reference Blueprint**: `BPMN — EEOS-O: Proses Orkestrasi oleh ZenOrion (v2.1)`  
**Scope**: Documentation & System Design Only (Zero Code, Zero DDL, Zero Infrastructure Mutation)  

---

## 1. Executive Summary

**Executive Engineering Orchestration — Orchestrator (EEOS-O)** is an enterprise-grade multi-agent coordination, execution, and lifecycle governance platform designed to manage complex software engineering initiatives. As modern systems scale across multiple domains (such as the 10-year multi-tenant SaaS architecture of APP MA'HAD), monolithic or purely autonomous agent workflows suffer from coordination bottlenecks, hallucinated task progression, loss of architectural fidelity, and lack of auditable accountability.

EEOS-O solves these challenges by implementing the core architectural doctrine: **"Distributed Execution, Centralized Orchestration."** 

Under this model:
- **Centralized Orchestration**: Managed exclusively by **ZenOrion (Lead Agent / Orchestrator)**, who maintains global situational awareness, dependency Directed Acyclic Graphs (DAG), parallel scheduling, capacity management, communication routing, event handling, and work package lifecycle state transitions.
- **Distributed Execution**: Domain engineering work is distributed across specialized agent pools spanning 8 functional divisions (Architecture, Engineering, Data, Security, QA, Infrastructure, Documentation, and Forensics).
- **Distributed Verification**: Technical reviews (Peer Review, QA Validation, Security Audits, Database Schema Verifications) are distributed strictly to specialist peer agents rather than bottlenecking at the orchestrator.

ZenOrion is **not** a universal code reviewer, QA tester, or database gatekeeper; rather, ZenOrion is the operational switchboard and workflow engine ensuring that tasks are decomposed with structural integrity, executed with cryptographic evidence, reviewed by competent specialists, and verified before dependent downstream tasks are unlocked.

---

## 2. Purpose & Scope

### 2.1 Purpose
This specification establishes the authoritative, normative system requirements, architectural boundaries, data contracts, and behavioral state machines governing the EEOS-O orchestration platform. It translates the agreed conceptual BPMN process (`eeos_o_zenorion_v2_1.bpmn`) into precise operational specifications for engineering, multi-agent coordination, and platform governance.

### 2.2 Scope
- **In-Scope**:
  - Conceptual architecture of EEOS-O orchestration engine and its primary agent actor pools.
  - Work Package (WP) decomposition, lifecycle governance, and completion semantics.
  - Task data structures, dependency management (DAG), and parallel scheduling policies.
  - Finite State Machine (FSM) defining all task and agent lifecycle states, transitions, entry/exit criteria, and responsible actors.
  - Division structure (8 functional divisions, minimum 16 baseline specialist agents + ZenOrion).
  - Hub-and-spoke communication protocol ("No Unregistered Inter-Agent Communication").
  - Multi-agent specialist validation and iterative rework loops.
  - Asynchronous event-driven sub-processes (Communication, Dependency Completion, Blocked Agents, Execution Failures, Escalations).
  - Evidence-backed state progression ("Evidence is the Single Source of Truth; Claims are Zero-Trust").
  - Traceability, audit logging, security boundaries, and observability.
- **Explicitly Out-of-Scope (Strict Non-Goals for this Phase)**:
  - Application source code implementation (TypeScript/Next.js).
  - Database schema definitions (DDL, SQL migrations, Drizzle ORM schemas).
  - REST / GraphQL / gRPC API endpoint creation.
  - User Interface (UI) dashboard implementation.
  - Dependency package installations or cloud resource provisioning.
  - Modifications to existing APP MA'HAD production/staging infrastructure.

---

## 3. Authoritative BPMN Reference

This specification is directly grounded in and formally traces to the authoritative business process model:
**`BPMN — EEOS-O: Proses Orkestrasi oleh ZenOrion` (Model Version 2.1.0, Definition ID: `Definitions_EEOS_O_v2_1`)**.

```text
+----------------------------------------------------------------------------------------------------------------------------------+
| BPMN v2.1 TOP-LEVEL PROCESS PHASES                                                                                               |
+-------------------+-----------------------------+-------------------------------+-------------------+--------------------+-------+
| 1. Pengajuan WP   | 2. Analisis & Perencanaan   | 3. Pembuatan & Penugasan      | 4. Eksekusi       | 5. Validasi &      | 6.    |
|                   |                             |    Tugas                      |    Paralel        |    Revisi          | Handoff/Done
+-------------------+-----------------------------+-------------------------------+-------------------+--------------------+-------+
```

### 3.1 Primary BPMN Lanes (Pools & Participants)
1. **Product Owner (`Process_PO`)**: Originator of business objectives, Work Package proposals, and receiver of final verified WP reports.
2. **Mandor / Chief Architect (`Process_Mandor`)**: Technical governance authority responsible for reviewing WP architecture, ratifying locked decisions, and establishing architectural directives and constraints.
3. **ZenOrion (`Process_ZenOrion`)**: Central Lead Agent Orchestrator managing task decomposition, DAG generation, allocation, execution monitoring, validation routing, dependency releasing, and final reporting.
4. **Agent Divisi / Sub-Agent (`Process_AgentDivisi`)**: Execution agents responsible for undertaking assigned tasks, generating immutable evidence, and performing remediation when rework is required.
5. **Agent Spesialis (`Process_AgentSpesialis`)**: Independent peer and specialist reviewers who execute multi-disciplinary validation sub-processes (Peer Review, QA Validation, Security Review, DB Validation).
6. **Sistem & Repositori (`Participant_Eksternal`)**: Authoritative shared external data stores (Project Code Repository, Task Orchestration DB, CI/CD Test Pipeline, Knowledge Base, and Monitoring Systems).

### 3.2 Authoritative BPMN Artifacts (Data Objects)
- **`DO_WP` (Dokumen WP)**: Scope, business objectives, priorities, constraints, and delivery targets.
- **`DO_Arch` (Direktif Arsitektur)**: Architecture guidelines, design patterns, invariant boundaries, and technical constraints.
- **`DO_Rencana` (Rencana Tugas / DAG)**: Task decomposition graph, dependencies, critical paths, and agent skill mappings.
- **`DO_Daftar` (Daftar Tugas)**: Structured task inventory with explicit prerequisites, SLAs, and assignees.
- **`DO_AD_Hasil` (Hasil Tugas / Evidence)**: Concrete engineering artifacts (diffs, test execution logs, configuration snapshots).
- **`DO_Validasi` (Hasil Validasi)**: Formal specialist evaluation reports (Verdict: PASS/FAIL, findings, required remediation).
- **`DO_Komunikasi` (Log Komunikasi)**: Cryptographically verifiable records of all inter-agent message exchanges and routing events.
- **`DO_Laporan` (Laporan WP)**: Final consolidated Work Package completion report presented to the Product Owner.

---

## 4. Core Principles

The design of EEOS-O is governed by seven non-negotiable architectural tenets:

1. **Distributed Execution, Centralized Orchestration**:
   Orchestration and workflow state are strictly centralized in ZenOrion. Technical execution and domain validation are strictly distributed to division and specialist pools.
2. **Anti-Bottleneck Architecture**:
   ZenOrion is an operational orchestrator, not a technical monolith. ZenOrion **never** performs deep code reviews, manual test verifications, or database query profiling. All verification is delegated to dedicated specialist agents.
3. **Evidence as Single Source of Truth**:
   Agent self-declarations ("Task is complete", "All tests pass") have zero evidentiary weight. State transitions require cryptographically verifiable, machine-inspectable evidence artifacts (CI/CD output, test logs, git commit SHAs, database query plans).
4. **Strict Authority Hierarchy**:
   Clear separation of powers: Product Owner owns business scope; Mandor owns technical architecture; ZenOrion owns execution orchestration; Specialists own technical verification; Division Agents own execution.
5. **No Unregistered Inter-Agent Communication**:
   To prevent invisible state corruption and untracked side-effects, agents cannot communicate directly through out-of-band channels. All inter-agent requests, dependencies, and handoffs must pass through ZenOrion's registered routing engine.
6. **Fail-Closed Governance**:
   If an ambiguity, dependency conflict, architectural violation, or unverified output occurs, the workflow halts or blocks the affected task branch immediately. The system never guesses or bypasses validation.
7. **Idempotent and Auditable Lifecycle**:
   Every state mutation, assignment, validation verdict, and escalation must produce an immutable audit log entry capable of full post-mortem reconstruction.

---

## 5. Authority Hierarchy

The organizational hierarchy enforces clear escalation boundaries and governance responsibilities:

```text
                    ┌─────────────────────────┐
                    │      PRODUCT OWNER      │
                    │   (Business Authority)  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  MANDOR / CHIEF ARCH    │
                    │ (Architectural Authority│
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        ZENORION         │
                    │ (Execution Orchestrator)│
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌──────────────────┐                           ┌──────────────────┐
│  DIVISION AGENT  │                           │    SPECIALIST    │
│      POOLS       │                           │   REVIEW POOLS   │
│   (Execution)    │                           │   (Validation)   │
└──────────────────┘                           └──────────────────┘
```

### Escalation Hierarchy Matrix:
| Escalation Tier | Authority Level | Permitted Decision Scope | Triggers |
| :--- | :--- | :--- | :--- |
| **Tier 1: Business** | Product Owner | Business requirements, budget, product scope changes, final release authorization, milestone acceptance. | Scope trade-offs, roadmap conflicts, release sign-off. |
| **Tier 2: Architecture** | Mandor (Chief Architect) | System boundaries, technology stack, RLS/security policies, schema invariants, architectural locked decisions. | Architectural ambiguity, security boundary violations, persistent rework deadlock. |
| **Tier 3: Orchestration** | ZenOrion | Task decomposition, DAG scheduling, agent assignment, capacity rebalancing, dependency releasing, communication routing. | Agent blocked, execution failure, dependency release, validation evaluation. |
| **Tier 4: Verification** | Specialist Agents | Technical verdict (PASS/FAIL) within assigned domain (Code, QA, Security, DB). | Code quality issues, security vulnerabilities, test failures. |
| **Tier 5: Execution** | Division Agents | Implementation decisions strictly within assigned task scope and architectural directives. | Code syntax, internal unit testing, artifact submission. |

---

## 6. Roles & Responsibilities

### 6.1 Product Owner (PO)
- Defines business objectives and user requirements.
- Submits formal Work Packages (`Task_PO_AjukanWP`).
- Reviews and accepts/rejects the final Work Package Report (`Event_PO_TerimaLaporan`).
- Evaluates and ratifies business scope changes escalated by Mandor.

### 6.2 Mandor (Chief Architect)
- Evaluates submitted Work Packages for architectural viability (`Task_Mandor_ReviewWP`).
- Issues authoritative Architectural Directives (`Task_Mandor_TetapkanArsitektur`), documenting constraints, standards, and invariant rules.
- Resolves technical escalations from ZenOrion involving architectural ambiguity, breaking schema changes, or cross-cutting security boundaries.
- Holds veto power over any technical change that violates locked decisions.

### 6.3 ZenOrion (Lead Agent Orchestrator)
- Ingests approved WPs and architectural directives (`Event_ZO_TerimaWP`).
- Decomposes WPs into atomic, cohesive tasks (`Task_ZO_AnalisisWP`).
- Builds and validates the dependency DAG (`Task_ZO_BuatDAG`).
- Matches and allocates tasks to qualified division agents (`Task_ZO_Alokasikan`).
- Continuously monitors execution progress and agent availability (`Task_ZO_Monitor`).
- Triggers specialist validation upon task completion (`MF_ZO_TriggerReview`).
- Evaluates validation verdicts (`Task_ZO_EvaluasiValidasi`); routes rework notes on failure (`Task_ZO_KirimRevisi`) or marks verified on success (`Task_ZO_TandaiTerverifikasi`).
- Unlocks downstream dependent tasks in the DAG (`Task_ZO_RilisDependency`).
- Compiles the final WP completion report for the Product Owner (`Task_ZO_BuatLaporan`).

### 6.4 Division Agents (Sub-Agents / Execution Pool)
- Ingests assigned tasks and executes within strict scope (`Task_AD_Kerjakan`).
- Generates concrete, reproducible evidence artifacts (`Task_AD_SubmitHasil`).
- Notifies ZenOrion of task completion (`Task_AD_NotifSelesai`).
- Upon receiving revision notes, performs required remediation without scope creep (`Task_AD_Perbaikan`) and resubmits (`Task_AD_Resubmit`).
- Does **not** autonomously mark tasks as complete or jump to subsequent tasks.

### 6.5 Specialist Agents (Peer Review & Validation Pool)
- Ingests validation assignments from ZenOrion (`Event_AS_TerimaTugas`).
- Executes rigorous domain-specific verification across four primary dimensions:
  1. **Peer Review**: Code design, pattern consistency, modularity, readability.
  2. **QA Validation**: Automated test coverage, regression checks, edge-case assertions.
  3. **Security Review**: OWASP top 10, multi-tenant data isolation, secret hygiene, RLS policy enforcement.
  4. **Database Validation**: Migration idempotency, foreign key integrity, index optimization, query performance.
- Produces structured, evidence-backed Validation Results (`DataObject_HasilValidasi`) with clear PASS/FAIL verdicts and actionable remediation instructions.

---

## 7. Non-Goals — Critical Safeguards

To prevent orchestration anti-patterns, EEOS-O strictly prohibits the following behaviors:

1. **Universal Bottleneck Anti-Pattern**:
   ZenOrion **must not** inspect source code diffs, run manual unit tests, evaluate query execution plans, or perform threat modeling. Doing so degrades throughput and violates separation of concerns.
2. **Autonomous Scope Expansion**:
   Division agents **must not** modify files or execute tasks outside their assigned scope. If an agent discovers a defect in an unassigned module, it must report it to ZenOrion as an observation; it must **not** fix it autonomously.
3. **Silent Architecture Drift**:
   Neither ZenOrion nor any division agent may alter locked architectural decisions (e.g., multi-tenant RLS patterns, tenant resolution mechanisms) without formal Mandor escalation and written amendment.
4. **Honor-System Progression**:
   No task may transition to `VERIFIED` based merely on an agent's status update. Without verifiable evidence artifacts linked to the task, progression is strictly blocked.
5. **Direct Agent-to-Agent Shadow Communication**:
   Agents **must not** communicate via unlogged private messaging. Direct peer-to-peer discussions that bypass ZenOrion prevent auditability, invalidate dependency tracking, and create uncoordinated race conditions.
6. **Silent Failure Suppression**:
   Errors during execution or test runs must never be swallowed or ignored. Any unhandled exception immediately transitions the task to `FAILED` or `BLOCKED` and triggers event handling.

---

## 8. Work Package (WP) Model

The Work Package is the macroscopic unit of delivery in EEOS-O. It encapsulates a cohesive business or technical capability.

```text
+-----------------------------------------------------------------------------------+
| WORK PACKAGE SPECIFICATION STRUCTURE                                              |
+-----------------------------------------------------------------------------------+
| 1. WP Header          : WP-ID, Title, Target Sprint, Created Date, Status        |
| 2. Business Intent    : Executive Objective, User Value, Acceptance Criteria      |
| 3. Architectural Directives: Mandatory Guidelines, Standards, Invariants (Mandor) |
| 4. Scope Boundary     : Explicitly In-Scope vs. Explicitly Out-of-Scope           |
| 5. Task DAG Registry  : Set of Tasks {T_01 .. T_n}, Dependency Relations, Critical Path |
| 6. Resource Plan      : Required Divisions, Specialist Review Requirements        |
| 7. Risk & Rollback    : Risk Classification, Blast Radius, Rollback Plan          |
| 8. Evidence Register  : Central repository of all generated artifacts and logs    |
| 9. Sign-off Ledger    : PO Approval, Mandor Sign-off, ZenOrion Closure Seal       |
+-----------------------------------------------------------------------------------+
```

### WP Lifecycle States:
1. `DRAFT`: Proposed by PO, awaiting technical refinement.
2. `UNDER_REVIEW`: Mandor reviewing for architectural feasibility.
3. `APPROVED`: Mandor ratified and issued architectural directives.
4. `DECOMPOSED`: ZenOrion created Task DAG and allocation matrix.
5. `ACTIVE`: Tasks in execution across division pools.
6. `BLOCKED`: Critical path blocked by unresolved technical or business issue.
7. `EVALUATING`: All tasks completed; ZenOrion compiling final WP evidence.
8. `ACCEPTED`: Final report approved by Product Owner; officially closed.
9. `REJECTED`: Fails business acceptance; returned to Mandor/PO for rework.

---

## 9. Task Model

A Task is an atomic, indivisible unit of engineering work allocated to an individual agent within a Work Package.

### 9.1 Task Data Schema
```typescript
interface TaskDefinition {
  taskId: string;                 // Format: T-{WP_NUM}-{SEQ} (e.g. T-08-01)
  workPackageId: string;          // Associated WP ID
  title: string;                  // Concise action-oriented title
  description: string;            // Detailed technical requirements
  targetDivision: DivisionId;     // Target division pool
  requiredCapabilities: string[]; // Specific capability tags required
  scopeFiles: {
    allowedPaths: string[];       // Strict file whitelist for mutations
    readOnlyPaths: string[];      // Files permitted for inspection
    forbiddenPaths: string[];     // Files strictly forbidden from mutation
  };
  dependencies: {
    requires: string[];           // Task IDs that must be VERIFIED before START
    requiredBy: string[];         // Downstream Task IDs waiting for this task
  };
  validationRequirements: {
    peerReview: boolean;          // Requires peer review
    qaValidation: boolean;        // Requires automated QA validation
    securityReview: boolean;      // Requires security review
    databaseValidation: boolean;  // Requires schema/database review
  };
  currentState: TaskState;        // Finite State Machine state
  assignee: string | null;        // Assigned Agent ID (e.g., ZenCoder-1)
  iterationCount: number;         // Current execution iteration (rework counter)
  maxIterations: number;          // Rework limit before mandatory escalation (default: 3)
  evidenceArtifacts: string[];    // Links to generated evidence documents
  validationReportId: string | null; // Associated validation result
}
```

---

## 10. Task State Machine (FSM)

The lifecycle of every task in EEOS-O is governed by a deterministic, non-bypassable Finite State Machine.

```text
                        ┌──────────────┐
                        │   CREATED    │
                        └──────┬───────┘
                               │ (Dependencies analyzed)
                               ▼
                        ┌──────────────┐
              ┌─────────┤    READY     │◄───────────────────┐
              │         └──────┬───────┘                    │
              │                │ (Agent assigned)           │
              │                ▼                            │
              │         ┌──────────────┐                    │
              │         │   ASSIGNED   │                    │
              │         └──────┬───────┘                    │
              │                │ (Agent starts execution)   │
              │                ▼                            │
              │         ┌──────────────┐                    │
              │    ┌───►│ IN_PROGRESS  │                    │
              │    │    └──────┬───────┘                    │
              │    │           │ (Evidence submitted)       │
              │    │           ▼                            │
              │    │    ┌──────────────────────┐            │
              │    │    │ COMPLETION_SUBMITTED │            │
              │    │    └──────┬───────────────┘            │
              │    │           │ (Validation required)      │
              │    │           ▼                            │
              │    │    ┌────────────────────┐              │
              │    │    │ VALIDATION_PENDING │              │
              │    │    └──────┬─────────────┘              │
              │    │           │ (Specialist begins review) │
              │    │           ▼                            │
              │    │    ┌──────────────┐                    │
              │    │    │  VALIDATING  │                    │
              │    │    └──────┬───────┘                    │
              │    │           │                            │
              │    │    ┌──────┴──────────────┐             │
              │    │    │ (Validation Result) │             │
              │    │    └──────┬──────────────┘             │
              │    │           │                            │
              │    │     FAIL  ▼  PASS                      │
              │    │  ┌──────────────────┐                  │
              │    └──┤ REWORK_REQUIRED  │                  │
              │       └──────────────────┘                  │
              │                │                            │
              │                ▼                            │
              │       ┌──────────────────┐                  │
              │       │     VERIFIED     │                  │
              │       └────────┬─────────┘                  │
              │                │ (DAG analyzed)             │
              │                ▼                            │
              │       ┌──────────────────┐                  │
              │       │DEPENDENCY_RELEASE│──────────────────┘ (Unlocks next READY)
              │       └────────┬─────────┘
              │                │ (All dependencies unblocked)
              │                ▼
              │       ┌──────────────────┐
              │       │    COMPLETED     │ (Terminal State)
              │       └──────────────────┘
              │
              │ (Orchestration Interruption States)
              ├──────► BLOCKED / WAITING
              ├──────► ESCALATED
              ├──────► FAILED
              └──────► CANCELLED
```

### 10.1 Detailed State Specification Matrix

| State Name | Operational Meaning | Entry Conditions | Exit Conditions | Allowed Transitions | Transition Actor | Required Evidence | Terminal? | Re-entry? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **`CREATED`** | Task instantiated during WP decomposition. | WP decomposition completed by ZenOrion. | Prerequisites evaluated in DAG. | `READY`, `WAITING`, `CANCELLED` | ZenOrion | Task definition entry in Task DAG Registry. | No | No |
| **`WAITING`** | Task waiting for upstream prerequisite tasks to finish. | One or more tasks in `dependencies.requires` are not `VERIFIED`. | All prerequisite tasks reach `VERIFIED`. | `READY`, `CANCELLED`, `BLOCKED` | ZenOrion | Dependency status check log. | No | Yes |
| **`READY`** | All dependencies satisfied; task is eligible for assignment. | All `dependencies.requires` verified AND target agent capacity confirmed. | Agent assigned from registry. | `ASSIGNED`, `BLOCKED`, `CANCELLED` | ZenOrion | Dependency completion verification log. | No | Yes |
| **`ASSIGNED`** | Task committed to a specific division agent. | Agent capability matches requirements AND agent is `AVAILABLE`. | Agent acknowledges assignment and initiates work. | `IN_PROGRESS`, `BLOCKED`, `READY` | ZenOrion / Agent | Assignment payload and agent acceptance message. | No | Yes |
| **`IN_PROGRESS`** | Agent actively executing task within scoped file boundary. | Agent starts work and records execution environment lock. | Agent completes implementation or encounters a blocker. | `COMPLETION_SUBMITTED`, `BLOCKED`, `FAILED`, `ESCALATED` | Division Agent | Working tree snapshot, active execution session ID. | No | Yes |
| **`COMPLETION_SUBMITTED`**| Work finished; evidence artifact submitted; awaiting review routing. | Agent commits changes, runs local unit tests, uploads evidence. | ZenOrion evaluates validation requirements. | `VALIDATION_PENDING`, `VERIFIED`, `REWORK_REQUIRED` | Division Agent | Git commit SHA, diff stats, unit test results, output artifact. | No | Yes |
| **`VALIDATION_PENDING`** | Task queued for specialist peer review. | ZenOrion determines task requires specialist validation. | Specialist agent claims validation task. | `VALIDATING`, `BLOCKED`, `ESCALATED` | ZenOrion | Validation request message containing evidence link. | No | Yes |
| **`VALIDATING`** | Specialist agent actively inspecting artifacts and test evidence. | Specialist agent initiates review sub-process. | Specialist issues formal validation verdict. | `VERIFIED`, `REWORK_REQUIRED`, `ESCALATED` | Specialist Agent | Active review session record. | No | Yes |
| **`REWORK_REQUIRED`** | Validation failed; findings must be remediated by original agent. | Specialist produces `FAIL` verdict with documented issues. | Original agent ingests revision notes and begins fixes. | `IN_PROGRESS`, `ESCALATED`, `FAILED` | ZenOrion | Structured validation failure report with file/line findings. | No | Yes |
| **`VERIFIED`** | Implementation and quality criteria formally proven and approved. | All required specialist reviews produce `PASS` verdicts. | ZenOrion updates task ledger and queries DAG for downstream tasks. | `DEPENDENCY_RELEASE`, `COMPLETED` | ZenOrion | Signed specialist validation reports with `PASS` verdict. | No | No |
| **`DEPENDENCY_RELEASE`** | Downstream dependencies unlocked in DAG. | Current task verified; ZenOrion evaluates `requiredBy` list. | Downstream tasks transitioned to `READY`. | `COMPLETED` | ZenOrion | DAG traversal log and state mutation records. | No | No |
| **`COMPLETED`** | Task completely finished, verified, and released. | All post-verification actions concluded. | None. | None (Terminal) | ZenOrion | Immutable completion receipt in Task Database. | **Yes** | No |
| **`BLOCKED`** | Execution halted due to environmental, dependency, or resource fault. | Missing dependency, runtime error, or external service failure. | Blocker resolved or task re-routed. | `IN_PROGRESS`, `READY`, `ESCALATED`, `CANCELLED` | Agent / ZenOrion | Blocker incident report citing exact root cause. | No | Yes |
| **`ESCALATED`** | Task handed over to higher authority for architectural or business decision. | Iteration limit exceeded, architectural conflict, or scope expansion. | Mandor or PO renders formal decision. | `IN_PROGRESS`, `REWORK_REQUIRED`, `CANCELLED` | ZenOrion | Formal escalation ticket with architectural trade-offs. | No | Yes |
| **`FAILED`** | Irrecoverable technical failure or violation of invariants. | Unresolvable technical barrier or critical security failure. | Mandor intervention or WP cancellation. | `CANCELLED`, `ESCALATED` | ZenOrion / Mandor| Post-mortem failure diagnostic report. | **Yes** | No |
| **`CANCELLED`** | Task abandoned or made redundant by scope redefinition. | Formal directive from Mandor or Product Owner. | None. | None (Terminal) | Mandor / PO | Cancellation authorization record citing business rationale. | **Yes** | No |

---

## 11. Dependency Directed Acyclic Graph (DAG)

EEOS-O models all tasks within a Work Package as a strict Directed Acyclic Graph (DAG):
$G = (V, E)$, where $V$ represents the set of tasks and $E$ represents directed dependency edges $(u, v)$ signifying that task $u$ must be `VERIFIED` before task $v$ can become `READY`.

### 11.1 Structural Constraints:
1. **Acyclicity**: Cycles ($T_A \to T_B \to T_A$) are strictly forbidden. ZenOrion validates the DAG during `Task_ZO_BuatDAG` using topological sort (Kahn’s algorithm). Any cycle causes immediate rejection of the WP decomposition.
2. **Explicit Relations**: Every dependency must specify both `REQUIRES` ($u \in \text{requires}(v)$) and `REQUIRED_BY` ($v \in \text{required\_by}(u)$).
3. **Readiness Evaluation**:
   $$\text{State}(v) = \text{READY} \iff \forall u \in \text{requires}(v), \, \text{State}(u) = \text{VERIFIED}$$

### 11.2 Concrete DAG Example (Multi-Tenant RLS Implementation):
```text
                  ┌──────────────────────┐
                  │       T-08-01        │
                  │  Audit Existing RLS  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │       T-08-02        │
                  │ Design Policy Spec   │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌──────────────────────┐      ┌──────────────────────┐
   │       T-08-03        │      │       T-08-04        │
   │ Implement Policies   │      │ Prepare Test Suite   │
   │     (Database)       │      │        (QA)          │
   └──────────┬───────────┘      └──────────┬───────────┘
              │                             │
              └──────────────┬──────────────┘
                             ▼
                  ┌──────────────────────┐
                  │       T-08-05        │
                  │ Runtime E2E Verify   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │       T-08-06        │
                  │ Architectural Doc    │
                  └──────────────────────┘
```

- $T_{08-03}$ and $T_{08-04}$ have no mutual dependency; they execute in **parallel** once $T_{08-02}$ reaches `VERIFIED`.
- $T_{08-05}$ requires **both** $T_{08-03}$ and $T_{08-04}$ to be `VERIFIED`.

---

## 12. Parallel Execution

Parallel execution maximizes engineering throughput without compromising system stability.

### 12.1 Parallel Execution Invariants:
1. **Zero Resource Contention**: Tasks executing concurrently **must never** have overlapping mutable file scopes (`scopeFiles.allowedPaths`). If two ready tasks target the same file, ZenOrion serializes them.
2. **Isolation of State**: Concurrent tasks must execute in isolated git worktrees or branches.
3. **Capacity Constraints**: Parallel dispatch is strictly bounded by division pool capacity. If 3 tasks are ready but only 2 agents are `AVAILABLE`, ZenOrion dispatches based on priority and critical path distance.
4. **Independent Validation**: Parallel execution branches undergo independent specialist reviews without blocking unrelated parallel branches.

---

## 13. Agent Registry

The Agent Registry is the authoritative centralized directory of all active orchestration actors in EEOS-O.

### 13.1 Agent Profile Schema
```typescript
interface AgentProfile {
  agentId: string;              // Unique identifier (e.g. AGT-ENG-001)
  agentName: string;            // Standard name starting with 'Zen' (e.g. ZenCoder)
  division: DivisionId;         // Assigned functional division
  role: AgentRole;              // PRIMARY_EXECUTOR | SPECIALIST_REVIEWER | HYBRID
  capabilities: string[];       // Specific skills (e.g. ['nextjs', 'typescript', 'drizzle'])
  permissions: {
    canMutateCode: boolean;     // Allowed to modify repository files
    canExecuteDDL: boolean;     // Allowed to run DB migrations (restricted)
    canDeploy: boolean;         // Allowed to trigger CI/CD deployment
    canPerformReview: boolean;  // Allowed to sign off validation reports
  };
  currentState: AgentState;     // AVAILABLE | WORKING | BLOCKED | WAITING | OFFLINE
  activeTaskId: string | null;  // Current assigned task
  activeWorkPackageId: string | null;
  workloadMetric: number;       // Current load factor (0 to 100)
  lastHeartbeat: string;        // ISO-8601 timestamp
}
```

### 13.2 Agent Operational States:
- `AVAILABLE`: Idle, healthy, and ready to accept new assignments.
- `WORKING`: Actively executing a task or validation review.
- `BLOCKED`: Unable to proceed due to an environmental or dependency issue.
- `WAITING`: Awaiting async operation (e.g. long-running CI/CD build).
- `OFFLINE`: De-registered, suspended, or unreachable.

---

## 14. Division Model

EEOS-O organizes agents into **8 functional divisions**. To guarantee high availability, fault tolerance, and peer review independence, every division enforces a **hard redundancy minimum of 2 agents per division** (Total minimum baseline: 16 specialist agents + 1 Lead Orchestrator = 17 agents).

```text
+----------------------------------------------------------------------------------------------------+
| EEOS-O DIVISIONAL STRUCTURE & BASELINE ROSTER                                                      |
+----+----------------------------+-----------------------+--------------------+---------------------+
| No | Division Name              | Division Code         | Primary Focus      | Baseline Agents     |
+----+----------------------------+-----------------------+--------------------+---------------------+
| 1  | Architecture & Analysis    | DIV_ARCH              | Architecture, ADR  | ZenArch, ZenStruct  |
| 2  | Engineering                | DIV_ENG               | Features, Business | ZenCoder, ZenCraft  |
| 3  | Data & Database            | DIV_DATA              | Schema, RLS, DDL   | ZenData, ZenSchema  |
| 4  | Identity & Security        | DIV_SEC               | Auth, Tokens, RBAC | ZenAuth, ZenGuard   |
| 5  | Quality Assurance          | DIV_QA                | E2E, Unit, Regress | ZenTest, ZenVerify  |
| 6  | Infrastructure & Release   | DIV_INFRA             | CI/CD, Domains, Env| ZenOps, ZenDeploy   |
| 7  | Documentation & Knowledge  | DIV_DOC               | Journey Map, Specs | ZenDoc, ZenScribe   |
| 8  | Research & Forensics       | DIV_FORENSICS         | RCA, Audits, Logs  | ZenScout, ZenTrace  |
+----+----------------------------+-----------------------+--------------------+---------------------+
| *  | Lead Agent Orchestrator    | ORCHESTRATION_CORE    | End-to-End Workflow| ZenOrion (Lead)     |
+----+----------------------------+-----------------------+--------------------+---------------------+
```

*Note: ZenOrion sits outside all division pools and has zero divisional reporting bias.*

---

## 15. Agent Capability Model

Tasks are matched to agents through deterministic capability evaluation, eliminating arbitrary assignments.

### 15.1 Capability Matching Hierarchy:
```text
Task Requirements (Division, Skills, Scope, Permissions)
                           │
                           ▼
          Filter 1: Division Alignment (Target Division)
                           │
                           ▼
          Filter 2: Capability Subsumption (All required capabilities present)
                           │
                           ▼
          Filter 3: Permission Verification (Security boundaries met)
                           │
                           ▼
          Filter 4: Availability & State (Agent state == AVAILABLE)
                           │
                           ▼
          Filter 5: Conflict of Interest Gate (Reviewer != Implementer)
                           │
                           ▼
                 Eligible Candidate Pool
                           │
                           ▼
       Dispatch to Agent with Lowest Workload Metric
```

---

## 16. Assignment Rules

ZenOrion enforces five strict assignment rules during `Task_ZO_Alokasikan`:
1. **Rule of Capability Adequacy**: An agent must possess 100% of the mandatory capabilities required by the task.
2. **Rule of Separation of Concerns (Review Independence)**: The specialist agent assigned to validate a task **must not** be the agent who implemented the task.
3. **Rule of Single Active Task**: A division agent may only execute **one** active mutable task at a time ($W = 1$). Specialists may handle up to two read-only reviews concurrently.
4. **Rule of Affinity**: If an agent successfully implemented an earlier task in a cohesive module chain, ZenOrion prioritizes that agent for immediate sequential tasks to preserve cognitive context, provided capacity allows.
5. **Rule of Anti-Stall**: If no eligible agent is available within a division for a critical-path task, ZenOrion flags the task as `WAITING_CAPACITY` and alerts Mandor if wait time exceeds predefined SLA (30 minutes).

---

## 17. Communication Architecture

EEOS-O adheres strictly to: **"No Unregistered Inter-Agent Communication."**

```text
                       ┌──────────────────────┐
                       │       ZENORION       │
                       │  (Central Hub Router)│
                       └───┬──────────────┬───┘
                           │              │
              Message Flow │              │ Message Flow
                           ▼              ▼
                 ┌──────────────┐    ┌──────────────┐
                 │ Sub-Agent A  │    │ Sub-Agent B  │
                 │ (Implementer)│    │ (Reviewer)   │
                 └──────────────┘    └──────────────┘
```

### 17.1 Communication Invariants:
1. **Hub-and-Spoke Topology**: All communication flows: `Agent A -> ZenOrion -> Agent B`. Direct peer-to-peer side channels are prohibited.
2. **Standard Message Envelope**: Every communication is formatted as a structured event containing: `messageId`, `correlationId`, `workPackageId`, `taskId`, `senderAgentId`, `recipientAgentId`, `messageType`, `payload`, and `timestamp`.
3. **Automated DAG Pass-Through**: When Task A completes and its outputs are verified, ZenOrion automatically packages Task A's verified artifacts and injects them into Task B's assignment context. This prevents ZenOrion from becoming an interactive conversational intermediary for routine data passing.
4. **Immutable Message Audit**: All routed messages are permanently persisted to `DS_DBOrkestrasi` and indexed for forensic replay.

---

## 18. Handoff Rules

A task handoff occurs when an agent submits completed work for validation, or when verified work is passed to a downstream dependency.

### 18.1 Handoff Contract:
A handoff is invalid and rejected by ZenOrion unless the submission package contains:
1. **Manifest of Deliverables**: Exact list of files created, modified, or deleted.
2. **Cryptographic Integrity**: Git commit SHA or artifact hash corresponding to the exact workspace state.
3. **Automated Test Evidence**: Clean execution logs demonstrating that existing tests pass and new targeted tests validate the deliverable.
4. **Preflight Checklist**: Confirmation that zero locked architectural decisions were breached and no credentials/secrets were exposed.
5. **Clear Handoff Notes**: Technical summary explaining non-obvious design choices or boundary considerations.

---

## 19. Specialist Validation

Validation is the quality firewall of EEOS-O. Specialist validation is executed across four parallel dimensions (`SubProcess_ReviewParalel`):

```text
                               ┌───────────────────┐
                               │  Tugas Diserahkan │
                               └─────────┬─────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │   Fork Validasi   │
                               └───┬───┬───┬───┬───┘
           ┌───────────────────────┘   │   │   └───────────────────────┐
           ▼                           ▼   ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│     Peer Review     │     │    QA Validation    │     │   Security Review   │     │    DB Validation    │
│  (Code Quality &    │     │ (Automated Tests &  │     │  (Tenant Isolation  │     │ (Schema Invariants, │
│     Patterns)       │     │   Edge Scenarios)   │     │    & Secret Audit)  │     │   RLS & Migrations) │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │   │                           │
           └───────────────────────┐   │   │   ┌───────────────────────┘
                                   ▼   ▼   ▼   ▼
                               ┌───────────────────┐
                               │   Join Validasi   │
                               └─────────┬─────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │  Hasil Validasi   │
                               │   (Pass / Fail)   │
                               └───────────────────┘
```

### 19.1 Validation Dimension Matrix:
| Dimension | Lead Division | Mandatory Scenarios | Failure Triggers |
| :--- | :--- | :--- | :--- |
| **Peer Review** | DIV_ENG / DIV_ARCH | Code changes > 50 lines; new components; architectural refactoring. | Code smells, dead code, missing docstrings, anti-patterns, style violations. |
| **QA Validation** | DIV_QA | All functional code changes; bug fixes; edge-case additions. | Failing tests, reduced coverage, brittle assertions, regression bugs. |
| **Security Review** | DIV_SEC | Authentication routes, cookies, headers, proxies, multi-tenant boundaries. | Exposed secrets, missing `tenant_id` filters, bypassable middleware, enumeration bugs. |
| **DB Validation** | DIV_DATA | DDL changes, schema updates, migrations, query performance optimization. | Non-idempotent migrations, missing RLS policies, unindexed foreign keys, destructive DROP operations. |

---

## 20. Rework Model

When a specialist review issues a `FAIL` verdict, the rework sub-process is triggered deterministically without terminating the parent Work Package.

```text
                  ┌──────────────────────┐
                  │    Hasil Validasi    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │    Validasi Lulus?   │
                  └───┬──────────────┬───┘
                  FAIL│              │PASS
                      ▼              ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│     REWORK_REQUIRED       │  │         VERIFIED          │
└─────────────┬─────────────┘  └───────────────────────────┘
              │
              ▼
┌───────────────────────────┐
│ Kirim Catatan Revisi      │ (ZenOrion formats structured findings)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Lakukan Perbaikan Tugas   │ (Original Agent repairs implementation)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│   Resubmit Hasil Tugas    │ (Resubmitted with fresh evidence)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Re-Review oleh Spesialis  │ (Targeted review of remediation items)
└───────────────────────────┘
```

### 20.1 Rework Rules:
1. **Targeted Remediation**: The rework notes must explicitly reference file paths, line numbers, and actionable remediation criteria.
2. **Iteration Ceiling**: Each task allows a maximum of **3 rework cycles** (`iterationCount <= 3`).
3. **Mandatory Escalation on Limit**: If a task fails validation on its 3rd iteration, ZenOrion automatically halts the task, transitions it to `ESCALATED`, and submits the dossier to Mandor to resolve architectural or technical deadlock.

---

## 21. Event Sub-Processes

As modeled in the BPMN (`SubProcess_EventHandling`), ZenOrion operates continuous, non-interrupting asynchronous event listeners alongside main orchestration:

```text
+-------------------------------------------------------------------------------------------------------+
| ZENORION ASYNCHRONOUS EVENT SUB-PROCESSES (Parallel Execution Listeners)                             |
+----+----------------------+--------------------------+-----------------------+------------------------+
| No | Event Name           | Triggering Condition     | Operational Handling  | State Effect           |
+----+----------------------+--------------------------+-----------------------+------------------------+
| 1  | Communication        | Sub-agent requests       | Authenticate, log,    | State preserved;       |
|    | Request (`ESP_Comm`) | info, unblock, or review | route to target actor | message logged         |
+----+----------------------+--------------------------+-----------------------+------------------------+
| 2  | Dependency           | Upstream task verified   | Traverse DAG, evaluate| Downstream tasks       |
|    | Completion (`ESP_Dep`| by specialist            | downstream readiness  | transition to READY    |
+----+----------------------+--------------------------+-----------------------+------------------------+
| 3  | Agent Blocked        | Agent missing resource   | Diagnose fault, seek  | Task -> BLOCKED;       |
|    | (`ESP_Block`)        | or dependency            | resolution or escalate| Agent -> BLOCKED       |
+----+----------------------+--------------------------+-----------------------+------------------------+
| 4  | Execution Failure    | Exception thrown, test   | Capture diagnostic log| Task -> FAILED;        |
|    | (`ESP_Fail`)         | suite hard crash         | trigger triage        | Alert sent to ZenOrion |
+----+----------------------+--------------------------+-----------------------+------------------------+
| 5  | Escalation Event     | Deadlock, authority      | Package ticket, pause | Task -> ESCALATED;     |
|    | (`ESP_Esc`)          | boundary, rework ceiling | branch, notify Mandor | Branch frozen safely   |
+----+----------------------+--------------------------+-----------------------+------------------------+
```

---

## 22. Evidence Model (Evidence as Source of Truth)

In EEOS-O, **assertions and claims are untrusted; verifiable evidence is the sole source of truth**.

### 22.1 Claim vs. Evidence Taxonomy:
| Subject | Untrusted Claim (Ignored) | Authoritative Evidence (Required) |
| :--- | :--- | :--- |
| **Code Completion** | "I updated the auth routes." | Git commit diff with exact file paths and cryptographic commit hash. |
| **Test Success** | "All unit tests pass." | Execution stdout/stderr log with timestamp, exit code `0`, and pass/fail summary. |
| **Type Integrity** | "TypeScript has no errors." | `npx tsc --noEmit` stdout showing `Found 0 errors`. |
| **Multi-Tenant Safety** | "Tenant data is completely isolated." | SQL query plan showing `tenant_id` filter and passing multi-tenant RLS contract tests. |
| **Email Delivery** | "Recovery email was dispatched." | Transactional provider (Resend) Message ID with status `delivered`. |
| **Deployment State** | "Feature is live in Preview." | Vercel Deployment ID (`dpl_*`), HTTP status `200`, and trace ID header. |

---

## 23. Work Package Completion

When all tasks within a Work Package reach `COMPLETED`, ZenOrion initiates formal WP closure:

```text
                  ┌───────────────────────────────┐
                  │   Semua Tugas WP Selesai?     │
                  └───────────────┬───────────────┘
                                  │
                                  ▼ YA
                  ┌───────────────────────────────┐
                  │    Buat Laporan Akhir WP      │
                  │ (Metrics, Evidence, Summary)  │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    Kirim Laporan ke PO        │
                  │   (Event_PO_TerimaLaporan)    │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │          WP CLOSED            │
                  └───────────────────────────────┘
```

### 23.1 Final WP Report Mandatory Contents:
1. **Work Package Metadata**: ID, Title, Target Environment, Execution Window.
2. **Decomposition Execution Summary**: Total tasks created, executed, reworked, and verified.
3. **Evidence Dossier**: Links to all code diffs, contract test runs, and verification artifacts.
4. **Specialist Sign-off Matrix**: Consolidated sign-off records from Peer, QA, Security, and DB reviewers.
5. **Deviations & Known Backlog**: Documented benign warnings, non-blocking limitations, and future backlog items.
6. **Production Promotion Readiness**: Explicit classification whether the completed WP is a candidate for Production release.

---

## 24. Escalation Model

Escalation is a structured safety valve ensuring that issues exceeding an agent's or orchestrator's mandate are resolved by appropriate leadership.

### 24.1 Escalation Triggers:
1. **Architectural Deviation**: A proposed change conflicts with existing architectural decisions or invariant rules.
2. **Security Barrier Breach**: A task inadvertently attempts to modify high-security boundaries (e.g. Supabase Service Role exposure, bypassing fail-closed proxy).
3. **Rework Deadlock**: Task exceeds the maximum iteration limit (3 failed review cycles).
4. **Capacity Exhaustion**: Complete blockage of a division pool preventing critical-path progression.
5. **Business Requirement Conflict**: Ambiguity in business intent requiring Product Owner clarification.

### 24.2 Escalation Protocol:
```text
Division Agent / Specialist
            │ (Submits structured Escalation Ticket)
            ▼
        ZenOrion
            │
            ├─ Architectural / Technical Conflict ──► Mandor (Chief Architect)
            │
            └─ Business Scope / Trade-off ─────────► Product Owner (PO)
```

---

## 25. Auditability & Traceability

Every operational action across EEOS-O must be recorded in an append-only audit ledger (`DS_DBOrkestrasi`):

### 25.1 Mandatory Audit Record Structure:
```text
AUDIT_RECORD:
  timestamp:       "2026-10-01T19:42:00.000Z"
  eventId:         "EVT-08-9842"
  correlationId:   "CORR-WP08-TASK03"
  actor:           "ZenCoder"
  actorRole:       "PRIMARY_EXECUTOR"
  action:          "SUBMIT_TASK_COMPLETION"
  targetEntity:    "T-08-03"
  previousState:   "IN_PROGRESS"
  newState:        "COMPLETION_SUBMITTED"
  rationale:       "RLS policy implementation finished with 100% unit tests passing"
  evidenceHash:    "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
```

---

## 26. Security Boundaries

1. **Role-Based Isolation**: Division agents are strictly sandboxed. They have zero direct access to production secrets, master database connection strings, or cloud control plane APIs.
2. **Read-Only / Mutable File Paths**: Tasks define strict file access boundaries (`scopeFiles`). Attempts to mutate files outside the whitelist trigger an automatic security alarm and task failure.
3. **Secret Hygiene**: Real API keys, tokens, and credentials are never stored in task payloads, code diffs, logs, or reports.
4. **Environment Isolation**: Execution environments (local, preview, production) are segregated. Agents operating in preview cannot execute commands against production.

---

## 27. Observability Requirements

EEOS-O requires real-time observability across four core operational views:
1. **DAG Topology Visualizer**: Live interactive rendering of the task graph showing active, blocked, and verified nodes with color-coded health states.
2. **Agent Capacity & Workload Dashboard**: Real-time utilization metrics per division and agent, displaying queue depths and throughput.
3. **Evidence Explorer**: Hierarchical file store allowing instant inspection of test logs, diffs, and verification reports linked to each task.
4. **Audit Trail Timeline**: Chronological, searchable timeline of all state transitions, escalations, and messages.

---

## 28. Open Questions for Product Owner & Mandor

The following architectural questions are identified during system analysis and submitted for formal decision:

1. **Agent Persistence & Runtime Medium**:
   *Should EEOS-O agents run as ephemeral stateless containerized workers dispatched per task, or as long-lived stateful daemons maintaining persistent local workspace caches?*
2. **Automated vs. Manual Specialist Assignment**:
   *Should ZenOrion autonomously assign specialist reviewers based strictly on capability scoring, or should the Mandor retain approval authority over specialist assignments on Tier-1 (Security/Database) tasks?*
3. **Rework Cost Ceiling**:
   *When a task reaches its 3rd failed rework cycle, should the entire Work Package pause, or should ZenOrion isolate the failing branch and allow independent parallel branches to continue?*
4. **Inter-WP Dependencies**:
   *How should EEOS-O model dependencies between two separate Work Packages (e.g., WP-09 requiring completion of WP-08)? Should this be managed at the Mandor level, or modeled as an inter-WP DAG in ZenOrion?*

---

## 29. Explicit Assumptions

1. **Git as Baseline VCS**: The underlying repository operates on Git, supporting branch isolation, worktrees, and commit SHA verification.
2. **CI/CD Pipeline Availability**: An automated testing engine (Vitest, Next.js build, TypeScript compiler) is available to execute deterministic verification.
3. **Single Active Mandor**: Technical governance is anchored in a Chief Architect persona who provides authoritative directives and escalation decisions.
4. **Standardized Formatting**: All documentation, reports, and communication records use GitHub Flavored Markdown and JSON data contracts.

---

## 30. Non-Goals / Future Scope (Roadmap Beyond v1.0)

The following capabilities are explicitly deferred to future releases:
- **v1.1**: Dynamic auto-scaling of agent division pools based on real-time task queue depth.
- **v1.2**: Automated cross-WP dependency management and multi-WP scheduling.
- **v2.0**: Natural language conversational interface for Product Owner Work Package submission and interactive progress interrogation.
- **v2.5**: Machine learning-driven task effort estimation and automated critical path optimization.

---

*End of Master System Specification v1.0. This document constitutes the definitive architectural design baseline for EEOS-O.*
