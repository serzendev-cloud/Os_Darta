# EEOS-O — Phase 1.4 Sub-Work Package Execution Directive
## Sub-Work Package WP-P14-02-03: Concurrency Limiter & Admission Control Architecture

---

## 1. Directive Metadata

* **Document Identifier**: `EEOS-O-PHASE-1.4-WP-P14-02-03-EXECUTION-DIRECTIVE`
* **Directive Identifier**: `EXEC-DIR-EEOS-O-WP-P14-02-03-001`
* **Directive Version**: `1.0.0`
* **Classification**: Formal Sub-Work Package Operational Execution Directive
* **Directive Governance Status**: **`PROPOSED EXECUTION DIRECTIVE — AWAITING INDEPENDENT DIRECTIVE AUDIT`**
* **Issuing Agent Role**: EEOS-O Hierarchical Architectural Orchestrator (ZenOrion Tier 3 Governance Architecture)
* **Governing Sovereign Authorities**:
  - `Process_PO`: Sovereign Business & Mission Authority
  - `Process_Mandor`: Sovereign Technical & Architecture Delivery Authority
* **Parent Phase**: Phase 1.4 — DAG Scheduler & Execution Engine Architectural Design
* **Parent Master Work Package**: `MWP-EEOS-O-PHASE-1.4` ([`docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md))
* **Governing Work Package Master WP**: `MWP-EEOS-O-WP-P14-02` ([`docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md))
* **Target Sub-Work Package**: `WP-P14-02-03 — Concurrency Limiter & Admission Control Architecture`
* **Target Specification Path**: `docs/eeos-o/specs/phase-1.4/WP-P14-02-03-CONCURRENCY-LIMITER-ARCHITECTURE.md`
* **Date**: October 06, 2026
* **Timezone**: UTC+07:00 (WIB)

---

## 2. Governance Baseline & Authoritative Context

Prior to formulating this execution directive, the authoritative governance baseline across all prerequisite instruments was verified:

1. **Phase 1.1 Baseline**: **`RATIFIED / UNTOUCHED`** (`DO_WP` contract, task decomposition).
2. **Phase 1.2 Baseline**: **`RATIFIED / UNTOUCHED`** (Task Contract schema, 15-state Task FSM).
3. **Phase 1.3 Baseline**: **`DUAL-SOVEREIGN RATIFIED / UNTOUCHED`** (Agent Container Contract, `maxParallelAgents` baseline in §27).
4. **Phase 1.4 Baseline**: **`AUTHORIZED / ACTIVE ARCHITECTURAL DESIGN`** (Governed by `MWP-EEOS-O-PHASE-1.4`, **NOT RATIFIED**).
5. **WP-P14-01 Status**: **`GATE G1 DUAL-SOVEREIGN CLEARED / IMMUTABLE`**
   - Consolidated Statement: `EEOS-O-GOV-STAT-P14-G1-001` ([`docs/eeos-o/governance/DUAL-SOVEREIGN-G1-CLEARANCE-STATEMENT-WP-P14-01.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/governance/DUAL-SOVEREIGN-G1-CLEARANCE-STATEMENT-WP-P14-01.md)).
   - Invariants I-01 through I-08 are immutable upstream baselines.
6. **WP-P14-02 Master Work Package Status**: **`DUAL-SOVEREIGN CONCURRENCE ACHIEVED`**
   - Consolidated Statement: `EEOS-O-GOV-STAT-P14-P14-02-001` ([`docs/eeos-o/governance/DUAL-SOVEREIGN-CLEARANCE-STATEMENT-WP-P14-02.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/governance/DUAL-SOVEREIGN-CLEARANCE-STATEMENT-WP-P14-02.md)).
7. **WP-P14-02-01 Predecessor Status**: **`DUAL-SOVEREIGN ARCHITECTURAL SPECIFICATION CONCURRENCE ACHIEVED`**
   - Consolidated Statement: `EEOS-O-GOV-SPEC-CLEAR-P14-02-01-001` ([`docs/eeos-o/governance/EEOS-O-PHASE-1.4-WP-P14-02-01-DUAL-SOVEREIGN-ARCHITECTURAL-SPECIFICATION-CLEARANCE-STATEMENT.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/governance/EEOS-O-PHASE-1.4-WP-P14-02-01-DUAL-SOVEREIGN-ARCHITECTURAL-SPECIFICATION-CLEARANCE-STATEMENT.md)).
8. **WP-P14-02-02 Predecessor Status**: **`DUAL-SOVEREIGN ARCHITECTURAL SPECIFICATION CONCURRENCE ACHIEVED`**
   - Consolidated Statement: `EEOS-O-GOV-SPEC-CLEAR-P14-02-02-001` ([`docs/eeos-o/governance/EEOS-O-PHASE-1.4-WP-P14-02-02-DUAL-SOVEREIGN-ARCHITECTURAL-SPECIFICATION-CLEARANCE-STATEMENT.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/governance/EEOS-O-PHASE-1.4-WP-P14-02-02-DUAL-SOVEREIGN-ARCHITECTURAL-SPECIFICATION-CLEARANCE-STATEMENT.md)).
9. **Downstream Boundaries & Locks**:
   - `WP-P14-02-04` (Barrier State Machine & Lifecycle): **`LOCKED / WAITING ON 03`**.
   - `WP-P14-02-05` (Failure Propagation & Deadlock Prevention): **`LOCKED`**.
   - `WP-P14-02-06` (DAG Topology Interface Boundary): **`PARALLEL / SEPARATE DIRECTIVE LIFECYCLE`**.
   - `WP-P14-02-07` (Cross-Module Reconciliation): **`LOCKED`**.
   - `WP-P14-02-08` (Master Specification Compilation): **`LOCKED`**.
   - `WP-P14-03` (Dynamic Ripple Invalidation): **`LOCKED / QUARANTINED`**.
   - `WP-P14-04` (Structural Merge-Gating): **`LOCKED / QUARANTINED`**.
   - Phase 1.5 (Validation Pipeline): **`DEFERRED / LOCKED`**.
   - Phase 1.6 (Cryptographic Ledger): **`DEFERRED / LOCKED`**.
10. **Physical Implementation**: **`STRICTLY LOCKED`** (Zero code, zero SQL DDL migrations, zero runtime workers, 0 bytes budget).

```text
══════════════════════════════════════════════════════════════════════════════════
                     CRITICAL GOVERNANCE BOUNDARY DIRECTIVE
══════════════════════════════════════════════════════════════════════════════════

  THIS DIRECTIVE DOES NOT AUTHORIZE SUB-WP EXECUTION.

  This document defines the proposed, bounded execution directive for WP-P14-02-03.
  Sub-WP design authoring may commence ONLY after:
    1. Independent Execution-Directive Audit yields PASS;
    2. Process_PO issues sovereign execution authorization;
    3. Process_Mandor issues sovereign execution authorization;
    4. Dual-Sovereign Sub-WP Execution Authorization Statement is consolidated.

  WP-P14-02-03 REMAINS UNACTIVATED PENDING SOVEREIGN AUTHORIZATION.

══════════════════════════════════════════════════════════════════════════════════
```

---

## 3. Sub-Work Package Identity & Purpose

* **Sub-Work Package ID**: `WP-P14-02-03`
* **Module Title**: Concurrency Limiter & Admission Control Architecture
* **Scope Classification**: Bounded Architectural Specification (`SPEC-P14-02-03`)
* **Core Purpose**:
  > **To formally architect the mathematical multi-agent resource throttling, concurrency slot allocation, reservation, claim, and release protocol, deterministic admission queueing algorithms, capacity exhaustion backpressure policies, and the strict decoupling between topological structural eligibility and runtime concurrency admission under ZenOrion Tier 3 Governance.**

The directive strictly enforces the foundational architectural separation:
$$\text{Static DAG Topology} \neq \text{Dynamic Barrier State} \neq \text{Concurrency Admission} \neq \text{Runtime Worker Dispatch} \neq \text{Cryptographic Ledger}$$

---

## 4. Summary of Proposed Scope (Questions Q1–Q12)

The future architectural design authoring agent executing `WP-P14-02-03` must strictly resolve the following twelve (12) architectural design questions:

### 4.1 Q1 — Concurrency Limiter Formal Semantics
* Formulate the precise mathematical definition of a Concurrency Limiter Instance ($\mathcal{C}_{\text{limiter}}$).
* Formulate mathematical bounds for tenant-isolated capacity ($C_{\text{tenant}}$) and global orchestrator capacity ($C_{\text{global}}$).
* Explicitly distinguish between:
  1. Structural DAG eligibility ($\text{SetStructuralEligibility}(w, \text{ELIGIBLE})$);
  2. Concurrency admission request ($\text{RequestAdmission}(w)$);
  3. Slot allocation and reservation ($\text{ReserveSlot}(w)$);
  4. Slot claim during dispatch ($\text{ClaimSlot}(w)$);
  5. Slot release on completion or forfeiture ($\text{ReleaseSlot}(w)$).

### 4.2 Q2 — Decoupling Structural Eligibility from Concurrency Admission
* Establish the formal boundary proving that structural eligibility under `WP-P14-01` §9 and barrier releases under `WP-P14-02-01` / `02` **NEVER** guarantee immediate execution dispatch.
* Formalize the invariant:
  $$\text{StructuralEligibility}(w) == \text{ELIGIBLE} \centernot\implies \text{ConcurrencyAdmission}(w) == \text{ADMITTED}$$
* Define the admission state as a distinct pre-dispatch gating layer that evaluates available execution capacity without altering DAG node state or barrier release state.

### 4.3 Q3 — Concurrency Slot Lifecycle Model
* Formulate the canonical lifecycle of an individual concurrency slot:
  $$\mathcal{S}_{\text{slot}} = \{\text{AVAILABLE}, \text{RESERVED}, \text{CLAIMED}, \text{RELEASED}, \text{FORFEITED}\}$$
* Define mathematical invariants ensuring slot conservation:
  $$\sum \text{slots}_{\text{active}} \le C_{\text{tenant}} \le C_{\text{global}}$$
* Specify atomic reservation and release hand-off signal semantics (declarative, without OS mutexes or runtime thread primitives).

### 4.4 Q4 — Deterministic Admission Queueing & Ordering Algorithm
* Define the deterministic multi-agent admission priority function $\mathcal{O}_{\text{admission}}(w)$:
  $$\mathcal{O}_{\text{admission}}(w) = \langle \text{TopologicalLayer}(w), \text{PriorityWeight}(w), \text{lexicographical}(v.\text{nodeId}) \rangle$$
* Enforce strict deterministic tie-breaking using `WP-P14-01` Kahn layer ordering and node ID sorting to eliminate race conditions in slot acquisition.
* Prohibit FIFO non-deterministic arrival-order queues.

### 4.5 Q5 — Multi-Tenant Concurrency Quota Isolation
* Architect multi-tenant resource partitioning ensuring that Tenant $T_A$ cannot starve or exhaust concurrency capacity allocated to Tenant $T_B$.
* Define tenant quota constraints:
  $$\forall T_k \in \mathcal{T}, \quad \text{ActiveSlots}(T_k) \le \text{QuotaLimit}(T_k) \quad \text{and} \quad \sum_{T_k} \text{QuotaLimit}(T_k) \le C_{\text{global}}$$
* Formulate fair-sharing and anti-starvation mechanisms across tenants without introducing runtime thread schedulers.

### 4.6 Q6 — Capacity Exhaustion & Non-Blocking Backpressure
* Formulate the declarative policy governing behavior when $\text{ActiveSlots}(T_k) == \text{QuotaLimit}(T_k)$ or $\sum \text{ActiveSlots} == C_{\text{global}}$.
* Define non-blocking backpressure: tasks remain structurally eligible and queued in the deterministic admission queue $\mathcal{Q}_{\text{admit}}$ without polling, sleeping, or blocking operating system threads.
* Define declarative saturation event emissions (`EVENT_CONCURRENCY_SATURATED`) for macro-orchestrator visibility.

### 4.7 Q7 — Slot Reclaiming, Timeout Policies & Failure Containment
* Define slot release invariants upon task completion, task rejection (Phase 1.2), task failure, or container abort (Phase 1.3).
* Formulate declarative slot reservation timeout parameters ($\tau_{\text{claim\_timeout}}$) preventing leaked reservations when an agent container fails to launch.
* Enforce failure containment: a task failing or aborting within its execution slot must immediately trigger slot release without destabilizing adjacent claimed slots.

### 4.8 Q8 — Interface with Phase 1.3 Container Contract (§27)
* Formulate the read-only contract mapping `WP-P14-02-03` concurrency slot grants to Phase 1.3 container execution instances.
* Ensure alignment with Phase 1.3 §27 `maxParallelAgents` parameters and container lifecycle states.
* Strictly preserve Phase 1.3 ratified contracts: zero redefinition of agent containers, turn boundaries, or supervisor protocols.

### 4.9 Q9 — Interface with WP-P14-01 Topological Model
* Consume Kahn topological layers ($\mathcal{L}(v)$) and node metadata strictly as read-only inputs from `WP-P14-01`.
* Enforce that concurrency admission preserves Invariants I-01 through I-08.
* Reassert zero mutation of `WP-P14-01` graph schemas or topological structures ($\Delta(G_{\text{P14-01}}) \equiv \emptyset$).

### 4.10 Q10 — Canonical Barrier Interaction Boundary
* Explicitly bound how `WP-P14-02-03` interacts with Fork Barriers (`WP-P14-02-01`) and Join Barriers (`WP-P14-02-02`):
  - Spawning multiple fork branches emits multiple admission requests;
  - Each branch competes independently in the deterministic admission queue;
  - Join barriers monitor predecessor task completions regardless of whether branches were admitted concurrently or sequentially.
* Prohibit embedding concurrency limits into barrier state machine states.

### 4.11 Q11 — Strict OAQ Quarantines
* Preserving quarantine across all unresolved Open Architectural Questions:
  - `OAQ-SYNC-01` (Dependency Hash Binding Location): **`UNRESOLVED / QUARANTINED`**.
  - `OAQ-SYNC-02` (Dynamic Invalidation Scope & Cascade Depth): **`UNRESOLVED / QUARANTINED`**.
  - `OAQ-SYNC-03` (Cross-Validation Matrix Scope): **`UNRESOLVED / QUARANTINED`**.
* The specification must not attempt to resolve or formulate cryptographic hashes or global invalidation cascades.

### 4.12 Q12 — Implementation Prohibition
* Strictly enforce the implementation lock:
  - **Zero Lines of Code**: No TypeScript, JavaScript, Python, Go, or Rust.
  - **Zero Database Migrations**: No PostgreSQL DDL, tables, or stored procedures.
  - **Zero Queue Infrastructure**: No Redis, RabbitMQ, Kafka, BullMQ, or Celery.
  - **Zero OS Thread Primitives**: No semaphores, mutexes, thread pools, or process signals.
* Deliverable must remain a pure, formal architectural specification document.

---

## 5. Authoritative Inputs & Predecessors

The executing agent must strictly ingest and adhere to the following authoritative baseline inputs:

| Input Artifact | Path / Identifier | Governance Status | Mandatory Constraints |
| :--- | :--- | :--- | :--- |
| **`WP-P14-01` Primary Spec** | [`docs/eeos-o/specs/phase-1.4/WP-P14-01-DAG-DATA-STRUCTURE-SPECIFICATION.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/specs/phase-1.4/WP-P14-01-DAG-DATA-STRUCTURE-SPECIFICATION.md) | `G1 CLEARED / IMMUTABLE` | Zero mutation of topological layers, Kahn sort, or Invariants I-01..I-08. |
| **`Phase 1.3` Container Spec** | [`docs/eeos-o/EEOS-O-AGENT-CONTRACT-ARCHITECTURE-AND-INTERFACE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-AGENT-CONTRACT-ARCHITECTURE-AND-INTERFACE.md) | `RATIFIED` | §27 `maxParallelAgents` baseline; container execution boundaries. |
| **`Phase 1.2` Task Contract** | [`docs/eeos-o/EEOS-O-TASK-CONTRACT-ARCHITECTURE-AND-CONTRACT.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-TASK-CONTRACT-ARCHITECTURE-AND-CONTRACT.md) | `RATIFIED` | 15-state Task FSM; task completion/rejection states. |
| **`WP-P14-02-01` Fork Spec** | [`docs/eeos-o/specs/phase-1.4/WP-P14-02-01-FORK-BARRIER-ARCHITECTURE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/specs/phase-1.4/WP-P14-02-01-FORK-BARRIER-ARCHITECTURE.md) | `DUAL-CLEARED / IMMUTABLE` | Fork branch spawning contracts; `RELEASED` terminality. |
| **`WP-P14-02-02` Join Spec** | [`docs/eeos-o/specs/phase-1.4/WP-P14-02-02-JOIN-BARRIER-ARCHITECTURE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/specs/phase-1.4/WP-P14-02-02-JOIN-BARRIER-ARCHITECTURE.md) | `DUAL-CLEARED / IMMUTABLE` | Multi-branch convergence contracts; release hand-off. |
| **`MWP-EEOS-O-WP-P14-02`** | [`docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md) | `DUAL-CLEARED` | Master WP §7.3, §8, §9, and §10. |

---

## 6. Prohibited Scope & Exclusions

The executing agent is strictly forbidden from engaging in or defining:
1. **Physical Runtime Queues**: No Redis queues, RabbitMQ topics, BullMQ jobs, or Kafka partitions.
2. **OS Process Throttling**: No CPU cgroups, OS thread affinity, or system memory cgroups.
3. **Runtime Thread Workers**: No async worker pool implementations, Tokio tasks, or Go routines.
4. **Active Timers / Polling**: No background sleep loops, setInterval, or watchdog daemon threads.
5. **Dynamic Ripple Invalidation**: Deferred exclusively to `WP-P14-03` / `OAQ-SYNC-02`.
6. **Structural Merge-Gating**: Deferred exclusively to `WP-P14-04`.
7. **DAG Graph Mutations**: Zero changes to upstream topological models or graph JSON schemas.

---

## 7. Deliverable Requirements

* **Primary Deliverable Artifact**:
  `docs/eeos-o/specs/phase-1.4/WP-P14-02-03-CONCURRENCY-LIMITER-ARCHITECTURE.md`
* **Deliverable Version**: `1.0.0-DRAFT`
* **Artifact Structure**:
  1. Document Identity & Metadata
  2. Governance Status & Lifecycle Boundaries
  3. Formal Mathematical Model of Concurrency Limits ($C_{\text{tenant}}, C_{\text{global}}$)
  4. Decoupling Structural Eligibility from Concurrency Admission
  5. Canonical Slot Lifecycle & Conservation Invariants
  6. Deterministic Admission Queueing & Priority Evaluation Algorithm
  7. Multi-Tenant Quota Partitioning & Anti-Starvation Guarantees
  8. Capacity Exhaustion & Non-Blocking Backpressure Semantics
  9. Slot Reclaim, Timeout, and Failure Containment Protocols
  10. Upstream Interfaces (`WP-P14-01`, Phase 1.3 §27, `WP-P14-02-01`, `WP-P14-02-02`)
  11. Invariant Catalogue (`INV-LIMIT-01` through `INV-LIMIT-08`)
  12. Formal Resolution Matrix for Directive Questions Q1–Q12
  13. Explicit Non-Effects & Governance Boundaries
  14. HARD STOP Section

---

## 8. Governance Lifecycle & Verification Requirements

Prior to commencing architectural authoring, this directive must satisfy the full governance gate sequence:
```text
PROPOSED DIRECTIVE (This Document)
        ↓
Independent Directive Audit (REPORT-EEOS-O-WP-P14-02-03-EXECUTION-DIRECTIVE-INDEPENDENT-AUDIT-001)
        ↓
Process_PO Sovereign Authorization (SOV-DEC-PO-P14-02-03-AUTH-001)
        +
Process_Mandor Sovereign Authorization (SOV-DEC-MANDOR-P14-02-03-AUTH-001)
        ↓
Consolidated Dual-Sovereign Execution Authorization (EEOS-O-GOV-EXEC-AUTH-P14-02-03-001)
        ↓
Bounded Architectural Design Execution
```

---

## 9. HARD STOP

```text
══════════════════════════════════════════════════════════════════════
PROPOSED EXECUTION DIRECTIVE FORMULATED FOR WP-P14-02-03.
NO DESIGN AUTHORING, NO SOVEREIGN DECISION CREATION,
NO DOWNSTREAM ACTIVATION, AND NO CODE IMPLEMENTATION PERFORMED.

SUB-WORK PACKAGE REMAINS UNACTIVATED PENDING SOVEREIGN AUTHORIZATION.
HARD STOP — AWAITING INDEPENDENT DIRECTIVE AUDIT.
══════════════════════════════════════════════════════════════════════
```
