# EEOS-O — Architectural Specification
## Work Package WP-P14-02-01: Fork Barrier Architecture
### Module: Parallel Branch Spawning and Fork Synchronization Semantics

---

## 1. Document Identity & Metadata

* **Document Identifier**: `EEOS-O-PHASE-1.4-WP-P14-02-01-FORK-BARRIER-ARCHITECTURE`
* **Specification Version**: `1.0.0-DRAFT`
* **Artifact Type**: Formal Bounded Sub-Work Package Architectural Specification
* **Target Sub-Work Package**: `WP-P14-02-01 — Fork Barrier Architecture`
* **Governing Execution Directive**: `EXEC-DIR-EEOS-O-WP-P14-02-01-001` ([`docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-01-EXECUTION-DIRECTIVE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-01-EXECUTION-DIRECTIVE.md), v1.0.0)
* **Governing Authorization Record**: `EEOS-O-GOV-EXEC-AUTH-P14-02-01-001` ([`docs/eeos-o/governance/DUAL-SOVEREIGN-EXECUTION-AUTHORIZATION-STATEMENT-WP-P14-02-01.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/governance/DUAL-SOVEREIGN-EXECUTION-AUTHORIZATION-STATEMENT-WP-P14-02-01.md))
* **Governing Master Work Package**: `MWP-EEOS-O-WP-P14-02` ([`docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md))
* **Parent Phase**: Phase 1.4 — DAG Scheduler & Execution Engine Architectural Design
* **Parent Master Work Package**: `MWP-EEOS-O-PHASE-1.4` ([`docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md))
* **Authoring Agent Role**: EEOS-O Architectural Design Execution Agent (ZenOrion Tier 3 Governance Architecture)
* **Date**: October 03, 2026
* **Timezone**: UTC+07:00 (WIB)

---

## 2. Governance Status & Boundaries

* **Lifecycle State**: **`DRAFT — AWAITING INDEPENDENT ARCHITECTURAL SPECIFICATION AUDIT`**
* **Ratification Status**: **`NOT YET RATIFIED`** (Pre-ratification modular architecture; subject to internal gate review and sovereign clearance)
* **Implementation Status**: **`STRICTLY LOCKED`** (Zero software code, zero SQL DDL migrations, zero runtime queues or workers)
* **Parent Phase 1.4 Status**: `AUTHORIZED / ACTIVE ARCHITECTURAL DESIGN` (Phase 1.4 remains active and unratified)
* **Upstream Baseline Immutability**:
  - Phase 1.1 (`DO_WP` Contract): `RATIFIED / UNTOUCHED`
  - Phase 1.2 (Task Contract & 15-state FSM): `RATIFIED / UNTOUCHED`
  - Phase 1.3 (Agent Container Contract): `DUAL-SOVEREIGN RATIFIED / UNTOUCHED`
  - WP-P14-01 (DAG Graph & Topological Model): `GATE G1 DUAL-SOVEREIGN CLEARED / IMMUTABLE`
* **Internal Gate Alignment**: Contributes evidence toward `Gate P14-02-G1` (Component Architectural Module Design Gate) under `MWP-EEOS-O-WP-P14-02` §11.
* **Parent Gate Alignment**:
  - **Parent Phase 1.4 Gate G2 (`OAQ Resolution Complete`)**: **UNRESOLVED**. This specification does not resolve or complete Parent Gate G2.
  - **Parent Phase 1.4 Gate G3 (`Module Designs Complete`)**: **NOT AUTOMATICALLY SATISFIED**. This document contributes foundational modular evidence but does not automatically satisfy Parent Gate G3.

---

## 3. Objective & Architectural Intent

The primary architectural objective of `WP-P14-02-01` is:

> **To formalize the macro-orchestration synchronization contracts, branch membership models, activation predicates, deterministic index ordering, and completion tracking mechanisms for DAG fork gateways (`FORK_GATEWAY`), establishing an airtight, reproducible upstream foundation for parallel multi-agent task execution across distributed enterprise clusters.**

`WP-P14-02-01` bridges the static topological graph structure defined in `WP-P14-01` and the concurrent multi-agent execution mechanisms of Phase 1.3. It ensures that when an upstream dependency chain reaches a structural fork point, the resulting parallel branches are spawned, registered, indexed, and evaluated with deterministic branch identity, deterministic index ordering, and strict failure isolation. Runtime concurrency, worker scheduling, and race behavior are outside the normative guarantee of `WP-P14-02-01` and belong to separately bounded orchestration and runtime concerns.

---

## 4. Authorized Scope & Explicit Exclusions

### 4.1 Authorized Scope
In strict compliance with `EXEC-DIR-EEOS-O-WP-P14-02-01-001` §4, this specification is confined exclusively to the following ten (10) architectural design domains:
1. **Fork Barrier Semantics**: Formal definition of runtime fork barrier instances and their distinction from static graph nodes;
2. **Barrier Entry Conditions**: Mathematical predicates governing inbound dependency satisfaction and activation triggers;
3. **Branch Spawning & Membership Models**: Cardinality formulation, branch identification, and deterministic indexing;
4. **Barrier Satisfaction Conditions**: Criteria for structural fork completion and downstream branch dispatch eligibility;
5. **Partial Satisfaction Representation**: Formal tracking of interim branch preparation under bounded architectural state transitions;
6. **Blocking & Anti-Stall Semantics**: Structural detection and governance of blocked fork states;
7. **Failure Propagation & Branch Isolation**: Upstream fault handling and strict containment preventing unaffected branch corruption;
8. **Invalidation Interaction Boundary**: Deterministic response to incoming invalidation signals preserving the OAQ quarantine;
9. **Barrier Release Conditions**: Formal criteria for releasing downstream branch tasks;
10. **Canonical 8-State Model Adherence**: Full compliance with the authoritative barrier lifecycle state machine.

### 4.2 Explicit Exclusions & Prohibitions
To preserve hermetic architecture boundaries under ZenOrion Tier 3 Governance, the following are **ABSOLUTELY EXCLUDED**:
* **Join Barrier Release Predicates**: Convergent fan-in cardinality and barrier release logic belong exclusively to `WP-P14-02-02` (**LOCKED**);
* **Concurrency Limiting & Admission Control**: Tenant/global `maxParallelAgents` slots, admission queues, and resource throttling belong exclusively to `WP-P14-02-03` (**LOCKED**);
* **Dynamic Ripple Invalidation Policy**: Propagation algorithms and dirty-bit policies belong exclusively to `WP-P14-03` and `OAQ-SYNC-02` (**LOCKED / UNRESOLVED**);
* **Structural Merge-Gating**: Branch reconciliation and structural merge consensus belong exclusively to `WP-P14-04` (**LOCKED**);
* **Physical Implementation**: Strictly zero TypeScript, JavaScript, Python, Go, Rust, SQL DDL migrations, container runtimes, process workers, or Redis/RabbitMQ message brokers;
* **Downstream Sub-WP Cascading**: Completion of this specification does not authorize execution of `WP-P14-02-02` through `08`.

---

## 5. Domain Terminology & Definitions

* **Fork Gateway (`FORK_GATEWAY`)**: A topological `DAGNode` classification defined under `WP-P14-01` §4.1 where outbound degree $\text{outDegree}(v) \ge 2$, representing a structural divergence point in the DAG.
* **Fork Barrier Instance ($\mathcal{B}_{\text{fork}}$)**: A dynamic macro-orchestration synchronization entity bound to a specific `FORK_GATEWAY` execution lifecycle, managing inbound dependency evaluation, branch registration, and release gating.
* **Inbound Prerequisite Set ($\text{Pred}(v)$)**: The set of predecessor nodes $\{u \in V \mid (u, v) \in E\}$ whose successful completion is mandatory before the fork barrier can become active.
* **Outbound Branch Set ($\text{Succ}(v)$)**: The set of successor nodes $\{w \in V \mid (v, w) \in E\}$ spawned as parallel execution paths upon fork barrier satisfaction.
* **Fan-Out Cardinality ($k_{\text{fork}}$)**: The integer count of outbound successor edges originating at the gateway, where $k_{\text{fork}} = \text{outDegree}(v) \ge 2$.
* **Branch Index ($\beta_i$)**: A zero-based integer index $\beta_i \in \{0, 1, \dots, k-1\}$ assigned deterministically to each outbound branch to eliminate scheduling ambiguity.
* **Branch Binding Dossier**: A formal record binding a branch index to a specific successor node ID, target task ID, and execution context.
* **Canonical 8-State Barrier FSM**: The authoritative state vocabulary governing synchronization barrier lifecycles: `PENDING`, `WAITING`, `PARTIALLY_SATISFIED`, `SATISFIED`, `BLOCKED`, `FAILED`, `RELEASED`, `INVALIDATED`.

---

## 6. Upstream Architectural Context

`WP-P14-02-01` operates strictly as a consumer of upstream ratified contracts:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          UPSTREAM CONTRACT HIERARCHY                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Phase 1.1: DO_WP Contract (Work Package Decomposition Baseline)                │
│       │                                                                          │
│       ▼                                                                          │
│   Phase 1.2: Task Contract Architecture (15-State Task Lifecycle FSM)            │
│       │                                                                          │
│       ▼                                                                          │
│   Phase 1.4 / WP-P14-01: DAG Graph & Topological Model (Immutable Foundation)    │
│   ├── Kahn Topological Sort Layers (L_0, L_1, ..., L_m)                          │
│   ├── Gateway Classifications (Precedence: JOIN > FORK > ROOT > TERM > STD)      │
│   └── Invariants I-01 through I-08 (Bijective Task Binding, Acyclicity, Parity) │
│       │                                                                          │
│       ▼                                                                          │
│   Phase 1.4 / WP-P14-02-01: Fork Barrier Architecture [THIS MODULE]              │
│   ├── Dynamic Barrier Instance Management (B_fork)                              │
│   ├── Deterministic Outbound Branch Indexing (β_0 .. β_{k-1})                   │
│   └── Canonical 8-State Barrier Lifecycle Synchronizer                           │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Mapping to WP-P14-01
Under `WP-P14-01` §4.1, topological nodes are classified via a singular precedence hierarchy. A node $v$ is classified as `FORK_GATEWAY` if and only if:
$$\text{inDegree}(v) < 2 \land \text{outDegree}(v) \ge 2$$
(If $\text{inDegree}(v) \ge 2$, inbound convergence takes priority, classifying the node as `JOIN_GATEWAY` under `WP-P14-01` §4.1 Step 1).

### 6.2 Mapping to Phase 1.2 Task FSM
Every `FORK_GATEWAY` node $v$ is bijectively bound to exactly one Phase 1.2 Task Contract:
$$v.\text{nodeId} \equiv \text{"NODE-" + } v.\text{taskId} \quad (\text{Invariant I-02})$$
The execution of the task bound to the `FORK_GATEWAY` node represents the computation that produces the divergence criteria. The fork barrier synchronizer monitors the Phase 1.2 Task FSM state of the gateway task to evaluate its completion prior to branch release.

---

## 7. Fork Gateway Architectural Model

### 7.1 Static DAG Node vs. Dynamic Fork Barrier
A critical architectural separation is established between the static graph topology and the dynamic orchestration barrier:

| Dimension | Static DAG Gateway (`DAGNode`, WP-P14-01) | Dynamic Fork Barrier Instance ($\mathcal{B}_{\text{fork}}$, WP-P14-02-01) |
| :--- | :--- | :--- |
| **Lifecycle** | Persisted permanently within `DAGGraph` schema | Instantiated dynamically during workflow run execution |
| **Mutability** | Structural properties are strictly immutable | Tracks mutable barrier lifecycle states ($\mathcal{S}_{\text{barrier}}$) |
| **Responsibility** | Defines potential topological dependency edges | Coordinates activation, branch registration, and release gating |
| **Cardinality** | Exactly 1 per fork node in graph definition | Exactly 1 per workflow execution run of that node |
| **Schema Scope** | Defined in `dag-graph-schema.json` | Governed by runtime orchestrator barrier contract |

### 7.2 Gateway Fan-Out Characteristics
Let $v \in V$ be a `DAGNode` where $v.\text{nodeType} = \text{FORK_GATEWAY}$.
* **Inbound Edge Count**: $|\text{Pred}(v)| \in \{0, 1\}$.
  - If $|\text{Pred}(v)| = 0$: Gateway is a Root Fork Gateway ($v.\text{stageIndex} = 0$).
  - If $|\text{Pred}(v)| = 1$: Gateway is an Intermediate Fork Gateway ($v.\text{stageIndex} \ge 1$).
* **Outbound Edge Count**: $|\text{Succ}(v)| = k_{\text{fork}} \ge 2$.
  Every successor node $w \in \text{Succ}(v)$ represents a distinct parallel branch entry point.

---

## 8. Branch Spawning & Membership Architecture

### 8.1 Branch Membership Formalism
For a fork gateway $v$, the Outbound Branch Collection $\mathcal{M}(v)$ is formally defined as:
$$\mathcal{M}(v) = \{ \text{Branch}_0, \text{Branch}_1, \dots, \text{Branch}_{k-1} \}$$
Where each $\text{Branch}_i$ is an immutable tuple:
$$\text{Branch}_i = \langle \beta_i, \text{gatewayNodeId}, \text{targetNodeId}, \text{targetTaskId}, \text{branchContextRef} \rangle$$

> **ARCHITECTURAL BOUNDARY OF `branchContextRef`**:
> The `branchContextRef` field is an opaque architectural reference to the immutable branch execution context. `WP-P14-02-01` does NOT define cryptographic hashing, verification algorithms, or cryptographic evidence ledgers (which belong to Phase 1.6). Furthermore, `WP-P14-02-01` does NOT define dependency-hash binding or resolve `OAQ-SYNC-01` (Dependency Hash Binding Location), which remains strictly quarantined and unresolved.

### 8.2 Deterministic Branch Indexing Algorithm
To ensure deterministic branch ordering across distributed orchestrator nodes at the architectural specification level, branch indexing MUST follow an unambiguous, reproducible rule. Note that runtime concurrency, worker scheduling, and race behavior are outside the normative scope of this work package.

Let $\text{Succ}(v) = \{ w_0, w_1, \dots, w_{k-1} \}$ be the set of successor nodes.
The deterministic sort key $\mathcal{K}_{\text{branch}}(w)$ is defined as the lexicographical pair:
$$\mathcal{K}_{\text{branch}}(w) = \Big( w.\text{executionMetadata.priority}, \; w.\text{nodeId} \Big)$$

**Ordering Rule**:
1. Primary Sort: Ascending numerical sort on `priority` (inherited from `WP-P14-01` §10.1);
2. Tie-Breaking Sort: Ascending lexicographical ASCII sort on `nodeId`.

The branch index $\beta_i \in \{0, \dots, k-1\}$ is assigned strictly according to this sorted sequence:
$$\beta_i(w) = \text{rank}_{\mathcal{K}}(w) \quad \text{where} \quad \text{rank} \in \{0, \dots, k-1\}$$

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   DETERMINISTIC BRANCH INDEXING TOPOLOGY                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [ FORK_GATEWAY: NODE-TASK-ROOT ] (outDegree = 3)                              │
│       │                                                                          │
│       ├── Priority 10, ID: NODE-TASK-ANALYZE-A  ──> BranchIndex β = 0           │
│       ├── Priority 20, ID: NODE-TASK-ANALYZE-B  ──> BranchIndex β = 1           │
│       └── Priority 20, ID: NODE-TASK-ANALYZE-C  ──> BranchIndex β = 2           │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Invariant Guarantees on Branch Indexing
* **Uniqueness ($\text{INV-FORK-01}$)**: $\forall i, j \in \{0, \dots, k-1\} : i \neq j \implies \beta_i \neq \beta_j$.
* **Contiguity ($\text{INV-FORK-02}$)**: The set of assigned indices forms a contiguous integer interval $[0, k_{\text{fork}} - 1]$ with zero gaps.
* **Bijective Target Mapping ($\text{INV-FORK-03}$)**: Exactly one successor `nodeId` is mapped to exactly one branch index $\beta_i$.

---

## 9. Fork Barrier Lifecycle & State Transitions

The fork barrier synchronizer adheres strictly to the canonical 8-state barrier vocabulary:
$$\mathcal{S}_{\text{barrier}} = \{\text{PENDING}, \text{WAITING}, \text{PARTIALLY\_SATISFIED}, \text{SATISFIED}, \text{BLOCKED}, \text{FAILED}, \text{RELEASED}, \text{INVALIDATED}\}$$

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       FORK BARRIER STATE MACHINE (FSM)                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│               [ PENDING ] ──(Inbound Dependencies Cleared)                       │
│                    │                                                             │
│                    ▼                                                             │
│               [ WAITING ] ──(Branch Registration Initiated)                      │
│                    │                                                             │
│                    ▼                                                             │
│         [ PARTIALLY_SATISFIED ] ──(All k Branches Registered & Bound)            │
│                    │                                                             │
│                    ▼                                                             │
│               [ SATISFIED ] ──(Gateway Task COMPLETED & Validated)               │
│                    │                                                             │
│                    ▼                                                             │
│               [ RELEASED ] ===> [ Downstream Branches Eligible for Dispatch ]    │
│                 (Terminal)                                                       │
│                                                                                  │
│   ─── EXCEPTION & ANOMALY TRANSITIONS ────────────────────────────────────────   │
│   {PENDING, WAITING, PARTIALLY_SATISFIED} ──(Blocking Predicate Active)─> [BLOCKED│
│   [ BLOCKED ] ──(Blocking Predicate Cleared & Context Valid)───────────> [WAITING]│
│   {PENDING, WAITING, PARTIALLY_SATISFIED, BLOCKED} ──(Execution Error)─> [ FAILED]│
│   {PENDING, WAITING, PARTIALLY_SATISFIED, SATISFIED, BLOCKED} ─────────> [INVALID]│
│       (Upstream Cascade Invalidation; RELEASED and FAILED strictly excluded)     │
│   [ INVALIDATED ] ──(External Re-Evaluation Authorization Signal)──────> [PENDING]│
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 9.1 State Definitions for Fork Barriers
1. **`PENDING`**: Initial resting state. The fork barrier instance exists in the execution plan but its inbound prerequisite nodes have not yet completed.
2. **`WAITING`**: Inbound dependencies are fully satisfied. The barrier is actively waiting for gateway task completion and branch catalog initialization.
3. **`PARTIALLY_SATISFIED`**: Branch registration is actively in progress. A subset of outbound branches ($0 < m < k_{\text{fork}}$) has been indexed and validated, but full fan-out registration is incomplete.
4. **`SATISFIED`**: All $k_{\text{fork}}$ outbound branches have been successfully registered, indexed, and structurally bound, and the bound `FORK_GATEWAY` task execution has successfully completed according to its contract.
5. **`BLOCKED`**: Progress is halted because an explicit blocking predicate is active (e.g., orchestrator administrative hold, structural dependency hold, or unallocated required context).
6. **`FAILED`**: Terminal failure state. A fatal fault has occurred during gateway task execution or branch spawning, aborting fork progression.
7. **`RELEASED`**: Terminal success state for the local fork barrier. The barrier releases gating constraints, transitioning all child branch entry tasks into `ELIGIBLE` status for macro-orchestrator scheduling. **`RELEASED` is an immutable, terminal local state; it does NOT transition to `INVALIDATED` or any other local barrier state.**
8. **`INVALIDATED`**: An upstream re-execution, revocation, or dirty-bit cascade has invalidated the prerequisite state of this gateway prior to release, revoking readiness. Transition back to `PENDING` requires an externally authorized re-evaluation signal.

---

## 10. Entry & Activation Preconditions

A fork barrier instance $\mathcal{B}_{\text{fork}}(v)$ transitions from `PENDING` to `WAITING` if and only if the formal entry predicate $\text{EntryPredicate}(v)$ evaluates to `TRUE`:

$$\text{EntryPredicate}(v) \iff \text{InboundPrereqsSatisfied}(v) \land \neg \text{IsOrchestratorHalted}(\Omega_{\text{gov}})$$

Where inbound dependency satisfaction is mathematically defined as:
$$\text{InboundPrereqsSatisfied}(v) \iff \begin{cases}
\text{TRUE}, & \text{if } \text{Pred}(v) = \emptyset \quad (\text{Root Gateway}) \\
\forall u \in \text{Pred}(v) : \text{TaskState}(u.\text{taskId}) = \text{COMPLETED}, & \text{if } |\text{Pred}(v)| = 1 \quad (\text{Intermediate Gateway})
\end{cases}$$

### Activation Rules:
1. **Root Fork Gateways**: Evaluates immediately to `TRUE` upon workflow execution initiation.
2. **Intermediate Fork Gateways**: Monitored continuously; triggers activation immediately upon the predecessor node's Phase 1.2 Task FSM transitioning to `COMPLETED` according to its task contract with required outputs available. No cryptographic verification mechanism or Phase 1.6 evidence ledger is required or evaluated.
3. **No Unilateral Execution**: Gateway task dispatch is initiated only after transition to `WAITING`.

---

## 11. Satisfaction & Completion Tracking Semantics

The transition from `WAITING` $\to$ `PARTIALLY_SATISFIED` $\to$ `SATISFIED` tracks the structural readiness of the divergence point.

### 11.1 Partial Satisfaction Evaluation
Let $m(t)$ be the count of successfully registered and bound outbound branches at time $t$:
$$0 < m(t) < k_{\text{fork}} \implies \text{BarrierState}(\mathcal{B}_{\text{fork}}) = \text{PARTIALLY\_SATISFIED}$$
This state allows the macro-orchestrator to verify incremental allocation without exposing unregistered branches to premature scheduling.

### 11.2 Full Satisfaction Predicate
A fork barrier achieves `SATISFIED` status if and only if:
$$\text{ForkSatisfiedPredicate}(v) \iff \Big( m(t) == k_{\text{fork}} \Big) \land \Big( \text{TaskState}(v.\text{taskId}) = \text{COMPLETED} \Big) \land \Big( \text{OutputPayloadBound}(v) = \text{TRUE} \Big)$$

### 11.3 Decoupling from Concurrency Admission
* **Structural Satisfaction (This Module)**: Confirms that all $k_{\text{fork}}$ branches are structurally instantiated, indexed, and legally ready.
* **Resource Admission (`WP-P14-02-03`)**: Determines whether orchestrator slots (`maxParallelAgents`) are available to actually execute those branches.
* **Separation Assertion**: Transitioning to `SATISFIED` does NOT require available agent execution slots. Resource throttling is completely decoupled and evaluated downstream.

---

## 12. Blocking & Anti-Stall Semantics

### 12.1 Conditions Inducing `BLOCKED` State
`BLOCKED` signifies that the fork barrier cannot currently progress toward satisfaction because an explicit blocking predicate is active. The barrier transitions to `BLOCKED` under the following conditions:
1. **`PENDING → BLOCKED`**: Allowed when an explicit blocking predicate (such as an administrative hold `IsOrchestratorHalted = TRUE`) is active before prerequisite evaluation can begin.
2. **`WAITING → BLOCKED`**: Allowed when an administrative freeze is triggered while waiting, or when required initial branch configuration is incomplete.
3. **`PARTIALLY_SATISFIED → BLOCKED`**: Allowed when branch registration progress is halted after one or more branches are registered, due to context unavailability or registration stall.
4. **`BLOCKED → WAITING`**: Allowed only when the active blocking predicate is cleared and the barrier's branch obligations remain valid. This transition preserves already-established branch registrations without silent reset or re-indexing.

### 12.2 Anti-Stall Guarantees
To prevent silent orchestrator lockup at fork gateways:
* **Deterministic Evaluation ($\text{INV-FORK-04}$)**: Every barrier state evaluation terminates in finite steps $\mathcal{O}(k_{\text{fork}})$ under deterministic logic;
* **Explicit Escalation Trigger**: If a barrier remains in `BLOCKED` beyond a declaratively configured threshold ($\tau_{\text{stall}}$), it emits an architectural signal `ERR_FORK_BARRIER_STALLED` to the macro-orchestration control plane;
* **Zero Runtime Implementation**: Detection is an architectural event contract evaluated upon state transition signals, never via runtime watchdog threads or polling sleep loops.

---

## 13. Failure Propagation & Branch Isolation Architecture

### 13.1 Predecessor Failure Propagation
If a predecessor node $u \in \text{Pred}(v)$ transitions to `FAILED` or `CANCELLED`:
1. The fork barrier $\mathcal{B}_{\text{fork}}(v)$ immediately aborts entry and transitions directly:
   $$\text{PENDING} \longrightarrow \text{FAILED}$$
2. The failure record annotates causal origin: `causalNodeId = u.nodeId`.
3. Outbound branches $\text{Succ}(v)$ are never spawned.

### 13.2 Gateway Task Execution Failure
If the task bound to the `FORK_GATEWAY` itself fails (`TaskState(v.taskId) = FAILED`):
1. The barrier transitions:
   $$\{\text{WAITING}, \text{PARTIALLY\_SATISFIED}, \text{BLOCKED}\} \longrightarrow \text{FAILED}$$
2. All partially registered branches are marked `ABORTED` in the orchestrator tracking table.
3. Downstream branch nodes are marked `CANCELLED` under `WP-P14-01` structural state rules.

### 13.3 Sibling Branch Isolation Guarantee
Once a fork barrier achieves `RELEASED` and downstream branches begin parallel execution:
* **Isolation Boundary ($\text{INV-FORK-05}$)**: The runtime failure of a downstream branch task $\text{Branch}_i$ does NOT directly abort or mutate the execution state of sibling branches $\text{Branch}_j$ ($j \neq i$).
* **Reconciliation Confinement**: Aggregation of branch failures occurs exclusively at downstream `JOIN_GATEWAY` nodes (`WP-P14-02-02` and `WP-P14-02-05`). The fork barrier does not retroactively fail once released.

---

## 14. Release Criteria & Downstream Eligibility Triggers

The transition of the fork barrier from `SATISFIED` to `RELEASED` is the operational trigger for downstream dispatch readiness.

### 14.1 Release Predicate
$$\text{ReleasePredicate}(\mathcal{B}_{\text{fork}}) \iff \Big( \text{BarrierState}(\mathcal{B}_{\text{fork}}) = \text{SATISFIED} \Big) \land \Big( \text{TaskOutputReady}(v) = \text{TRUE} \Big)$$
Where $\text{TaskOutputReady}(v)$ indicates that the bound gateway task has successfully terminated in `COMPLETED` status with its declared output artifacts accessible per Phase 1.2. No cryptographic evidence verification or Phase 1.6 dossier mechanism is introduced.

### 14.2 Downstream Eligibility Cascade
Upon transition to `RELEASED`, the fork barrier executes an atomic, deterministic notification across all registered branches:
$$\forall \text{Branch}_i \in \mathcal{M}(v) : \text{SetStructuralEligibility}(w_i, \text{ELIGIBLE})$$
Where:
* $w_i$ is the target successor node bound to $\beta_i$;
* $w_i.\text{structuralState}$ transitions from `BLOCKED` to `ELIGIBLE` under `WP-P14-01` §9;
* Downstream execution admission is an external architectural dependency owned by the separately authorized `WP-P14-02-03` concurrency limiter boundary.

---

## 15. Invalidation Interaction Boundary (OAQ-SYNC-02 Preservation)

### 15.1 Reaction to Incoming Invalidation Signal
In the event that an upstream task re-executes or an invalidation cascade reaches gateway $v$:
1. If $\mathcal{B}_{\text{fork}}$ is in a non-terminal pre-release state ($\{\text{PENDING}, \text{WAITING}, \text{PARTIALLY\_SATISFIED}, \text{SATISFIED}, \text{BLOCKED}\}$):
   $$\text{BarrierState}(\mathcal{B}_{\text{fork}}) \longrightarrow \text{INVALIDATED}$$
2. If $\mathcal{B}_{\text{fork}}$ is in `RELEASED`:
   **`RELEASED` is an immutable, terminal local state and does NOT transition to `INVALIDATED`.** Instead, the local barrier remains `RELEASED`, and an architectural downstream invalidation hand-off signal is emitted to the governing `WP-P14-03` boundary to manage downstream invalidations.
3. Transition from `INVALIDATED` to `PENDING` requires an explicit, externally authorized re-evaluation signal. `WP-P14-02-01` does not define automatic re-evaluation, polling, or cache invalidation policies.

### 15.2 Strict OAQ-SYNC-02 Boundary Preservation
* **Quarantine Directive**: This specification defines ONLY the local state reaction of $\mathcal{B}_{\text{fork}}$ to an incoming invalidation signal.
* **No Global Policy Assertion**: This specification does NOT define whether ripple invalidation across the DAG is eager, lazy, pull-based, or event-driven. That policy decision belongs exclusively to `WP-P14-03` and `OAQ-SYNC-02` (**UNRESOLVED**).

---

## 16. Determinism Guarantees & Invariant Catalogue

This specification introduces the formal **`INV-FORK`** invariant catalogue governing fork barrier synchronization:

| Invariant ID | Formal Name | Mathematical Formulation | Enforcing Scope |
| :--- | :--- | :--- | :--- |
| **`INV-FORK-01`** | **Branch Index Uniqueness** | $\forall i, j \in \{0, \dots, k-1\} : i \neq j \implies \beta_i \neq \beta_j$ | Branch Indexer |
| **`INV-FORK-02`** | **Branch Index Contiguity** | $\bigcup_{i=0}^{k-1} \{\beta_i\} \equiv \{0, 1, \dots, k_{\text{fork}}-1\}$ | Branch Indexer |
| **`INV-FORK-03`** | **Bijective Target Binding** | $\forall \text{Branch}_i, \text{Branch}_j : \beta_i = \beta_j \iff w_i = w_j$ | Registration Engine |
| **`INV-FORK-04`** | **Finite State Evaluation** | Evaluation latency $\mathcal{T}_{\text{eval}} \le \mathcal{O}(k_{\text{fork}})$ | Barrier FSM Engine |
| **`INV-FORK-05`** | **Post-Release Sibling Isolation** | $\forall i \neq j : \text{Fault}(\text{Branch}_i) \cap \text{State}(\text{Branch}_j) \equiv \emptyset$ | Macro-Orchestrator |
| **`INV-FORK-06`** | **Canonical State Conformance** | $\text{BarrierState}(\mathcal{B}_{\text{fork}}) \in \mathcal{S}_{\text{barrier}}$ (Exactly 8 states) | Barrier FSM Engine |
| **`INV-FORK-07`** | **Monotonic Release Gating** | $\text{RELEASED} \implies \text{SATISFIED} \text{ was satisfied at } t - \epsilon$ | Barrier FSM Engine |
| **`INV-FORK-08`** | **Upstream Immutability** | $\Delta(G_{\text{P14-01}}) \equiv \emptyset$ (Zero DAG graph mutation) | Interface Boundary |

---

## 17. Error & Exception Taxonomy

Any violation of fork barrier architectural invariants raises a deterministic, standardized exception:

| Error Code | Error Category | Trigger Condition | Severity |
| :--- | :--- | :--- | :--- |
| **`ERR_FORK_INVALID_GATEWAY_TYPE`** | Structural | Instantiating fork barrier on non-`FORK_GATEWAY` node | **BLOCKING** |
| **`ERR_FORK_INVALID_CARDINALITY`** | Structural | Outbound branch cardinality $k_{\text{fork}} < 2$ | **BLOCKING** |
| **`ERR_FORK_INDEX_COLLISION`** | Algorithmic | Duplicate branch index detected ($\beta_i = \beta_j$) | **CRITICAL** |
| **`ERR_FORK_INDEX_DISCONTINUITY`**| Algorithmic | Branch indices do not form contiguous $[0, k-1]$ | **CRITICAL** |
| **`ERR_FORK_PREDECESSOR_UNSATISFIED`**| Execution | Attempting activation with incomplete predecessors | **MAJOR** |
| **`ERR_FORK_GATEWAY_TASK_FAILED`**| Execution | Bound Phase 1.2 task failed during execution | **MAJOR** |
| **`ERR_FORK_BARRIER_STALLED`** | Lifecycle | Barrier blocked exceeding stall threshold $\tau_{\text{stall}}$ | **MAJOR** |
| **`ERR_FORK_STATE_CORRUPTION`** | Lifecycle | Transition to state outside canonical 8-state set | **BLOCKING** |

---

## 18. Interface Pseudocode & State Transition Matrix

### 18.1 Deterministic State Transition Matrix
The state transition function $\delta_{\text{fork}} : \mathcal{S}_{\text{barrier}} \times \Sigma \to \mathcal{S}_{\text{barrier}}$ is defined as:

| Current State | Transition Trigger ($\sigma \in \Sigma$) | Next State | Guard Condition |
| :--- | :--- | :--- | :--- |
| **`PENDING`** | `INBOUND_PREREQS_MET` | **`WAITING`** | $\text{EntryPredicate}(v) == \text{TRUE}$ |
| **`PENDING`** | `PREDECESSOR_FAILED` | **`FAILED`** | $\exists u \in \text{Pred}(v) : \text{Failed}(u)$ |
| **`PENDING`** | `PREDECESSOR_INVALIDATED` | **`INVALIDATED`** | Invalidation signal received from upstream |
| **`PENDING`** | `INITIAL_HOLD_TRIGGERED` | **`BLOCKED`** | Blocking predicate active prior to prerequisite evaluation |
| **`WAITING`** | `BRANCH_REGISTRATION_START`| **`PARTIALLY_SATISFIED`** | $0 < m < k_{\text{fork}}$ registered |
| **`WAITING`** | `GATEWAY_TASK_FAILED` | **`FAILED`** | Bound task failed signal received |
| **`WAITING`** | `HOLD_TRIGGERED` | **`BLOCKED`** | Blocking predicate active during wait |
| **`WAITING`** | `CASCADE_INVALIDATED` | **`INVALIDATED`** | Invalidation signal received from upstream |
| **`PARTIALLY_SATISFIED`** | `ALL_BRANCHES_BOUND` | **`SATISFIED`** | $m == k_{\text{fork}} \land \text{TaskOutputReady}(v)$ |
| **`PARTIALLY_SATISFIED`** | `REGISTRATION_STALL` | **`BLOCKED`** | Registration timeout / blocking predicate active during partial binding |
| **`PARTIALLY_SATISFIED`** | `GATEWAY_TASK_FAILED` | **`FAILED`** | Bound task failed signal received |
| **`PARTIALLY_SATISFIED`** | `CASCADE_INVALIDATED` | **`INVALIDATED`** | Invalidation signal received from upstream |
| **`SATISFIED`** | `SEAL_AND_RELEASE` | **`RELEASED`** | Output payload verified & sealed ($\text{ReleasePredicate} == \text{TRUE}$) |
| **`SATISFIED`** | `CASCADE_INVALIDATED` | **`INVALIDATED`** | Upstream output revoked before barrier release |
| **`BLOCKED`** | `HOLD_CLEARED` | **`WAITING`** | Blocking predicate cleared; existing branch registrations/satisfaction preserved |
| **`BLOCKED`** | `UNRESOLVABLE_ERROR` | **`FAILED`** | Unrecoverable configuration or structural flaw |
| **`BLOCKED`** | `CASCADE_INVALIDATED` | **`INVALIDATED`** | Upstream output revoked while blocked |
| **`RELEASED`** | *None (Terminal)* | **`RELEASED`** | Immutable terminal local state (downstream invalidation delegated to WP-P14-03) |
| **`FAILED`** | *None (Terminal)* | **`FAILED`** | Immutable terminal local failure state |
| **`INVALIDATED`**| `RE_EVALUATION_TRIGGERED` | **`PENDING`** | Externally authorized re-evaluation signal received (OAQ-SYNC-02 preserved) |

### 18.2 Architectural Contract Specification: Fork Barrier Registration & Release
The following specification formalizes the declarative sequence of architectural signals, contracts, and abstract state transitions governing a fork barrier instance:

```text
SPECIFICATION SynchronizeForkBarrierContract(gatewayNode, barrierInstance):
    CONTRACT INPUTS:
        gatewayNode: DAGNode (where gatewayNode.nodeType == FORK_GATEWAY)
        barrierInstance: ForkBarrierRecord
    ARCHITECTURAL OUTPUTS:
        updatedBarrierRecord: ForkBarrierRecord
        emittedSignals: Set<ArchitecturalSignal>

    1. Structural Integrity Invariants:
        ASSERT gatewayNode.nodeType == "FORK_GATEWAY"
            ELSE EMIT ErrorSignal("ERR_FORK_INVALID_GATEWAY_TYPE")
        
        k = gatewayNode.outDegree
        ASSERT k >= 2
            ELSE EMIT ErrorSignal("ERR_FORK_INVALID_CARDINALITY")

    2. Barrier Initialization Contract:
        barrierInstance.state = PENDING
        barrierInstance.registeredBranches = []

    3. Inbound Prerequisite Evaluation:
        WHEN InboundPrerequisitesMetSignal(gatewayNode) IS RECEIVED:
            TRANSITION barrierInstance.state: PENDING -> WAITING
        WHEN InboundHoldActiveSignal(gatewayNode) IS RECEIVED:
            TRANSITION barrierInstance.state: PENDING -> BLOCKED

    4. Bound Task Execution & Branch Indexing:
        // Bound Task Execution is an external Phase 1.2 runtime responsibility
        WHEN BoundTaskExecutionCompletionSignal(gatewayNode.taskId, status="COMPLETED") IS RECEIVED:
            // Successor DAG nodes are ordered deterministically by architectural sorting key
            orderedSuccessors = OrderSuccessorsBySpec(gatewayNode.successorNodes, key=(priority ASC, nodeId ASC))
            
            TRANSITION barrierInstance.state: WAITING -> PARTIALLY_SATISFIED
            
            FOR index FROM 0 TO k - 1:
                targetNode = orderedSuccessors[index]
                branchRecord = ArchitecturalBranchBinding(
                    branchIndex = index,
                    gatewayNodeId = gatewayNode.nodeId,
                    targetNodeId = targetNode.nodeId,
                    targetTaskId = targetNode.taskId,
                    branchContextRef = OpaqueContextRef(gatewayNode.nodeId, index) // Deferred under OAQ-SYNC-01
                )
                barrierInstance.registeredBranches.APPEND(branchRecord)

            TRANSITION barrierInstance.state: PARTIALLY_SATISFIED -> SATISFIED

        WHEN BoundTaskExecutionCompletionSignal(gatewayNode.taskId, status="FAILED") IS RECEIVED:
            TRANSITION barrierInstance.state: WAITING/PARTIALLY_SATISFIED -> FAILED

    5. Release & Downstream Hand-Off Gating:
        WHEN ReleasePredicateSatisfied(barrierInstance) == TRUE:
            TRANSITION barrierInstance.state: SATISFIED -> RELEASED
            
            FOR EACH branch IN barrierInstance.registeredBranches:
                // Downstream branch eligibility is emitted as an architectural hand-off signal
                // Concurrency admission decision is an external architectural dependency owned by WP-P14-02-03
                EMIT DownstreamBranchEligibleSignal(
                    targetNodeId = branch.targetNodeId,
                    branchIndex = branch.branchIndex,
                    gatewayNodeId = barrierInstance.nodeId
                )

    6. Local Terminal Immutability & Downstream Cascade Invalidation:
        WHEN UpstreamOutputRevocationSignal(gatewayNode.nodeId) IS RECEIVED:
            IF barrierInstance.state == RELEASED:
                // RELEASED is terminal locally; barrier state remains RELEASED
                // Downstream branch invalidation is delegated to WP-P14-03
                EMIT DownstreamBranchInvalidationSignal(
                    gatewayNodeId = barrierInstance.nodeId,
                    registeredBranches = barrierInstance.registeredBranches
                )
            ELSE IF barrierInstance.state IN {PENDING, WAITING, PARTIALLY_SATISFIED, SATISFIED, BLOCKED}:
                TRANSITION barrierInstance.state: state -> INVALIDATED
```

---

## 19. Requirements Traceability Matrix

This specification completely satisfies all governing requirements from `MWP-EEOS-O-WP-P14-02` and `EXEC-DIR-EEOS-O-WP-P14-02-01-001`:

| Requirement Source | Requirement Key | Architectural Implementation | Section in this Document | Verification Status |
| :--- | :--- | :--- | :--- | :---: |
| **`EXEC-DIR §4.1`** | Fork Barrier Semantics | Formal definition of $\mathcal{B}_{\text{fork}}$ vs static `DAGNode` | §7.1, §7.2 | **COMPLIANT** |
| **`EXEC-DIR §4.2`** | Barrier Entry Conditions | $\text{EntryPredicate}(v)$ formulation | §10 | **COMPLIANT** |
| **`EXEC-DIR §4.3`** | Branch Spawning & Membership| Deterministic sorting $\mathcal{K}_{\text{branch}}$ and indexing $[0, k-1]$ | §8.1, §8.2 | **COMPLIANT** |
| **`EXEC-DIR §4.4`** | Satisfaction Conditions | $\text{ForkSatisfiedPredicate}(v)$ and decoupling from limits | §11.1, §11.3 | **COMPLIANT** |
| **`EXEC-DIR §4.5`** | Partial Satisfaction | Formal modeling of `PARTIALLY_SATISFIED` state | §9.1, §11.1 | **COMPLIANT** |
| **`EXEC-DIR §4.6`** | Blocking & Anti-Stall | Explicit `BLOCKED` triggers and finite-step anti-stall | §12.1, §12.2 | **COMPLIANT** |
| **`EXEC-DIR §4.7`** | Failure Propagation | Branch failure isolation and gateway failure cascade | §13.1, §13.3 | **COMPLIANT** |
| **`EXEC-DIR §4.8`** | Invalidation Boundary | Incoming `INVALIDATED` reaction preserving OAQ-02 | §15.1, §15.2 | **COMPLIANT** |
| **`EXEC-DIR §4.9`** | Barrier Release Conditions | $\text{ReleasePredicate}(\mathcal{B}_{\text{fork}})$ and dispatch signaling | §14.1, §14.2 | **COMPLIANT** |
| **`EXEC-DIR §4.10`**| Canonical 8-State Vocabulary| Rigid restriction to canonical 8-state model ($\text{INV-FORK-06}$)| §9.1, §16, §18.1 | **COMPLIANT** |
| **`MWP-EEOS-O-WP-P14-02`**| Traceability to §7.1, §18 | Complete mapping of fork synchronization contracts | §6, §16, §19 | **COMPLIANT** |

---

## 20. Audit Readiness Statement & Hard Stop

### 20.1 Audit Readiness Statement
This architectural specification `WP-P14-02-01-FORK-BARRIER-ARCHITECTURE.md` (v1.0.0-DRAFT) has been authored strictly in compliance with governing directive `EXEC-DIR-EEOS-O-WP-P14-02-01-001`. It contains zero physical implementation code, respects the immutability of `WP-P14-01`, preserves all Open Architectural Questions in their unresolved status, adheres rigidly to the canonical 8-state barrier vocabulary, and establishes an objective, mathematically verifiable architectural contract. It is formally prepared for independent controller audit.

### 20.2 HARD STOP

```text
══════════════════════════════════════════════════════════════════════

WP-P14-02-01 ARCHITECTURAL DESIGN COMPLETED

DOCUMENT:
docs/eeos-o/specs/phase-1.4/WP-P14-02-01-FORK-BARRIER-ARCHITECTURE.md

SPECIFICATION VERSION:
1.0.0-DRAFT

GOVERNING DIRECTIVE:
EXEC-DIR-EEOS-O-WP-P14-02-01-001 (v1.0.0)

AUTHORIZATION:
EEOS-O-GOV-EXEC-AUTH-P14-02-01-001 (Dual-Sovereign Concurrence)

SCOPE:
FORK BARRIER ARCHITECTURE ONLY (10 Bound Design Questions)

IMPLEMENTATION:
STRICTLY LOCKED (0 software code, 0 migrations)

UPSTREAM BASELINE:
WP-P14-01 (IMMUTABLE / ZERO MUTATION)

PARENT GATE G2:
OAQ RESOLUTION COMPLETE (UNRESOLVED)

PARENT GATE G3:
MODULE DESIGNS COMPLETE (NOT AUTOMATICALLY SATISFIED)

OAQ STATUS:
PRESERVED / UNRESOLVED (OAQ-SYNC-01, OAQ-SYNC-02, OAQ-SYNC-03)

DOWNSTREAM SUB-WPs:
NOT ACTIVATED / LOCKED (WP-P14-02-02 through 08)

RATIFICATION:
NOT PERFORMED

NEXT GOVERNANCE STEP:
INDEPENDENT ARCHITECTURAL SPECIFICATION AUDIT

HARD STOP — ARCHITECTURAL DESIGN DRAFTED; AUDIT AND RATIFICATION NOT PERFORMED.

══════════════════════════════════════════════════════════════════════
```
