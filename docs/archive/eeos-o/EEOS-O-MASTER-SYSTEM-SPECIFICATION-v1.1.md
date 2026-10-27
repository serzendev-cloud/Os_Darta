# EEOS-O (Executive Engineering Orchestration — Orchestrator)
## Master System Specification v1.1 — Ratified Architectural Baseline

**Document Identifier**: `EEOS-O-MASTER-SYSTEM-SPECIFICATION-v1.1`  
**Classification**: Formally Ratified Architectural Baseline  
**Date**: October 01, 2026  
**Status**: **RATIFIED BY PRODUCT OWNER & MANDOR (READY FOR PHASE 1 IMPLEMENTATION)**  
**Supercedes**: `EEOS-O-MASTER-SYSTEM-SPECIFICATION-v1.0` (Design Baseline)  
**Author**: Lead Engineering & Documentation Agent (Operating under ZenOrion Governance)  
**Primary Visual Authority**: `BPMN — EEOS-O (v2.1) Proses Orkestrasi oleh ZenOrion`  
**Scope**: Governance & Architecture Specification Only (Zero Application Code, Zero DDL, Zero Infrastructure Mutation)  

---

## 1. Executive Summary

**Executive Engineering Orchestration — Orchestrator (EEOS-O)** is an enterprise-grade multi-agent coordination, execution, and lifecycle governance platform designed to manage complex software engineering initiatives across multi-tenant enterprise architectures (such as APP MA'HAD).

EEOS-O is anchored in the foundational doctrine: **"Distributed Execution, Centralized Orchestration."**

Under this ratified specification:
- **Centralized Orchestration**: **ZenOrion (Lead Agent / Orchestrator)** centrally manages workflow lifecycles, task decomposition, Directed Acyclic Graph (DAG) dependencies, parallel scheduling, capacity tracking, message routing, and release gates.
- **Distributed Execution**: Domain engineering work is distributed across specialized division pools spanning 8 functional disciplines.
- **Distributed Verification**: Technical reviews (Peer Review, QA Validation, Security Audits, Database Validations) are distributed strictly to peer specialist agents.
- **Strict Anti-Bottleneck Guarantee**: ZenOrion **never** acts as a universal code reviewer, QA tester, or database gatekeeper. Technical validation belongs exclusively to specialist agents.
- **Branch-Only Freeze**: When a task fails review or requires rework escalation, only the affected branch and its dependent descendants are frozen; independent parallel DAG branches continue execution unimpeded.
- **Logical Registry vs. Deferred Runtime**: The Agent Registry is an architectural invariant representing logical agent identities, capabilities, and governance states. The physical execution medium (containers, daemons, serverless workers) is intentionally deferred to implementation.
- **Autonomous Reviewer Dispatch**: ZenOrion autonomously assigns qualified specialist reviewers based on capability, availability, and strict conflict-of-interest filters, reserving Mandor escalation strictly for architectural and security governance boundaries.

---

## 2. Purpose & Scope

### 2.1 Purpose
This document establishes the ratified, normative engineering specification governing the EEOS-O orchestration platform. It integrates the three ratified Product Owner governance decisions into the baseline architecture, provides a formal tri-part classification of all rules (Architectural Invariants, Operational Policies, Deferred Implementation Details), and establishes the authoritative foundation for Phase 1 interface contract design.

### 2.2 Scope
- **Authoritative Governance**: Ratified process flows, authority matrices, task lifecycles, and dependency rules.
- **Strict Boundary**: This specification mandates system behavior without prescribing premature physical runtime technologies. Implementation code, database migrations, UI components, and API deployments remain strictly out-of-scope for this phase.

---

## 3. Authoritative BPMN Reference & Hierarchy of Authority

### 3.1 Primary Process Authority
The primary visual process reference is:
**`BPMN — EEOS-O (v2.1) Proses Orkestrasi oleh ZenOrion` (Model Version 2.1.0)**.
*(Note: An earlier experimental file `EEOS-O-BPMN-v2.2.bpmn` is formally declared SUPERSEDED and non-authoritative.)*

### 3.2 Hierarchy of Documentation Authority
1. **Primary Visual Authority**: BPMN v2.1 (governs process flow, lanes, gateways, event sub-processes, rework loops, and handoff boundaries).
2. **Primary System-Design Authority**: This Master System Specification v1.1 (governs domain concepts, state machines, task schemas, DAG algorithms, registry models, evidence requirements, and policy classifications).
3. **Reconciliation Authority**: `docs/eeos-o/EEOS-O-BPMN-BASELINE-RECONCILIATION-REPORT.md` (documents 100% baseline congruence).

---

## 4. Rule Classification Framework

Every rule, constraint, and threshold in EEOS-O is strictly classified into one of three governance categories to ensure operational flexibility without compromising architectural safety:

```text
+----------------------------------------------------------------------------------------------------+
| EEOS-O RULE CLASSIFICATION TAXONOMY                                                                |
+------------------------------+------------------------------+--------------------------------------+
| 1. ARCHITECTURAL INVARIANT   | 2. OPERATIONAL POLICY        | 3. DEFERRED IMPLEMENTATION DETAIL    |
+------------------------------+------------------------------+--------------------------------------+
| Immutable systemic laws.     | Configurable operational     | Physical technical choices           |
| Defines identity, authority, | thresholds, SLAs, and        | intentionally left open until        |
| safety boundaries, and DAG   | heuristics. May be adjusted  | Phase 1 implementation               |
| semantics. Requires Mandor/PO| without altering systemic    | engineering.                         |
| governance to amend.         | architecture.                |                                      |
+------------------------------+------------------------------+--------------------------------------+
```

### 4.1 Master Rule Classification Registry

| System Dimension | Rule / Requirement | Classification | Governance / Flexibility Note |
| :--- | :--- | :---: | :--- |
| **Orchestration Doctrine** | Distributed Execution, Centralized Orchestration | **Architectural Invariant** | Non-negotiable foundation of EEOS-O. |
| **ZenOrion Scope** | ZenOrion is an Orchestrator, NOT a Universal Reviewer | **Architectural Invariant** | Anti-bottleneck boundary; cannot be violated. |
| **Authority Separation** | PO (Business) $\to$ Mandor (Arch) $\to$ ZenOrion (Execution) | **Architectural Invariant** | Strict separation of executive powers. |
| **Escalation Freeze Scope**| Branch-Only Freeze (Independent branches continue) | **Architectural Invariant** | Ratified Decision #1. Preserves throughput. |
| **Agent Registry Concept** | Logical identity, capabilities, permissions, states | **Architectural Invariant** | Ratified Decision #2. Permanent system concept. |
| **Agent Runtime Model** | Physical runtime (containers, daemons, workers) | **Deferred Implementation** | Ratified Decision #2. Deferred to Phase 1/2. |
| **Reviewer Assignment** | Autonomous capability-based dispatch by ZenOrion | **Architectural Invariant** | Ratified Decision #3. Eliminates routine bottlenecks. |
| **Reviewer Selection Alg** | Heuristics for scoring workload, tie-breaking | **Operational Policy** | Configurable dispatch heuristic. |
| **Mandor Escalation Gate** | Escalation on architectural/security/invariant conflicts | **Architectural Invariant** | Mandor remains final technical authority. |
| **Communication Topo** | Hub-and-Spoke: No unregistered inter-agent comms | **Architectural Invariant** | Prevents shadow communication & state drift. |
| **Dependency Routing** | Automated pass-through of verified DAG outputs | **Architectural Invariant** | Prevents ZenOrion from becoming human chat proxy. |
| **DAG Dependency Gate** | Downstream unlocked ONLY when prerequisites VERIFIED | **Architectural Invariant** | Strict topological mathematical guarantee. |
| **Review Independence** | Reviewer $\neq$ Implementer (Conflict-of-Interest Gate) | **Architectural Invariant** | Separation of execution and verification. |
| **Evidence vs. Claim** | Claims untrusted; verifiable evidence required | **Architectural Invariant** | Zero-trust verification standard. |
| **Rework Max Cycles** | 3-cycle ceiling before mandatory Mandor escalation | **Operational Policy** | Configurable default (3 iterations); adjustable by WP. |
| **Reviewer Concurrency** | Max 2 concurrent read-only reviews per specialist | **Operational Policy** | Configurable capacity threshold. |
| **Implementer Concurrency**| Max 1 active mutable task per division agent | **Operational Policy** | Default $W=1$; configurable for high-capacity agents. |
| **Workload Metric Range** | 0 to 100 integer utilization factor | **Operational Policy** | Standardized metric convention. |
| **Allocation Timeout SLA** | 30-minute unassigned critical-path alert | **Operational Policy** | Configurable notification threshold. |
| **Review Line Threshold** | Mandatory Peer Review on diffs > 50 lines | **Operational Policy** | Configurable heuristic threshold per division. |
| **Workspace Isolation** | Branch / Worktree segregation for concurrent tasks | **Architectural Invariant** | Prevents mutable file collision. |
| **Git Tooling Mechanics** | Exact git commands, flags, worktree paths | **Deferred Implementation** | Implementation detail of execution agents. |
| **Database Technology** | Database engine for `DS_DBOrkestrasi` | **Deferred Implementation** | Deferred (PostgreSQL / SQLite / Supabase). |
| **Message Transport** | Protocol for inter-agent messaging (IPC, HTTP, MQ) | **Deferred Implementation** | Deferred to Phase 1 Interface Design. |

---

## 5. Authority Hierarchy & Escalation Boundaries

```text
                    ┌─────────────────────────┐
                    │      PRODUCT OWNER      │
                    │   (Business Authority)  │
                    └────────────┬────────────┘
                                 │ Business Directives / Scope Trade-offs
                                 ▼
                    ┌─────────────────────────┐
                    │  MANDOR / CHIEF ARCH    │
                    │ (Architectural Authority│
                    └────────────┬────────────┘
                                 │ Architectural Directives & Locked Invariants
                                 ▼
                    ┌─────────────────────────┐
                    │        ZENORION         │
                    │ (Execution Orchestrator)│
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │ Autonomous Capability Dispatch                │ Autonomous Validation Routing
         ▼                                               ▼
┌──────────────────┐                           ┌──────────────────┐
│  DIVISION AGENT  │                           │    SPECIALIST    │
│      POOLS       │                           │   REVIEW POOLS   │
│   (Execution)    │                           │   (Validation)   │
└──────────────────┘                           └──────────────────┘
```

### 5.1 Mandor Governance Invariants:
ZenOrion operates autonomously for routine scheduling and review routing, but **MUST** escalate to Mandor when any of the following occur:
1. **Architectural Invariant Contradiction**: Any proposed change conflicting with locked architectural decisions (e.g. multi-tenant RLS isolation, tenant resolution rules).
2. **Security Barrier Breach**: Any attempt to bypass the fail-closed edge proxy, expose internal Service Role keys, or alter secret handling.
3. **Persistent Rework Deadlock**: A task failing validation after reaching the operational rework limit (default: 3 cycles).
4. **Scope Expansion**: A task requiring modifications beyond its authorized whitelist boundary (`scopeFiles.allowedPaths`).
5. **Production Impact**: Any operation that could mutate Production environment state or live tenant data (e.g. `SR2601`).

---

## 6. Roles & Responsibilities

- **Product Owner (PO)**: Originates business intent, authorises Work Packages, resolves business scope trade-offs, and issues final release sign-off.
- **Mandor (Chief Architect)**: Defines architectural directives, enforces invariants, ratifies schemas, and serves as final technical arbitrator.
- **ZenOrion (Lead Agent Orchestrator)**: Decomposes approved WPs, maintains the dependency DAG, matches capabilities, schedules parallel tasks, routes messages, evaluates specialist review results, unblocks dependencies, compiles evidence dossiers, and routes escalations.
- **Division Agents (Execution Pool)**: Implement scoped requirements, generate verifiable evidence artifacts, notify completion, and perform targeted rework when required.
- **Specialist Agents (Validation Pool)**: Perform rigorous, independent domain reviews (Peer, QA, Security, DB) and issue authoritative PASS/FAIL verdicts with actionable remediation dossiers.

---

## 7. Non-Goals — Critical Architectural Safeguards

ZenOrion is strictly barred from violating separation of concerns:
1. **No Universal Technical Review**: ZenOrion **must not** perform code diff reviews, execute manual tests, or inspect DB query plans.
2. **No Arbitrary Specialist Override**: ZenOrion **cannot** overturn a specialist's `FAIL` verdict without formal Mandor escalation.
3. **No Honor-System Progression**: Verbal assertions are disregarded; progression without machine-verifiable evidence is rejected.
4. **No Direct Unregistered Chat**: Side-channel agent communications bypassing ZenOrion's audit log are strictly prohibited.
5. **No WP-Wide Freeze on Local Rework**: A single task rework **must not** pause unrelated parallel execution branches.

---

## 8. Work Package (WP) Model

The Work Package is the macroscopic unit of delivery. Each WP defines:
- **Metadata**: WP-ID, Title, Target Environment, Execution Window.
- **Business Intent**: Objectives and user acceptance criteria from PO.
- **Architectural Directives**: Constraints and invariants established by Mandor.
- **Decomposition**: Complete Task DAG $G = (V, E)$.
- **Status Ledger**: Active state, branch freeze flags, and completion evidence.

---

## 9. Task Model

```typescript
interface TaskDefinition {
  taskId: string;                 // Format: T-{WP_NUM}-{SEQ} (e.g. T-08-01)
  workPackageId: string;          // Parent WP ID
  title: string;                  // Concise action title
  description: string;            // Functional requirements
  targetDivision: DivisionId;     // Target division pool
  requiredCapabilities: string[]; // Mandatory skill tags
  scopeFiles: {
    allowedPaths: string[];       // Strict mutation whitelist
    readOnlyPaths: string[];      // Reference inspection whitelist
    forbiddenPaths: string[];     // Explicitly blocked paths
  };
  dependencies: {
    requires: string[];           // Prerequisite Task IDs (must be VERIFIED)
    requiredBy: string[];         // Downstream Task IDs (waiting for this task)
  };
  validationRequirements: {
    peerReview: boolean;          // Requires Peer Review
    qaValidation: boolean;        // Requires QA Automated Test Validation
    securityReview: boolean;      // Requires Security & RLS Review
    databaseValidation: boolean;  // Requires DB Schema / DDL Review
  };
  currentState: TaskState;        // Finite State Machine state
  assignee: string | null;        // Assigned Agent ID (e.g. ZenCoder-1)
  iterationCount: number;         // Rework counter (starts at 1)
  maxIterations: number;          // Operational ceiling (default: 3)
  evidenceArtifacts: string[];    // Links to cryptographic diffs/test logs
  validationReportId: string | null; // Pointer to specialist verdict
}
```

---

## 10. Task State Machine (FSM) & BPMN Alignment

The EEOS-O state architecture maintains strict alignment between **BPMN-Visible Process States** (Indonesian labels from the visual blueprint) and **Internal Deterministic FSM States**:

```text
+---------------------------------------------------------------------------------------------------------------+
| EEOS-O STATE ALIGNMENT TABLE                                                                                  |
+----+-----------------------+-----------------------------+----------------------------------------------------+
| No | BPMN-Visible State    | Internal FSM State          | Operational Definition / Role in Workflow          |
+----+-----------------------+-----------------------------+----------------------------------------------------+
| 1  | DIBUAT                | CREATED                     | Task instantiated during WP decomposition in DAG.  |
| *  | (Transitional)        | WAITING                     | Task waiting for upstream prerequisites to verify. |
| *  | (Transitional)        | READY                       | Prerequisites satisfied; queued for assignment.    |
| 2  | DITUGASKAN            | ASSIGNED                    | Task committed to a specific division agent.       |
| 3  | DALAM PROSES          | IN_PROGRESS                 | Agent actively implementing within scoped files.   |
| *  | (Transitional)        | COMPLETION_SUBMITTED        | Execution done; evidence submitted; awaiting queue.|
| 4  | MENUNGGU VALIDASI     | VALIDATION_PENDING          | Task in queue for specialist reviewer dispatch.    |
| 5  | VALIDASI BERJALAN     | VALIDATING                  | Specialist actively reviewing artifacts.          |
| 6  | REVISI DIPERLUKAN     | REWORK_REQUIRED             | Review failed; rework dossier routed to agent.     |
| 7  | TERVERIFIKASI         | VERIFIED                    | Specialist validation PASS; evidence certified.    |
| *  | (Transitional)        | DEPENDENCY_RELEASE          | ZenOrion traverses DAG to unlock downstream tasks. |
| 8  | SELESAI               | COMPLETED                   | Terminal state; task fully verified and released.  |
| 9  | TERBLOKIR             | BLOCKED                     | Execution halted due to environmental/data fault.  |
| 10 | DIESKALASI            | ESCALATED                   | Escalated to Mandor (branch frozen; WP continues). |
| *  | (Exception)           | FAILED                      | Irrecoverable technical fault.                     |
| *  | (Governance)          | CANCELLED                   | Abandoned by Mandor/PO directive.                  |
+----+-----------------------+-----------------------------+----------------------------------------------------+
```
*\* Note: Internal transitional states provide mathematical determinism for the orchestration engine and are fully harmonious elaborations of the high-level BPMN process.*

---

## 11. Dependency DAG & Parallel Execution

### 11.1 Mathematical Formulation
The Work Package DAG is modeled as $G = (V, E)$.
- **Readiness Invariant**:
  $$\text{State}(v) = \text{READY} \iff \forall u \in \text{requires}(v), \, \text{State}(u) = \text{VERIFIED}$$
- **Acyclicity Invariant**: Cycles are prohibited. ZenOrion executes Kahn's algorithm during WP decomposition. Any cycle causes immediate decomposition rejection.

### 11.2 Parallel Execution Invariants
1. **Zero Mutable File Contention**: Parallel tasks **must not** share overlapping paths in `scopeFiles.allowedPaths`.
2. **Branch-Level Workspace Isolation**: Each concurrent task executes in an isolated Git worktree or branch.
3. **Independent Validation Pipelines**: Concurrent tasks undergo independent specialist reviews without cross-blocking.

---

## 12. Agent Registry (Logical Identity vs. Deferred Runtime)

### 12.1 Ratified Architectural Concept: Logical Agent Registry
The Agent Registry is an **Architectural Invariant** modeling logical identities, authority, skill profiles, and governance states:

```typescript
interface AgentProfile {
  agentId: string;              // Unique identifier (e.g. AGT-ENG-001)
  agentName: string;            // Standardized name with 'Zen' prefix (e.g. ZenCoder)
  division: DivisionId;         // Assigned functional division
  role: AgentRole;              // PRIMARY_EXECUTOR | SPECIALIST_REVIEWER | HYBRID
  capabilities: string[];       // Verified skill tags (e.g. ['nextjs', 'drizzle', 'rls'])
  permissions: {
    canMutateCode: boolean;     // Allowed to write code diffs
    canExecuteDDL: boolean;     // Allowed to run DB migrations (restricted)
    canDeploy: boolean;         // Allowed to trigger preview deployment
    canPerformReview: boolean;  // Authorized to sign off specialist reports
  };
  currentState: AgentState;     // AVAILABLE | WORKING | BLOCKED | WAITING | OFFLINE
  activeTaskId: string | null;  // Current assigned task ID
  workloadMetric: number;       // Operational utilization factor (0 to 100)
}
```

### 12.2 Deferred Implementation Detail: Physical Agent Runtime
In accordance with **Ratified Decision #2**, the physical execution medium is **intentionally deferred**:
- Whether agents run as ephemeral containerized workers, long-lived daemons, serverless execution handlers, or hybrid worker pools is an implementation engineering decision to be specified in Phase 1/2.
- The logical architecture interacts solely through abstract messaging and state contracts.

---

## 13. Division Model & Redundancy

EEOS-O establishes **8 functional divisions** with a strict redundancy minimum of **2 agents per division** (16 baseline specialist agents + ZenOrion Lead Orchestrator):

```text
+----+----------------------------+---------------+--------------------+---------------------+
| No | Division Name              | Code          | Primary Domain     | Baseline Agents     |
+----+----------------------------+---------------+--------------------+---------------------+
| 1  | Architecture & Analysis    | DIV_ARCH      | ADR, Boundaries    | ZenArch, ZenStruct  |
| 2  | Engineering                | DIV_ENG       | Features, Logic    | ZenCoder, ZenCraft  |
| 3  | Data & Database            | DIV_DATA      | Schema, RLS, DDL   | ZenData, ZenSchema  |
| 4  | Identity & Security        | DIV_SEC       | Auth, RBAC, Tokens | ZenAuth, ZenGuard   |
| 5  | Quality Assurance          | DIV_QA        | Tests, Regression  | ZenTest, ZenVerify  |
| 6  | Infrastructure & Release   | DIV_INFRA     | CI/CD, Deployment  | ZenOps, ZenDeploy   |
| 7  | Documentation & Knowledge  | DIV_DOC       | Journey Map, Specs | ZenDoc, ZenScribe   |
| 8  | Research & Forensics       | DIV_FORENSICS | Root Cause, Logs   | ZenScout, ZenTrace  |
+----+----------------------------+---------------+--------------------+---------------------+
| *  | Orchestration Core         | ORCH_CORE     | Workflow Engine    | ZenOrion (Lead)     |
+----+----------------------------+---------------+--------------------+---------------------+
```

---

## 14. Autonomous Reviewer Dispatch & Assignment Rules

### 14.1 Ratified Decision #3: Autonomous Reviewer Dispatch
ZenOrion **autonomously dispatches Tier-1 and peer specialist reviewers** without requiring prior Mandor approval:
- Reviewers are matched based on required validation dimensions (Peer, QA, Security, DB), capability subsumption, availability, and strict conflict-of-interest enforcement.
- Mandor is notified via observability events but is **not** a gatekeeper for routine reviewer assignments.

### 14.2 Assignment Invariants & Policies
1. **Rule of Review Independence (Architectural Invariant)**:
   $$\text{Reviewer}(T) \neq \text{Implementer}(T)$$
   An agent who executed a task is mathematically barred from reviewing it.
2. **Single Active Execution Invariant (Operational Policy)**:
   Default concurrency $W = 1$ mutable task per division agent; max 2 read-only reviews per specialist. Configurable by division lead.
3. **Dispatch Heuristic (Operational Policy)**:
   When multiple qualified reviewers are available, ZenOrion selects the candidate with the lowest active `workloadMetric`.

---

## 15. Communication Architecture

### 15.1 Architectural Invariants
1. **No Unregistered Inter-Agent Communication**: Direct unlogged agent-to-agent communication is strictly forbidden.
2. **Three Structured Message Classes**:
   - **Class 1: Automatic DAG Handoffs**: When an upstream task is `VERIFIED`, ZenOrion automatically routes its verified deliverables to dependent downstream task contexts.
   - **Class 2: Routed Communication Requests**: Formal requests for clarification or cross-discipline data routed through ZenOrion's message broker.
   - **Class 3: Governance Escalations**: High-priority alert packages routed to Mandor or Product Owner.

---

## 16. Validation & Rework Architecture (Branch-Only Freeze)

### 16.1 Ratified Decision #1: Branch-Only Freeze
When a task fails specialist validation or enters rework escalation:
- **Affected Branch Frozen**: The failing task ($T_{\text{fail}}$) and all downstream tasks reachable from it in the DAG ($\text{Descendants}(T_{\text{fail}})$) are frozen in `REWORK_REQUIRED`, `WAITING`, or `BLOCKED`.
- **Independent Branches Continue**: Any task $T_{\text{indep}}$ such that:
  $$T_{\text{indep}} \notin \text{Descendants}(T_{\text{fail}}) \quad \land \quad \text{AllowedPaths}(T_{\text{indep}}) \cap \text{AllowedPaths}(T_{\text{fail}}) = \emptyset$$
  **continues active parallel execution unimpeded**.
- **WP-Wide Freeze Exception**: ZenOrion pauses the entire Work Package **only** if Mandor explicitly issues a global freeze directive due to a cross-cutting architectural boundary breach or security incident.

### 16.2 Rework Lifecycle
```text
ASSIGNED ──► IN_PROGRESS ──► COMPLETION_SUBMITTED ──► VALIDATION_PENDING ──► VALIDATING
                                                                                 │
                                                    ┌────────────────────────────┴─────────────┐
                                                    ▼ PASS                                     ▼ FAIL
                                                 VERIFIED                               REWORK_REQUIRED
                                                    │                                          │
                                                    ▼                                          ▼ (Iteration < 3)
                                            DEPENDENCY_RELEASE                            IN_PROGRESS
                                                    │                                          │ (Iteration >= 3)
                                                    ▼                                          ▼
                                                COMPLETED                                  ESCALATED
                                                                                      (Branch-Only Freeze)
                                                                                               │
                                                                                               ▼
                                                                                       Mandor Arbitration
```

---

## 17. Asynchronous Event Sub-Processes

ZenOrion continuously monitors 5 parallel event sub-processes (`SubProcess_EventHandling`):
1. **`ESP_Comm` (Communication Request)**: Routes and logs structured inter-agent inquiries.
2. **`ESP_Dep` (Dependency Completion)**: Evaluates DAG on upstream task verification and unblocks downstream tasks.
3. **`ESP_Block` (Agent Blocked)**: Traps environmental faults and resource bottlenecks.
4. **`ESP_Fail` (Execution Failure)**: Captures fatal script/build crashes and initiates triage.
5. **`ESP_Esc` (Escalation)**: Packages escalation dossiers to Mandor/PO and applies branch-only freezes.

---

## 18. Evidence as Source of Truth

- **Zero-Trust Standard**: Self-declarative statements ("Tests pass", "Feature complete") have zero evidentiary validity.
- **Evidentiary Threshold**: Task transitions to `VERIFIED` strictly require:
  - Cryptographic Git commit SHA or artifact hash.
  - Formally captured execution stdout/stderr logs with exit code `0`.
  - Machine-signed specialist validation reports (`DO_Validasi`) containing explicit line-item passes.

---

## 19. Auditability, Security & Observability

- **Append-Only Audit Ledger**: Every assignment, transition, validation verdict, and routing event is persisted with ISO-8601 timestamps, actor IDs, correlation IDs, and evidence hashes.
- **Security Sandboxing**: Division agents operate without production credentials, direct database connection strings, or cloud management API keys.
- **Observability Views**: Real-time DAG Topology rendering, Agent Capacity metrics, Evidence Explorer, and Audit Trail timeline.

---

## 20. Phased Implementation Roadmap

- **Phase 0 (Completed)**: Authoritative BPMN Reconciliation & Master Specification Ratification.
- **Phase 1 (Next Gate)**: Architecture & Interface Contract Design (JSON Schemas, protocol definitions, FSM state transition tables).
- **Phase 2**: Core Orchestrator Engine (ZenOrion DAG engine, capacity tracker, event broker).
- **Phase 3**: Agent Pool Integration & Specialist Verification Harness.
- **Phase 4**: End-to-End Simulation & Live Preview Validation.

---

*This Master System Specification v1.1 represents the ratified, authoritative architectural baseline for EEOS-O. All engineering implementations must strictly adhere to its invariants and governance boundaries.*
