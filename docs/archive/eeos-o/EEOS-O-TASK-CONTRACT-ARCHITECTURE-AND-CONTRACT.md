# EEOS-O — Phase 1.2: Task Contract Architecture Design
## Authoritative Architecture, Logical Entity Model, and Contract Boundary Specification

**Document Identifier**: `EEOS-O-TASK-CONTRACT-ARCHITECTURE-AND-CONTRACT`  
**Classification**: Enterprise Architecture & Interface Governance  
**Phase**: Phase 1 — Architecture & Interface Contract Design  
**Sub-Phase**: 1.2 — Task Contract Architecture Design  
**Specification Version**: `1.0.0-DRAFT`  
**Date**: October 01, 2026  
**Status**: DESIGN COMPLETE — PENDING MANDOR & PRODUCT OWNER RATIFICATION  
**Author**: Architecture & Documentation Agent (Under ZenOrion Governance)  
**Authority Hierarchy**:  
1. `Process_PO` / Product Owner Directives (Sovereign Business Intent)  
2. `Process_Mandor` / Chief Architect Directives (Sovereign Architectural Ratification)  
3. `BPMN — EEOS-O (v2.1) Proses Orkestrasi oleh ZenOrion` (Authoritative Visual Process Baseline)  
4. `EEOS-O-MASTER-SYSTEM-SPECIFICATION-v1.1` (Ratified Master Specification)  
5. `EEOS-O-MASTER-SYSTEM-RATIFICATION-REPORT` (Ratification Certification & Locked Decisions #1, #2, #3)  
6. `EEOS-O-PHASE-1.1-WORK-PACKAGE-CONTRACT` (Ratified Work Package Contract Specification)  
7. `EEOS-O-MEMORY-ARCHITECTURE-AND-CONTRACT-BOUNDARY` (Ratified Memory Architecture v1.1.0)  
8. `EEOS-O-MEMORY-ARCHITECTURE-RATIFICATION-REPORT` (Ratification Certification & Decision Locks 01–06)  
9. This Phase 1.2 Task Contract Architecture Specification  

---

## 1. Document Control & Metadata

| Attribute | Specification Value |
| :--- | :--- |
| **Document UID** | `SPEC-EEOS-O-PHASE-1.2-TASK-CONTRACT-v1.0.0` |
| **System** | EEOS-O (Executive Engineering Orchestration — Orchestrator) |
| **Phase Milestone** | Phase 1.2 (Subordinate to Phase 1.1 Memory Architecture & WP Contract) |
| **Classification** | System Architecture & Interface Contract Boundary |
| **Lifecycle State** | `DESIGN_DRAFT` (Awaiting Formal Mandor Ratification) |
| **Governing Entity** | ZenOrion Lead Orchestrator |
| **Superseded Docs** | None (First formal Task Contract architecture specification) |

---

## 2. Authority Hierarchy & Inheritance Map

This specification operates strictly under the established EEOS-O governance hierarchy. No clause herein may weaken, contradict, or preempt a higher-tier authority.

```text
                  ┌───────────────────────────────┐
                  │         Product Owner         │  (Tier 1: Sovereign Business Authority)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    Mandor / Chief Architect   │  (Tier 2: Sovereign Architectural Authority)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   BPMN EEOS-O v2.1 Visual     │  (Tier 3: Primary Process Authority)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Master Spec v1.1 & Reports  │  (Tier 4 & 5: Ratified System Baseline)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │  Phase 1.1 Contracts (WP/Mem) │  (Tier 6, 7, 8: Ratified Component Contracts)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │  Phase 1.2 Task Contract Spec │  (Tier 9: This Specification)
                  └───────────────────────────────┘
```

### 2.1 Explicit Authority Map

| Document UID / Source | Version | Authority Tier | Relevant Sections | Rules Inherited by Phase 1.2 | Nature |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `Process_PO` Directives | Ongoing | **Tier 1** | Scope, Budget, Business Invariants | Final business acceptance authority; zero unratified scope expansion. | Normative |
| `Process_Mandor` Directives | Ongoing | **Tier 2** | ADRs, Security, DDL Locks | Technical supremacy; sole authority to ratify schemas & arbitrate rework deadlocks. | Normative |
| `BPMN — EEOS-O (v2.1)` | v2.1 | **Tier 3** | Pools: `PO`, `Mandor`, `ZenOrion` | Visual state alignment; autonomous reviewer dispatch; parallel execution paths. | Normative |
| `EEOS-O-MASTER-SPEC-v1.1` | v1.1.0 | **Tier 4** | Sec 4, 5, 8, 9, 10, 11, 14, 16, 20 | TaskDefinition baseline, 15-state deterministic FSM (11 core/transitional + 4 exception/governance states), DAG acyclicity, workspace isolation. | Normative |
| `EEOS-O-MASTER-RATIFICATION` | v1.1.0 | **Tier 5** | Locked Decisions #1, #2, #3 | Branch-Only Freeze (#1); Logical Registry / Runtime Deferred (#2); Auto Reviewer (#3). | Normative |
| `EEOS-O-PHASE-1.1-WP-CONTRACT` | v1.1.0 | **Tier 6** | Sec 7, 8, 10 (`taskDecompositionRef`) | TaskReference schema; WP-level correlation; acceptance criteria propagation. | Normative |
| `EEOS-O-MEMORY-ARCH-CONTRACT` | v1.1.0 | **Tier 7** | Sec 3, 4, 8, 9, 10, 15, 18, 24 | Subservience to Memory Architecture; Zero Direct Agent Writes; Scoped Context. | Normative |
| `EEOS-O-MEMORY-RATIFICATION` | v1.1.0 | **Tier 8** | Locks 01 through 06 | Storage Independence (01); Runtime Independence (02); Evidence vs Memory (06). | Normative |

---

## 3. Phase Entry Conditions & Pre-Design Audit

### 3.1 Certified Phase Entry State
1. **Phase 1.1 Complete & Ratified**: Both Work Package Contract (`v1.1.0`) and Memory Architecture & Contract Boundary (`v1.1.0`) are formally ratified with `0` blocking findings, `0` non-blocking findings, and `0` authority conflicts.
2. **Implementation Status**: Strictly `NOT STARTED`. Zero application code, database migrations, SQL DDL, or vector indices exist in the repository.
3. **Execution Mandate**: Authorized strictly for **Phase 1.2 — Task Contract Architecture Design**.

### 3.2 Pre-Design Audit Findings

#### Audit B01 — Existing Task Definition
- *Finding*: `EEOS-O-MASTER-SYSTEM-SPECIFICATION-v1.1` Section 9 establishes a conceptual TypeScript interface `TaskDefinition`. Concurrently, `EEOS-O-PHASE-1.1-WORK-PACKAGE-CONTRACT` Section 10 defines a symbolic `TaskReference` object (`taskId`, `title`, `division`, `state`, `requires`, `requiredBy`).
- *Architectural Action*: Phase 1.2 reconciles and expands these baselines into the authoritative, machine-readable **Canonical Task Contract**, ensuring full mathematical compatibility with the WP Contract without schema conflict.

#### Audit B02 — Task Lifecycle Baseline
- *Finding*: Master Specification Section 10 ratifies a dual-layer state mapping aligning 10 high-level Indonesian visual BPMN process states (`DIBUAT`, `DITUGASKAN`, `DALAM PROSES`, `MENUNGGU VALIDASI`, `VALIDASI BERJALAN`, `REVISI DIPERLUKAN`, `TERVERIFIKASI`, `SELESAI`, `TERBLOKIR`, `DIESKALASI`) with internal deterministic engine states (`CREATED`, `ASSIGNED`, `IN_PROGRESS`, `VALIDATING`, etc.).
- *Architectural Action*: The Task Contract adopts this ratified state engine as its normative lifecycle foundation, distinguishing architectural state boundaries from physical worker implementations.

#### Audit B03 — Task Authority & Permissions
- *Finding*: Per `BPMN v2.1` and Master Spec Section 5:
  - **Who may create a task?** `ZenOrion` exclusively, through formal decomposition of a ratified Work Package.
  - **Who may authorize a task?** `Process_PO` and `Process_Mandor` indirectly via WP ratification.
  - **Can an agent create a task?** **NO**. Specialist agents possess zero task creation authority.
  - **Can an agent mutate task authority or scope?** **NO**. Scope modification requires ZenOrion decomposition adjustment or Mandor escalation.

#### Audit B04 — Memory Interaction Invariants (Subordination to Phase 1.1)
- *Finding*: Ratified Memory Architecture Invariant 1 (*Memory is not Sovereign Authority*), Invariant 2 (*Zero Direct Agent Writes*), and Invariant 4 (*Strict Scoped Retrieval*) mandate that a task cannot directly query or mutate durable memory.
- *Architectural Action*: Task Contract must enforce read-only injection of authorized context slices and treat task knowledge outputs strictly as unverified candidates.

---

## 4. Purpose & Core Philosophy

The primary question answered by this specification is:
> *"What is the authoritative, immutable contract governing an atomic engineering task as decomposed, scheduled, dispatched, executed, validated, and accounted for within EEOS-O?"*

### 4.1 The Fundamental Subordination Principle
```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ARCHITECTURAL INVARIANT:                                                         │
│ THE TASK CONTRACT IS STRICTLY SUBORDINATE TO THE RATIFIED MEMORY ARCHITECTURE.   │
│ A TASK DOES NOT OWN, REDEFINE, BYPASS, OR DIRECTLY MUTATE LONG-TERM MEMORY.     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

The Task Contract enforces a clean operational chain:
$$\text{Task} \xrightarrow{\text{consumes}} \text{Authorized Scoped Context} \xrightarrow{\text{executes}} \text{Governed Work} \xrightarrow{\text{emits}} \text{Task Output + Evidence} \xrightarrow{\text{evaluates}} \text{Validation Dossier} \xrightarrow{\text{ingests}} \text{Candidate Knowledge}$$

Under no circumstances does an executing agent or task instance possess write access to the persistent organizational knowledge store.

---

## 5. Scope Boundary

### In-Scope:
- Canonical logical schema and attribute specification of the Task Contract.
- Task identity, correlation, and cryptographic lineage models.
- Task authority, delegation hierarchy, and permission scoping.
- Formal Memory $\to$ Task Context Injection boundary.
- Ephemeral Working Context definitions and lifecycle isolation rules.
- Task output classification model (Result vs. Evidence vs. Candidate vs. Durable Memory).
- Task Lifecycle State Machine (BPMN v2.1 and Master Spec Section 10 alignment).
- Property mutability rules (Immutable vs. Controlled Mutable vs. Append-Only).
- Interface contracts to future phases (Agent Contract 1.3, DAG 1.4, Validation 1.5, Evidence 1.6).

### Out-of-Scope (Deferred to Later Sub-Phases):
- Agent registry schema, talent pools, and agent heartbeat mechanics (deferred to **Phase 1.3**).
- DAG traversal algorithms, cycle detection code, and scheduler heaps (deferred to **Phase 1.4**).
- Specialist reviewer checklists, automated lint rules, and review dossier schemas (deferred to **Phase 1.5**).
- Cryptographic Merkle tree hashing, blob storage drivers, and evidence ledgers (deferred to **Phase 1.6**).
- Physical database tables, SQL DDL migrations, and runtime daemon processes (deferred to **Implementation Phase**).

---

## 6. Strict Non-Goals & Implementation Deferrals

To preserve architectural governance and prevent premature implementation drift, the following areas are strictly declared **OUT-OF-SCOPE**:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STRICT NON-GOALS & IMPLEMENTATION DEFERRALS:                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. Zero Application Runtime Code (No TypeScript, Python, Node.js task engines).  │
│ 2. Zero Physical Database Schemas (No PostgreSQL, SQLite tables, or DDL).        │
│ 3. Zero SQL Migrations or ORM Definitions (No Drizzle, Prisma, or TypeORM).     │
│ 4. Zero Queue or Worker Locking (No Redis, BullMQ, Celery, or Kafka locks).     │
│ 5. Zero Vector Database Selection (No Chroma, Qdrant, Pinecone, pgvector).      │
│ 6. Zero Embedding / RAG Algorithm Locking (No chunking or cosine search code).  │
│ 7. Zero Antigravity API Bindings (Execution environment remains abstracted).     │
│ 8. Zero Modification to Phase 1.1 WP Contract or Ratified Memory Architecture.  │
│ 9. Zero Premature Initiation of Phase 1.3 (Agent Contract Design).              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Terminology & Formal Disambiguation

To prevent cognitive ambiguity and semantic drift across engineering agents, key terms are formally disambiguated:

| Term | Formal Architecture Definition in EEOS-O | Primary Owner |
| :--- | :--- | :--- |
| **Work Package (WP)** | The macroscopic, contractual unit of business and engineering initiative containing a decomposed DAG of tasks. | `Process_PO` / `Mandor` |
| **Task** | The atomic, scheduled unit of governed execution allocated to a single division agent under strict scope boundaries. | `ZenOrion` |
| **Task Contract** | The machine-readable specification of constraints, inputs, context, and outputs governing a single task instance. | `ZenOrion` |
| **Task Context** | The ephemeral, read-only payload injected into a task containing task requirements, memory slices, and evidence links. | `ZenOrion` |
| **Ephemeral Working Context** | In-session scratchpad, tool buffers, and interim thoughts generated during task execution, wiped upon exit. | Specialist Agent |
| **Task Result** | Primary deliverables (code diffs, documents, configurations) produced specifically for the current task. | Specialist Agent |
| **Evidence Artifact** | Verifiable, immutable proof of execution (test logs, build traces, exit codes, commit SHAs). | Specialist Agent / Tool |
| **Candidate Knowledge** | Proposed reusable insight emitted alongside task completion, quarantined awaiting specialist validation. | Specialist Agent |
| **Durable Memory** | Formally validated, version-controlled organizational knowledge committed to the persistent knowledge vault. | `ZenOrion` (Governed) |

---

## 8. Task Domain Model (Logical Entity)

The Task entity within EEOS-O represents a structured, deterministic aggregate comprising twenty-two (22) core conceptual dimensions:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EEOS-O TASK DOMAIN MODEL                              │
├────────────────────────────────┬────────────────────────────────────────────────┤
│ 1. Identity & Correlation      │ taskId, workPackageId, correlationId, taskSeq  │
│ 2. Intent & Business Scope     │ title, functionalObjective, problemContext     │
│ 3. Authority & Governance      │ originatingAuthority, governingMandorRef, tier │
│ 4. Assignment & Capability     │ targetDivision, requiredCapabilities, assignee │
│ 5. Boundary & Mutation Whitelist│ allowedPaths, readOnlyPaths, forbiddenPaths   │
│ 6. Dependency & Graph Topology │ requires (prerequisites), requiredBy (dependents)│
│ 7. Injected Context & Memory   │ injectedMemorySlice, contextTokenBudget, scope │
│ 8. Injected Evidence Baseline  │ prerequisiteEvidencePointers, baselineArtifacts│
│ 9. Execution Constraints       │ maxExecutionDuration, allowNetwork, allowDDL   │
│ 10. Acceptance Criteria        │ testCriteria, verificationMethod, isSatisfied  │
│ 11. Lifecycle State Machine    │ currentState, enteredAt, stateHistory, reworkCt│
│ 12. Workspace & Environment    │ targetEnvironment, gitBranch, gitWorktreePath  │
│ 13. Output Manifest: Result    │ deliverablesList, modifiedFilesSummary, diffRef│
│ 14. Output Manifest: Evidence  │ executionLogs, testOutputHash, exitCodeRef     │
│ 15. Output Manifest: Candidate │ proposedMemoryCandidates, observationNotes     │
│ 16. Review & Validation Ledger │ reviewRequirements, validationDossierRef, result│
│ 17. Tenancy & Data Scope       │ tenantScope, tenantId, dataClassification      │
│ 18. Security Clearance Tag     │ securityLevel, secretHandlingDirective         │
│ 19. Failure & Exception Ledger │ failureCategory, errorSummary, fatalFlag       │
│ 20. Escalation & Freeze Status │ isBranchFrozen, escalationReason, mandorAction │
│ 21. Audit Trail & Provenance   │ createdTimestamp, closedTimestamp, actorSignOff│
│ 22. Ephemeral Storage Bounds   │ workingScratchpadQuota, cleanupConfirmation    │
└────────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 9. Canonical Task Contract Specification

The machine-readable Task Contract is formally structured into ten (10) logical sections:

### 9.1 Section 1: Header & System Identity
- `contractVersion`: Semantic version of the Task Contract schema (e.g., `"1.0.0"`).
- `taskId`: Globally unique, deterministic task identifier conforming to pattern `^T-[A-Z0-9_-]+-[0-9]{2,}$` (e.g., `"T-WP08-CORE-01"`).
- `workPackageId`: Parent Work Package identifier conforming to pattern `^WP-[A-Z0-9_-]+-[0-9]{3}[A-Z]?$` (e.g., `"WP-AUTH-MULTI-TENANT-RLS-008"`).
- `correlationId`: UUIDv4 tracking the end-to-end orchestration transaction across distributed events.
- `createdAt`: ISO-8601 UTC timestamp of task instantiation.
- `createdBy`: System actor generating the contract (must be `"ZenOrion"`).

### 9.2 Section 2: Authority & Governance Anchors
- `governingAuthority`: Sovereign entity ratifying the parent WP (`"Process_Mandor"` or `"Process_PO"`).
- `architecturalDirectivesRef`: URI/path to active architectural directive or ADR (e.g., `"docs/architecture/ADR-008-RLS-POLICIES.md"`).
- `lockedInvariants`: Array of immutable invariant identifiers binding this task (e.g., `["INV-RLS-STRICT-TENANCY", "INV-BRANCH-ONLY-FREEZE"]`).
- `securityClassification`: Data classification tier (`"PUBLIC"` | `"INTERNAL_CONFIDENTIAL"` | `"RESTRICTED_SECURITY"` | `"SOVEREIGN_MANDOR_ONLY"`).

### 9.3 Section 3: Intent & Acceptance Criteria
- `title`: Concise, imperative task title (e.g., `"Implement PostgreSQL RLS Policies for Santri Table"`).
- `functionalObjective`: Explicit technical deliverable expected from the implementing agent.
- `acceptanceCriteria`: Array of deterministic acceptance rules:
  ```json
  [
    {
      "criteriaId": "AC-01",
      "description": "All SELECT queries against santri table must filter by current_setting('app.current_tenant_id')",
      "verificationMethod": "AUTOMATED_UNIT_TEST",
      "isMet": false
    }
  ]
  ```

### 9.4 Section 4: Target Allocation & Capability Constraints
- `targetDivision`: Functional division pool responsible for execution (`"ENGINEERING"` | `"QUALITY_ASSURANCE"` | `"SECURITY_GOVERNANCE"` | `"DATABASE_INFRASTRUCTURE"` | `"DOCUMENTATION"`).
- `requiredCapabilities`: Mandatory verified skill tags required of the assignee (e.g., `["postgresql-rls", "drizzle-orm", "multi-tenant-isolation"]`).
- `assignee`: Logical Agent Profile ID assigned by ZenOrion (e.g., `"agent://engineering/zencoder-01"`). Initialized as `null`.

### 9.5 Section 5: Mutation Whitelist & Scope Boundary
To enforce Master Spec Section 11.2 (Zero Mutable File Contention), strict filesystem boundaries are mandated:
- `allowedPaths`: Array of relative file/directory paths where the agent has exclusive write permission. Overlapping `allowedPaths` across parallel concurrent tasks are prohibited.
- `readOnlyPaths`: Array of paths the agent may inspect for contextual reference but cannot modify.
- `forbiddenPaths`: Explicitly prohibited paths (e.g., `["drizzle/migrations/*", ".env*"]`). Attempted writes cause immediate task termination and escalation.

**Classification Note:** The path whitelist boundary (`allowedPaths`) is an architectural scope invariant. Immediate task termination upon a path violation is a proposed runtime enforcement policy and is not itself an immutable architectural invariant.

### 9.6 Section 6: Injected Context & Memory Slice
- `injectedMemories`: Array of authorized, read-only memory objects assembled by ZenOrion:
  ```json
  [
    {
      "memoryId": "MEM-20261001-ARCH-0042",
      "category": "ARCHITECTURE",
      "title": "Next.js App Router Server Component RLS Enforcement",
      "summary": "Server actions must explicitly validate session before issuing DB calls.",
      "relevanceScore": 0.95
    }
  ]
  ```
- `contextTokenBudget`: Maximum allocated token limit for the context slice (Operational Policy).

### 9.7 Section 7: Dependency Topology & Evidence Anchors
- `dependencies`:
  - `requires`: Array of prerequisite Task IDs that must be in state `VERIFIED` before this task can become `READY`.
  - `requiredBy`: Array of downstream Task IDs awaiting the successful verification of this task.
- `prerequisiteEvidence`: Array of verified evidence hashes emitted by prerequisite tasks, providing immutable proof of upstream completion.

### 9.8 Section 8: Lifecycle & Rework Ledger
- `currentState`: Active FSM state (Enum defined in Section 10).
- `iterationCount`: Current rework iteration (integer, begins at `1`).
- `maxIterations`: Operational rework ceiling (default: `3`). Reaching limit triggers Mandor escalation.
- `stateHistory`: Append-only transition log:
  ```json
  [
    {
      "fromState": "CREATED",
      "toState": "ASSIGNED",
      "timestamp": "2026-10-01T21:15:00Z",
      "actor": "ZenOrion",
      "rationale": "Prerequisites verified; agent AGT-ENG-01 allocated."
    }
  ]
  ```

### 9.9 Section 9: Validation & Review Matrix
In compliance with Ratified Decision #3 (Autonomous Reviewer Dispatch), review requirements are declared preflight:
- `reviewRequirements`:
  - `peerReview`: Boolean (mandatory if diff > 50 lines).
  - `qaValidation`: Boolean (mandatory if code mutates business logic).
  - `securityReview`: Boolean (mandatory if touching auth, RLS, or secrets).
  - `databaseValidation`: Boolean (mandatory if touching DDL or schema).
- `validationReportRef`: Pointer to independent specialist review dossier (initialized as `null`).

### 9.10 Section 10: Output & Delivery Manifest
- `taskResult`:
  - `modifiedFiles`: Array of modified file paths and their post-execution SHA-256 hashes.
  - `patchArtifactRef`: URI/path to Git diff or pull request branch.
- `evidenceArtifacts`: Array of cryptographic URIs to execution logs, test outputs, and exit codes.
- `proposedMemoryCandidates`: Array of Candidate Memory objects proposed by the agent for downstream validation.

---

## 10. Task Lifecycle State Machine (FSM)

The Task Lifecycle rigorously implements the dual-layer mapping ratified in Master Specification v1.1 Section 10 and visual `BPMN — EEOS-O (v2.1)`.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             EEOS-O TASK LIFECYCLE FSM                            │
│                                                                                  │
│   [CREATED] ──► [WAITING] ──► [READY] ──► [ASSIGNED] ──► [IN_PROGRESS]          │
│                                                              │                   │
│                                                              ▼                   │
│                                                   [COMPLETION_SUBMITTED]         │
│                                                              │                   │
│                                                              ▼                   │
│                                                    [VALIDATION_PENDING]          │
│                                                              │                   │
│                                                              ▼                   │
│                                                        [VALIDATING]              │
│                                                              │                   │
│                              ┌───────────────────────────────┴─────────────┐     │
│                              ▼                                             ▼     │
│                     [REWORK_REQUIRED]                                 [VERIFIED] │
│              (iterationCount < maxIterations)                                │     │
│                              │                                             ▼     │
│                              ▼                                        [COMPLETED]│
│                     [IN_PROGRESS]                                                │
│                                                                                  │
│   ════════════════════════ EXCEPTION & GOVERNANCE BRANCHES ════════════════════  │
│   [BLOCKED]             : Execution halted due to environmental/data blocker.    │
│   [ESCALATED_TO_MANDOR] : Iteration count >= maxIterations OR invariant breach.  │
│   [FROZEN]              : Branch-only freeze applied by ZenOrion/Mandor.         │
│   [CANCELLED]           : Abandoned by sovereign PO/Mandor directive.           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 10.1 Deterministic State Transition Matrix

| Internal State | Visual BPMN State | Entry Condition Guard | Exit Condition | Responsible Authority | Permitted Next States |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`CREATED`** | `DIBUAT` | WP successfully decomposed into DAG. | Prerequisites analyzed. | `ZenOrion` | `WAITING`, `READY` |
| **`WAITING`** | *(Transitional)* | $\exists u \in \text{requires}(v)$ where $\text{State}(u) \neq \text{VERIFIED}$. | All prerequisites reach `VERIFIED`. | `ZenOrion Engine` | `READY`, `BLOCKED`, `CANCELLED` |
| **`READY`** | *(Transitional)* | $\forall u \in \text{requires}(v), \, \text{State}(u) = \text{VERIFIED}$. | Matching agent available and committed. | `ZenOrion Dispatcher`| `ASSIGNED`, `BLOCKED`, `FROZEN` |
| **`ASSIGNED`** | `DITUGASKAN` | Agent matches division, skills, and workload capacity. | Agent session initializes in runtime. | `ZenOrion Dispatcher`| `IN_PROGRESS`, `BLOCKED` |
| **`IN_PROGRESS`**| `DALAM PROSES` | Workspace initialized; context injected. | Work execution finished; diff generated. | `Specialist Agent` | `COMPLETION_SUBMITTED`, `BLOCKED` |
| **`COMPLETION_SUBMITTED`**| *(Transitional)* | Agent emits completion signal with result + evidence. | Submission validated for completeness. | `Specialist Agent` | `VALIDATION_PENDING`, `REWORK_REQUIRED` |
| **`VALIDATION_PENDING`**| `MENUNGGU VALIDASI`| Complete deliverables & evidence anchors present. | Autonomous reviewer agent dispatched. | `ZenOrion` | `VALIDATING`, `BLOCKED` |
| **`VALIDATING`**| `SEDANG DIVALIDASI`| Reviewer claims task review dossier. | Reviewer issues signed PASS/FAIL report. | `Specialist Reviewer`| `VERIFIED`, `REWORK_REQUIRED` |
| **`REWORK_REQUIRED`**| `REVISI DIPERLUKAN`| Reviewer emits `FAIL` verdict AND `iterationCount < maxIterations`. | Increments iteration; dispatches back. | `ZenOrion` | `IN_PROGRESS`, `ESCALATED_TO_MANDOR` |
| **`VERIFIED`** | `TERVERIFIKASI` | Reviewer emits `PASS` verdict with certified evidence. | Dependent DAG evaluation triggered. | `ZenOrion` | `COMPLETED` |
| **`COMPLETED`** | `SELESAI` | Terminal verified state; deliverables locked. | None (Archived in WP Evidence Dossier). | `ZenOrion` | Terminal State |
| **`BLOCKED`** | `TERBLOKIR` | Environmental failure, secret missing, or file lock. | Blocker resolved or escalated. | `ZenOrion` / Agent | `READY`, `IN_PROGRESS`, `ESCALATED_TO_MANDOR` |
| **`ESCALATED_TO_MANDOR`**| `DIESKALASI` | Rework count >= maxIterations OR invariant violation attempt. | Mandor issues binding architectural directive. | `Mandor` (Chief Arch)| `IN_PROGRESS`, `CANCELLED`, `FROZEN` |
| **`FROZEN`** | `DIBEKUKAN` | Branch-only freeze triggered per Ratified Decision #1. | Mandor releases branch freeze. | `Mandor` / `ZenOrion` | `READY`, `IN_PROGRESS`, `CANCELLED` |
| **`CANCELLED`**| *(Governance)* | Formal directive from PO or Mandor cancelling task. | None (Cold archive). | `Process_PO` / `Mandor` | Terminal State |

---

## 11. Task Authority & Delegation Model

### 11.1 Authority Invariants
1. **Zero Self-Creation**: Specialist agents cannot create tasks. All tasks originate from ZenOrion decomposing a ratified Work Package.
2. **Zero Scope Self-Expansion**: An executing agent cannot alter `scopeFiles.allowedPaths`. If an agent determines that additional files require mutation, it must fail the task with reason `SCOPE_EXPANSION_REQUIRED`, triggering ZenOrion DAG re-evaluation.
3. **Immutable Governance Anchor**: A task cannot modify its parent Work Package ID, correlation ID, or assigned security classification.
4. **Mandor Escalation Sovereignty**: Only the Chief Architect (`Process_Mandor`) can resolve deadlocks when a task reaches `ESCALATED_TO_MANDOR`. ZenOrion cannot unilaterally bypass failed specialist reviews.

---

## 12. Memory → Task Context Boundary

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ARCHITECTURAL INVARIANT:                                                         │
│ MEMORY INGESTION INTO A TASK IS STRICTLY READ-ONLY AND SCOPED.                   │
│ A TASK INSTANCE CANNOT QUERY THE RAW VAULT OR DIRECTLY MUTATE LONG-TERM MEMORY. │
└──────────────────────────────────────────────────────────────────────────────────┘
```

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. PERSISTENT STORAGE (Git Markdown Vault / e.g. Obsidian)             │
  │    Holds governed, verified, published Long-Term Memory                │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼ Managed & Scoped Retrieval
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 2. ZENORION CONTEXT ASSEMBLY ENGINE                                    │
  │    Filters by: Project, Division, Capability, Task Scope, Clearance    │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼ Injects Read-Only Slice
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 3. TASK INSTANCE (Execution Sandbox / Runtime Environment)             │
  │    Consumes authorized memory slice; zero access to external vault     │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼ Emits Candidates & Evidence
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 4. TASK OUTPUT MANIFEST                                                │
  │    Emits: [Class A: Result] [Class B: Evidence] [Class C: Candidate]   │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼ Validation Pipeline (Phase 1.5)
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 5. VERIFIED KNOWLEDGE INGESTION                                        │
  │    Only validated candidates are committed to Persistent Memory        │
  └────────────────────────────────────────────────────────────────────────┘
```

### 12.1 Context Injection Rules
1. **Filtered Context Slices**: Tasks receive only a minimal, relevant subset of active memories (`status: ACTIVE`). Outdated, deprecated, or superseded memories are purged preflight.
2. **Zero Cross-Tenant Memory Ingestion**: Memories tagged with `tenant_scope: SPECIFIC` are strictly filtered out unless `task.tenantId` matches the memory's tenant anchor.
3. **No Dynamic Vault Querying**: Agents cannot issue live SQL, graph, or semantic search queries directly to the persistent store during task execution. All contextual knowledge is provided up-front in the Task Contract payload.

---

## 13. Ephemeral Working Context

Specialist agents require working memory during execution (scratchpads, command execution buffers, AST parse trees, interim diffs). The architecture strictly isolates this ephemeral context.

### 13.1 Governance Properties of Ephemeral Working Context
1. **Instance Isolation**: Working context is private to a single task execution session. Agent B executing a parallel task cannot read Agent A's working context.
2. **Zero Durability**: Ephemeral context is strictly discarded upon task exit (whether `COMPLETED`, `FAILED`, or `BLOCKED`).
3. **Non-Promotability**: Scratchpad musings, unverified CLI traces, and interim thoughts **cannot be directly promoted to Durable Memory**. They can only influence the final task output and evidence artifacts.
4. **Tool Buffer Teardown**: Upon task completion, execution sandboxes must tear down local tmp directories, process tables, and scratch files to prevent state bleed into subsequent tasks.

---

## 14. Task Output Classification Framework

The Task Contract establishes a strict, four-tier classification model for all data produced during task execution:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ EEOS-O OUTPUT CLASSIFICATION TAXONOMY:                                           │
│ TASK RESULT ≠ EVIDENCE ≠ CANDIDATE KNOWLEDGE ≠ DURABLE MEMORY                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

| Class Tier | Classification Name | Definition | Authority Level | Lifecycle / Durability | Destination |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **Class A** | **Task Result** | Primary deliverables (code diff, markdown doc, schema definition) created to fulfill the task objective. | Operational Output | Durable within Git working branch; merged upon WP acceptance. | Git Repository / Worktree |
| **Class B** | **Evidence** | Verifiable empirical artifacts proving execution truth (test logs, build output, exit code 0, commit SHA). | Immutable Proof | Permanent, immutable record in Evidence Dossier. | Phase 1.6 Evidence Vault |
| **Class C** | **Candidate Knowledge** | Proposed reusable insight, lesson learned, or architectural observation emitted by agent. | Unverified Hypothesis | Transient; quarantined in `CANDIDATE` state until review. | Phase 1.5 Review Pipeline |
| **Class D** | **Durable Memory** | Validated, versioned organizational knowledge derived from verified candidates. | Institutional Knowledge | Persistent across WPs; human-auditable in Markdown store. | Phase 1.1 Persistent Store |

---

## 15. Evidence Boundary & Zero-Trust Verification

In accordance with Master Specification v1.1 Section 4 (Evidence vs. Claim Invariant):
> *"Verbal claims and honor-system completions are rejected. A task cannot progress to `VERIFIED` without machine-verifiable Evidence."*

### 15.1 Evidence Requirements per Task Type
- **Code Mutation Tasks**: Must produce a clean Git diff and an automated test execution log with exit code `0`.
- **Database / Schema Tasks**: Must produce a dry-run migration log and RLS security policy verification test results.
- **Architecture / Documentation Tasks**: Must produce a Markdown artifact adhering to standard governance templates with valid internal cross-references.
- **Verification / Audit Tasks**: Must produce an immutable forensic log referencing cryptographic commit SHAs and test assertion summaries.

---

## 16. Security, Tenancy & Secret Isolation

The Task Contract inherits all security invariants established in the Ratified Memory Architecture:

### 16.1 Invariant: Zero Secret Exposure
- Tasks must **never** receive plaintext secrets, API keys, or database service-role passwords in their context payload.
- Secrets must be injected exclusively at execution runtime via environment variable references or masked credential proxies.
- Task outputs and evidence artifacts are scanned; any artifact containing plaintext tokens (e.g. `re_***`, `sbp_***`) triggers immediate task failure and security escalation.

### 16.2 Invariant: Strict Tenancy Isolation
- In multi-tenant systems (`App Ma'had / Os_Darta`), tasks executing under `tenantScope: "TENANT_SPECIFIC"` are strictly confined to data belonging to their assigned `tenantId`.
- Cross-tenant data operations are prohibited unless authorized by a formal Mandor cross-tenant architectural directive.

---

## 17. Task Immutability & Property Evolution

To maintain audit integrity, properties within the Task Contract are governed by strict mutability rules:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PROPERTY MUTABILITY TIERS:                                                      │
├─────────────────────┬───────────────────────────────────────────────────────────┤
│ Immutable           │ taskId, workPackageId, correlationId, createdAt, createdBy│
│ (Write-Once)        │ governingAuthority, architecturalDirectivesRef            │
│                     │ allowedPaths, readOnlyPaths, forbiddenPaths               │
├─────────────────────┼───────────────────────────────────────────────────────────┤
│ Controlled Mutable  │ currentState, assignee, iterationCount, executionProgress │
│ (ZenOrion FSM Only) │ validationReportRef, isBranchFrozen                       │
├─────────────────────┼───────────────────────────────────────────────────────────┤
│ Append-Only         │ stateHistory, prerequisiteEvidence, evidenceArtifacts     │
│ (Audit Ledger)      │ proposedMemoryCandidates, failureEvents                   │
└─────────────────────┴───────────────────────────────────────────────────────────┘
```

---

## 18. Parent / Child Task & Delegation Boundary

### 18.1 Logical Task Relationships
While complex graph scheduling belongs to **Phase 1.4 (DAG Contract)**, the Task Contract defines atomic relational anchors:
- `parentTaskId`: Identifier of the parent task if this task was spawned via approved sub-decomposition.
- `subTaskIds`: Array of child tasks decomposed from this task.
- `retryTaskId`: Pointer to predecessor task if this task represents a rework attempt.

### 18.2 Boundary Rule: Zero Autonomous Delegation
An executing agent cannot unilaterally spawn child tasks or delegate work to other agents. Sub-decomposition is strictly an orchestration capability owned by ZenOrion.

---

## 19. Interface to Phase 1.3 — Agent Contract

The Task Contract defines the upstream interface consumed by the future **Agent Contract**:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TASK CONTRACT ──► AGENT CONTRACT INTERFACE BOUNDARY                             │
├────────────────────────────────┬────────────────────────────────────────────────┤
│ What Task Exposes to Agent     │ - Task Requirements & Functional Objectives    │
│                                │ - Scoped Allowed Mutation Paths (allowedPaths) │
│                                │ - Injected Scoped Memory Context Slice         │
│                                │ - Prerequisite Evidence Artifact Hashes        │
├────────────────────────────────┼────────────────────────────────────────────────┤
│ What Agent Returns to Task     │ - Primary Deliverables (Task Result diffs)     │
│                                │ - Objective Execution Evidence (Logs, Exit=0)  │
│                                │ - Proposed Memory Candidates (Class C)         │
├────────────────────────────────┼────────────────────────────────────────────────┤
│ Forbidden Agent Actions        │ - Cannot mutate Task Scope or Allowed Paths    │
│                                │ - Cannot self-promote Task State to VERIFIED   │
│                                │ - Cannot write directly to Long-Term Memory    │
└────────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 20. Interface to Phase 1.4 — DAG / Dependency Contract

The Task Contract provides atomic nodes for the directed acyclic graph managed in **Phase 1.4**:
- **Prerequisite Anchors**: `dependencies.requires` declares incoming edges $u \to v$.
- **Dependent Anchors**: `dependencies.requiredBy` declares outgoing edges $v \to w$.
- **Readiness Signal**: When a task achieves `VERIFIED`, ZenOrion notifies the DAG Engine to evaluate downstream readiness:
  $$\text{State}(w) = \text{READY} \iff \forall v \in \text{requires}(w), \, \text{State}(v) = \text{VERIFIED}$$
- **Acyclicity Assertion**: Task dependency sets must strictly prohibit circular references ($T_1 \to T_2 \to T_1$).

---

## 21. Interface to Phase 1.5 — Validation Contract

The Task Contract provides the verification targets consumed by **Phase 1.5**:
- **Target Deliverable**: `taskResult.patchArtifactRef` and `modifiedFiles`.
- **Predeclared Checklists**: `validationRequirements` specifies which independent specialist domains (Peer, QA, Security, DB) must review the task.
- **Reviewer Dispatch**: ZenOrion autonomously pairs the task with certified specialist agents (Ratified Decision #3).
- **Conflict of Interest Gate**: Invariant enforces that the reviewing agent cannot be the implementing agent ($\text{Reviewer} \neq \text{Implementer}$).

---

## 22. Interface to Phase 1.6 — Evidence Contract

The Task Contract connects execution truth to the immutable ledger of **Phase 1.6**:
- **Evidence Pointers**: `evidenceArtifacts` stores cryptographic SHA-256 hashes and storage URIs.
- **Evidence Dossier Compilation**: Upon task verification, ZenOrion appends the task's certified evidence artifacts into the parent Work Package's Evidence Dossier (`DO_Laporan`).

---

## 23. Architectural Traceability Matrix

| Req ID | Requirement / Rule Statement | Source Authority | Master Section | Task Contract Impact | Status |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **TR-01** | Task is atomic unit of WP decomposition | Master Spec v1.1 | Sec 8, 9 | Defines canonical Task Contract entity | **ALIGNED** |
| **TR-02** | Dual-layer BPMN to FSM state mapping | Master Spec v1.1 | Sec 10 | 15-state deterministic FSM (11 core/transitional + 4 exception/governance states) in Sec 10 | **ALIGNED** |
| **TR-03** | Zero mutable file contention (AllowedPaths) | Master Spec v1.1 | Sec 11.2 | Strict whitelist mutation scope in Sec 9.5 | **ALIGNED** |
| **TR-04** | Branch-only freeze on rework escalation | Ratified Decision #1 | Sec 4, 16 | Freeze applied strictly to task branch | **ALIGNED** |
| **TR-05** | Logical agent matching (runtime deferred) | Ratified Decision #2 | Sec 12 | Agent allocated by logical capability | **ALIGNED** |
| **TR-06** | Autonomous specialist reviewer dispatch | Ratified Decision #3 | Sec 10 | Review requirements predeclared in task | **ALIGNED** |
| **TR-07** | Memory subordination & read-only injection| Ratified Memory Arch | Sec 4, 8, 9 | Tasks cannot mutate long-term memory | **ALIGNED** |
| **TR-08** | Output classification (Result vs Evidence) | Ratified Memory Arch | Sec 3.2, 15 | 4-tier output taxonomy in Sec 14 | **ALIGNED** |
| **TR-09** | Strict tenant isolation & zero secret leak | Ratified Memory Arch | Sec 18 | Tenancy & secret invariants in Sec 16 | **ALIGNED** |
| **TR-10** | Conflict of Interest Gate (Reviewer != Dev)| Master Spec v1.1 | Sec 4, 10 | Reviewer must be independent specialist | **ALIGNED** |

---

## 24. Architectural Decision Records (ADRs)

### ADR-TC-001: Separation of Task Result, Evidence, and Memory Candidates
- **Status**: PROPOSED DESIGN
- **Context**: Executing agents often conflate functional code changes, test logs, and organizational lessons into a single unstructured output block.
- **Decision**: The Task Contract enforces strict structural separation into three distinct output manifests: `taskResult` (deliverables), `evidenceArtifacts` (proof), and `proposedMemoryCandidates` (quarantined hypotheses).
- **Consequences**: Eliminates knowledge poisoning, enables automated evidence auditing, and prevents unreviewed agent thoughts from corrupting durable memory.

### ADR-TC-002: Fail-Closed Scope Boundary via Strict Path Whitelisting
- **Status**: PROPOSED DESIGN
- **Context**: LLM-based execution agents can inadvertently edit unrelated files or mutate migration scripts outside task scope.
- **Decision**: Every task contract mandates explicit, non-overlapping `allowedPaths`. Modifications to files outside `allowedPaths` trigger immediate execution termination.
- **Consequences**: Guarantees zero file contention during parallel execution, supporting branch-level workspace isolation.

---

## 25. Open Architectural Questions

| Question ID | Architectural Question Statement | Why It Matters | Affected Sub-Phase | Proposed Options | Authority Needed |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **OAQ-TC-01**| Should dynamic sub-task decomposition during execution require Mandor sign-off or remain autonomous to ZenOrion? | Determines orchestration autonomy when a task unexpectedly requires decomposition. | Phase 1.4 (DAG) | Option A: Autonomous ZenOrion.<br>Option B: Mandatory Mandor approval. | `Process_Mandor` |
| **OAQ-TC-02**| Should task rework iterations reset to zero if the failure is environmental rather than code-related? | Prevents premature escalation when failures are caused by infrastructure or network timeouts. | Phase 1.5 (Validation)| Option A: Reset iteration count on environmental fault.<br>Option B: Strict cumulative counter. | `Process_Mandor` |

---

## 26. Deferred Implementation Decisions

The following decisions are intentionally deferred to future sub-phases:
1. **Physical Serialization Protocol**: Whether Task Contracts are transported via JSON-RPC, HTTP REST, gRPC, or IPC message queues (deferred to Phase 1.3/1.4).
2. **Database Engine for State Persistence**: Whether task FSM states are persisted in PostgreSQL, SQLite, or Redis (deferred to Physical Implementation).
3. **Execution Sandbox Technology**: Whether tasks execute in Docker containers, WebAssembly sandboxes, or local Git worktrees (deferred to Physical Implementation).
4. **Token Quota Algorithms**: Dynamic token budget scoring for memory context slices (deferred to Physical Implementation).

---

## 27. Phase 1.2 Exit Review & Phase 1.3 Entry Preconditions

### 27.1 Phase 1.2 Exit Review Verdict
```text
══════════════════════════════════════════════════════════════
EEOS-O PHASE 1.2 TASK CONTRACT ARCHITECTURE EXIT GATE
══════════════════════════════════════════════════════════════

Document:
EEOS-O-TASK-CONTRACT-ARCHITECTURE-AND-CONTRACT.md

Version:
v1.0.0-DRAFT

Design Governance Status:
DESIGN COMPLETE — PENDING FORMAL RATIFICATION

Blocking Findings:
0

Non-Blocking Findings:
0

Higher-Authority Conflicts:
0

Implementation Status:
STRICTLY NOT STARTED (ZERO CODE, ZERO DDL, ZERO RUNTIME)

Subordination to Memory Architecture:
PRESERVED (ZERO DIRECT MUTATION, SCOPED INGESTION ONLY)

Recommended Next Action:
SUBMIT FOR MANDOR & PRODUCT OWNER RATIFICATION REVIEW
══════════════════════════════════════════════════════════════
```

### 27.2 Preconditions for Entering Phase 1.3 (Agent Contract Design)
Entry into Phase 1.3 requires:
1. Formal ratification of this Phase 1.2 Task Contract specification by `Process_Mandor` and `Process_PO`.
2. Explicit authorization to initiate Phase 1.3.
3. Continued adherence to the zero-implementation governance directive.

---
*End of Specification — Submitted for Review to Chief Architect (Mandor) and Product Owner.*
