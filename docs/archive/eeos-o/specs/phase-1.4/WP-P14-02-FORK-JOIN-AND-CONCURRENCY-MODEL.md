# EEOS-O — Master Architectural Specification & Contract Compilation
## Work Package WP-P14-02-08: Unified Multi-Agent Fork-Join Synchronization & Concurrency Model
### Canonical Identifiers: `WP-P14-02-SPEC` / `SPEC-P14-02-UNIFIED` (Version `1.0.0-DRAFT`)

---

## 1. Document Metadata, System Context & Governance Conformance

### 1.1 Document Metadata & Identification
* **Document Identifier**: `EEOS-O-PHASE-1.4-WP-P14-02-MASTER-SPECIFICATION`
* **Canonical Specification Identifiers**: `WP-P14-02-SPEC` / `SPEC-P14-02-UNIFIED`
* **Specification Version**: `1.0.0-DRAFT`
* **Target Sub-Work Package**: `WP-P14-02-08 — Master Architectural Specification & Contract Compilation`
* **Governing Master Work Package**: `MWP-EEOS-O-WP-P14-02` ([`docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md), §7.8)
* **Parent Phase**: Phase 1.4 — DAG Scheduler & Execution Engine Architectural Design
* **Parent Master Work Package**: `MWP-EEOS-O-PHASE-1.4` ([`docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md), §9 Gate Registry)
* **Governing Execution Directive**: `EXEC-DIR-EEOS-O-WP-P14-02-08-001` ([`docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-08-EXECUTION-DIRECTIVE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-08-EXECUTION-DIRECTIVE.md), Version `1.0.0`)
* **Consolidated Execution Authorization**: `EEOS-O-GOV-EXEC-AUTH-P14-02-08-001` ([`docs/eeos-o/governance/EEOS-O-GOV-EXEC-AUTH-P14-02-08-001.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/governance/EEOS-O-GOV-EXEC-AUTH-P14-02-08-001.md))
* **Authoring Role**: EEOS-O Architectural Compiler & Specification Assembly Authority (ZenOrion Tier 3 Governance Architecture)
* **Target Milestone Gate**: Internal Gate `P14-02-G4` (Master Contract Assembly Gate)
* **Compilation Date**: October 12, 2026
* **Timezone**: UTC+07:00 (WIB)
* **Physical Implementation Budget**: `STRICTLY 0 BYTES` (No runtime code, daemons, DDL, or migrations)

### 1.2 System Context & Architectural Lineage
The EEOS-O system coordinates distributed, multi-agent automated software engineering workflows across enterprise multi-tenant environments. In Phase 1.4, the Macro-Orchestrator schedules complex dependency graphs modeled as Directed Acyclic Graphs (DAGs). 

This unified master specification synthesizes and compiles six immutable, dual-sovereign-cleared modular specifications and the Module 07 reconciliation audit into one unbroken architectural contract:
1. `SPEC-P14-02-01` (Fork Barrier Architecture) — Dynamic branch spawning, indexing, and fan-out gating;
2. `SPEC-P14-02-02` (Join Barrier Architecture) — Multi-branch synchronization, completion tracking, and fan-in gating;
3. `SPEC-P14-02-03` (Concurrency Limiter Architecture) — Mathematical admission control, multi-tenant quota bounding, and non-blocking backpressure;
4. `SPEC-P14-02-04` (Barrier State Machine Lifecycle) — Canonical 8-state barrier FSM, deterministic transitions $T_{01}$–$T_{19}$, rejection rules $R_1$–$R_{10}$, and Cartesian state orthogonality;
5. `SPEC-P14-02-05` (Fault & Deadlock Governance Architecture) — Deterministic failure propagation, 4-term cardinality conservation law, deadlock-free composite wait graph, and anti-starvation theorems;
6. `SPEC-P14-02-06` (DAG Topology Interface Boundary) — Read-only functional interface contract, topological layer mapping, and zero mutation of upstream `WP-P14-01` baseline ($\Delta(G) \equiv \emptyset$);
7. `REPORT-P14-02-RECONCILIATION` (`WP-P14-02-07`) — Cross-module architectural reconciliation and proof of absence of cross-module race conditions.

### 1.3 Governance Lineage & Immutability of Upstream Baselines
This specification strictly adheres to all ratified upstream baselines:
* **Phase 1.1 (`DO_WP`)**: Governance work package protocol, audit standards, and lifecycle gate enforcement.
* **Phase 1.2 (Task Contract Architecture)**: The canonical 15-state Task FSM and task rejection semantics ([`docs/eeos-o/EEOS-O-TASK-CONTRACT-ARCHITECTURE-AND-CONTRACT.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-TASK-CONTRACT-ARCHITECTURE-AND-CONTRACT.md)).
* **Phase 1.3 (Agent Container Contract)**: Agent container execution lifecycle, turn cycles, container autonomy, and §27 `maxParallelAgents` quota bounds ([`docs/eeos-o/EEOS-O-AGENT-CONTRACT-ARCHITECTURE-AND-INTERFACE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-AGENT-CONTRACT-ARCHITECTURE-AND-INTERFACE.md)).
* **WP-P14-01 (DAG Graph & Topological Model)**: The single authoritative workspace topological model on disk: [`docs/eeos-o/specs/phase-1.4/WP-P14-01-DAG-GRAPH-AND-TOPOLOGICAL-MODEL.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/specs/phase-1.4/WP-P14-01-DAG-GRAPH-AND-TOPOLOGICAL-MODEL.md) (Invariants `I-01` through `I-08`), resolving `OBS-02`.
* **Zero Mutation Contract**: The macro-orchestrator synchronization engine asserts $\Delta(G_{\text{P14-01}}) \equiv \emptyset$ and $\Delta(\text{dag-graph-schema.json}) \equiv \emptyset$.

---

## 2. Mathematical Foundations & Formal Orchestration Model

### 2.1 Formal Workflow DAG Definition
A workflow execution graph is formalized as a finite, directed, acyclic graph:
$$G = (V, E)$$
where:
* $V$ is the finite set of task and gateway nodes ($|V| < \infty$).
* $E \subset V \times V$ is the set of directed causal precedence edges, satisfying strict acyclicity:
  $$\text{Cycles}(G) = \emptyset$$
* For any node $v \in V$, its Kahn topological layer index $\mathcal{L}(v) \in \mathbb{N}_0$ is defined inductively:
  $$\mathcal{L}(v) = \begin{cases}
  0, & \text{if } \text{Pred}(v) = \emptyset \\
  1 + \max_{u \in \text{Pred}(v)} \mathcal{L}(u), & \text{if } \text{Pred}(v) \neq \emptyset
  \end{cases}$$
  where $\text{Pred}(v) = \{ u \in V \mid (u, v) \in E \}$ and $\text{Succ}(v) = \{ w \in V \mid (v, w) \in E \}$.
* **Monotonicity Law**: Directed precedence edges strictly increase topological level:
  $$\forall (u, v) \in E \implies \mathcal{L}(u) < \mathcal{L}(v)$$

### 2.2 Gateway Classification & Precedence Hierarchy
Nodes in $V$ are partitioned into five disjoint functional types ($v.\text{nodeType} \in \mathcal{T}_{\text{node}}$):
$$\mathcal{T}_{\text{node}} = \{ \text{JOIN\_GATEWAY}, \text{FORK\_GATEWAY}, \text{ROOT\_TASK}, \text{TERMINAL\_TASK}, \text{STANDARD\_TASK} \}$$

In accordance with `SPEC-P14-02-06` §7 and `WP-P14-01` §5, gateway classification adheres to the strict precedence hierarchy:
$$\text{JOIN\_GATEWAY} \succ \text{FORK\_GATEWAY} \succ \text{ROOT\_TASK} \succ \text{TERMINAL\_TASK} \succ \text{STANDARD\_TASK}$$

1. **`JOIN_GATEWAY`**: Defined when $\text{inDegree}(v) \ge 2$. Evaluates convergent multi-branch synchronization.
2. **`FORK_GATEWAY`**: Defined when $\text{outDegree}(v) \ge 2$ and $\text{inDegree}(v) \le 1$. Evaluates divergent parallel branch spawning.
3. **`ROOT_TASK`**: Defined when $\text{inDegree}(v) = 0$ and $\text{outDegree}(v) = 1$. Root workflow entry task.
4. **`TERMINAL_TASK`**: Defined when $\text{inDegree}(v) = 1$ and $\text{outDegree}(v) = 0$. Workflow terminal leaf task.
5. **`STANDARD_TASK`**: Defined when $\text{inDegree}(v) = 1$ and $\text{outDegree}(v) = 1$. Linear internal sequential task.

### 2.3 Separation of Static Graph Nodes and Dynamic Barrier Instances
A foundational invariant of the architecture is the strict ontological separation between static graph definitions and dynamic execution barriers:
$$\text{Static Topological Definition } (WP\text{-}P14\text{-}01) \neq \text{Dynamic Synchronization Barrier } (WP\text{-}P14\text{-}02)$$

* A `DAGNode` $v \in V$ is an immutable structural definition persisted in the workflow schema.
* A `BarrierInstance` $\mathcal{B}(v)$ is an ephemeral macro-orchestration state machine instantiated dynamically during workflow execution to manage the synchronization lifecycle of $v$.
* The mapping function $\mathcal{M}_{\text{barrier}}: V_{\text{gateway}} \to \{ \mathcal{B}_{\text{fork}}, \mathcal{B}_{\text{join}} \}$ projects gateway nodes into their corresponding dynamic synchronization barrier instances without mutating the underlying graph node.

### 2.4 Deterministic Branch Indexing
For every fork gateway $v$ with fan-out $k_{\text{fork}} = \text{outDegree}(v) \ge 2$, outbound branches are indexed deterministically using the composite key:
$$\mathcal{K}_{\text{branch}}(w) = \Big( w.\text{executionMetadata.priority}, \; w.\text{nodeId} \Big)$$
where:
1. Primary sort: Ascending numerical order on priority weight.
2. Secondary tie-breaking: Ascending lexicographical ASCII order on `nodeId`.
3. The deterministic branch index $\beta_i \in \{0, 1, \dots, k_{\text{fork}}-1\}$ is bijectively assigned according to the rank in this sorted sequence.

---

## 3. Fork Barrier Architecture & Dynamic Branch Spawning

### 3.1 Fork Barrier Structural Model
A fork barrier instance $\mathcal{B}_{\text{fork}}(v)$ is bound to a node $v$ where $v.\text{nodeType} = \text{FORK\_GATEWAY}$. Its structural parameters include:
* $\text{gatewayNodeId} = v.\text{nodeId}$
* $\text{gatewayTaskId} = v.\text{taskId}$
* Inbound prerequisite condition: $|\text{Pred}(v)| \in \{0, 1\}$
* Outbound fan-out cardinality: $C_{\text{fork}}(v) = |\text{Succ}(v)| = k_{\text{fork}} \ge 2$
* Branch collection: $\mathcal{M}(v) = \{ \text{Branch}_0, \text{Branch}_1, \dots, \text{Branch}_{k-1} \}$

Each branch member is modeled as an immutable tuple:
$$\text{Branch}_i = \langle \beta_i, \text{gatewayNodeId}, \text{targetNodeId}, \text{targetTaskId}, \text{branchContextRef} \rangle$$
where `branchContextRef` is an opaque architectural reference to the immutable branch execution context.

### 3.2 Entry & Activation Predicates
A fork barrier transitions from `PENDING` to `WAITING` ($T_{01}$) if and only if $\text{CanActivateBarrier}(\mathcal{B}_{\text{fork}})$ evaluates to `TRUE`:
$$\text{CanActivateBarrier}(\mathcal{B}_{\text{fork}}) \iff \text{StructuralEligibility}(v) \land \neg \text{IsOrchestratorHalted}(\Omega_{\text{gov}})$$
where:
$$\text{StructuralEligibility}(v) \equiv \begin{cases}
\text{TRUE}, & \text{if } \text{Pred}(v) = \emptyset \quad (\text{Root Gateway}) \\
\forall u \in \text{Pred}(v) : \text{TaskState}(u.\text{taskId}) == \text{COMPLETED}, & \text{if } |\text{Pred}(v)| = 1 \quad (\text{Intermediate Gateway})
\end{cases}$$

### 3.3 Partial Satisfaction & Registration Tracking
During active branch preparation, the barrier tracks the count of validated and registered outbound branches $m(t)$:
$$0 < m(t) < k_{\text{fork}} \implies \text{BarrierState}(\mathcal{B}_{\text{fork}}) = \text{PARTIALLY\_SATISFIED}$$
This state enables incremental registration verification across distributed nodes while strictly preventing premature branch dispatch.

### 3.4 Full Satisfaction Predicate
A fork barrier achieves `SATISFIED` readiness ($T_{04}$ or $T_{09}$) if and only if:
$$\text{ForkSatisfiedPredicate}(v) \iff \Big( m(t) == k_{\text{fork}} \Big) \land \Big( \text{TaskState}(v.\text{taskId}) == \text{COMPLETED} \Big) \land \Big( \text{OutputPayloadBound}(v) == \text{TRUE} \Big)$$

### 3.5 Atomic Release Handoff & Downstream Dispatch
When `ForkSatisfiedPredicate` holds and the release handshake is asserted, the barrier executes transition $T_{14}$:
$$\text{SATISFIED} \overset{\mathbf{e}_{\text{dispatch\_release}}}{\longrightarrow} \text{RELEASED}$$
Post-condition effects:
1. Entry into `RELEASED` is an immutable, terminal local sink state (`INV-STATE-05`);
2. All $k_{\text{fork}}$ child branch tasks $w \in \text{Succ}(v)$ have their structural eligibility set to `ELIGIBLE` ($\sigma_{\text{struct}}(w) := \text{ELIGIBLE}$);
3. Downstream tasks become eligible for submission to the Concurrency Limiter admission queue ($\mathcal{Q}_{\text{admit}}$).

### 3.6 Fork Boundary Branch Isolation
Under `INV-FORK-05`, once the fork barrier releases downstream branches:
* The subsequent runtime failure of any child branch $\text{Branch}_i$ does NOT corrupt, mutate, or abort sibling parallel branches $\text{Branch}_j$ ($j \neq i$);
* Branch aggregation occurs strictly downstream at convergent join gateways; the fork barrier never retroactively un-releases or fails.

---

## 4. Join Barrier Architecture & Synchronization Predicates

### 4.1 Join Barrier Structural Model
A join barrier instance $\mathcal{B}_{\text{join}}(v)$ is bound to a node $v$ where $v.\text{nodeType} = \text{JOIN\_GATEWAY}$. Its structural parameters include:
* $\text{gatewayNodeId} = v.\text{nodeId}$
* $\text{gatewayTaskId} = v.\text{taskId}$
* Inbound fan-in cardinality: $C_{\text{expected}}(b) = |\text{Pred}(v)| = k_{\text{in}} \ge 2$
* Inbound precursor branch set: $\mathcal{B}_{\text{branches}}(b) = \{ u_1, u_2, \dots, u_m \}$ where $m = C_{\text{expected}}(b)$
* Predecessor member collection: $\mathcal{M}_{\text{in}}(v) = \{ M_1, M_2, \dots, M_m \}$ where each $M_j = \langle u_j.\text{nodeId}, u_j.\text{taskId}, \text{predecessorContextRef} \rangle$

### 4.2 Inbound Branch Observation Domain & Conservation Law
In accordance with `SPEC-P14-02-05` §4.2 and resolving `OBS-03`:
Each inbound precursor branch $u \in \mathcal{B}_{\text{branches}}(b)$ executes under the Phase 1.2 Task FSM and reaches a terminal state. The discrete observation alphabet of inbound branch completion tokens is:
$$\mathcal{O}_{\text{branch}} = \{ \text{COMPLETED}, \text{REJECTED}, \text{FAILED} \}$$

At any point in workflow execution, the join barrier maintains the discrete partition:
$$N_{\text{total}}(b) = N_{\text{completed}}(b) + N_{\text{rejected}}(b) + N_{\text{failed}}(b) + N_{\text{pending}}(b) \equiv C_{\text{expected}}(b)$$
where:
* $N_{\text{completed}}(b) = |\{ u \in \mathcal{B}_{\text{branches}}(b) \mid \text{Token}(u) = \text{COMPLETED} \}|$
* $N_{\text{rejected}}(b) = |\{ u \in \mathcal{B}_{\text{branches}}(b) \mid \text{Token}(u) = \text{REJECTED} \}|$
* $N_{\text{failed}}(b) = |\{ u \in \mathcal{B}_{\text{branches}}(b) \mid \text{Token}(u) = \text{FAILED} \}|$
* $N_{\text{pending}}(b) = |\{ u \in \mathcal{B}_{\text{branches}}(b) \mid \text{Token}(u) = \text{PENDING} \}|$

### 4.3 Join Satisfaction Predicate & Quorum Policies
Let $K(b)$ be the required completion quorum ($1 \le K(b) \le N_{\text{total}}(b)$):
* **Strict AND-Join**: $K(b) = N_{\text{total}}(b) = C_{\text{expected}}(b)$. Requires all inbound branches to complete.
* **Tolerant/Quorum Join**: $K(b) \le N_{\text{total}}(b)$. Can tolerate up to $N_{\text{total}}(b) - K(b)$ branch failures.

Formal evaluation predicates:
* $\text{CanSatisfy}(b) \iff N_{\text{completed}}(b) + N_{\text{pending}}(b) \ge K(b)$
* $\text{IsSatisfied}(b) \iff N_{\text{completed}}(b) \ge K(b)$
* $\text{IsUnsatisfiable}(b) \iff N_{\text{completed}}(b) + N_{\text{pending}}(b) < K(b)$

### 4.4 Join Barrier Lifecycle Progressions
1. **Entry to `WAITING` ($T_{01}$)**: Triggered when parent gateway $v$ becomes structurally eligible ($\mathcal{L}(v)$ ready). Initial count: $N_{\text{completed}} := 0$, $N_{\text{pending}} := C_{\text{expected}}$.
2. **First Arrival ($T_{03}$)**: When first branch completes ($N_{\text{completed}} = 1 < K(b)$ and $K(b) > 1$), barrier transitions `WAITING` $\to$ `PARTIALLY_SATISFIED`.
3. **Accumulation ($T_{08}$)**: Additional intermediate branch completions maintain `PARTIALLY_SATISFIED` while $N_{\text{completed}} < K(b)$.
4. **Satisfaction ($T_{04}$ or $T_{09}$)**: Final branch arrives satisfying $N_{\text{completed}} == K(b)$. Barrier transitions to `SATISFIED`.
5. **Release Handoff ($T_{14}$)**: Barrier transitions `SATISFIED` $\to$ `RELEASED`, signaling downstream task structural eligibility ($\text{SetStructuralEligibility}(w, \text{ELIGIBLE})$).

---

## 5. Concurrency Limiter & Multi-Tenant Resource Governance

### 5.1 Mathematical Limiter Model & Capacity Bounds
The Concurrency Limiter subsystem manages runtime execution admission across multi-tenant clusters:
$$\mathcal{C}_{\text{limiter}} = \langle \mathcal{T}, C_{\text{global}}, \mathbf{C}_{\text{tenant}}, \mathcal{Q}_{\text{admit}}, \mathbf{S}_{\text{committed}}, \Pi_{\text{admit}} \rangle$$
where:
* $\mathcal{T} = \{T_1, T_2, \dots, T_m\}$ is the set of active tenant identifiers.
* $C_{\text{global}} \in \mathbb{N}_{\ge 1}$ is the global cluster capacity ceiling.
* $\mathbf{C}_{\text{tenant}}: \mathcal{T} \longrightarrow \mathbb{N}_{\ge 1}$ maps each tenant $T_k$ to its static concurrent slot quota $C_{\text{tenant}}(T_k)$, satisfying:
  $$\sum_{T_k \in \mathcal{T}} C_{\text{tenant}}(T_k) \le C_{\text{global}}$$
* $\mathbf{S}_{\text{committed}}(T_k, t)$ is the set of committed slots for tenant $T_k$ at time $t$.

### 5.2 Multi-Tenant Quota Isolation Invariant (`INV-LIMIT-02`)
The fundamental tenant safety invariant asserts that no tenant may breach its provisioned capacity bound or cannibalize shared cluster slots:
$$\forall T_k \in \mathcal{T}, \quad \forall t, \quad |\mathbf{S}_{\text{committed}}(T_k, t)| \le C_{\text{tenant}}(T_k)$$
and
$$\forall t, \quad \sum_{T_k \in \mathcal{T}} |\mathbf{S}_{\text{committed}}(T_k, t)| \le C_{\text{global}}$$

### 5.3 Five-State Concurrency Slot Lifecycle FSM
In accordance with `SPEC-P14-02-03` §5.2 and resolving `OBS-01`:
Every concurrency slot $s \in \text{Slots}$ conforms strictly to the canonical 5-state state space:
$$\mathcal{S}_{\text{slot}} = \{\text{AVAILABLE}, \text{RESERVED}, \text{CLAIMED}, \text{RELEASED}, \text{FORFEITED}\}$$

```text
                  ┌────────────────────────────────────────┐
                  ▼                                        │
           [ AVAILABLE ] ──(ReserveSlot)──► [ RESERVED ]   │
                 ▲                                │        │
                 │                         (ClaimSlot)     │
           (SlotRecycled)                         │        │
                 │                                ▼        │
           [ RELEASED ] ◄──(ReleaseSlot)─── [ CLAIMED ]    │
                 ▲                                         │
                 └───────── (ForfeitSlot / Timeout) ───────┘
```

**Capacity Accounting Rules**:
1. Capacity is committed at the moment of reservation: $\text{AVAILABLE} \longrightarrow \text{RESERVED}$.
2. $|\mathbf{S}_{\text{committed}}(T_k)| = |\mathbf{S}_{\text{reserved}}(T_k)| + |\mathbf{S}_{\text{claimed}}(T_k)|$.
3. Slot recycling: Transitions $\text{RELEASED} \to \text{AVAILABLE}$ and $\text{FORFEITED} \to \text{AVAILABLE}$ occur instantaneously in the orchestrator ledger, decrementing committed capacity.

### 5.4 Decoupling Structural Eligibility from Concurrency Admission
Let $\sigma_{\text{struct}}(w) \in \{\text{INELIGIBLE}, \text{ELIGIBLE}\}$ denote task structural DAG eligibility.  
Let $\sigma_{\text{admit}}(w) \in \{\text{QUEUED}, \text{RESERVED}, \text{ADMITTED}\}$ denote concurrency admission status.

**Theorem 5.1 (Eligibility-Admission Decoupling):**
$$\sigma_{\text{struct}}(w) = \text{ELIGIBLE} \centernot\implies \sigma_{\text{admit}}(w) = \text{ADMITTED}$$
*Proof*: Structural eligibility is established exclusively by topological satisfaction and barrier release handoffs. Concurrency admission requires satisfying the separate capacity predicate:
$$\text{CanAdmit}(w, T_k) \iff \Big( |\mathbf{S}_{\text{committed}}(T_k)| < C_{\text{tenant}}(T_k) \Big) \land \Big( \sum_{T \in \mathcal{T}} |\mathbf{S}_{\text{committed}}(T)| < C_{\text{global}} \Big) \land \text{IsTenantQueueHead}(w, \mathcal{Q}_{\text{admit}}, T_k)$$
If $\text{CanAdmit}(w, T_k)$ evaluates to `FALSE`, task $w$ remains strictly $\sigma_{\text{struct}}(w) = \text{ELIGIBLE}$ while queued in $\mathcal{Q}_{\text{admit}}$ with $\sigma_{\text{admit}}(w) = \text{QUEUED}$. The structural DAG topology is completely unaffected by capacity exhaustion. $\blacksquare$

### 5.5 Deterministic Admission Ordering & Per-Tenant Queue Head
Tasks in admission queue $\mathcal{Q}_{\text{admit}}$ are totally ordered by sorting tuple:
$$\mathcal{O}_{\text{admission}}(w) = \Big\langle \mathcal{L}(v), \; w.\text{executionMetadata.priority}, \; v.\text{nodeId} \Big\rangle$$
* Primary: Ascending Kahn topological level $\mathcal{L}(v)$ (prevents deadlock and prioritizes upstream completion);
* Secondary: Descending priority weight;
* Tie-breaker: Ascending lexicographical ASCII sort on $v.\text{nodeId}$.

**Tenant Queue-Head Eligibility Predicate:**
$$\text{IsTenantQueueHead}(w, \mathcal{Q}_{\text{admit}}, T_k) \iff \Big( w \in \mathcal{Q}_{\text{admit}} \land w.\text{tenantId} = T_k \land \nexists u \in \mathcal{Q}_{\text{admit}} : [u.\text{tenantId} = T_k \land u \prec_{\mathcal{O}} w] \Big)$$

### 5.6 Non-Blocking Backpressure Signaling
When a tenant reaches quota capacity ($|\mathbf{S}_{\text{committed}}(T_k)| = C_{\text{tenant}}(T_k)$):
* The limiter emits the declarative architectural event $\mathbf{e}_{\text{backpressure\_on}}$ (`EVENT_CONCURRENCY_SATURATED`);
* Tasks remain queued without consuming CPU cycles or holding operating system thread locks;
* When running tasks terminate, releasing slots, the limiter emits $\mathbf{e}_{\text{backpressure\_off}}$ and admits the next eligible candidate under $\mathcal{O}_{\text{admission}}$.

---

## 6. Unified Multi-FSM State Space & Lifecycle Orthogonality

### 6.1 Canonical 8-State Barrier Finite State Machine
In accordance with `SPEC-P14-02-04` §4.1 and resolving `OBS-01`:
The state space of the Macro-Orchestrator Barrier FSM, denoted $\mathcal{S}_{\text{barrier}}$, is strictly and exhaustively defined as:
$$\mathcal{S}_{\text{barrier}} = \{\text{PENDING}, \text{WAITING}, \text{PARTIALLY\_SATISFIED}, \text{SATISFIED}, \text{BLOCKED}, \text{FAILED}, \text{RELEASED}, \text{INVALIDATED}\}$$

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│              CANONICAL 8-STATE MACRO-ORCHESTRATOR BARRIER FSM                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [INITIAL]                                                                      │
│   • PENDING             : Instantiated dormant barrier upon graph compilation    │
│                                                                                  │
│   [ACTIVE / TRANSIENT]                                                           │
│   • WAITING             : Structurally eligible; actively awaiting branch events │
│   • PARTIALLY_SATISFIED : 0 < Completed Branches < Expected Branches             │
│   • SATISFIED           : Completed Branches == Expected Branches                │
│   • BLOCKED             : Backpressure state; progress halted without OS blocking│
│                                                                                  │
│   [LOCAL TERMINAL SINK]                                                          │
│   • RELEASED            : Release handoff dispatched; local immutable sink       │
│   • FAILED              : Terminal error encountered; locally contained failure  │
│                                                                                  │
│   [EXTERNAL RECEPTOR / QUARANTINED]                                              │
│   • INVALIDATED         : Rendered invalid by external macro ripple signal       │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Complete $8 \times 8$ Transition Matrix
Every transition pair $(S_{\text{from}}, S_{\text{to}}) \in \mathcal{S}_{\text{barrier}} \times \mathcal{S}_{\text{barrier}}$ is formally classified:

| Source State ($S_{\text{from}}$) | PENDING | WAITING | PARTIALLY_SATISFIED | SATISFIED | BLOCKED | FAILED | RELEASED | INVALIDATED |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **PENDING** | *IDEMPOTENT* | **VALID** ($T_{01}$) | ILLEGAL ($R_1$) | ILLEGAL ($R_1$) | ILLEGAL ($R_2$) | ILLEGAL ($R_3$) | ILLEGAL ($R_4$) | **VALID** ($T_{02}$) |
| **WAITING** | ILLEGAL ($R_5$) | *IDEMPOTENT* | **VALID** ($T_{03}$) | **VALID** ($T_{04}$) | **VALID** ($T_{05}$) | **VALID** ($T_{06}$) | ILLEGAL ($R_4$) | **VALID** ($T_{07}$) |
| **PARTIALLY_SATISFIED** | ILLEGAL ($R_5$) | ILLEGAL ($R_5$) | **VALID** ($T_{08}$) | **VALID** ($T_{09}$) | **VALID** ($T_{10}$) | **VALID** ($T_{11}$) | ILLEGAL ($R_4$) | **VALID** ($T_{12}$) |
| **SATISFIED** | ILLEGAL ($R_5$) | ILLEGAL ($R_5$) | ILLEGAL ($R_5$) | *IDEMPOTENT* | ILLEGAL ($R_6$) | **VALID** ($T_{13}$) | **VALID** ($T_{14}$) | ILLEGAL ($R_7$) |
| **BLOCKED** | ILLEGAL ($R_5$) | **VALID** ($T_{15}$) | **VALID** ($T_{16}$) | **VALID** ($T_{17}$) | *IDEMPOTENT* | **VALID** ($T_{18}$) | ILLEGAL ($R_4$) | **VALID** ($T_{19}$) |
| **FAILED** | ILLEGAL ($R_8$) | ILLEGAL ($R_8$) | ILLEGAL ($R_8$) | ILLEGAL ($R_8$) | ILLEGAL ($R_8$) | *TERMINAL* | ILLEGAL ($R_8$) | ILLEGAL ($R_8$) |
| **RELEASED** | ILLEGAL ($R_9$) | ILLEGAL ($R_9$) | ILLEGAL ($R_9$) | ILLEGAL ($R_9$) | ILLEGAL ($R_9$) | ILLEGAL ($R_9$) | *TERMINAL* | ILLEGAL ($R_9$) |
| **INVALIDATED** | ILLEGAL ($R_{10}$) | ILLEGAL ($R_{10}$) | ILLEGAL ($R_{10}$) | ILLEGAL ($R_{10}$) | ILLEGAL ($R_{10}$) | ILLEGAL ($R_{10}$) | ILLEGAL ($R_{10}$) | *TERMINAL* |

### 6.3 Transition Specification Table ($T_{01}$–$T_{19}$)

| ID | Transition Edge | Trigger Event | Guard Predicate ($\mathcal{P}_{\text{guard}}$) | Post-Condition & Effect |
| :---: | :--- | :--- | :--- | :--- |
| **$T_{01}$** | `PENDING` $\to$ `WAITING` | $\mathbf{e}_{\text{topo\_ready}}$ | $\text{StructuralEligibility}(v) == \text{TRUE}$ | Gateway activated; branch event monitoring begins; $C_{\text{completed}} := 0$. |
| **$T_{02}$** | `PENDING` $\to$ `INVALIDATED` | $\mathbf{e}_{\text{ripple\_invalidate}}$ | $\text{InvalidationSignalValid} == \text{TRUE}$ | Dormant barrier invalidated prior to activation; enters passive sink. |
| **$T_{03}$** | `WAITING` $\to$ `PARTIALLY_SATISFIED` | $\mathbf{e}_{\text{branch\_done}}$ | $(C_{\text{completed}} + 1 < C_{\text{expected}}) \land (C_{\text{expected}} > 1) \land \text{IsUniqueBranch}(i)$ | $C_{\text{completed}} := C_{\text{completed}} + 1$; partial progress recorded. |
| **$T_{04}$** | `WAITING` $\to$ `SATISFIED` | $\mathbf{e}_{\text{branch\_done}}$ | $(C_{\text{completed}} + 1 == C_{\text{expected}}) \land \text{IsUniqueBranch}(i)$ | $C_{\text{completed}} := C_{\text{completed}} + 1$; criteria met (direct for $C_{\text{expected}}=1$). |
| **$T_{05}$** | `WAITING` $\to$ `BLOCKED` | $\mathbf{e}_{\text{backpressure\_on}}$ | $\text{BackpressureAsserted} == \text{TRUE}$ | Halted due to capacity exhaustion or upstream stall; progress frozen ($C=0$). |
| **$T_{06}$** | `WAITING` $\to$ `FAILED` | $\mathbf{e}_{\text{fatal\_error}}$ | $\text{FatalCondition} == \text{TRUE}$ | Unrecoverable prerequisite abort; barrier transitions to local failure sink. |
| **$T_{07}$** | `WAITING` $\to$ `INVALIDATED` | $\mathbf{e}_{\text{ripple\_invalidate}}$ | $\text{InvalidationSignalValid} == \text{TRUE}$ | Active waiting barrier aborted by external ripple invalidation. |
| **$T_{08}$** | `PARTIALLY_SATISFIED` $\to$ `PARTIALLY_SATISFIED` | $\mathbf{e}_{\text{branch\_done}}$ | $(C_{\text{completed}} + 1 < C_{\text{expected}}) \land \text{IsUniqueBranch}(i)$ | $C_{\text{completed}} := C_{\text{completed}} + 1$; intermediate completion accumulated. |
| **$T_{09}$** | `PARTIALLY_SATISFIED` $\to$ `SATISFIED` | $\mathbf{e}_{\text{branch\_done}}$ | $(C_{\text{completed}} + 1 == C_{\text{expected}}) \land \text{IsUniqueBranch}(i)$ | $C_{\text{completed}} := C_{\text{expected}}$; final branch satisfied; readiness achieved. |
| **$T_{10}$** | `PARTIALLY_SATISFIED` $\to$ `BLOCKED` | $\mathbf{e}_{\text{backpressure\_on}}$ | $\text{BackpressureAsserted} == \text{TRUE}$ | Backpressure asserted during partial progress; $C_{\text{completed}}$ preserved. |
| **$T_{11}$** | `PARTIALLY_SATISFIED` $\to$ `FAILED` | $\mathbf{e}_{\text{fatal\_error}}$ | $\text{FatalCondition} == \text{TRUE}$ | Active branch failed fatally; barrier aborts into local failure sink. |
| **$T_{12}$** | `PARTIALLY_SATISFIED` $\to$ `INVALIDATED` | $\mathbf{e}_{\text{ripple\_invalidate}}$ | $\text{InvalidationSignalValid} == \text{TRUE}$ | Partially satisfied barrier aborted by external ripple invalidation. |
| **$T_{13}$** | `SATISFIED` $\to$ `FAILED` | $\mathbf{e}_{\text{fatal\_error}}$ | $\text{FatalCondition} == \text{TRUE}$ | Pre-release validation check failed; aborts into local failure sink. |
| **$T_{14}$** | `SATISFIED` $\to$ `RELEASED` | $\mathbf{e}_{\text{dispatch\_release}}$ | $(C_{\text{completed}} == C_{\text{expected}}) \land \text{ReleaseHandshakeReady}$ | Atomic release handoff executed; downstream nodes triggered; local sink entered. |
| **$T_{15}$** | `BLOCKED` $\to$ `WAITING` | $\mathbf{e}_{\text{backpressure\_off}}$ | $(\text{BackpressureCleared} == \text{TRUE}) \land (C_{\text{completed}} == 0)$ | Backpressure cleared; returns to active waiting state. |
| **$T_{16}$** | `BLOCKED` $\to$ `PARTIALLY_SATISFIED` | $\mathbf{e}_{\text{backpressure\_off}}$ | $(\text{BackpressureCleared} == \text{TRUE}) \land (0 < C_{\text{completed}} < C_{\text{expected}})$ | Backpressure cleared; resumes with preserved partial cardinality. |
| **$T_{17}$** | `BLOCKED` $\to$ `SATISFIED` | $\mathbf{e}_{\text{backpressure\_off}}$ | $(\text{BackpressureCleared} == \text{TRUE}) \land (C_{\text{completed}} == C_{\text{expected}})$ | Backpressure cleared while all branches completed; resumes to satisfaction. |
| **$T_{18}$** | `BLOCKED` $\to$ `FAILED` | $\mathbf{e}_{\text{fatal\_error}}$ | $\text{FatalCondition} == \text{TRUE}$ | Stalled barrier encounters fatal abort or timeout escalation; enters failure sink. |
| **$T_{19}$** | `BLOCKED` $\to$ `INVALIDATED` | $\mathbf{e}_{\text{ripple\_invalidate}}$ | $\text{InvalidationSignalValid} == \text{TRUE}$ | Blocked barrier aborted by external ripple invalidation. |

### 6.4 Architectural Rejection Rules ($R_1$–$R_{10}$)
* **$R_1$**: `PENDING` cannot jump directly to `PARTIALLY_SATISFIED` or `SATISFIED` without entering `WAITING`.
* **$R_2$**: `PENDING` cannot be `BLOCKED`; backpressure can only apply to an active, structurally eligible barrier.
* **$R_3$**: `PENDING` cannot fail prior to structural activation; compilation errors belong to DAG compilation time.
* **$R_4$**: `RELEASED` cannot be entered without satisfying $C_{\text{completed}} == C_{\text{expected}}$ through state `SATISFIED`.
* **$R_5$**: Active barriers cannot regress to `PENDING` or `WAITING` (except recovering from `BLOCKED` with $C=0$).
* **$R_6$**: A `SATISFIED` barrier cannot be `BLOCKED`; once full cardinality is reached, the barrier is frozen awaiting atomic release dispatch.
* **$R_7$**: In the standard local lifecycle, once a barrier is `SATISFIED`, release handoff is atomic. Any invalidation arriving post-satisfaction is handled under macro invalidation protocols (`WP-P14-03`), not local transitions.
* **$R_8$**: Once in `FAILED`, all transitions are strictly forbidden. The failure is immutable within the local DAG run.
* **$R_9$**: Once in `RELEASED`, all transitions are strictly forbidden. `RELEASED` $\to$ `INVALIDATED` is strictly prohibited locally.
* **$R_{10}$**: Once in `INVALIDATED`, the barrier is quarantined and cannot transition locally.

### 6.5 Theorem 6.1 (Multi-FSM Cartesian Orthogonality)
The global macro-orchestration execution state is a Cartesian product of four orthogonal state spaces:
$$\mathcal{S}_{\text{system}} = \mathcal{S}_{\text{barrier}} \times \mathcal{S}_{\text{task}} \times \mathcal{S}_{\text{slot}} \times \mathcal{S}_{\text{container}}$$
where:
* $\mathcal{S}_{\text{barrier}}$ is the 8-state Barrier FSM (`WP-P14-02-04`);
* $\mathcal{S}_{\text{task}}$ is the 15-state Task FSM (Phase 1.2);
* $\mathcal{S}_{\text{slot}}$ is the 5-state Concurrency Slot FSM (`WP-P14-02-03`);
* $\mathcal{S}_{\text{container}}$ is the 5-state Agent Container Turn FSM (Phase 1.3).

*Proof of Orthogonality*:
No transition in $\mathcal{S}_{\text{barrier}}$ directly mutates the state of a task in $\mathcal{S}_{\text{task}}$, a slot in $\mathcal{S}_{\text{slot}}$, or a container in $\mathcal{S}_{\text{container}}$. All cross-subsystem interactions occur strictly via discrete declarative event signals ($\mathbf{e}_{\text{dispatch\_release}}$, $\mathbf{e}_{\text{cancel\_intent}}$, $\mathbf{e}_{\text{backpressure\_on}}$). Because state transition functions evaluate strictly over independent state vectors, the composite state space exhibits zero transition interference, zero race ambiguity, and zero state aliasing. $\blacksquare$

---

## 7. Failure Propagation, Deadlock Prevention & Cancellation Governance

### 7.1 Failure Classification & Containment Invariant (`INV-FAULT-01`)
Faults occurring within inbound precursor branches $u \in \mathcal{B}_{\text{branches}}(b)$ are partitioned into:
1. **Single-Branch Fault**: $N_{\text{failed}}(b) + N_{\text{rejected}}(b) = 1$ and $N_{\text{total}}(b) > 1$.
2. **Partial Multi-Branch Fault**: $1 < N_{\text{failed}}(b) + N_{\text{rejected}}(b) < N_{\text{total}}(b)$.
3. **Total Branch Collapse**: $N_{\text{failed}}(b) + N_{\text{rejected}}(b) = N_{\text{total}}(b)$.

**Invariant INV-FAULT-01 (Deterministic Failure Containment):**
Failure propagation is strictly bounded to the topological transitive closure $\text{Reachable}(v_{\text{join}}, G)$. For any task node $w \in V$ such that $w \notin \text{Reachable}(v_{\text{join}}, G)$, the execution of $w$ and the state of $\mathcal{B}(w)$ are strictly independent of the failure of branch $u$. Sibling subgraphs execute to completion without interference.

### 7.2 Full Join Fault Aggregation Truth Table (Rows R01–R12)
The complete truth table maps all aggregate branch conditions to the canonical 8-state barrier FSM:

| Row | $N_{\text{completed}}$ | $N_{\text{rejected}}$ | $N_{\text{failed}}$ | $N_{\text{pending}}$ | $\text{CanSatisfy}$ | Prior State | Trigger Event | Resulting State | Transition | Semantic Meaning |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **R01** | $0$ | $0$ | $0$ | $= N$ | $\text{TRUE}$ | `PENDING` | $\mathbf{e}_{\text{topo\_ready}}$ | `WAITING` | $T_{01}$ | Initial barrier activation; awaiting branch execution. |
| **R02** | $> 0$ | $0$ | $0$ | $> 0$ | $\text{TRUE}$ | `WAITING` | $\mathbf{e}_{\text{branch\_done}}(\text{COMPL})$ | `PARTIALLY_SATISFIED` | $T_{03}$ | Normal progress: subset of branches completed. |
| **R03** | $> 0$ | $0$ | $0$ | $> 0$ | $\text{TRUE}$ | `PARTIALLY_SATISFIED` | $\mathbf{e}_{\text{branch\_done}}(\text{COMPL})$ | `PARTIALLY_SATISFIED` | $T_{08}$ | Intermediate branch completed; quorum not yet reached. |
| **R04** | $\ge K$ | $\ge 0$ | $\ge 0$ | $\ge 0$ | $\text{TRUE}$ | `PARTIALLY_SATISFIED` | $\mathbf{e}_{\text{branch\_done}}(\text{COMPL})$ | `SATISFIED` | $T_{09}$ | Quorum achieved: satisfaction condition fully met. |
| **R05** | $\ge K$ | $0$ | $0$ | $0$ | $\text{TRUE}$ | `WAITING` | $\mathbf{e}_{\text{branch\_done}}(\text{COMPL})$ | `SATISFIED` | $T_{04}$ | Single-branch join ($N=K=1$) immediately satisfies barrier. |
| **R06** | $< K$ | $> 0$ | $\ge 0$ | $> 0$ | $\text{TRUE}$ | `PARTIALLY_SATISFIED` | $\mathbf{e}_{\text{branch\_done}}(\text{REJ/FAIL})$ | `PARTIALLY_SATISFIED` | $T_{08}$ | Tolerant join: branch failed but quorum still mathematically achievable. |
| **R07** | $< K$ | $\ge 0$ | $\ge 0$ | $> 0$ | $\text{FALSE}$ | `PARTIALLY_SATISFIED` | $\mathbf{e}_{\text{branch\_done}}(\text{REJ/FAIL})$ | `BLOCKED` | $T_{10}$ | Quorum impossible while branches remain active; execution stalled. |
| **R08** | $< K$ | $\ge 0$ | $\ge 0$ | $> 0$ | $\text{FALSE}$ | `WAITING` | $\mathbf{e}_{\text{branch\_done}}(\text{REJ/FAIL})$ | `BLOCKED` | $T_{05}$ | Strict AND-join: first branch fails, stalling barrier awaiting resolution. |
| **R09** | $< K$ | $\ge 0$ | $\ge 0$ | $0$ | $\text{FALSE}$ | `PARTIALLY_SATISFIED` | $\mathbf{e}_{\text{branch\_done}}(\text{REJ/FAIL})$ | `FAILED` | $T_{11}$ | Terminal collapse: all branches ended, quorum unfulfilled. |
| **R10** | $< K$ | $\ge 0$ | $\ge 0$ | $0$ | $\text{FALSE}$ | `WAITING` | $\mathbf{e}_{\text{branch\_done}}(\text{REJ/FAIL})$ | `FAILED` | $T_{06}$ | Total immediate failure on single-branch or all-failed evaluation. |
| **R11** | $< K$ | $\ge 0$ | $\ge 0$ | $\ge 0$ | $\text{FALSE}$ | `BLOCKED` | $\mathbf{e}_{\text{fatal\_error}}(\tau_{\text{stall}})$ | `FAILED` | $T_{18}$ | Declarative timeout expires on stalled barrier, converting block to terminal fail. |
| **R12** | $\ge K$ | $\ge 0$ | $\ge 0$ | $\ge 0$ | $\text{TRUE}$ | `SATISFIED` | $\mathbf{e}_{\text{dispatch\_release}}$ | `RELEASED` | $T_{14}$ | Downstream dispatch unlocked; barrier permanently released. |

### 7.3 Declarative Non-Blocking Barrier Blocking Semantics (`INV-FAULT-02`)
The state `BLOCKED` is an **architectural ledger record** in the orchestrator log. It possesses **zero physical blocking characteristics**:
* Never causes an operating system thread to sleep, park, or block;
* Never acquires or holds an OS mutex, futex, semaphore, or lock;
* Never executes busy-wait loops or polling cycles;
* Signals declarative non-readiness to scheduling evaluators while keeping the engine 100% reactive.

### 7.4 Structural Deadlock Prevention Invariant (`INV-FAULT-03`)
To prove absence of deadlock, we define the composite wait graph across both topological dependencies and capacity wait states:
$$\mathcal{W} = (V, \mathcal{E}_{\text{topo}} \cup \mathcal{E}_{\text{slots}})$$
where:
* $\mathcal{E}_{\text{topo}} = E$: Directed DAG precedence edges;
* $\mathcal{E}_{\text{slots}} = \{ (x_i, x_j) \in V \times V \mid x_i \text{ is queued in } \mathcal{Q}_{\text{admit}} \text{ awaiting a slot held by } x_j \}$.

**Theorem 7.1 (Global Deadlock Freedom):**
$$\text{Cycles}(\mathcal{W}) = \emptyset$$
*Proof*:
1. By `WP-P14-01`, $\forall (u, v) \in \mathcal{E}_{\text{topo}} \implies \mathcal{L}(u) < \mathcal{L}(v)$.
2. Under admission ordering $\mathcal{O}_{\text{admission}}$, slots are committed strictly in non-decreasing topological layer order ($\mathcal{L}(x_j) \le \mathcal{L}(x_i)$). No task at level $\mathcal{L} > k$ can be admitted if any task at level $\mathcal{L} \le k$ is awaiting admission and capacity is saturated.
3. Therefore, along any directed slot-wait edge $(x_i, x_j) \in \mathcal{E}_{\text{slots}}$, $\mathcal{L}(x_j) \le \mathcal{L}(x_i)$.
4. Suppose there exists a directed cycle $C$ in $\mathcal{W}$. A cycle must contain at least one topological edge $(u, v) \in \mathcal{E}_{\text{topo}}$ (since $\mathcal{E}_{\text{slots}}$ edges between identical levels are resolved by deterministic lexicographical tie-breaking on `nodeId`).
5. Traversing cycle $C$, the topological level increases strictly along every $\mathcal{E}_{\text{topo}}$ edge ($\mathcal{L}(u) < \mathcal{L}(v)$) and remains non-increasing along every $\mathcal{E}_{\text{slots}}$ edge ($\mathcal{L}(x_j) \le \mathcal{L}(x_i)$).
6. Summing level differences around the cycle yields: $\sum_{e \in C} \Delta \mathcal{L} > 0$.
7. But for any closed cycle, the net level change must be exactly zero: $\sum_{e \in C} \Delta \mathcal{L} \equiv 0$.
8. Contradiction. Therefore, no cycle can exist in $\mathcal{W}$, guaranteeing structural deadlock freedom. $\blacksquare$

### 7.5 Anti-Starvation Guarantees (`INV-FAULT-04`)
For any structurally eligible task $v \in \mathcal{Q}_{\text{admit}}$, the elapsed admission wait time is strictly bounded:
$$t_{\text{admit}}(v) - t_0 \le N_{\text{ahead}} \cdot \tau_{\text{task\_max}} < \infty$$
where:
* $N_{\text{ahead}} = |\{ u \in \mathcal{Q}_{\text{admit}} \mid u \prec_{\mathcal{O}} v \}| < |V| < \infty$ is finite;
* Container contracts enforce a finite turn execution bound $\tau_{\text{task\_max}}$;
* Kahn layer ordering prevents newly spawned downstream tasks from preempting $v$.

### 7.6 Declarative Cancellation Intent & Container Autonomy (`INV-FAULT-06`)
Resolving `OBS-03`:
When a join barrier enters an unsatisfiable state (`BLOCKED` or `FAILED`):
1. It dispatches the declarative event $\mathbf{e}_{\text{cancel\_intent}}(b, \text{branchId}, \text{reason})$ to all still-pending branches $u \in \text{Pending}(b)$.
2. The event is an informative cancellation request, honoring Phase 1.3 container autonomy without sending destructive OS kill signals (`SIGKILL`).
3. Upon receiving $\mathbf{e}_{\text{cancel\_intent}}$, the agent container gracefully terminates its turn cycle and transitions the bound task in the Phase 1.2 Task FSM to `TASK_CANCELLED`.
4. The cancelled branch is observed by the barrier as terminal non-completion, releasing any reserved slot immediately and ensuring zero slot or quota leakage.

---

## 8. DAG Topology Interface Boundary & Functional Projections

### 8.1 Read-Only Interface Contract & Zero-Mutation Boundary
The interface contract with `WP-P14-01` DAG Topology is strictly read-only:
$$\Delta(G_{\text{P14-01}}) \equiv \emptyset \quad \text{and} \quad \Delta(\text{dag-graph-schema.json}) \equiv \emptyset$$

All topology queries are mathematical projections evaluated via purely functional read operators:
* $\text{GetInDegree}(v): V \longrightarrow \mathbb{N}_0$
* $\text{GetOutDegree}(v): V \longrightarrow \mathbb{N}_0$
* $\text{GetPredecessors}(v): V \longrightarrow \mathcal{P}(V)$
* $\text{GetSuccessors}(v): V \longrightarrow \mathcal{P}(V)$
* $\text{GetKahnLayer}(v): V \longrightarrow \mathbb{N}_0$
* $\text{GetNodePriority}(v): V \longrightarrow \mathbb{N}_0$

Zero mutation operators ($\text{AddEdge}, \text{RemoveEdge}, \text{SetNodeType}$) are exposed or invoked by the synchronization engine.

### 8.2 Invariant Verification Matrix for Invariants `I-01` through `I-08`
The synchronization engine preserves all topological invariants of `WP-P14-01`:

| Invariant | Title | Specification Requirement | WP-P14-02 Enforcement Mechanism | Verification Status |
| :---: | :--- | :--- | :--- | :---: |
| **`I-01`** | Direct Edge Acyclicity | Strict acyclicity $\text{Cycles}(G) = \emptyset$ | Read-only graph consumption; zero dynamic edge insertion | **PRESERVED** |
| **`I-02`** | Bijective Node-Task Binding | $\forall v \in V, \exists! w : v.\text{nodeId} \equiv \text{"NODE-"}+w.\text{taskId}$ | All barrier activations reference bound $v.\text{taskId}$ verbatim | **PRESERVED** |
| **`I-03`** | Stage Index Monotonicity | $(u, v) \in E \implies u.\text{stageIndex} \le v.\text{stageIndex}$ | Topological level progression respects stage ordering | **PRESERVED** |
| **`I-04`** | Single Connected Component | Workflow forms a single connected graph | Barrier release cascades flow along connected DAG components | **PRESERVED** |
| **`I-05`** | Bounded Gateway Cardinality | Fork $\text{outDegree} \ge 2$, Join $\text{inDegree} \ge 2$ | Validated prior to barrier instantiation ($\mathcal{M}_{\text{barrier}}$) | **PRESERVED** |
| **`I-06`** | Explicit Edge Typing | Edges classified as `DATA`, `CONTROL`, or `PIPELINE` | Barrier evaluation tracks prerequisite control dependencies | **PRESERVED** |
| **`I-07`** | Immutable Node Metadata | Node attributes immutable post-compilation | Barrier state stored in orthogonal orchestrator ledger | **PRESERVED** |
| **`I-08`** | Valid Schema Compliance | Strict compliance with `dag-graph-schema.json` | Zero schema modifications ($\Delta \equiv \emptyset$) | **PRESERVED** |

---

## 9. Cross-Module Reconciliation Synthesis & Cardinality Invariants

### 9.1 Synthesis of Ten Reconciliation Dimensions (R1–R10)
Module 07 (`REPORT-P14-02-RECONCILIATION`) established complete consistency across cleared modular specifications:
* **R1 (Terminology & Semantics)**: Harmonized formal vocabularies across fork, join, limiter, and state modules.
* **R2 (Data Interfaces & Schemas)**: Verified seamless handoffs between `BranchDescriptor`, `BarrierStateSnapshot`, `SlotAllocationToken`, and `FaultEventPayload`.
* **R3 (Cardinality Conservation)**: Verified exact mathematical closure ($N_{\text{total}} = N_{\text{comp}} + N_{\text{fail}} + N_{\text{rej}} + N_{\text{pend}}$).
* **R4 (Concurrency Limiter Alignment)**: Verified that structural eligibility release triggers queue insertion without premature execution.
* **R5 (State Space Orthogonality)**: Verified Theorem 6.1 multi-FSM Cartesian product without race conditions.
* **R6 (Fault Aggregation & Recovery)**: Verified that failure aggregation cleanly routes to `BLOCKED` or `FAILED` without deadlock.
* **R7 (Deadlock Prevention & Anti-Starvation)**: Verified Theorem 7.1 composite wait-graph acyclicity.
* **R8 (Upstream Immutability)**: Verified zero mutation of `WP-P14-01`, Phase 1.2, and Phase 1.3 baselines.
* **R9 (Downstream Hermeticism)**: Confirmed strict boundary locks around `WP-P14-03`, `WP-P14-04`, Phase 1.5, and Phase 1.6.
* **R10 (OAQ Quarantine)**: Confirmed strict isolation of `OAQ-SYNC-01`, `OAQ-SYNC-02`, and `OAQ-SYNC-03`.

### 9.2 Formal Disposition of Independent Audit Observations
This master specification explicitly incorporates and resolves all three advisory observations from `REPORT-EEOS-O-WP-P14-02-07-RECONCILIATION-INDEPENDENT-AUDIT-001`:

#### 9.2.1 OBS-01: FSM State Nomenclature Harmony
* **Audit Finding**: Directive summary text used informal colloquial labels (`INITIALIZED`, `SCHEDULED`, `FREE`, `COMMITTED`).
* **Disposition**: This master specification rigorously enforces the canonical formal vocabularies defined in authoritative specifications:
  - 8 Barrier States: $\mathcal{S}_{\text{barrier}} = \{\text{PENDING}, \text{WAITING}, \text{PARTIALLY\_SATISFIED}, \text{SATISFIED}, \text{BLOCKED}, \text{FAILED}, \text{RELEASED}, \text{INVALIDATED}\}$
  - 5 Concurrency Slot States: $\mathcal{S}_{\text{slot}} = \{\text{AVAILABLE}, \text{RESERVED}, \text{CLAIMED}, \text{RELEASED}, \text{FORFEITED}\}$
* **Result**: Zero colloquial labels are used in normative sections or transition tables.

#### 9.2.2 OBS-02: Authoritative Upstream Path Citation
* **Audit Finding**: Directive drafts cited competing workspace filenames for the `WP-P14-01` primary specification.
* **Disposition**: This master specification cites exclusively the single, authoritative, G1-cleared topological specification on disk:
  `docs/eeos-o/specs/phase-1.4/WP-P14-01-DAG-GRAPH-AND-TOPOLOGICAL-MODEL.md`
* **Result**: All path citations are verified against active disk artifacts.

#### 9.2.3 OBS-03: Cardinality Partition & Cancellation Semantics Formalization
* **Audit Finding**: Explanatory prose mentioned cancellation alongside the 4-term partition ($N_{\text{total}} = N_{\text{comp}} + N_{\text{fail}} + N_{\text{rej}} + N_{\text{pend}}$), requiring formal clarification of the role of cancellation.
* **Disposition**: Chapters 4, 7, and 9 explicitly formalize the mathematical distinction:
  1. The 4-term partition represents the **inbound observation domain** $\mathcal{O}_{\text{branch}} = \{\text{COMPLETED}, \text{FAILED}, \text{REJECTED}\}$ plus pending branches $N_{\text{pending}}$;
  2. Cancellation is a **downstream consequence**, emitted as declarative event $\mathbf{e}_{\text{cancel\_intent}}(b, \text{branchId}, \text{reason})$ to still-pending branches when a barrier enters `BLOCKED` or `FAILED`;
  3. Tasks receiving $\mathbf{e}_{\text{cancel\_intent}}$ transition in the Phase 1.2 Task FSM to `TASK_CANCELLED` and drain gracefully via Phase 1.3 container autonomy without corrupting barrier counting or slot quotas.
* **Result**: Mathematical closure is proven without ad-hoc token states or cardinality leakage.

---

## 10. Machine-Readable Barrier Contracts & Interface Schemas

### 10.1 Schema Distinction & Normative Boundary
The schemas defined in this chapter are **machine-readable JSON Schema (Draft 2020-12)** definitions formalizing the contract interfaces across orchestrator components. They represent normative architectural contracts, accompanied by illustrative instance payloads.

### 10.2 BranchDescriptor Schema
Used by Fork Barriers (`WP-P14-02-01`) to formalize outbound spawned branches:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://specs.darta.os/eeos-o/phase-1.4/branch-descriptor.schema.json",
  "title": "BranchDescriptor",
  "description": "Formal contract describing a spawned outbound branch from a DAG fork gateway.",
  "type": "object",
  "required": [
    "branchIndex",
    "gatewayNodeId",
    "targetNodeId",
    "targetTaskId",
    "branchContextRef"
  ],
  "additionalProperties": false,
  "properties": {
    "branchIndex": {
      "description": "Deterministic zero-based branch index assigned by topological sorting.",
      "type": "integer",
      "minimum": 0
    },
    "gatewayNodeId": {
      "description": "Canonical node identifier of the spawning fork gateway.",
      "type": "string",
      "pattern": "^NODE-[A-Za-z0-9_-]+$"
    },
    "targetNodeId": {
      "description": "Canonical node identifier of the branch entry task.",
      "type": "string",
      "pattern": "^NODE-[A-Za-z0-9_-]+$"
    },
    "targetTaskId": {
      "description": "Canonical Phase 1.2 task identifier bound to the target node.",
      "type": "string",
      "pattern": "^TASK-[A-Za-z0-9_-]+$"
    },
    "branchContextRef": {
      "description": "Opaque architectural reference URI to the immutable branch input context.",
      "type": "string",
      "format": "uri-reference"
    }
  }
}
```

*Illustrative Instance Payload:*
```json
{
  "branchIndex": 0,
  "gatewayNodeId": "NODE-GW-FORK-01",
  "targetNodeId": "NODE-TASK-ANALYZE-A",
  "targetTaskId": "TASK-ANALYZE-A",
  "branchContextRef": "urn:eeos-o:context:run-4012:node-gw-fork-01:branch-0"
}
```

### 10.3 BarrierStateSnapshot Schema
Used by the Barrier State Machine (`WP-P14-02-04`) to record orchestrator ledger state snapshots:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://specs.darta.os/eeos-o/phase-1.4/barrier-state-snapshot.schema.json",
  "title": "BarrierStateSnapshot",
  "description": "Formal architectural ledger snapshot of an active or terminal synchronization barrier.",
  "type": "object",
  "required": [
    "barrierId",
    "gatewayNodeId",
    "barrierType",
    "state",
    "cardinalityExpected",
    "cardinalityCompleted",
    "cardinalityFailed",
    "cardinalityRejected",
    "cardinalityPending",
    "timestampIso"
  ],
  "additionalProperties": false,
  "properties": {
    "barrierId": {
      "type": "string",
      "pattern": "^BARRIER-[A-Za-z0-9_-]+$"
    },
    "gatewayNodeId": {
      "type": "string",
      "pattern": "^NODE-[A-Za-z0-9_-]+$"
    },
    "barrierType": {
      "type": "string",
      "enum": ["FORK_BARRIER", "JOIN_BARRIER"]
    },
    "state": {
      "type": "string",
      "enum": [
        "PENDING",
        "WAITING",
        "PARTIALLY_SATISFIED",
        "SATISFIED",
        "BLOCKED",
        "FAILED",
        "RELEASED",
        "INVALIDATED"
      ]
    },
    "cardinalityExpected": {
      "type": "integer",
      "minimum": 1
    },
    "cardinalityCompleted": {
      "type": "integer",
      "minimum": 0
    },
    "cardinalityFailed": {
      "type": "integer",
      "minimum": 0
    },
    "cardinalityRejected": {
      "type": "integer",
      "minimum": 0
    },
    "cardinalityPending": {
      "type": "integer",
      "minimum": 0
    },
    "timestampIso": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

*Illustrative Instance Payload:*
```json
{
  "barrierId": "BARRIER-P14-02-JOIN-0042",
  "gatewayNodeId": "NODE-GW-JOIN-07",
  "barrierType": "JOIN_BARRIER",
  "state": "PARTIALLY_SATISFIED",
  "cardinalityExpected": 4,
  "cardinalityCompleted": 2,
  "cardinalityFailed": 0,
  "cardinalityRejected": 0,
  "cardinalityPending": 2,
  "timestampIso": "2026-10-12T07:15:00.000Z"
}
```

### 10.4 SlotAllocationToken Schema
Used by the Concurrency Limiter (`WP-P14-02-03`) to manage tenant execution slot reservations:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://specs.darta.os/eeos-o/phase-1.4/slot-allocation-token.schema.json",
  "title": "SlotAllocationToken",
  "description": "Formal contract token governing admission slot reservation and claiming.",
  "type": "object",
  "required": [
    "tokenId",
    "slotId",
    "tenantId",
    "taskId",
    "nodeId",
    "slotState",
    "allocatedAtIso",
    "claimTimeoutSeconds"
  ],
  "additionalProperties": false,
  "properties": {
    "tokenId": {
      "type": "string",
      "pattern": "^TOKEN-SLOT-[A-Za-z0-9_-]+$"
    },
    "slotId": {
      "type": "string",
      "pattern": "^SLOT-[A-Za-z0-9_-]+$"
    },
    "tenantId": {
      "type": "string",
      "pattern": "^TENANT-[A-Za-z0-9_-]+$"
    },
    "taskId": {
      "type": "string",
      "pattern": "^TASK-[A-Za-z0-9_-]+$"
    },
    "nodeId": {
      "type": "string",
      "pattern": "^NODE-[A-Za-z0-9_-]+$"
    },
    "slotState": {
      "type": "string",
      "enum": ["AVAILABLE", "RESERVED", "CLAIMED", "RELEASED", "FORFEITED"]
    },
    "allocatedAtIso": {
      "type": "string",
      "format": "date-time"
    },
    "claimTimeoutSeconds": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

*Illustrative Instance Payload:*
```json
{
  "tokenId": "TOKEN-SLOT-20261012-0941",
  "slotId": "SLOT-PESANTREN-01-04",
  "tenantId": "TENANT-PESANTREN-ALFALAH",
  "taskId": "TASK-COMPILE-REPORT-08",
  "nodeId": "NODE-TASK-COMPILE-REPORT-08",
  "slotState": "RESERVED",
  "allocatedAtIso": "2026-10-12T07:15:30.000Z",
  "claimTimeoutSeconds": 30
}
```

### 10.5 FaultEventPayload Schema
Used by Failure Propagation & Deadlock Governance (`WP-P14-02-05`) for diagnostic observability:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://specs.darta.os/eeos-o/phase-1.4/fault-event-payload.schema.json",
  "title": "FaultEventPayload",
  "description": "Declarative non-cryptographic diagnostic telemetry emitted upon barrier failure or stall.",
  "type": "object",
  "required": [
    "eventType",
    "barrierId",
    "gatewayNodeId",
    "sourceState",
    "targetState",
    "faultCategory",
    "errorCode",
    "causalNodeId",
    "timestampIso"
  ],
  "additionalProperties": false,
  "properties": {
    "eventType": {
      "type": "string",
      "enum": ["EVENT_BARRIER_FAILED", "EVENT_BARRIER_BLOCKED", "EVENT_CONCURRENCY_SATURATED"]
    },
    "barrierId": {
      "type": "string",
      "pattern": "^BARRIER-[A-Za-z0-9_-]+$"
    },
    "gatewayNodeId": {
      "type": "string",
      "pattern": "^NODE-[A-Za-z0-9_-]+$"
    },
    "sourceState": {
      "type": "string",
      "enum": ["PENDING", "WAITING", "PARTIALLY_SATISFIED", "SATISFIED", "BLOCKED"]
    },
    "targetState": {
      "type": "string",
      "enum": ["BLOCKED", "FAILED"]
    },
    "faultCategory": {
      "type": "string",
      "enum": ["SINGLE_FAULT", "PARTIAL_FAULT", "TOTAL_COLLAPSE", "CAPACITY_SATURATION", "SLA_TIMEOUT"]
    },
    "errorCode": {
      "type": "string",
      "pattern": "^ERR_[A-Za-z0-9_]+$"
    },
    "causalNodeId": {
      "type": "string",
      "pattern": "^NODE-[A-Za-z0-9_-]+$"
    },
    "timestampIso": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

*Illustrative Instance Payload:*
```json
{
  "eventType": "EVENT_BARRIER_FAILED",
  "barrierId": "BARRIER-P14-02-JOIN-0042",
  "gatewayNodeId": "NODE-GW-JOIN-07",
  "sourceState": "BLOCKED",
  "targetState": "FAILED",
  "faultCategory": "SLA_TIMEOUT",
  "errorCode": "ERR_JOIN_BARRIER_STALLED",
  "causalNodeId": "NODE-TASK-BRANCH-B",
  "timestampIso": "2026-10-12T07:16:00.000Z"
}
```

---

## 11. Unified Invariant Catalogue & Error Taxonomy

### 11.1 Master Invariant Registry
The table below compiles all authoritative invariants across the `WP-P14-02` synchronization engine:

```text
┌─────────────────┬─────────────────────────────────────────────────┬───────────────────┐
│ Invariant Code  │ Title & Architectural Mandate                   │ Source Instrument │
├─────────────────┼─────────────────────────────────────────────────┼───────────────────┤
│ INV-FORK-01     │ Branch Index Uniqueness (β_i ≠ β_j for i ≠ j)   │ SPEC-P14-02-01 §8 │
│ INV-FORK-02     │ Contiguous Branch Domain ([0, k_fork - 1])      │ SPEC-P14-02-01 §8 │
│ INV-FORK-03     │ Gateway Precondition Monotonicity               │ SPEC-P14-02-01 §10│
│ INV-FORK-04     │ Deterministic Branch Evaluation Complexity O(k) │ SPEC-P14-02-01 §12│
│ INV-FORK-05     │ Sibling Parallel Branch Failure Isolation       │ SPEC-P14-02-01 §13│
├─────────────────┼─────────────────────────────────────────────────┼───────────────────┤
│ INV-JOIN-01     │ Inbound Fan-In Cardinality Binding (k_in ≥ 2)   │ SPEC-P14-02-02 §5 │
│ INV-JOIN-02     │ Predecessor Context Reference Non-Null          │ SPEC-P14-02-02 §6 │
│ INV-JOIN-03     │ Monotonic Cardinality Accumulation              │ SPEC-P14-02-02 §7 │
│ INV-JOIN-04     │ Decoupling of SATISFIED from RELEASED           │ SPEC-P14-02-02 §8 │
│ INV-JOIN-05     │ Declarative Anti-Stall Escalation (τ_stall)     │ SPEC-P14-02-02 §9 │
├─────────────────┼─────────────────────────────────────────────────┼───────────────────┤
│ INV-LIMIT-01    │ Global Committed Capacity Conservation          │ SPEC-P14-02-03 §8 │
│ INV-LIMIT-02    │ Multi-Tenant Quota Isolation (|S| ≤ C_tenant)   │ SPEC-P14-02-03 §8 │
│ INV-LIMIT-03    │ Structural Eligibility vs Admission Decoupling  │ SPEC-P14-02-03 §8 │
│ INV-LIMIT-04    │ Deterministic Admission Total Order (O_admit)   │ SPEC-P14-02-03 §8 │
│ INV-LIMIT-05    │ Single Concurrency Slot Assignment              │ SPEC-P14-02-03 §8 │
│ INV-LIMIT-06    │ Terminal Slot Reclamation & Recycling           │ SPEC-P14-02-03 §8 │
│ INV-LIMIT-07    │ Reservation Timeout Boundedness (τ_timeout)     │ SPEC-P14-02-03 §8 │
│ INV-LIMIT-08    │ Zero Physical Implementation Budget (0 Bytes)   │ SPEC-P14-02-03 §8 │
├─────────────────┼─────────────────────────────────────────────────┼───────────────────┤
│ INV-STATE-01    │ Canonical 8-State Mutex Invariant               │ SPEC-P14-02-04 §5 │
│ INV-STATE-02    │ Structural Entry Precondition Invariant         │ SPEC-P14-02-04 §5 │
│ INV-STATE-03    │ Cardinality Monotonicity & Satisfaction Guard   │ SPEC-P14-02-04 §5 │
│ INV-STATE-04    │ Declarative Non-Blocking Backpressure Semantics │ SPEC-P14-02-04 §5 │
│ INV-STATE-05    │ Local Sink Terminality of RELEASED              │ SPEC-P14-02-04 §5 │
│ INV-STATE-06    │ Local Failure Containment Invariant             │ SPEC-P14-02-04 §5 │
│ INV-STATE-07    │ Passive Invalidation Ingress Invariant          │ SPEC-P14-02-04 §5 │
│ INV-STATE-08    │ Orthogonal State Space Invariance (Theorem 6.1) │ SPEC-P14-02-04 §5 │
├─────────────────┼─────────────────────────────────────────────────┼───────────────────┤
│ INV-FAULT-01    │ Deterministic Failure Containment Boundary      │ SPEC-P14-02-05 §5 │
│ INV-FAULT-02    │ Declarative Non-Blocking Barrier Blocking       │ SPEC-P14-02-05 §7 │
│ INV-FAULT-03    │ Structural Deadlock Prevention (Cycles(W) = ∅)  │ SPEC-P14-02-05 §9 │
│ INV-FAULT-04    │ Architectural Anti-Starvation Guarantees        │ SPEC-P14-02-05 §10│
│ INV-FAULT-05    │ Declarative SLA Timeout Boundaries              │ SPEC-P14-02-05 §11│
│ INV-FAULT-06    │ Container Sovereign Cancellation Boundaries     │ SPEC-P14-02-05 §12│
├─────────────────┼─────────────────────────────────────────────────┼───────────────────┤
│ INV-TOPO-01..08 │ Preservation of P14-01 Invariants I-01..I-08    │ SPEC-P14-02-06 §8 │
├─────────────────┼─────────────────────────────────────────────────┼───────────────────┤
│ INV-RECON-01    │ Four-Term Cardinality Conservation Law          │ REPORT-RECON §8.2 │
│ INV-RECON-02    │ Static Upstream Model Immutability (Δ ≡ ∅)      │ REPORT-RECON §8.3 │
│ INV-RECON-03    │ OAQ-SYNC-01..03 Strict Quarantine Preservation  │ REPORT-RECON §8.4 │
└─────────────────┴─────────────────────────────────────────────────┴───────────────────┘
```

### 11.2 Exhaustive Error Taxonomy (`ERR-SYNC-*`)

| Error Code | Severity | Triggering Condition | Subsystem Origin | Expected Architectural Handling |
| :--- | :---: | :--- | :--- | :--- |
| **`ERR_FORK_INVALID_GATEWAY_TYPE`** | BLOCKING | Instantiating fork barrier on non-`FORK_GATEWAY` node | Fork (`SPEC-01`) | Abort barrier instantiation; emit validation fault |
| **`ERR_FORK_INVALID_CARDINALITY`** | BLOCKING | Outbound branch cardinality $k_{\text{fork}} < 2$ | Fork (`SPEC-01`) | Reject node execution; abort DAG execution |
| **`ERR_FORK_INDEX_COLLISION`** | CRITICAL | Duplicate branch index detected ($\beta_i = \beta_j$) | Fork (`SPEC-01`) | Halt fork registration; emit algorithmic failure |
| **`ERR_FORK_INDEX_DISCONTINUITY`** | CRITICAL | Branch indices do not form contiguous $[0, k-1]$ | Fork (`SPEC-01`) | Halt fork registration; emit algorithmic failure |
| **`ERR_FORK_BARRIER_STALLED`** | MAJOR | Fork barrier blocked exceeding stall threshold $\tau_{\text{stall}}$ | Fork (`SPEC-01`) | Emit escalation signal to macro control plane |
| **`ERR_JOIN_BARRIER_STALLED`** | MAJOR | Join barrier waiting/partial duration exceeds $\tau_{\text{stall}}$ | Join (`SPEC-02`) | Transition to `BLOCKED`; emit escalation alert |
| **`ERR_JOIN_PREDECESSOR_FAILED`** | MAJOR | Inbound predecessor branch reports `FAILED` | Join (`SPEC-02`) | Transition barrier to `BLOCKED` or `FAILED`; isolate siblings |
| **`ERR_JOIN_CARDINALITY_MISMATCH`** | BLOCKING | Initialized member count $|\mathcal{M}_{\text{in}}| \neq \text{inDegree}(v)$ | Join (`SPEC-02`) | Abort instantiation; emit structural integrity error |
| **`ERR_JOIN_CONTEXT_UNBOUND`** | MAJOR | Predecessor flags `COMPLETED` but context ref is null | Join (`SPEC-02`) | Reject member completion; transition to `BLOCKED` |
| **`ERR_SLOT_CAPACITY_EXHAUSTED`** | ADVISORY | Tenant or global capacity pool saturated | Limiter (`SPEC-03`) | Emit $\mathbf{e}_{\text{backpressure\_on}}$; queue task in $\mathcal{Q}_{\text{admit}}$ |
| **`ERR_SLOT_RESERVATION_TIMEOUT`** | MAJOR | Task fails to claim reserved slot within $\tau_{\text{claim\_timeout}}$ | Limiter (`SPEC-03`) | Transition slot to `FORFEITED` $\to$ `AVAILABLE`; forfeit task |
| **`ERR_TENANT_QUOTA_BREACH`** | CRITICAL | Tenant attempt to commit slots exceeding $C_{\text{tenant}}$ | Limiter (`SPEC-03`) | Reject admission request; maintain quota ceiling |
| **`ERR_ILLEGAL_STATE_TRANSITION`** | BLOCKING | Attempted transition violating rules $R_1$–$R_{10}$ | State (`SPEC-04`) | Reject transition; maintain current state; emit alert |
| **`ERR_MUTATION_TERMINAL_SINK`** | BLOCKING | Attempted mutation of barrier in `RELEASED` or `FAILED` | State (`SPEC-04`) | Reject mutation; enforce immutable terminal sink |
| **`ERR_CARDINALITY_OVERFLOW`** | CRITICAL | Inbound arrivals exceed $C_{\text{expected}}$ ($C > k_{\text{in}}$) | State (`SPEC-04`) | Transition to `FAILED`; emit cardinality breach |
| **`ERR_DEADLOCK_CYCLE_DETECTED`** | FATAL | Cycle detected in runtime scheduling wait graph | Fault (`SPEC-05`) | Trigger emergency orchestrator DAG fail-stop |
| **`ERR_STARVATION_BOUND_EXCEEDED`**| MAJOR | Queued task wait time exceeds finite anti-starvation bound | Fault (`SPEC-05`) | Escalate queue priority; inspect tenant saturation |
| **`ERR_BARRIER_SLA_TIMEOUT`** | MAJOR | Stalled barrier in `BLOCKED` exceeds SLA threshold | Fault (`SPEC-05`) | Transition `BLOCKED` $\to$ `FAILED` ($T_{18}$); emit cancellations |
| **`ERR_TOPOLOGY_DISCONNECTED`** | BLOCKING | Precedence edge $(u, v)$ missing or corrupted in DAG | Topo (`SPEC-06`) | Halt evaluation; emit structural disconnection error |
| **`ERR_GATEWAY_DEGREE_VIOLATION`** | BLOCKING | Gateway node degree violates topological classification | Topo (`SPEC-06`) | Reject gateway instantiation; abort run |
| **`ERR_TOPOLOGY_MUTATION_PROHIBITED`**| FATAL | Runtime service attempts to mutate static graph $G$ | Topo (`SPEC-06`) | Immediate hard stop; preserve upstream immutability |

---

## 12. Synthetic Architectural Verification Scenarios

### 12.1 Scenarios Framing & Non-Executable Nature
The ten (10) review test cases below (`RVE-01` through `RVE-10`) are **static architectural review scenarios** designed to verify mathematical determinism, failure isolation, and invariant preservation. In compliance with the strict 0-byte implementation budget, these scenarios are purely documentary and do NOT contain executable code, runnable tests, or test harnesses.

### 12.2 Scenario Catalogue (RVE-01 through RVE-10)

#### RVE-01: Standard 1-to-N Fork Fan-Out & Deterministic Branch Spawning
* **Objective**: Verify deterministic branch generation and release gating at a fork gateway.
* **Initial Conditions**: DAG node $v$ is `FORK_GATEWAY` with $k_{\text{fork}} = 3$. Predecessor task $u \in \text{Pred}(v)$ completes successfully.
* **Execution Events**:
  1. $\mathbf{e}_{\text{topo\_ready}}$ received $\implies$ Barrier transitions `PENDING` $\to$ `WAITING` ($T_{01}$).
  2. Branch registration initiates $\implies$ Branches $\beta_0, \beta_1, \beta_2$ indexed by $(\text{priority}, \text{nodeId})$.
  3. Incremental registration $\implies$ Transitions `WAITING` $\to$ `PARTIALLY_SATISFIED` ($T_{03}$) $\to$ `PARTIALLY_SATISFIED` ($T_{08}$).
  4. Gateway task execution finishes $\implies$ Transition to `SATISFIED` ($T_{09}$).
  5. $\mathbf{e}_{\text{dispatch\_release}}$ dispatched $\implies$ Transition to `RELEASED` ($T_{14}$).
* **Expected Outcome**: All 3 branches assigned unique, contiguous indices $[0, 1, 2]$. Target nodes marked `ELIGIBLE`. Barrier enters local terminal sink `RELEASED`.
* **Invariants Exercised**: `INV-FORK-01`, `INV-FORK-02`, `INV-FORK-03`, `INV-STATE-01`, `INV-STATE-05`.
* **Traceability**: `SPEC-P14-02-01` §8, §14.

#### RVE-02: Strict N-to-1 Join Barrier Convergence (AND-Join)
* **Objective**: Verify full satisfaction and atomic release gating for convergent branches.
* **Initial Conditions**: DAG node $v$ is `JOIN_GATEWAY` with $k_{\text{in}} = 3$ ($C_{\text{expected}} = 3$). Strict AND-join policy ($K=3$).
* **Execution Events**:
  1. Topological activation $\implies$ Barrier transitions `PENDING` $\to$ `WAITING` ($T_{01}$), $N_{\text{pending}} = 3$.
  2. Branch 0 completes $\implies$ Transitions `WAITING` $\to$ `PARTIALLY_SATISFIED` ($T_{03}$), $N_{\text{comp}} = 1, N_{\text{pend}} = 2$.
  3. Branch 1 completes $\implies$ Re-evaluates `PARTIALLY_SATISFIED` ($T_{08}$), $N_{\text{comp}} = 2, N_{\text{pend}} = 1$.
  4. Branch 2 completes $\implies$ Transitions to `SATISFIED` ($T_{09}$), $N_{\text{comp}} = 3, N_{\text{pend}} = 0$.
  5. Dispatch command issued $\implies$ Transitions `SATISFIED` $\to$ `RELEASED` ($T_{14}$).
* **Expected Outcome**: Barrier releases downstream target task only after all 3 branches report completion. Decoupling of `SATISFIED` from `RELEASED` verified.
* **Invariants Exercised**: `INV-JOIN-01`, `INV-JOIN-03`, `INV-JOIN-04`, `INV-STATE-03`, `INV-STATE-05`.
* **Traceability**: `SPEC-P14-02-02` §7, §8.

#### RVE-03: Single-Branch Failure in Multi-Branch Join & Declarative Cancellation
* **Objective**: Verify failure containment and cancellation event emission upon branch failure.
* **Initial Conditions**: Join barrier $b$ with $k_{\text{in}} = 3$, strict AND-join ($K=3$). Sibling branches $\text{Branch}_0, \text{Branch}_1, \text{Branch}_2$ executing concurrently.
* **Execution Events**:
  1. $\text{Branch}_0$ completes successfully ($N_{\text{comp}} = 1, N_{\text{pend}} = 2$) $\implies$ Barrier in `PARTIALLY_SATISFIED`.
  2. $\text{Branch}_1$ encounters fatal task error $\implies$ Emits $\mathbf{e}_{\text{branch\_done}}(\text{FAILED})$.
  3. Quorum check evaluates $\text{CanSatisfy}(b) == \text{FALSE}$ while $N_{\text{pend}} = 1$ ($\text{Branch}_2$ still running).
  4. Row R07 triggers: Barrier transitions `PARTIALLY_SATISFIED` $\to$ `BLOCKED` ($T_{10}$).
  5. Barrier emits $\mathbf{e}_{\text{cancel\_intent}}(b, \text{Branch}_2, \text{PREDECESSOR\_FAILED})$ to running $\text{Branch}_2$.
  6. $\text{Branch}_2$ terminates turn gracefully $\implies$ Transition to `TASK_CANCELLED` in Task FSM.
  7. All branches terminated $\implies$ Row R09 triggers: Barrier transitions `BLOCKED` $\to$ `FAILED` ($T_{18}$).
* **Expected Outcome**: Join failure contained locally; barrier terminates in `FAILED`; $\text{Branch}_2$ cancelled without OS thread interruption; 4-term cardinality conserved: $N_{\text{total}} = 1 + 1 + 0 + 1 = 3$.
* **Invariants Exercised**: `INV-FAULT-01`, `INV-FAULT-02`, `INV-FAULT-06`, `INV-STATE-06`, `INV-RECON-01`.
* **Traceability**: `SPEC-P14-02-05` §5, §6, §12.

#### RVE-04: Tenant Concurrency Slot Saturation & Non-Blocking Backpressure
* **Objective**: Verify multi-tenant quota ceiling enforcement and backpressure event emission.
* **Initial Conditions**: Tenant $T_A$ has quota $C_{\text{tenant}}(T_A) = 2$. Currently, 2 tasks hold slots in state `CLAIMED` ($|\mathbf{S}_{\text{committed}}(T_A)| = 2$).
* **Execution Events**:
  1. Upstream join barrier releases task $w$ belonging to $T_A$ $\implies \sigma_{\text{struct}}(w) = \text{ELIGIBLE}$.
  2. Admission evaluated $\implies \text{CanAdmit}(w, T_A)$ evaluates to `FALSE` (quota saturated).
  3. Task $w$ inserted into admission queue $\mathcal{Q}_{\text{admit}}$ with $\sigma_{\text{admit}}(w) = \text{QUEUED}$.
  4. Limiter emits $\mathbf{e}_{\text{backpressure\_on}}$ (`EVENT_CONCURRENCY_SATURATED`).
  5. Running task $u$ terminates $\implies$ Slot transitions `CLAIMED` $\to$ `RELEASED` $\to$ `AVAILABLE` ($|\mathbf{S}_{\text{committed}}| := 1$).
  6. Limiter emits $\mathbf{e}_{\text{backpressure\_off}}$ and evaluates $\mathcal{Q}_{\text{admit}}$.
  7. Task $w$ (at head of $T_A$ queue) allocated slot $\implies$ Slot transitions $\text{AVAILABLE} \to \text{RESERVED}$.
* **Expected Outcome**: Tenant quota never exceeds 2 slots (`INV-LIMIT-02`). Structural eligibility decoupled from admission. Backpressure asserted without thread blocking.
* **Invariants Exercised**: `INV-LIMIT-01`, `INV-LIMIT-02`, `INV-LIMIT-03`, `INV-FAULT-02`.
* **Traceability**: `SPEC-P14-02-03` §5, §6.

#### RVE-05: Multi-Tenant Fair Scheduling & Queue-Head Priority Invariant
* **Objective**: Verify that tenant admission queues are isolated and prevent cross-tenant starvation.
* **Initial Conditions**: Two tenants $T_A, T_B$. $T_A$ quota saturated ($|\mathbf{S}_{\text{committed}}| = C_A$); $T_B$ quota has capacity ($|\mathbf{S}_{\text{committed}}| < C_B$).
* **Execution Events**:
  1. $T_A$ tasks $w_{A1}, w_{A2}$ are queued in $\mathcal{Q}_{\text{admit}}$ with Kahn layer $\mathcal{L} = 1$.
  2. $T_B$ task $w_{B1}$ arrives with Kahn layer $\mathcal{L} = 2$.
  3. Global scheduler evaluates candidate tasks.
  4. Although $w_{A1}$ has lower Kahn level, $T_A$ is saturated. $\text{CanAdmit}(w_{A1}, T_A) == \text{FALSE}$.
  5. $T_B$ has available quota. $\text{IsTenantQueueHead}(w_{B1}, \mathcal{Q}_{\text{admit}}, T_B) == \text{TRUE}$.
  6. Task $w_{B1}$ is admitted and reserved a slot in $T_B$'s pool.
* **Expected Outcome**: Saturation of Tenant A does not block or starve Tenant B. Per-tenant queue head isolation preserves independent scheduling velocity.
* **Invariants Exercised**: `INV-LIMIT-02`, `INV-LIMIT-04`, `INV-FAULT-04`.
* **Traceability**: `SPEC-P14-02-03` §6.2, §8.

#### RVE-06: Sibling Branch Execution under Local Fault Isolation
* **Objective**: Verify that failure in one sub-graph branch does not affect disconnected parallel subgraphs.
* **Initial Conditions**: Root fork gateway spawns Branch A (nodes $A_1 \to A_2 \to \text{Join}_A$) and Branch B (nodes $B_1 \to B_2 \to \text{Join}_B$), converging at separate join nodes.
* **Execution Events**:
  1. Both branches spawned successfully.
  2. Node $A_1$ encounters unrecoverable failure $\implies A_1$ enters `FAILED`.
  3. Failure propagates along causal edges to $\text{Join}_A \implies \text{Join}_A$ enters `FAILED`.
  4. Node $B_1$ and $B_2$ continue executing concurrently on independent agent containers.
  5. Node $B_2$ completes successfully $\implies \text{Join}_B$ reaches `SATISFIED` and releases.
* **Expected Outcome**: Failure of Branch A has zero effect on Branch B. $\Delta(\text{Execution}(B)) \equiv \emptyset$. Local failure containment verified.
* **Invariants Exercised**: `INV-FAULT-01`, `INV-FORK-05`, `INV-STATE-06`.
* **Traceability**: `SPEC-P14-02-05` §5.3.

#### RVE-07: Barrier Stalling & SLA Timeout Escalation to FAILED
* **Objective**: Verify declarative SLA timeout escalation on stalled join barriers without runtime daemons.
* **Initial Conditions**: Join barrier $b$ in state `BLOCKED` awaiting missing predecessor context ($\text{CanSatisfy} == \text{FALSE}, N_{\text{pend}} > 0$).
* **Execution Events**:
  1. Barrier records entry timestamp $t_{\text{blocked}}$ in orchestrator ledger.
  2. Duration in blocked state exceeds declarative SLA threshold: $\Delta t > \tau_{\text{stall\_threshold}}$.
  3. Macro-orchestrator evaluation pass detects SLA threshold expiration.
  4. Declarative signal $\mathbf{e}_{\text{timeout\_escalated}}$ dispatched to barrier.
  5. Row R11 triggers: Barrier executes transition $T_{18}$: `BLOCKED` $\to$ `FAILED`.
  6. Diagnostic payload emitted: `errorCode: ERR_JOIN_BARRIER_STALLED`.
* **Expected Outcome**: Stalled barrier converts deterministically to terminal `FAILED`. Operating system threads remain non-blocking. Downstream tasks prevented from executing.
* **Invariants Exercised**: `INV-FAULT-02`, `INV-FAULT-05`, `INV-STATE-05`.
* **Traceability**: `SPEC-P14-02-05` §6.2, §11.

#### RVE-08: Composite Fork-Join Diamond Graph Synchronization
* **Objective**: Verify cardinality conservation and state transitions across a complete diamond graph ($u \to \{v_0, v_1, v_2\} \to w$).
* **Initial Conditions**: Root task $u$ forks into 3 parallel branches $v_0, v_1, v_2$, converging at join gateway $w$.
* **Execution Events**:
  1. $u$ completes $\implies$ Fork barrier $\mathcal{B}_{\text{fork}}(u)$ satisfies and releases branches $\beta_0, \beta_1, \beta_2$ ($C_{\text{fork}} = 3$).
  2. Join barrier $\mathcal{B}_{\text{join}}(w)$ initializes with $C_{\text{expected}} = 3$.
  3. Branches execute in arbitrary completion order (e.g., $v_1$, then $v_2$, then $v_0$).
  4. $\mathcal{B}_{\text{join}}(w)$ tracks arrivals monotonically: $N_{\text{comp}} = 1 \to 2 \to 3$.
  5. Upon arrival of $v_0$, $N_{\text{comp}} == C_{\text{expected}} == 3 \implies \mathcal{B}_{\text{join}}(w)$ transitions to `SATISFIED`.
  6. Release handoff dispatched $\implies \mathcal{B}_{\text{join}}(w)$ transitions to `RELEASED`.
* **Expected Outcome**: Fan-out cardinality equals fan-in cardinality ($C_{\text{fork}} \equiv C_{\text{expected}} = 3$). Diamond synchronizes deterministically regardless of branch completion interleaving.
* **Invariants Exercised**: `INV-FORK-01`, `INV-JOIN-01`, `INV-JOIN-03`, `INV-RECON-01`.
* **Traceability**: `REPORT-P14-02-RECONCILIATION` §8.1.

#### RVE-09: Ripple Invalidation Arrival on Unreleased Barrier (Passive Receptor)
* **Objective**: Verify passive receptor invalidation boundary preserving `WP-P14-03` / `OAQ-SYNC-02` quarantine.
* **Initial Conditions**: Join barrier $b$ in state `WAITING` awaiting branch completion events.
* **Execution Events**:
  1. Upstream dirty-bit invalidation signal $\mathbf{e}_{\text{ripple\_invalidate}}$ arrives from macro controller.
  2. Barrier verifies $\text{InvalidationSignalValid} == \text{TRUE}$.
  3. Barrier executes transition $T_{07}$: `WAITING` $\to$ `INVALIDATED`.
  4. Accumulated state frozen; barrier transitions to passive receptor sink.
  5. Barrier does NOT propagate invalidation downstream or execute invalidation cascades (deferred to `WP-P14-03`).
* **Expected Outcome**: Invalidation captured cleanly; barrier enters quarantined terminal sink `INVALIDATED`; zero unilateral invalidation cascading.
* **Invariants Exercised**: `INV-STATE-07`, `INV-RECON-03`.
* **Traceability**: `SPEC-P14-02-04` §4.8.

#### RVE-10: Topological Layer Monotonicity & Deadlock Freedom under Kahn Ordering
* **Objective**: Verify that Kahn layer admission ordering prevents cyclic resource dependencies.
* **Initial Conditions**: Workflow with tasks at Layer 0, Layer 1, Layer 2. Capacity limited to 1 slot ($C_{\text{global}} = 1$).
* **Execution Events**:
  1. Layer 0 task $A$ holds slot in `CLAIMED`.
  2. Layer 1 task $B$ and Layer 2 task $C$ both achieve structural eligibility and enter $\mathcal{Q}_{\text{admit}}$.
  3. $\mathcal{Q}_{\text{admit}}$ orders candidates: $\mathcal{O}_{\text{admission}}(B) \prec \mathcal{O}_{\text{admission}}(C)$ because $\mathcal{L}(B) = 1 < \mathcal{L}(C) = 2$.
  4. Task $A$ terminates and releases slot.
  5. Task $B$ is admitted ahead of task $C$.
  6. Task $C$ cannot be admitted until all preceding Layer 1 tasks complete and release slots.
* **Expected Outcome**: Monotonic layer progression strictly enforced. Inversion of topological priority is prevented. Composite wait graph $\mathcal{W}$ remains acyclic.
* **Invariants Exercised**: `INV-LIMIT-04`, `INV-FAULT-03`, `INV-TOPO-01`.
* **Traceability**: `SPEC-P14-02-05` §9, `SPEC-P14-02-06` §6.

---

## 13. Governance Boundaries, OAQ Quarantine & Implementation Lock

### 13.1 Physical Implementation Lock
In strict compliance with ZenOrion Tier 3 Governance Architecture and the governing execution directive:
$$\mathbf{IMPLEMENTATION\ BUDGET \equiv 0\ BYTES}$$

The following activities are strictly and unconditionally prohibited:
1. Writing or generating executable application code in any language (TypeScript, JavaScript, Python, Go, Rust, C++, SQL, Shell);
2. Creating database tables, SQL DDL migrations, relational schemas, views, or triggers;
3. Instantiating runtime daemons, queue workers, background schedulers, or event loops;
4. Creating runnable test suites, unit tests, integration tests, or test harnesses;
5. Executing live runtime benchmarks or simulated load tests.

All deliverables of `WP-P14-02-08` are strictly architectural contract documents, formal specification schemas, and governance reports.

### 13.2 Open Architectural Questions (OAQ) Quarantine Boundary
The three governing Open Architectural Questions remain strictly **UNRESOLVED AND QUARANTINED**:

```text
┌───────────────┬──────────────────────────────────────────┬───────────────────────────┬──────────────────────────────────────────┐
│ OAQ ID        │ Title                                    │ Governed Status           │ Authorized Resolution Venue              │
├───────────────┼──────────────────────────────────────────┼───────────────────────────┼──────────────────────────────────────────┤
│ OAQ-SYNC-01   │ Dependency Hash Binding Location         │ UNRESOLVED / QUARANTINED  │ Phase 1.4 Integration / Phase 1.6 Ledger │
│ OAQ-SYNC-02   │ Dynamic Invalidation Policy (Eager/Lazy) │ UNRESOLVED / QUARANTINED  │ WP-P14-03 Ripple Invalidation            │
│ OAQ-SYNC-03   │ Cross-Agent Semantic Reconciliation      │ UNRESOLVED / QUARANTINED  │ Downstream Lifecycle Orchestration       │
└───────────────┴──────────────────────────────────────────┴───────────────────────────┴──────────────────────────────────────────┘
```

The master specification does not resolve, bypass, or define speculative mechanisms for any quarantined question.

### 13.3 Downstream Package Locks
The following downstream work packages and phases remain strictly locked and quarantined:
* **`WP-P14-03` (Dynamic Ripple Invalidation)**: Strictly locked. Zero runtime dirty-bit propagation algorithms included.
* **`WP-P14-04` (Structural Merge-Gating)**: Strictly locked. Zero branch reconciliation consensus engines included.
* **Phase 1.5 (Validation Pipeline)**: Deferred / locked. Zero executable test runners or benchmarks included.
* **Phase 1.6 (Cryptographic Ledger)**: Deferred / locked. Zero Merkle trees or tamper-evident ledgers included.

### 13.4 Internal vs. Parent Gate Preservation
* **Internal Gate P14-02-G4**: Assembled and ready for independent controller audit;
* **Internal Gate P14-02-G5 & G6**: Remain `BLOCKED / PENDING`;
* **Parent Phase 1.4 Gate G2 (`OAQ Resolution Complete`)**: Strictly **`UNRESOLVED / NOT SATISFIED`**;
* **Parent Phase 1.4 Gate G3 (`Module Designs Complete`)**: **`NOT AUTOMATICALLY SATISFIED`**; clearance of internal sub-package gates is decoupled from parent phase gates;
* **Phase 1.4 Ratification**: **`NOT PERFORMED`**; Phase 1.4 remains active and unratified.

---
*End of Master Architectural Specification `WP-P14-02-SPEC` (Version `1.0.0-DRAFT`).*
