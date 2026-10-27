# EEOS-O — Architectural Specification
## Work Package WP-P14-02-03: Concurrency Limiter & Admission Control Architecture
### Module: Mathematical Multi-Agent Resource Throttling and Admission Control

---

## 1. Document Identity & Metadata

* **Document Identifier**: `EEOS-O-PHASE-1.4-WP-P14-02-03-CONCURRENCY-LIMITER-ARCHITECTURE`
* **Specification Version**: `1.0.0-DRAFT`
* **Artifact Type**: Formal Bounded Sub-Work Package Architectural Specification
* **Target Sub-Work Package**: `WP-P14-02-03 — Concurrency Limiter & Admission Control Architecture`
* **Governing Execution Directive**: `EXEC-DIR-EEOS-O-WP-P14-02-03-001` ([`docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-03-EXECUTION-DIRECTIVE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-03-EXECUTION-DIRECTIVE.md), v1.0.0)
* **Governing Authorization Record**: `EEOS-O-GOV-EXEC-AUTH-P14-02-03-001` ([`docs/eeos-o/governance/EEOS-O-GOV-EXEC-AUTH-P14-02-03-001.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/governance/EEOS-O-GOV-EXEC-AUTH-P14-02-03-001.md))
* **Governing Master Work Package**: `MWP-EEOS-O-WP-P14-02` ([`docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WP-P14-02-MASTER-WORK-PACKAGE.md))
* **Parent Phase**: Phase 1.4 — DAG Scheduler & Execution Engine Architectural Design
* **Parent Master Work Package**: `MWP-EEOS-O-PHASE-1.4` ([`docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md))
* **Authoring Agent Role**: EEOS-O Architectural Design Execution Agent (ZenOrion Tier 3 Governance Architecture)
* **Date**: October 06, 2026
* **Timezone**: UTC+07:00 (WIB)

---

## 2. Governance Status & Boundaries

* **Lifecycle State**: **`DUAL-SOVEREIGN ARCHITECTURAL SPECIFICATION CLEARED`** ([`docs/eeos-o/governance/EEOS-O-GOV-SPEC-CLEAR-P14-02-03-001.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/governance/EEOS-O-GOV-SPEC-CLEAR-P14-02-03-001.md))
* **Ratification Status**: **`NOT YET RATIFIED`** (Pre-ratification modular architecture; cleared for Master integration; Phase 1.4 remains unratified)
* **Implementation Status**: **`STRICTLY LOCKED`** (Physical software implementation budget is **0 BYTES**; zero code, zero SQL DDL migrations, zero runtime workers, zero queue infrastructure)
* **Parent Phase 1.4 Status**: `AUTHORIZED / ACTIVE ARCHITECTURAL DESIGN` (Phase 1.4 remains active and unratified)
* **Upstream Baseline Immutability**:
  - Phase 1.1 (`DO_WP` Contract): `RATIFIED / UNTOUCHED`
  - Phase 1.2 (Task Contract & 15-state FSM): `RATIFIED / UNTOUCHED`
  - Phase 1.3 (Agent Container Contract): `DUAL-SOVEREIGN RATIFIED / UNTOUCHED` (specifically §27 `maxParallelAgents`)
  - WP-P14-01 (DAG Graph & Topological Model): `GATE G1 DUAL-SOVEREIGN CLEARED / IMMUTABLE` ($\Delta(G_{\text{P14-01}}) \equiv \emptyset$)
  - WP-P14-02-01 (Fork Barrier Architecture): `DUAL-SOVEREIGN SPECIFICATION CLEARED / IMMUTABLE` (`EEOS-O-GOV-SPEC-CLEAR-P14-02-01-001`)
  - WP-P14-02-02 (Join Barrier Architecture): `DUAL-SOVEREIGN SPECIFICATION CLEARED / IMMUTABLE` (`EEOS-O-GOV-SPEC-CLEAR-P14-02-02-001`)
* **Internal Gate Alignment**: Contributes modular architectural evidence toward `Gate P14-02-G1` under `MWP-EEOS-O-WP-P14-02` §11.
* **Parent Gate Alignment**:
  - **Parent Phase 1.4 Gate G2 (`OAQ Resolution Complete`)**: **UNRESOLVED / NOT SATISFIED**. This specification does not resolve Parent Gate G2.
  - **Parent Phase 1.4 Gate G3 (`Module Designs Complete`)**: **NOT AUTOMATICALLY SATISFIED**. This document contributes foundational modular evidence only.
* **Open Architectural Questions (OAQ) Quarantine**:
  - `OAQ-SYNC-01` (Dependency Hash Binding Location): **`UNRESOLVED / QUARANTINED`**
  - `OAQ-SYNC-02` (Dynamic Invalidation Scope & Cascade Depth): **`UNRESOLVED / QUARANTINED`**
  - `OAQ-SYNC-03` (Cross-Agent Semantic Reconciliation): **`UNRESOLVED / DEFERRED / QUARANTINED`**

---

## 3. Objective & Architectural Intent

The primary architectural objective of `WP-P14-02-03` is:

> **To formally architect the mathematical multi-agent resource throttling model, tenant-isolated concurrency slot allocations, reservation and release protocols, deterministic admission queueing algorithms, capacity exhaustion backpressure policies, and the strict decoupling between topological structural eligibility and runtime concurrency admission under ZenOrion Tier 3 Governance.**

While `WP-P14-01` defines static topological dependencies and `WP-P14-02-01` / `02` define dynamic structural barrier release points, `WP-P14-02-03` defines the resource admission boundary. It guarantees that multi-branch fan-outs and structurally eligible tasks cannot oversaturate system concurrency limits, monopolize cross-tenant quota shares, or violate deterministic architectural admission ordering.

---

## 4. Authorized Scope & Explicit Exclusions

### 4.1 Authorized Scope (Questions Q1–Q12)
In strict compliance with `EXEC-DIR-EEOS-O-WP-P14-02-03-001` §4, this specification resolves exclusively the twelve (12) authorized architectural design questions:
* **Q1 — Concurrency Limiter Formal Semantics**: Formal mathematical definition of $\mathcal{C}_{\text{limiter}}$ and capacity bounds ($C_{\text{tenant}}, C_{\text{global}}$).
* **Q2 — Decoupling Structural Eligibility from Concurrency Admission**: Proof that structural eligibility never implies immediate execution dispatch.
* **Q3 — Concurrency Slot Lifecycle Model**: Canonical slot states ($\mathcal{S}_{\text{slot}}$) and committed capacity conservation invariants.
* **Q4 — Deterministic Admission Queueing & Ordering Algorithm**: Total ordering function $\mathcal{O}_{\text{admission}}(w)$ incorporating Kahn layer, priority weight, and strict lexicographical $v.\text{nodeId}$ tie-breaking (resolving `OBS-01`).
* **Q5 — Multi-Tenant Concurrency Quota Isolation**: Mathematical quota partition preventing cross-tenant quota monopolization and bounding tenant concurrency shares.
* **Q6 — Capacity Exhaustion & Non-Blocking Backpressure**: Declarative saturation event emissions (`EVENT_CONCURRENCY_SATURATED`) without runtime thread blocking (resolving `OBS-02`).
* **Q7 — Slot Reclaiming, Timeout Policies & Failure Containment**: Declarative timeout parameter $\tau_{\text{claim\_timeout}}$ and failure containment boundaries.
* **Q8 — Interface with Phase 1.3 Container Contract (§27)**: Read-only mapping to Phase 1.3 `maxParallelAgents` parameters.
* **Q9 — Interface with WP-P14-01 Topological Model**: Read-only consumption of Kahn topological layers.
* **Q10 — Canonical Barrier Interaction Boundary**: Strict separation between barrier states and concurrency slot grants.
* **Q11 — Strict OAQ Quarantines**: Preserving `OAQ-SYNC-01`, `02`, `03` as unresolved and quarantined.
* **Q12 — Implementation Prohibition**: Enforcing the strict 0-byte implementation lock.

### 4.2 Explicit Exclusions
This specification explicitly excludes and forbids:
1. Physical runtime queues (Redis, RabbitMQ, Kafka, BullMQ, Celery);
2. Operating system thread primitives (mutexes, semaphores, thread pools, OS process signals);
3. Runtime worker processes, poll loops, or sleep timers;
4. Global ripple invalidation policies (quarantined to `WP-P14-03` / `OAQ-SYNC-02`);
5. Structural merge-gating algorithms (quarantined to `WP-P14-04`);
6. Topological graph schema modifications ($\Delta(G) \equiv \emptyset$).

---

## 5. Mathematical Foundations & Formal Model

### 5.1 Concurrency Limiter Tuple
A Concurrency Limiter Instance $\mathcal{C}_{\text{limiter}}$ is formally defined as the 6-tuple:
$$\mathcal{C}_{\text{limiter}} = \langle \mathcal{T}, C_{\text{global}}, \mathbf{C}_{\text{tenant}}, \mathcal{Q}_{\text{admit}}, \mathbf{S}_{\text{committed}}, \Pi_{\text{admit}} \rangle$$
Where:
* $\mathcal{T} = \{T_1, T_2, \dots, T_m\}$ is the finite set of active tenant identifiers;
* $C_{\text{global}} \in \mathbb{N}_{\ge 1}$ is the global orchestrator execution capacity bound;
* $\mathbf{C}_{\text{tenant}}: \mathcal{T} \longrightarrow \mathbb{N}_{\ge 1}$ maps each tenant $T_k$ to its maximum authorized concurrent slot quota $C_{\text{tenant}}(T_k)$, subject to the strict static invariant:
  $$\sum_{T_k \in \mathcal{T}} C_{\text{tenant}}(T_k) \le C_{\text{global}}$$
  *Note on Over-subscription*: Dynamic quota rebalancing or over-subscription policies are not defined within this module; any such cross-tenant capacity multiplexing belongs strictly to future governance / master coordination scope (`WP-P14-02-04/08`) and remains non-authoritative here.
* $\mathcal{Q}_{\text{admit}}$ is the global deterministic admission queue containing structurally eligible tasks awaiting slot allocation across all tenants, ordered by total order $\mathcal{O}_{\text{admission}}(w)$;
* $\mathbf{S}_{\text{committed}}: \mathcal{T} \longrightarrow \mathcal{P}(\text{Slots})$ is the committed concurrency slot partition, where for each tenant $T_k$:
  $$\mathbf{S}_{\text{committed}}(T_k) = \{ s \in \text{Slots}(T_k) \mid \text{SlotState}(s) \in \{\text{RESERVED}, \text{CLAIMED}\} \}$$
* $\Pi_{\text{admit}}$ is the deterministic admission evaluation policy.

### 5.2 Canonical Concurrency Slot Lifecycle & Committed Capacity Accounting
An individual execution concurrency slot $s \in \text{Slots}$ conforms to the 5-state discrete state machine:
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

**Committed Capacity Accounting Rule**:
1. **Capacity Consumption Point**: The transition $\text{AVAILABLE} \longrightarrow \text{RESERVED}$ already consumes admission capacity because the slot has been formally committed to a task.
2. **Conservation Sum**: At any time instant $t$, the committed capacity for tenant $T_k$ equals:
   $$|\mathbf{S}_{\text{committed}}(T_k)| = |\mathbf{S}_{\text{reserved}}(T_k)| + |\mathbf{S}_{\text{claimed}}(T_k)|$$
3. **Hard Ceiling**: Neither tenant nor global limits may be exceeded:
   $$|\mathbf{S}_{\text{committed}}(T_k)| \le C_{\text{tenant}}(T_k) \quad \text{and} \quad \sum_{T_k \in \mathcal{T}} |\mathbf{S}_{\text{committed}}(T_k)| \le C_{\text{global}}$$
   An architectural state where $\text{RESERVED} + \text{CLAIMED} > \text{Capacity}$ is strictly invalid and unreachable.
4. **State Definitions**:
   - **AVAILABLE**: Slot is unallocated in the capacity pool.
   - **RESERVED**: Slot is committed to a structurally eligible task $w$; consumes capacity; awaits physical container initialization.
   - **CLAIMED**: Container has confirmed initialization under Phase 1.3; task actively executes; capacity remains committed.
   - **RELEASED**: Task execution has reached a terminal state (`COMPLETED`, `FAILED`, `CANCELLED`); slot transitions back to `AVAILABLE`, decrementing committed capacity.
   - **FORFEITED**: Task failed to claim reservation within declarative timeout bound $\tau_{\text{claim\_timeout}}$ or container launch was rejected; slot returns to `AVAILABLE`, decrementing committed capacity.

---

## 6. Formal Semantics & Decoupling Proof

### 6.1 Foundational Decoupling Axiom
The architecture establishes the formal separation:
$$\text{Static DAG Topology } (WP\text{-}P14\text{-}01) \neq \text{Barrier State } (WP\text{-}P14\text{-}02\text{-}01/02) \neq \text{Concurrency Admission } (WP\text{-}P14\text{-}02\text{-}03) \neq \text{Container Execution } (Phase\;1.3)$$

### 6.2 Structural Eligibility vs. Concurrency Admission
Let $\sigma_{\text{struct}}(w) \in \{\text{INELIGIBLE}, \text{ELIGIBLE}\}$ denote the structural eligibility status of task $w$ derived from DAG edge dependencies (`WP-P14-01` §9) and barrier releases (`WP-P14-02-01` §14, `WP-P14-02-02` §14).
Let $\sigma_{\text{admit}}(w) \in \{\text{QUEUED}, \text{RESERVED}, \text{ADMITTED}\}$ denote the concurrency admission status.

#### Unified Queue-Head Semantics
Admission eligibility within the global admission queue $\mathcal{Q}_{\text{admit}}$ is governed by the formal tenant queue-head predicate:
$$\text{IsTenantQueueHead}(w, \mathcal{Q}_{\text{admit}}, T_k) \iff \Big( w \in \mathcal{Q}_{\text{admit}} \land w.\text{tenantId} = T_k \land \nexists u \in \mathcal{Q}_{\text{admit}} : [u.\text{tenantId} = T_k \land u \prec_{\mathcal{O}} w] \Big)$$
Where $\text{HeadOfQueue}(\mathcal{Q}_{\text{admit}}, T_k) \equiv w$ identifies the unique candidate task satisfying this predicate.

**Theorem 1 (Eligibility-Admission Decoupling):**
$$\sigma_{\text{struct}}(w) = \text{ELIGIBLE} \centernot\implies \sigma_{\text{admit}}(w) = \text{ADMITTED}$$
*Proof:* A task $w$ achieves $\sigma_{\text{struct}}(w) = \text{ELIGIBLE}$ strictly through graph topological satisfaction (inDegree predecessor completions). However, transition to $\sigma_{\text{admit}}(w) = \text{ADMITTED}$ requires the satisfaction of capacity and ordering predicates:
$$\text{CanAdmit}(w, T_k) \iff \Big( |\mathbf{S}_{\text{committed}}(T_k)| < C_{\text{tenant}}(T_k) \Big) \land \Big( \sum_{T \in \mathcal{T}} |\mathbf{S}_{\text{committed}}(T)| < C_{\text{global}} \Big) \land \text{IsTenantQueueHead}(w, \mathcal{Q}_{\text{admit}}, T_k)$$
If $\text{CanAdmit}(w, T_k)$ evaluates to false, $w$ remains strictly $\sigma_{\text{struct}}(w) = \text{ELIGIBLE}$ while queued in $\mathcal{Q}_{\text{admit}}$ with $\sigma_{\text{admit}}(w) = \text{QUEUED}$. The structural DAG node state is completely unaffected by capacity exhaustion. $\blacksquare$

---

## 7. Preconditions & Postconditions

### 7.1 Admission Request (`RequestAdmission`)
* **Precondition**: $\sigma_{\text{struct}}(w) == \text{ELIGIBLE}$, $w \notin \mathcal{Q}_{\text{admit}}$, and $w$ not currently holding or reserving a slot.
* **Postcondition**: $w$ is inserted into $\mathcal{Q}_{\text{admit}}$ at deterministic priority position $\mathcal{O}_{\text{admission}}(w)$; $\sigma_{\text{admit}}(w) = \text{QUEUED}$.

### 7.2 Slot Reservation (`ReserveSlot`)
* **Precondition**: $\text{IsTenantQueueHead}(w, \mathcal{Q}_{\text{admit}}, T_k) == \text{TRUE}$ and $\text{CanAdmit}(w, T_k) == \text{TRUE}$.
* **Postcondition**: Slot $s$ transitions $\text{AVAILABLE} \longrightarrow \text{RESERVED}$; committed capacity increments ($|\mathbf{S}_{\text{committed}}(T_k)| \leftarrow |\mathbf{S}_{\text{committed}}(T_k)| + 1$); reservation timeout timer $\tau_{\text{claim\_timeout}}$ initialized; $w$ dequeued from $\mathcal{Q}_{\text{admit}}$; $\sigma_{\text{admit}}(w) = \text{RESERVED}$.

### 7.3 Slot Claim (`ClaimSlot`)
* **Precondition**: Slot $s$ is $\text{RESERVED}$ for task $w$; agent container initialization confirmed under Phase 1.3.
* **Postcondition**: Slot $s$ transitions $\text{RESERVED} \longrightarrow \text{CLAIMED}$; committed capacity remains constant ($|\mathbf{S}_{\text{committed}}(T_k)|$ unchanged; $|\mathbf{S}_{\text{reserved}}| \leftarrow |\mathbf{S}_{\text{reserved}}| - 1$, $|\mathbf{S}_{\text{claimed}}| \leftarrow |\mathbf{S}_{\text{claimed}}| + 1$); $\sigma_{\text{admit}}(w) = \text{ADMITTED}$.

### 7.4 Slot Release (`ReleaseSlot`)
* **Precondition**: Slot $s$ is $\text{CLAIMED}$ by $w$; task FSM transitions to terminal state ($\text{COMPLETED}, \text{FAILED}, \text{CANCELLED}$).
* **Postcondition**: Slot $s$ transitions $\text{CLAIMED} \longrightarrow \text{RELEASED} \longrightarrow \text{AVAILABLE}$; committed capacity decrements ($|\mathbf{S}_{\text{committed}}(T_k)| \leftarrow |\mathbf{S}_{\text{committed}}(T_k)| - 1$). Next eligible task in $\mathcal{Q}_{\text{admit}}$ evaluated.

### 7.5 Slot Forfeiture (`ForfeitSlot`)
* **Precondition**: Slot $s$ is $\text{RESERVED}$ for task $w$; claim timeout $\tau_{\text{claim\_timeout}}$ expires or container spawn fails.
* **Postcondition**: Slot $s$ transitions $\text{RESERVED} \longrightarrow \text{FORFEITED} \longrightarrow \text{AVAILABLE}$; committed capacity decrements ($|\mathbf{S}_{\text{committed}}(T_k)| \leftarrow |\mathbf{S}_{\text{committed}}(T_k)| - 1$). Next eligible task in $\mathcal{Q}_{\text{admit}}$ evaluated.

---

## 8. Invariant Rules Catalogue (`INV-LIMIT-01` through `INV-LIMIT-08`)

1. **`INV-LIMIT-01` (Strict Global Committed Capacity Conservation)**:
   $$\forall t, \quad \sum_{T_k \in \mathcal{T}} |\mathbf{S}_{\text{committed}}(T_k, t)| \le C_{\text{global}}$$
   Committed execution slots ($\text{RESERVED} + \text{CLAIMED}$) across all tenants never exceed the global capacity bound.

2. **`INV-LIMIT-02` (Hard Multi-Tenant Quota Isolation)**:
   $$\forall T_k \in \mathcal{T}, \forall t, \quad |\mathbf{S}_{\text{committed}}(T_k, t)| \le C_{\text{tenant}}(T_k)$$
   No tenant $T_k$ may exceed its allocated concurrency quota. Quota isolation prevents one tenant from exceeding its reserved concurrency share and prevents cross-tenant quota monopolization.

3. **`INV-LIMIT-03` (Structural Orthogonality Invariant)**:
   $$\Delta(\sigma_{\text{admit}}(w)) \implies \Delta(G_{\text{P14-01}}) \equiv \emptyset \land \Delta(\text{BarrierState}(\mathcal{B})) \equiv \emptyset$$
   Slot allocation, queueing, and releases never alter DAG topological structure, edge adjacency, or barrier satisfaction states.

4. **`INV-LIMIT-04` (Deterministic Queue Total Order)**:
   $$\forall w_i, w_j \in \mathcal{Q}_{\text{admit}}, \quad (w_i \neq w_j) \implies \Big( \mathcal{O}(w_i) < \mathcal{O}(w_j) \lor \mathcal{O}(w_j) < \mathcal{O}(w_i) \Big)$$
   The admission queue is governed by a strict, irreflexive, transitive, and total ordering relation defined over architectural metadata; non-deterministic arrival-order arbitrations are strictly prohibited.

5. **`INV-LIMIT-05` (Single Slot Assignment)**:
   $$\forall w, \quad |\text{SlotsAssigned}(w)| \le 1$$
   A single task instance $w$ can occupy at most one concurrency slot at any time instant $t$.

6. **`INV-LIMIT-06` (Terminal Slot Reclamation)**:
   $$\text{TaskState}(w) \in \{\text{COMPLETED}, \text{FAILED}, \text{CANCELLED}\} \implies \text{SlotState}(s_w) == \text{RELEASED}$$
   Reaching a terminal task state deterministically releases the assigned concurrency slot.

7. **`INV-LIMIT-07` (Reservation Timeout Boundedness)**:
   $$(t - t_{\text{reserve}} > \tau_{\text{claim\_timeout}}) \land (\text{SlotState}(s) == \text{RESERVED}) \implies \text{SlotState}(s) = \text{FORFEITED}$$
   Unclaimed slot reservations are automatically reclaimed after declarative duration $\tau_{\text{claim\_timeout}}$, preventing zombie slot lockup.

8. **`INV-LIMIT-08` (Zero Implementation Leakage)**:
   $$\text{CodeBytes}(\text{WP-P14-02-03}) \equiv 0$$
   All admission mechanics are expressed purely as declarative state models, mathematical constraints, and invariant rules without runtime code or middleware.

---

## 9. Transition & Interaction Mechanics

### 9.1 Admission Queue Total Ordering Formulation (Resolving OBS-01)
To eliminate scheduling ambiguity within the architectural queue ordering model, the deterministic priority comparator $\mathcal{O}_{\text{admission}}(w)$ is defined over a lexicographical 3-tuple:
$$\mathcal{O}_{\text{admission}}(w) = \langle \mathcal{L}(w), \mathcal{W}_{\text{prio}}(w), \text{lex}(v.\text{nodeId}) \rangle$$
Where:
1. $\mathcal{L}(w) \in \mathbb{N}_0$ is the Kahn topological layer index of node $v$ derived from `WP-P14-01` §8. Lower layers (closer to DAG roots) have strictly higher scheduling priority:
   $$\mathcal{L}(w_i) < \mathcal{L}(w_j) \implies w_i \succ w_j$$
2. $\mathcal{W}_{\text{prio}}(w) \in \mathbb{N}$ is the task priority weight defined in Phase 1.2 task metadata (default: 100). Higher weights take precedence within the same layer:
   $$\mathcal{W}_{\text{prio}}(w_i) > \mathcal{W}_{\text{prio}}(w_j) \implies w_i \succ w_j$$
3. $\text{lex}(v.\text{nodeId})$ is the strict ASCII lexicographical sort on the authoritative node identifier ($v.\text{nodeId} \equiv \text{"NODE-" + } v.\text{taskId}$).

**Resolution of OBS-01**: Because node identifiers are guaranteed unique across the entire DAG (Invariant I-02), $\text{lex}(v.\text{nodeId})$ ensures that any tie in topological layer and priority weight is broken deterministically. Identical DAG inputs produce an identical, mathematically repeatable architectural admission priority ordering.

---

## 10. Interface Contracts

### 10.1 Interface with Phase 1.3 Agent Container (§27)
* `WP-P14-02-03` binds directly to Phase 1.3 §27 `maxParallelAgents` parameter.
* For each tenant $T_k$, $C_{\text{tenant}}(T_k) \equiv T_k.\text{maxParallelAgents}$.
* Phase 1.3 agent supervisor requests slot reservation prior to container spawn and signals slot release upon container termination.
* Zero mutation of Phase 1.3 container schemas, supervisor protocols, or turn boundaries.

### 10.2 Interface with WP-P14-01 Topological Model
* Consumes node types, topological layer mappings $\mathcal{L}(v)$, and node IDs $v.\text{nodeId}$ strictly in read-only mode.
* Reasserts $\Delta(G_{\text{P14-01}}) \equiv \emptyset$.

### 10.3 Interface with Fork Barriers (WP-P14-02-01)
* When a Fork Gateway releases $k_{\text{fork}}$ parallel sibling branches, each branch $\beta_i$ emits an independent admission request $\text{RequestAdmission}(\beta_i)$.
* Branches compete in $\mathcal{Q}_{\text{admit}}$ based on $\mathcal{O}_{\text{admission}}(\beta_i)$.
* Branches may execute concurrently (if capacity permits) or sequentially (if throttled), preserving branch isolation (`INV-FORK-05`).

### 10.4 Interface with Join Barriers (WP-P14-02-02)
* Join barriers track incoming predecessor branch task completions regardless of whether branches were admitted simultaneously or staggered by the concurrency limiter.
* Reaching `SATISFIED` on a join barrier releases the downstream gateway task, which then submits its own admission request to `WP-P14-02-03`.

---

## 11. Determinism Rules & Total Order Guarantees

1. **State Evaluation Determinism**: Given identical tenant capacities $\mathbf{C}_{\text{tenant}}$, global bound $C_{\text{global}}$, and queue $\mathcal{Q}_{\text{admit}}$, the slot allocation evaluation sequence is deterministic and reproducible under the defined ordering relation.
2. **Zero Arrival-Order Dependency**: Admission priority ordering is determined strictly by architectural relation $\mathcal{O}_{\text{admission}}(w) = \langle \mathcal{L}(w), \mathcal{W}_{\text{prio}}(w), \text{lex}(v.\text{nodeId}) \rangle$, independent of asynchronous runtime arrival sequence.
3. **Bounded Determinism Principle**: Determinism applies strictly to the architectural ordering relation defined by the module. Physical operating system scheduling, wall-clock timing, asynchronous runtime arrival, physical worker races, and network timing remain outside this module's authorized scope.

---

## 12. Failure, Timeout, & Backpressure Semantics

### 12.1 Declarative Backpressure & Saturation Signaling (Resolving OBS-02)
* When $|\mathbf{S}_{\text{committed}}(T_k)| == C_{\text{tenant}}(T_k)$ (tenant saturation) or $\sum |\mathbf{S}_{\text{committed}}| == C_{\text{global}}$ (global saturation), the limiter enters backpressure state $\sigma_{\text{press}} = \text{SATURATED}$.
* In saturation state, new structurally eligible tasks accumulate in $\mathcal{Q}_{\text{admit}}$ without error, drop, or rejection.
* **Resolution of OBS-02**: Saturation emissions (`EVENT_CONCURRENCY_SATURATED` and `EVENT_CONCURRENCY_DRAINED`) are formalized strictly as declarative state transitions within the orchestrator state ledger. They do **NOT** require or prescribe physical pub/sub event brokers (Kafka, Redis, RabbitMQ) or blocking OS thread sleep cycles.

### 12.2 Slot Reservation Timeout ($\tau_{\text{claim\_timeout}}$)
* To prevent indefinite capacity lockup from crashed initialization scripts or hanging container downloads, slot reservation is bounded by declarative parameter $\tau_{\text{claim\_timeout}}$ (default: 30 seconds).
* If Phase 1.3 container initialization confirmation is not registered within $\tau_{\text{claim\_timeout}}$, the slot transitions $\text{RESERVED} \longrightarrow \text{FORFEITED} \longrightarrow \text{AVAILABLE}$.
* The associated task is marked with declarative failure signal `ERR_SLOT_RESERVATION_TIMEOUT`.

### 12.3 Sibling Failure Containment
* If task $w_i$ aborts, fails, or is rejected in Phase 1.2, its slot is immediately reclaimed via `ReleaseSlot`.
* Sibling tasks $w_j$ holding active slots continue uninterrupted; slot release of $w_i$ cannot force premature slot termination of $w_j$.

---

## 13. OAQ Boundary & Quarantine Preservation

* **`OAQ-SYNC-01` (Dependency Hash Binding Location)**: **`UNRESOLVED / QUARANTINED`**. Slot admission operates strictly on task node identities and tenant IDs; dependency cryptographic hashes and provenance ledgers remain quarantined.
* **`OAQ-SYNC-02` (Dynamic Invalidation Scope & Cascade Depth)**: **`UNRESOLVED / QUARANTINED`**. If an invalidation arrives for a queued or executing task, the limiter handles only the immediate slot release; ripple invalidation cascade depth belongs to `WP-P14-03`.
* **`OAQ-SYNC-03` (Cross-Agent Semantic Reconciliation)**: **`UNRESOLVED / DEFERRED / QUARANTINED`**.

---

## 14. Cross-Module Interface Specifications

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        UPSTREAM TOPOLOGY (WP-P14-01)                   │
│   Node Metadata, Precedence, Kahn Layers L(v), Invariants I-01..I-08   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Read-Only Projection
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             SYNCHRONIZATION BARRIERS (WP-P14-02-01 / 02)               │
│   Fork Spawning (k_fork >= 2)            Join Convergence (k_in >= 2)  │
│   SetStructuralEligibility(w, ELIGIBLE)                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Emits Structural Eligibility
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│        CONCURRENCY LIMITER & ADMISSION CONTROL (WP-P14-02-03)          │
│   • Multi-Tenant Quotas C_tenant(T)   • Global Capacity Bound C_global │
│   • Deterministic Queue Q_admit       • Slot Lifecycle S_slot          │
│   • Ordering O(w) = <L(w), W(w), lex(nodeId)>                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Grants Concurrency Slot
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     AGENT CONTAINER CONTRACT (Phase 1.3)               │
│   Container Execution Instances, maxParallelAgents (§27)               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Non-Goals & Explicit Exclusions

1. **Not a Job Queue**: `WP-P14-02-03` is not a persistent distributed job queue (Celery, BullMQ, Sidekiq);
2. **Not an OS Process Scheduler**: Does not assign OS CPU cores, thread affinities, or process priorities;
3. **Not a Thread Pool**: Does not implement thread worker loops, async task runtimes, or Goroutines;
4. **Not a Rate Limiter for HTTP APIs**: Does not enforce token-bucket or leaky-bucket network request throttling;
5. **Not a Deadlock Graph Solver**: Deadlock cycle analysis across circular barrier waits belongs to `WP-P14-02-05`.

---

## 16. Worked Architectural Examples / Scenarios

### Scenario 1: Fan-Out Throttling Under Restricted Tenant Quota
* **Initial State**: Tenant $T_1$ has quota $C_{\text{tenant}}(T_1) = 2$. Global capacity $C_{\text{global}} = 10$. Initial committed capacity $|\mathbf{S}_{\text{committed}}(T_1)| = 0$.
* **Event**: Fork Gateway $v_{\text{fork}}$ releases four parallel branches: $\beta_0, \beta_1, \beta_2, \beta_3$ (all in Layer $\mathcal{L}_1$, priority weight 100).
* **Admission Evaluation**:
  1. All 4 branches enter $\mathcal{Q}_{\text{admit}}$ with $\sigma_{\text{struct}} = \text{ELIGIBLE}$ and $\sigma_{\text{admit}} = \text{QUEUED}$.
  2. Queue sorted by total order $\mathcal{O}_{\text{admission}}$: $\beta_0 \succ \beta_1 \succ \beta_2 \succ \beta_3$ via ASCII tie-break on node IDs.
  3. $\beta_0$ satisfies $\text{IsTenantQueueHead}(\beta_0, \mathcal{Q}_{\text{admit}}, T_1)$ and $\text{CanAdmit}(\beta_0, T_1) \implies \text{ReserveSlot}(\beta_0) \implies |\mathbf{S}_{\text{committed}}(T_1)| = 1$. Upon container initialization, $\text{ClaimSlot}(\beta_0) \implies \beta_0$ becomes $\text{CLAIMED}$.
  4. $\beta_1$ becomes $\text{IsTenantQueueHead}(\beta_1, \mathcal{Q}_{\text{admit}}, T_1)$ and satisfies $\text{CanAdmit}(\beta_1, T_1) \implies \text{ReserveSlot}(\beta_1) \implies |\mathbf{S}_{\text{committed}}(T_1)| = 2$. Upon container initialization, $\text{ClaimSlot}(\beta_1) \implies \beta_1$ becomes $\text{CLAIMED}$.
  5. Committed capacity reaches tenant ceiling: $|\mathbf{S}_{\text{committed}}(T_1)| == C_{\text{tenant}}(T_1) = 2$. Tenant backpressure state transitions to $\sigma_{\text{press}}(T_1) = \text{SATURATED}$.
  6. $\beta_2$ is $\text{IsTenantQueueHead}(\beta_2, \mathcal{Q}_{\text{admit}}, T_1)$, but $\text{CanAdmit}(\beta_2, T_1) == \text{FALSE}$ due to capacity saturation. $\beta_2$ and $\beta_3$ remain safely queued in $\mathcal{Q}_{\text{admit}}$ ($\sigma_{\text{admit}} = \text{QUEUED}$).
  7. When $\beta_0$ reaches terminal completion, $\text{ReleaseSlot}(\beta_0)$ releases the slot $\implies |\mathbf{S}_{\text{committed}}(T_1)|$ decrements to 1.
  8. $\text{CanAdmit}(\beta_2, T_1)$ now evaluates to $\text{TRUE}$; $\beta_2$ is granted slot reservation ($\text{ReserveSlot}$).
* **Result**: Deterministic architectural admission priority ordering relation; strict enforcement of committed capacity bound ($|\mathbf{S}_{\text{committed}}(T_1)| \le 2$).

---

## 17. Traceability Matrix to Execution Directive Questions

| Directive Question | Title / Focus | Architecture Section | Invariant Binding | Compliance |
| :--- | :--- | :--- | :--- | :---: |
| **Q1** | Concurrency Limiter Formal Semantics | §5.1, §6.1 | `INV-LIMIT-01` | **FULL** |
| **Q2** | Decoupling Structural Eligibility & Admission | §6.2 (Theorem 1) | `INV-LIMIT-03` | **FULL** |
| **Q3** | Concurrency Slot Lifecycle Model | §5.2, §7.1–7.5 | `INV-LIMIT-01`, `05` | **FULL** |
| **Q4** | Deterministic Admission Queueing & Ordering | §9.1 | `INV-LIMIT-04` (OBS-01) | **FULL** |
| **Q5** | Multi-Tenant Concurrency Quota Isolation | §5.1, §8 | `INV-LIMIT-02` | **FULL** |
| **Q6** | Capacity Exhaustion & Backpressure | §12.1 | `INV-LIMIT-01` (OBS-02) | **FULL** |
| **Q7** | Slot Reclaiming, Timeout & Failure Containment | §12.2, §12.3 | `INV-LIMIT-06`, `07` | **FULL** |
| **Q8** | Interface with Phase 1.3 Container Contract | §10.1 | Ratified §27 Baseline | **FULL** |
| **Q9** | Interface with WP-P14-01 Topological Model | §9.1, §10.2 | `INV-LIMIT-03` | **FULL** |
| **Q10** | Canonical Barrier Interaction Boundary | §10.3, §10.4 | `INV-LIMIT-03` | **FULL** |
| **Q11** | Strict OAQ Quarantines | §13 | `OAQ-SYNC-01..03` | **FULL** |
| **Q12** | Implementation Prohibition (0 Bytes) | §2, §8, §19 | `INV-LIMIT-08` | **FULL** |

---

## 18. Internal Consistency & Coherence Checks

1. **Committed Capacity Conservation Proof**: The sum of committed slots ($\text{RESERVED} + \text{CLAIMED}$) across all tenants is mathematically bounded by $C_{\text{global}}$ (`INV-LIMIT-01`), guaranteeing system stability.
2. **Cross-Tenant Quota Isolation**: Tenant quota partitioning (`INV-LIMIT-02`) ensures no single tenant can exceed its reserved concurrency share, preventing cross-tenant quota monopolization.
3. **Topological Order Decoupling & Deadlock Prevention**: Tasks in $\mathcal{Q}_{\text{admit}}$ are totally ordered by topological layer index $\mathcal{L}(w)$; evaluating lower layers first preserves upstream progression and prevents circular queue-admission dependencies.
4. **Zero-Byte Budget Verification**: All constructs are pure formal mathematical definitions, predicates, state transitions, and tabular constraints.

---

## 19. Implementation Prohibition & 0-Byte Enforcement

In strict compliance with ZenOrion Tier 3 Governance Architecture:
* **Application Source Code**: `0 lines` (Zero TypeScript, JavaScript, Python, Go, Rust);
* **Database DDL / Migrations**: `0 lines` (Zero SQL tables, triggers, stored procedures);
* **Queue Middleware**: `0 bytes` (Zero Redis, RabbitMQ, Kafka, or BullMQ configuration);
* **Runtime Worker Engines**: `0 bytes` (Zero background pollers or thread executors).

Clearance of this specification applies **strictly and exclusively to the ARCHITECTURAL DESIGN**.

---

## 20. Audit Readiness Statement & Hard Stop

### 20.1 Audit Readiness Statement
This architectural specification `WP-P14-02-03-CONCURRENCY-LIMITER-ARCHITECTURE.md` (v1.0.0-DRAFT) has been authored strictly in compliance with governing directive `EXEC-DIR-EEOS-O-WP-P14-02-03-001` under Dual-Sovereign Execution Authorization `EEOS-O-GOV-EXEC-AUTH-P14-02-03-001`. It completely satisfies all twelve (12) authorized questions, resolves audit observations `OBS-01` and `OBS-02`, maintains zero bytes of software code, preserves all upstream baselines, and keeps all OAQs strictly quarantined. It is formally prepared for independent controller audit.

### 20.2 HARD STOP

```text
══════════════════════════════════════════════════════════════════════
WP-P14-02-03 ARCHITECTURAL DESIGN COMPLETED

DOCUMENT:
docs/eeos-o/specs/phase-1.4/WP-P14-02-03-CONCURRENCY-LIMITER-ARCHITECTURE.md

SPECIFICATION VERSION:
1.0.0-DRAFT

GOVERNING DIRECTIVE:
EXEC-DIR-EEOS-O-WP-P14-02-03-001 (v1.0.0)

AUTHORIZATION:
EEOS-O-GOV-EXEC-AUTH-P14-02-03-001 (Dual-Sovereign Concurrence)

IMPLEMENTATION BUDGET:
STRICTLY LOCKED (0 BYTES)

UPSTREAM BASELINES:
WP-P14-01 (IMMUTABLE / ZERO MUTATION)
WP-P14-02-01 (IMMUTABLE / ZERO MUTATION)
WP-P14-02-02 (IMMUTABLE / ZERO MUTATION)
PHASE 1.3 §27 (PRESERVED)

PARENT GATES:
PARENT G2 = UNRESOLVED / NOT SATISFIED
PARENT G3 = NOT AUTOMATICALLY SATISFIED

OAQ STATUS:
QUARANTINED (OAQ-SYNC-01, OAQ-SYNC-02, OAQ-SYNC-03)

DOWNSTREAM SUB-WPs:
LOCKED (WP-P14-02-04, 05, 07, 08, WP-P14-03, WP-P14-04)

RATIFICATION:
NOT PERFORMED

NEXT GOVERNANCE STEP:
INDEPENDENT ARCHITECTURAL SPECIFICATION AUDIT

HARD STOP — ARCHITECTURAL DESIGN DRAFTED; AUDIT AND RATIFICATION NOT PERFORMED.
══════════════════════════════════════════════════════════════════════
```
