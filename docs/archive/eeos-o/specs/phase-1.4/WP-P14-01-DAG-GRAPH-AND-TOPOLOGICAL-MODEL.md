# EEOS-O — Phase 1.4 Specification: WP-P14-01
## DAG Graph & Topological Model Specification

---

## 1. Document Metadata

* **Document Identifier**: `SPEC-EEOS-O-WP-P14-01-DAG-GRAPH-MODEL`
* **Work Package Identifier**: `WP-P14-01`
* **Specification Version**: `1.0.0-DRAFT`
* **Document Status**: `CORRECTED — AWAITING INDEPENDENT G1 AUDIT`
* **Phase Milestone**: Phase 1.4 — DAG Scheduler & Execution Engine Architectural Contract Design
* **Classification**: Formal Architectural Contract Specification (ZenOrion Tier 3 Governance)
* **Parent Master Work Package**: [`docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-ARCHITECTURAL-DESIGN-MASTER-WORK-PACKAGE.md) (`MWP-EEOS-O-PHASE-1.4`)
* **Governing Directives**:
  - Activation Directive: [`docs/eeos-o/EEOS-O-PHASE-1.4-WORK-PACKAGE-ACTIVATION-DIRECTIVE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-WORK-PACKAGE-ACTIVATION-DIRECTIVE.md) (`WP-ACT-P14-ARCH-001`)
  - Authorization Directive: [`docs/eeos-o/EEOS-O-PHASE-1.4-AUTHORIZATION-DIRECTIVE.md`](file:///e:/Projects/Os_Darta/docs/eeos-o/EEOS-O-PHASE-1.4-AUTHORIZATION-DIRECTIVE.md)
  - Sovereign Decisions: `SOV-DEC-PO-P14-AUTH-001` & `SOV-DEC-MANDOR-P14-AUTH-001`
* **Date**: October 02, 2026
* **Authoring Role**: Phase 1.4 DAG Graph & Topological Architecture Specialist
* **Ratification Status**: **`NOT YET RATIFIED`** (Design stage only; requires Gate G1..G6 progression and sovereign ratification)
* **Gate G1 Status**: **`NOT CLEARED`** (Awaiting independent G1 audit)

---

## 2. Architectural Objective

The primary objective of `WP-P14-01` is to define the foundational mathematical and structural contract for representing, validating, traversing, and deterministically ordering the Phase 1.4 Work Package execution Directed Acyclic Graph (DAG).

As the foundational module of Phase 1.4, this specification:
1. Translates the static Work Package decomposition (`DO_WP` / `taskDecompositionRef`) into an executable, validated DAG topology.
2. Establishes unambiguous node and edge contracts governing dependency relationships.
3. Formulates a mathematically deterministic topological sorting algorithm with formal cycle detection and tie-breaking.
4. Exposes clear graph primitives for consumption by downstream scheduling modules (`WP-P14-02` fork-join barriers, `WP-P14-03` ripple invalidation, and `WP-P14-04` merge gating).
5. Strictly decouples macro-orchestration structural eligibility from single-task execution lifecycles (Phase 1.2 Task FSM) and agent container boundaries (Phase 1.3 Agent Contract).

---

## 3. Conceptual Model & Terminology

The DAG model is governed by the following formal graph-theoretic and EEOS-O concepts:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           DAG GRAPH TOPOLOGY PRIMITIVES                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ROOT NODE [in-degree = 0]                 STANDARD NODE                        │
│         (Node A)                             (Node B)                            │
│            │                                    │                                │
│            └───[ Directed Edge: A → B ]─────────┘                                │
│                                                                                  │
│   INDEPENDENT PARALLEL BRANCHES             JOIN NODE [in-degree > 1]            │
│         Node B ───┐                                                              │
│                   ├───[ Merge / Join Point ]───> Node D (Terminal/Leaf)          │
│         Node C ───┘                                                              │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

* **Directed Acyclic Graph ($G = (V, E)$)**: A finite graph consisting of a set of vertices (nodes $V$) and directed edges ($E$) containing strictly zero directed cycles ($v_0 \to v_1 \to \dots \to v_n \to v_0$).
* **DAG Node ($v \in V$)**: A schedulable execution unit in the graph, representing the macro-orchestrator's binding to an underlying atomic Phase 1.2 Task Contract.
* **DAG Edge ($e = (u, v) \in E$)**: A directed constraint asserting that node $u$ must satisfy its dependency contract before node $v$ may be evaluated for execution eligibility.
* **Predecessor ($\text{Pred}(v)$)**: The set of nodes $\{u \in V \mid (u, v) \in E\}$ upon which node $v$ directly depends.
* **Successor ($\text{Succ}(u)$)**: The set of nodes $\{v \in V \mid (u, v) \in E\}$ that directly depend on node $u$.
* **Root Node**: A node with in-degree zero ($\text{inDegree}(v) = 0$). Represents an entry point into the Work Package DAG.
* **Leaf / Terminal Node**: A node with out-degree zero ($\text{outDegree}(v) = 0$). Represents a completion point of an execution branch.
* **Join Node**: A node with in-degree greater than one ($\text{inDegree}(v) \ge 2$), requiring multiple predecessor branches to reconcile before release.
* **Independent Branch**: A disjoint or parallel chain of nodes sharing no mutual edge dependencies within the same topological layer.
* **Structural Eligibility**: A binary macro-orchestration state indicating that all structural predecessor constraints of a node are satisfied and the node is ready for dispatch consideration.

---

## 4. DAG Node Contract

Every vertex in the execution graph is defined by a formal `DAGNode` record conforming to the machine-readable schema:

| Field | Type | Obligation | Mutability | Architectural Meaning & Constraints |
| :--- | :---: | :---: | :---: | :--- |
| `nodeId` | `String` | **REQUIRED** | **IMMUTABLE** | Unique deterministic node ID within graph, derived as `NODE-${taskId}`. Pattern: `^NODE-[A-Z0-9_-]+$`. |
| `taskId` | `String` | **REQUIRED** | **IMMUTABLE** | Bound Phase 1.2 Task Contract ID. Strictly unique within graph instance (1:1 bijective). Pattern: `^TASK-[A-Z0-9_-]+$`. |
| `nodeType` | `Enum` | **REQUIRED** | **IMMUTABLE** | `ROOT`, `STANDARD`, `FORK_GATEWAY`, `JOIN_GATEWAY`, `TERMINAL`. |
| `structuralState` | `Enum` | **REQUIRED** | **MUTABLE** | `BLOCKED`, `ELIGIBLE`, `DISPATCHED`, `COMPLETED`, `FAILED`, `CANCELLED`. |
| `stageIndex` | `Integer` | **REQUIRED** | **DERIVED** | Zero-indexed topological wave/layer index calculated during validation. |
| `inDegree` | `Integer` | **REQUIRED** | **DERIVED** | Count of inbound edges ($\|\text{Pred}(v)\|$). |
| `outDegree` | `Integer` | **REQUIRED** | **DERIVED** | Count of outbound edges ($\|\text{Succ}(v)\|$). |
| `predecessors` | `Array[String]`| **REQUIRED** | **IMMUTABLE** | Unique list of `nodeId`s upon which this node depends. |
| `successors` | `Array[String]`| **REQUIRED** | **IMMUTABLE** | Unique list of `nodeId`s that depend on this node. |
| `executionMetadata` | `Object` | **REQUIRED** | **IMMUTABLE** | Execution context (contains `assignedSpecialistRole`, `allowedPaths`, `priority`). |

### 4.1 Field Invariants, Identity Derivation, Parity & Gateway Semantics
1. **Deterministic Identity Derivation & Mandatory Equality (Invariant I-02, P14-G1-16, P14-G1-20)**: `nodeId` is deterministically derived from the bound Phase 1.2 `taskId` via the canonical pattern `NODE-${taskId}`. For every node $v \in V$, the identity assertion $v.\text{nodeId} == \text{"NODE-" + } v.\text{taskId}$ is an absolute structural invariant enforced during graph validation. Any mismatch immediately raises `ERR_DAG_INVALID_TASK_BINDING`.
2. **Bijective Task Binding & Task ID Uniqueness (Invariant I-02, P14-G1-16, P14-G1-20)**: Exactly one Phase 1.2 Task Contract (`taskId`) is bound to exactly one `nodeId` per DAG instance ($V \leftrightarrow \text{Tasks}$). Duplicate `taskId` bindings across different nodes are strictly prohibited ($\forall u, v \in V : u \neq v \implies u.\text{taskId} \neq v.\text{taskId}$). Any attempt to bind the same `taskId` to multiple nodes fails validation with `ERR_DAG_INVALID_TASK_BINDING`.
3. **Node ID Uniqueness (Invariant I-02, P14-G1-09)**: Every DAG node MUST have a strictly unique `nodeId` within the graph instance ($\forall u, v \in V : u \neq v \implies \text{nodeId}(u) \neq \text{nodeId}(v)$). Note that while JSON Schema Draft 2020-12 `uniqueItems: true` enforces whole-object uniqueness across array elements, property-level `nodeId` uniqueness is an architectural invariant strictly enforced algorithmically during graph construction/validation, raising `ERR_DAG_DUPLICATE_NODE`.
4. **Authoritative Edge Primacy & Field Parity (Invariant I-05, P14-G1-11)**: The `edges` collection ($E$) is the sole authoritative source of truth for graph dependency relationships. The node fields `predecessors`, `successors`, `inDegree`, and `outDegree` are strictly **graph-derived representations**. For every node $v \in V$:
   - $\text{predecessors}(v) \equiv \{ u \in V \mid \exists e \in E : \text{sourceNodeId}(e) = u \land \text{targetNodeId}(e) = \text{nodeId}(v) \}$
   - $\text{successors}(v) \equiv \{ w \in V \mid \exists e \in E : \text{sourceNodeId}(e) = \text{nodeId}(v) \land \text{targetNodeId}(e) = w \}$
   - $\text{inDegree}(v) \equiv |\text{predecessors}(v)|$
   - $\text{outDegree}(v) \equiv |\text{successors}(v)|$
   Any discrepancy between declared node properties and authoritative edges fails validation with `ERR_DAG_IN_DEGREE_MISMATCH` or `ERR_DAG_OUT_DEGREE_MISMATCH`.
5. **Singular `nodeType` Precedence Hierarchy (P14-G1-13)**: Topological role classification (`nodeType`) maps degree states to a singular enum via an unambiguous, deterministic precedence ladder:
   - **Step 1 (Inbound Barrier Priority)**: If $\text{inDegree}(v) \ge 2 \implies \text{nodeType} = \text{JOIN_GATEWAY}$. (Convergence barrier synchronization is the hard gating prerequisite for eligibility; it strictly takes priority over outbound divergence and terminal exit).
   - **Step 2 (Outbound Divergence Priority)**: Else if $\text{outDegree}(v) \ge 2 \implies \text{nodeType} = \text{FORK_GATEWAY}$. (Branching fan-out takes priority over linear entry or standard sequential execution).
   - **Step 3 (Entry Readiness Priority)**: Else if $\text{inDegree}(v) == 0 \implies \text{nodeType} = \text{ROOT}$. (Immediate entry dispatch readiness takes priority over terminal exit; specifically, an isolated single-node task with $\text{inDegree} = 0 \land \text{outDegree} = 0$ is classified as `ROOT`, while its exit status is preserved by $\text{outDegree} = 0$ and counted in `leafNodeCount`).
   - **Step 4 (Exit Point Priority)**: Else if $\text{outDegree}(v) == 0 \implies \text{nodeType} = \text{TERMINAL}$. (Completion exit point of a dependency chain with $\text{inDegree} = 1 \land \text{outDegree} = 0$).
   - **Step 5 (Default)**: Else $\implies \text{nodeType} = \text{STANDARD}$. (Linear intermediate node with $\text{inDegree} = 1 \land \text{outDegree} = 1$).
   *Explicit Resolution of Overlapping Cases*:
   - $\text{inDegree} = 0 \land \text{outDegree} = 0 \implies \mathbf{ROOT}$ (Step 3).
   - $\text{inDegree} \ge 2 \land \text{outDegree} \ge 2 \implies \mathbf{JOIN\_GATEWAY}$ (Step 1).
   - $\text{inDegree} \ge 2 \land \text{outDegree} = 0 \implies \mathbf{JOIN\_GATEWAY}$ (Step 1).
   - $\text{inDegree} = 0 \land \text{outDegree} \ge 2 \implies \mathbf{FORK\_GATEWAY}$ (Step 2, with $\text{inDegree} = 0$ preserved in wave assignment and `rootNodeCount`).
   Any discrepancy between declared `nodeType` and topologically derived classification based on degree precedence fails validation with `ERR_DAG_NODE_TYPE_MISMATCH` (violates Invariant I-05, P14-G1-13, P14-G1-22).
6. **Deterministic Tie-Breaking Key**: Within `executionMetadata`, `priority` is a required integer key (default `100`) utilized exclusively as the primary comparator during topological sort tie-breaking.
7. **Schema Contract Parity**: All ten fields in Table 4 (`nodeId`, `taskId`, `nodeType`, `structuralState`, `stageIndex`, `inDegree`, `outDegree`, `predecessors`, `successors`, `executionMetadata`) are strictly **REQUIRED** in both this specification and the machine-readable JSON Schema.

---

## 5. DAG Edge Contract

Every dependency relationship is represented by a directional `DAGEdge` record:

| Field | Type | Obligation | Mutability | Architectural Meaning & Constraints |
| :--- | :---: | :---: | :---: | :--- |
| `edgeId` | `String` | **REQUIRED** | **IMMUTABLE** | Unique deterministic edge ID. Pattern: `^EDGE-[A-Z0-9_-]+$`. |
| `sourceNodeId` | `String` | **REQUIRED** | **IMMUTABLE** | Predecessor node ID ($u$). Must exist in graph nodes collection. |
| `targetNodeId` | `String` | **REQUIRED** | **IMMUTABLE** | Successor node ID ($v$). Must exist in graph nodes collection. |
| `dependencyType`| `Enum` | **REQUIRED** | **IMMUTABLE** | `STRONG_COMPLETION`, `ARTIFACT_PROVENANCE`, `BARRIER_SYNC`. |
| `edgeState` | `Enum` | **REQUIRED** | **MUTABLE** | `PENDING`, `SATISFIED`, `STALE`, `INVALIDATED`. |
| `requiredArtifacts`| `Array[String]`| **OPTIONAL** | **IMMUTABLE** | Specific artifact tokens required from $u$ to release $v$. |

### 5.1 Direction Convention, Edge Identity & Dependency Pair Uniqueness
```text
DIRECTION CONVENTION:
  u ──→ v   (sourceNodeId = u, targetNodeId = v)

SEMANTIC DEFINITION:
  "u precedes v"  OR  "v depends on u"
  Node v CANNOT become structurally ELIGIBLE until edge (u, v) is in SATISFIED state.
```
* **Edge Identity vs. Dependency Identity (Invariant I-04, P14-G1-10, P14-G1-21)**: The DAG model explicitly establishes and distinguishes between two distinct dimensions of uniqueness:
  1. **Edge Identity (`edgeId`)**: Every edge record must possess a strictly unique identifier within the graph instance ($\forall e_1, e_2 \in E : e_1 \neq e_2 \implies \text{edgeId}(e_1) \neq \text{edgeId}(e_2)$).
  2. **Dependency Identity (`(sourceNodeId, targetNodeId)`)**: For any pair of nodes $(u, v)$, at most one directed dependency edge $(u, v)$ may exist within a DAG ($\forall e_1, e_2 \in E \implies (\text{source}(e_1) = \text{source}(e_2) \land \text{target}(e_1) = \text{target}(e_2)) \implies e_1 = e_2$). Multiple edges between the same source and target are strictly prohibited regardless of `edgeId`.
* **Algorithmic Enforcement Boundary**: While JSON Schema Draft 2020-12 `uniqueItems: true` protects against identical complete edge objects, property-level `edgeId` uniqueness and directed dependency pair uniqueness across distinct edge objects are distinct algorithmic graph invariants strictly enforced during validation (`ERR_DAG_DUPLICATE_EDGE`).
* Implicit, bidirectional, or reverse edge semantics are strictly prohibited.

### 5.2 Edge State Domain Isolation
The dependency edge state vocabulary is strictly confined to:
* `PENDING`: Initial state; source node has not completed acceptance.
* `SATISFIED`: Source node completed acceptance; dependency condition fulfilled.
* `STALE`: Upstream rework detected; dependency currency is compromised.
* `INVALIDATED`: Ripple invalidation has formally revoked satisfaction.

Edge states represent the validity and currency of the dependency token passing between nodes. States such as `FAILED` or `CANCELLED` do NOT exist on edges; terminal failures are properties of DAG nodes and Phase 1.2 task lifecycles, not dependency channels.

---

## 6. Graph Contract & Invariants

A complete DAG instance is defined by the `DAGGraph` contract:

```text
DAGGraph
├── schemaVersion             (String: "1.0.0")
├── graphId                   (String: "^DAG-[A-Z0-9_-]+$")
├── wpId                      (String: "^WP-[A-Z0-9_-]+$")
├── correlationId             (RFC 4122 UUIDv4 via Draft 2020-12 regex pattern)
├── graphState                (Enum: INITIALIZED, VALIDATED, SCHEDULABLE, EXECUTING, BLOCKED, COMPLETED, FAILED, ABORTED)
├── nodes                     (Array of DAGNode records, minItems: 1)
├── edges                     (Array of DAGEdge records)
└── metadata                  (DAGMetadata: totalNodeCount, totalEdgeCount, rootNodeCount, leafNodeCount, isAcyclic, maxLayerDepth, deterministicSortOrder)
```

### 6.1 Core Structural Invariants
* **Invariant I-01 (Referential Integrity)**:  
  $\forall (u, v) \in E \implies u \in V \land v \in V$. Every edge endpoint must reference an existing node.
* **Invariant I-02 (Node ID Uniqueness, Task Binding & Anti-Reflexivity)**:  
  $\forall u, v \in V : u \neq v \implies \text{nodeId}(u) \neq \text{nodeId}(v) \land u.\text{taskId} \neq v.\text{taskId}$ (strict node and task identity uniqueness, with $v.\text{nodeId} == \text{"NODE-" + } v.\text{taskId}$), and $\forall v \in V \implies (v, v) \notin E$ (no self-loops).
* **Invariant I-03 (Strict Acyclicity)**:  
  There exists no sequence of vertices $\langle v_0, v_1, \dots, v_k \rangle$ such that $(v_i, v_{i+1}) \in E$ for $0 \le i < k$ and $v_0 = v_k$. (Graphs containing directed cycles fail closed with `ERR_DAG_CYCLE_DETECTED`).
* **Invariant I-04 (Edge Identity & Directed Edge Pair Uniqueness)**:  
  $\forall e_1, e_2 \in E : e_1 \neq e_2 \implies \text{edgeId}(e_1) \neq \text{edgeId}(e_2)$ (strict edge identity uniqueness), and $\forall e_1, e_2 \in E \implies (\text{source}(e_1) = \text{source}(e_2) \land \text{target}(e_1) = \text{target}(e_2)) \implies e_1 = e_2$ (directed dependency pair uniqueness). Both duplicate edge identifiers and multiple dependency pairs between identical nodes are strictly prohibited.
* **Invariant I-05 (Authoritative Edge Parity & Topological Role Parity)**:  
  The `edges` collection $E$ is the single source of truth for dependencies. For every node $v$, its `predecessors`, `successors`, `inDegree`, and `outDegree` must match $E$ identically (`ERR_DAG_IN_DEGREE_MISMATCH`, `ERR_DAG_OUT_DEGREE_MISMATCH`), and its `nodeType` must strictly match the deterministic role classification derived from its verified degree states via the singular precedence hierarchy (`ERR_DAG_NODE_TYPE_MISMATCH`).
* **Invariant I-06 (Deterministic Sortability & Tie-Breaking)**:  
  A valid graph must yield an identical topological sequence and layer assignment under repeated evaluations for any isomorphic graph input.
* **Invariant I-07 (Concurrency Decoupling)**:  
  Graph topology defines structural dependency ordering only; it does not specify runtime agent concurrency limits (which belong to `WP-P14-02`).
* **Invariant I-08 (Derived Graph Metadata Consistency)**:  
  All 7 fields in `metadata` (`totalNodeCount`, `totalEdgeCount`, `rootNodeCount`, `leafNodeCount`, `isAcyclic`, `maxLayerDepth`, `deterministicSortOrder`) are strictly derived topological state calculated from graph structure. Non-topological attributes such as timestamps (`createdAt`) are explicitly excluded from the derived DAG metadata contract. Any input metadata diverging from derived values fails validation (`ERR_DAG_METADATA_MISMATCH`).

### 6.2 Graph Lifecycle State Vocabulary (P14-G1-19)
The `graphState` enum establishes the macro-orchestration lifecycle status of the DAG graph instance. In strict synchronization with `dag-graph-schema.json`, the vocabulary comprises exactly 8 states:
1. `INITIALIZED`: Graph structure instantiated from Work Package decomposition; awaiting structural validation.
2. `VALIDATED`: Structural validation complete; referential integrity, acyclicity, and invariants verified.
3. `SCHEDULABLE`: Topological sort and wave partition derived; ready for dispatch consideration.
4. `EXECUTING`: One or more nodes currently dispatched to agent containers under concurrency limiters (`WP-P14-02`).
5. `BLOCKED`: Graph execution paused or suspended due to dependency blockage or administrative freeze.
6. `COMPLETED`: All nodes have successfully completed and reached accepted status.
7. `FAILED`: Graph execution terminated prematurely due to unrecoverable task failure or rejection.
8. `ABORTED`: Graph execution cancelled or evicted via administrative override or parent Work Package cancellation.

*Boundary Preservation*: WP-P14-01 defines the structural representation of these states. State transitions during execution are governed by downstream execution modules (`WP-P14-02`); WP-P14-01 is strictly confined to initialization, validation, and schedulability analysis (`INITIALIZED` $\to$ `VALIDATED` $\to$ `SCHEDULABLE`).

---

## 7. Work Package Decomposition Mapping (`DO_WP` $\to$ DAG)

The Work Package Contract (`DO_WP`) defined in Phase 1.1 Section 7/18 (`taskDecompositionRef`) maps deterministically into the Phase 1.4 DAG:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         DECOMPOSITION MAPPING TOPOLOGY                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Phase 1.1: DO_WP (Work Package Contract)                                       │
│   ├── wpId: "WP-AUTH-001"                                                        │
│   └── taskDecompositionRef:                                                      │
│       ├── tasks: [ { taskId: "TASK-01", dependencies: [] },                      │
│       │            { taskId: "TASK-02", dependencies: ["TASK-01"] } ]            │
│       └── dagTopologyRef: "docs/eeos-o/specs/phase-1.4/dags/DAG-AUTH-001.json"   │
│                                                                                  │
│                              │ MAPPED INTO                                       │
│                              ▼                                                   │
│                                                                                  │
│   Phase 1.4: DAGGraph                                                            │
│   ├── graphId: "DAG-WP-AUTH-001"                                                 │
│   ├── wpId: "WP-AUTH-001"                                                        │
│   ├── nodes: [ Node("NODE-TASK-01"), Node("NODE-TASK-02") ]                      │
│   └── edges: [ Edge("NODE-TASK-01" → "NODE-TASK-02") ]                           │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Mapping Rules:
1. **Node Derivation**: Each entry in `taskDecompositionRef.tasks` maps 1-to-1 to a `DAGNode`. The `nodeId` is deterministically derived as `NODE-${taskId}`.
2. **Edge Derivation**: For each `depTaskId` in `task.dependencies`, a directed edge `(NODE-${depTaskId}, NODE-${taskId})` is synthesized with `dependencyType = STRONG_COMPLETION`.
3. **Metadata Inheritance**: Work package environment, execution window, and correlation ID are inherited directly into graph metadata.
4. **Boundary Preservation**: The underlying Task Contracts remain external entities governed by Phase 1.2; the DAG node holds a foreign-key binding (`taskId`) without duplicating task internal state.
5. **Gateway & Node Role Assignment (Singular Precedence Hierarchy)**: Topological roles (`nodeType`) are derived from the synthesized dependency edges via the strict precedence ladder:
   - **Precedence 1 (Inbound Convergence)**: If $|\text{dependencies}| \ge 2 \implies \text{nodeType} = \text{JOIN_GATEWAY}$ (inbound synchronization barrier takes priority over outbound divergence and terminal status).
   - **Precedence 2 (Outbound Divergence)**: Else if $|\text{dependents}| \ge 2 \implies \text{nodeType} = \text{FORK_GATEWAY}$ (divergent branching fan-out).
   - **Precedence 3 (Entry Readiness)**: Else if $|\text{dependencies}| = 0 \implies \text{nodeType} = \text{ROOT}$ (entry readiness; specifically, isolated tasks with $|\text{dependencies}| = 0 \land |\text{dependents}| = 0$ map to `ROOT`).
   - **Precedence 4 (Chain Completion)**: Else if $|\text{dependents}| = 0 \implies \text{nodeType} = \text{TERMINAL}$ (exit point for linear chains with $|\text{dependencies}| = 1$).
   - **Precedence 5 (Default)**: Else $\implies \text{nodeType} = \text{STANDARD}$ (linear intermediate link with 1 predecessor and 1 successor).
   *Guaranteed Bijective Task Binding*: Every node without exception remains bound 1-to-1 with its Phase 1.2 `taskId`. Gateways are structural classifications of actual tasks, guaranteeing zero synthetic, phantom, or unmapped tasks.

---

## 8. Dependency Lifecycle Semantics

From the perspective of graph traversal, every dependency edge progresses through a deterministic lifecycle:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           EDGE DEPENDENCY LIFECYCLE                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [PENDING]                                                                      │
│       │                                                                          │
│       ├──(Source Task Completes & Validated)──> [SATISFIED]                      │
│       │                                             │                            │
│       │                                             ├──(Upstream Rework Trigger) │
│       │                                             ▼                            │
│       └──(Upstream Rework / Source Fails)─────>  [STALE]                         │
│                                                     │                            │
│                                                     ├──(Ripple Traversal)        │
│                                                     ▼                            │
│                                               [INVALIDATED]                      │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **`PENDING`**: Initial state upon graph initialization. Predecessor $u$ has not completed.
2. **`SATISFIED`**: Predecessor $u$ has reached Phase 1.2 `ACCEPTED` status and produced all required artifact tokens. Edge condition is satisfied.
3. **`STALE`**: Predecessor $u$ has entered Phase 1.2 `REWORK_REQUIRED`. The edge output can no longer be trusted.
4. **`INVALIDATED`**: Downstream invalidation traversal (`WP-P14-03`) has formally revoked the satisfaction token. Dependent node $v$ must block or revert.

### Structural Handling of Fault Conditions:
* **Missing Node Reference**: Fails closed during graph validation (`ERR_DAG_UNRESOLVED_NODE`).
* **Unresolved Edge Dependency**: Node remains perpetually `BLOCKED`; graph flagged as unschedulable.
* **Cycle Encountered**: Graph rejected immediately at initialization (`ERR_DAG_CYCLE_DETECTED`).

---

## 9. Formal Node Eligibility Predicate

A node $v \in V$ is declared structurally **`ELIGIBLE`** if and only if its internal structural dependencies are fully satisfied, and no external orchestrator halt is active:

$$\text{Eligible}(v, \Omega_{\text{gov}}) \iff \text{Eligible}_{\text{structural}}(v) \land \Big( \neg \text{IsOrchestratorHalted}(\Omega_{\text{gov}}) \Big)$$

where internal structural eligibility is defined as:

$$\text{Eligible}_{\text{structural}}(v) \iff \Big( \text{structuralState}(v) = \text{BLOCKED} \Big) \land \Big( \forall u \in \text{Pred}(v) : \text{edgeState}(u, v) = \text{SATISFIED} \Big)$$

### Predicate Breakdown:
1. **$\text{structuralState}(v) = \text{BLOCKED}$**: The node is currently in the initial blocked state awaiting scheduling and has not yet been dispatched, completed, or cancelled.
2. **$\forall u \in \text{Pred}(v) : \text{edgeState}(u, v) = \text{SATISFIED}$**: Every inbound dependency edge from all predecessor nodes is in the `SATISFIED` state. If $\text{Pred}(v) = \emptyset$ (Root node), this condition vacuously evaluates to `TRUE`.
3. **$\neg \text{IsOrchestratorHalted}(\Omega_{\text{gov}})$**: External governance condition representing orchestrator-level administrative pause, tenant freeze, or emergency halt. **Crucial Contract Distinction**: `IsOrchestratorHalted` is an **external runtime input** evaluated at the orchestrator boundary; it is **NOT** a field on the `DAGNode` schema, ensuring the schema remains strictly confined to structural graph invariants.

Once $\text{Eligible}(v, \Omega_{\text{gov}})$ is satisfied, the macro-orchestrator transitions the node to `ELIGIBLE`, queuing it for dispatch under `WP-P14-02` concurrency limiters.

---

## 10. Deterministic Topological Sorting Algorithm

To guarantee reproducible, deterministic execution ordering across distributed orchestrator nodes, Phase 1.4 implements **Lexicographical Kahn's Algorithm**:

### 10.1 Mathematical Specification
Let $G = (V, E)$ be a DAG.
* In-degree array: $D[v] = |\text{Pred}(v)|, \forall v \in V$.
* Min-Heap priority queue $Q$ ordered primarily by `priority` ascending, tie-broken by `nodeId` lexicographically ascending.

### 10.2 Algorithm Pseudocode & Comprehensive Structural Verification
```text
ALGORITHM DeterministicTopologicalSortAndValidation(G = (V, E, metadata)):
    INPUT:
        V: List of DAGNode
        E: List of DAGEdge
        metadata: Optional DAGMetadata
    OUTPUT:
        L: Deterministic ordered list of nodeId
        Waves: List of execution layers (List of List of nodeId)
        derivedMetadata: Complete verified DAGMetadata

    1. Cardinality and Empty Graph Check:
        if |V| == 0 then:
            raise GraphValidationError("ERR_DAG_EMPTY_GRAPH", "Graph contains zero nodes.")

    2. Node ID, Task ID Uniqueness & Bijective Binding Verification (Invariants I-02, P14-G1-09, P14-G1-16):
        seenNodeIds = HashSet<String>()
        seenTaskIds = HashSet<String>()
        inDegreeMap = HashMap<String, Integer>()
        adjacencyList = HashMap<String, List<String>>()
        reverseAdjacency = HashMap<String, List<String>>()

        for each v in V:
            expectedNodeId = "NODE-" + v.taskId
            if v.nodeId != expectedNodeId then:
                raise GraphValidationError("ERR_DAG_INVALID_TASK_BINDING", 
                    "Node identity mismatch for task " + v.taskId + ": expected " + expectedNodeId + ", got " + v.nodeId)

            if v.nodeId in seenNodeIds then:
                raise GraphValidationError("ERR_DAG_DUPLICATE_NODE", v.nodeId)
            seenNodeIds.add(v.nodeId)

            if v.taskId in seenTaskIds then:
                raise GraphValidationError("ERR_DAG_INVALID_TASK_BINDING", 
                    "Duplicate task binding detected: taskId " + v.taskId + " bound to multiple nodes.")
            seenTaskIds.add(v.taskId)

            inDegreeMap[v.nodeId] = 0
            adjacencyList[v.nodeId] = EmptyList()
            reverseAdjacency[v.nodeId] = EmptyList()

    3. Edge Referential Integrity, Self-Loop, Edge ID & Pair Uniqueness (Invariants I-01, I-02, I-04, P14-G1-10, P14-G1-21):
        seenEdgeIds = HashSet<String>()
        seenEdgePairs = HashSet<Pair<String, String>>()

        for each edge in E:
            if edge.edgeId in seenEdgeIds then:
                raise GraphValidationError("ERR_DAG_DUPLICATE_EDGE", "Duplicate edgeId detected: " + edge.edgeId)
            seenEdgeIds.add(edge.edgeId)

            u = edge.sourceNodeId
            v = edge.targetNodeId

            if u not in seenNodeIds or v not in seenNodeIds then:
                raise GraphValidationError("ERR_DAG_UNRESOLVED_NODE", u, v)

            if u == v then:
                raise GraphValidationError("ERR_DAG_SELF_LOOP", u)

            pairKey = (u, v)
            if pairKey in seenEdgePairs then:
                raise GraphValidationError("ERR_DAG_DUPLICATE_EDGE", "Duplicate dependency pair detected: (" + u + ", " + v + ")")
            seenEdgePairs.add(pairKey)

            inDegreeMap[v] = inDegreeMap[v] + 1
            adjacencyList[u].append(v)
            reverseAdjacency[v].append(u)

    4. Predecessor/Successor Field Parity & NodeType Precedence (Invariants I-05, P14-G1-11, P14-G1-13, P14-G1-22):
        for each v in V:
            actualPreds = reverseAdjacency[v.nodeId]
            actualSuccs = adjacencyList[v.nodeId]

            if set(v.predecessors) != set(actualPreds) or v.inDegree != actualPreds.size() then:
                raise GraphValidationError("ERR_DAG_IN_DEGREE_MISMATCH", v.nodeId)

            if set(v.successors) != set(actualSuccs) or v.outDegree != actualSuccs.size() then:
                raise GraphValidationError("ERR_DAG_OUT_DEGREE_MISMATCH", v.nodeId)

            // Validate deterministic singular nodeType via precedence ladder:
            expectedType = null
            if v.inDegree >= 2 then:
                expectedType = "JOIN_GATEWAY"
            else if v.outDegree >= 2 then:
                expectedType = "FORK_GATEWAY"
            else if v.inDegree == 0 then:
                expectedType = "ROOT"
            else if v.outDegree == 0 then:
                expectedType = "TERMINAL"
            else:
                expectedType = "STANDARD"

            if v.nodeType != expectedType then:
                raise GraphValidationError("ERR_DAG_NODE_TYPE_MISMATCH", 
                    "Node type mismatch for " + v.nodeId + ": expected " + expectedType + ", got " + v.nodeType)

    5. Seed Zero In-Degree Root Nodes & Cycle Detection (Invariants I-03, P14-G1-17):
        L = EmptyList()
        nextWaveQueue = PriorityQueue(Comparator: (a, b) -> 
            if a.priority != b.priority then return a.priority - b.priority
            else return a.nodeId.compareTo(b.nodeId)
        )

        for each v in V:
            if inDegreeMap[v.nodeId] == 0:
                nextWaveQueue.insert(v)

        if nextWaveQueue.isEmpty() and |V| > 0:
            // In a finite directed graph, zero nodes of in-degree 0 mathematically guarantees that
            // every node has in-degree >= 1, establishing the existence of at least one directed cycle.
            // Unified fail-closed abort with ERR_DAG_CYCLE_DETECTED:
            cycleNodes = [v.nodeId for v in V if inDegreeMap[v.nodeId] > 0]
            raise GraphCycleError("ERR_DAG_CYCLE_DETECTED", cycleNodes)

    6. Layered Traversal (Lexicographical Kahn's Algorithm):
        Waves = EmptyList()
        layerIndex = 0
        workingInDegree = HashMap(inDegreeMap)

        while not nextWaveQueue.isEmpty():
            currentWaveNodes = nextWaveQueue.extractAllSorted()
            currentLayerList = EmptyList()

            for each u in currentWaveNodes:
                L.append(u.nodeId)
                currentLayerList.append(u.nodeId)
                u.stageIndex = layerIndex

                for each vId in adjacencyList[u.nodeId]:
                    workingInDegree[vId] = workingInDegree[vId] - 1
                    if workingInDegree[vId] == 0:
                        vNode = getNodeById(V, vId)
                        nextWaveQueue.insert(vNode)

            Waves.append(currentLayerList)
            layerIndex = layerIndex + 1

    7. Cycle Detection Assertion (Invariant I-03):
        if |L| != |V| then:
            cycleNodes = [v.nodeId for v in V if workingInDegree[v.nodeId] > 0]
            raise GraphCycleError("ERR_DAG_CYCLE_DETECTED", cycleNodes)

    8. Metadata Derivation & Consistency Verification (Invariant I-08, P14-G1-12):
        derivedMetadata = {
            totalNodeCount: |V|,
            totalEdgeCount: |E|,
            rootNodeCount: count(v in V where inDegreeMap[v.nodeId] == 0),
            leafNodeCount: count(v in V where adjacencyList[v.nodeId].size() == 0),
            isAcyclic: (|L| == |V|),
            maxLayerDepth: max(0, Waves.size() - 1),
            deterministicSortOrder: L
        }

        if metadata != null then:
            if metadata.totalNodeCount != derivedMetadata.totalNodeCount or
               metadata.totalEdgeCount != derivedMetadata.totalEdgeCount or
               metadata.rootNodeCount != derivedMetadata.rootNodeCount or
               metadata.leafNodeCount != derivedMetadata.leafNodeCount or
               metadata.isAcyclic != derivedMetadata.isAcyclic or
               metadata.maxLayerDepth != derivedMetadata.maxLayerDepth or
               metadata.deterministicSortOrder != derivedMetadata.deterministicSortOrder then:
                raise GraphValidationError("ERR_DAG_METADATA_MISMATCH", "Declared metadata diverges from topologically derived values.")

    RETURN (L, Waves, derivedMetadata)
```

### 10.3 Determinism Invariant & Boundary
Given graph inputs $G_1$ and $G_2$:
$$\text{Isomorphic}(G_1, G_2) \land (V_1 = V_2) \land (E_1 = E_2) \implies \text{DeterministicTopologicalSort}(G_1) = \text{DeterministicTopologicalSort}(G_2)$$

**Scope of Determinism Guarantee**:
The topological sorting algorithm guarantees 100% deterministic, reproducible total ordering of nodes, tie-breaking sequence, and execution wave partitioning for any isomorphic graph input. This provides an unambiguous, repeatable structural sequence to the orchestrator.

**Architectural Concurrency Decoupling**:
Structural topological determinism does **not** eliminate runtime distributed execution races, agent worker concurrency races, or network/infrastructure scheduling races. Concurrency throttles (`maxParallelAgents`), worker pool arbitration, and runtime race controls are strictly the architectural responsibility of downstream module `WP-P14-02` (Fork/Join Barrier & Concurrency Architecture).

---

## 11. Execution Layers / Waves

The algorithm partitions nodes into deterministic **Execution Layers** (topological depth waves):

```text
Layer 0 (Stage 0): Roots (inDegree = 0)
  ├── NODE-01
  └── NODE-02

Layer 1 (Stage 1): Depend strictly on Layer 0
  ├── NODE-03
  └── NODE-04

Layer 2 (Stage 2): Join / Dependent nodes
  └── NODE-05
```

### Architectural Axiom on Layers:
* **Wave Progression**: Nodes in Layer $k$ can only become eligible when required predecessors in Layers $0 \dots k-1$ are satisfied.
* **Non-Equivalence to Concurrency**: Layer membership indicates *topological distance* from roots. It does **not** authorize concurrent execution of all layer nodes. Concurrency limits (`maxParallelAgents`) are enforced downstream by `WP-P14-02`.

---

## 12. Cycle Detection Mechanics

Cycle detection is enforced strictly as a **fail-closed pre-execution gate**:
1. **Mathematical Invariant & Root Precedence (P14-G1-17)**: In any finite directed graph $G = (V, E)$ with $|V| > 0$, if there exist zero nodes with in-degree 0 ($\text{inDegree}(v) \ge 1 \;\forall v \in V$), the graph mathematically contains at least one directed cycle (by the Pigeonhole Principle on backwards edge traversal). Therefore, a "no-root" condition in a non-empty graph is not an independent structural topology but a direct manifestation of a directed cycle. It is deterministically unified under `ERR_DAG_CYCLE_DETECTED`, eliminating algorithmic precedence ambiguity.
2. **Detection Principle**: In an acyclic graph, Kahn's algorithm processes every node ($|L| = |V|$). If the zero-in-degree queue becomes empty while $|L| < |V|$, all residual nodes with `inDegreeMap[v] > 0` belong to or depend on directed cycles.
3. **Cycle Identification**: The residual nodes with `inDegreeMap[v] > 0` are extracted to construct the cycle diagnostic report.
4. **Fail-Closed Policy**: A cyclic graph is immediately rejected with error `ERR_DAG_CYCLE_DETECTED`. Zero partial scheduling, fallback execution, or cycle-breaking heuristics are permitted.

---

## 13. Structural Error Model

Invalid graph topologies and contract violations are governed by an explicit, machine-readable architectural catalogue of 11 stable fatal structural error codes:

| # | Error Identifier | Severity | Trigger Condition | Architectural Action |
| :-: | :--- | :---: | :--- | :--- |
| 1 | **`ERR_DAG_EMPTY_GRAPH`** | **FATAL** | Graph contains zero nodes ($\|V\| = 0$; violates schema `minItems: 1`). | Reject graph; fail-closed abort. |
| 2 | **`ERR_DAG_DUPLICATE_NODE`** | **FATAL** | Multiple nodes share identical `nodeId` within graph instance (violates Invariant I-02, P14-G1-09). | Reject graph; fail-closed abort. |
| 3 | **`ERR_DAG_INVALID_TASK_BINDING`**| **FATAL** | Node `nodeId != "NODE-" + v.taskId` or duplicate `taskId` binding across nodes (violates Invariant I-02, P14-G1-16, P14-G1-20). | Reject graph; fail-closed abort. |
| 4 | **`ERR_DAG_UNRESOLVED_NODE`** | **FATAL** | Edge references a `sourceNodeId` or `targetNodeId` absent from $V$ (violates Invariant I-01). | Reject graph; fail-closed abort. |
| 5 | **`ERR_DAG_SELF_LOOP`** | **FATAL** | Edge exists where `sourceNodeId == targetNodeId` (violates Invariant I-02). | Reject graph; fail-closed abort. |
| 6 | **`ERR_DAG_DUPLICATE_EDGE`** | **FATAL** | Duplicate edge identity (`edgeId`) or duplicate directed dependency pair `(sourceNodeId, targetNodeId)` exists (violates Invariant I-04, P14-G1-10, P14-G1-21). | Reject graph; fail-closed abort. |
| 7 | **`ERR_DAG_IN_DEGREE_MISMATCH`** | **FATAL** | Declared `node.inDegree` does not equal cardinality of `node.predecessors` or incoming edges (violates Invariant I-05, P14-G1-11). | Reject graph; fail-closed abort. |
| 8 | **`ERR_DAG_OUT_DEGREE_MISMATCH`**| **FATAL** | Declared `node.outDegree` does not equal cardinality of `node.successors` or outgoing edges (violates Invariant I-05, P14-G1-11). | Reject graph; fail-closed abort. |
| 9 | **`ERR_DAG_NODE_TYPE_MISMATCH`** | **FATAL** | Declared `node.nodeType` does not equal topologically derived classification based on degree precedence hierarchy (JOIN_GATEWAY > FORK_GATEWAY > ROOT > TERMINAL > STANDARD; violates Invariant I-05, P14-G1-13, P14-G1-22). | Reject graph; fail-closed abort. |
| 10 | **`ERR_DAG_CYCLE_DETECTED`** | **FATAL** | One or more directed cycles exist in graph edges ($\|L\| < \|V\|$, including zero-root cycle conditions; P14-G1-17). | Reject graph; fail-closed abort. |
| 11 | **`ERR_DAG_METADATA_MISMATCH`** | **FATAL** | Declared metadata diverges from derived topological metrics (node, edge, root, leaf counts, acyclicity, maxLayerDepth, or sort order; P14-G1-12, P14-G1-14, P14-G1-15). | Reject graph; fail-closed abort. |

> **Architectural Decisions on Error Catalogue Consolidation (P14-G1-17, P14-G1-18, P14-G1-20, P14-G1-21, P14-G1-22)**:
> 1. `ERR_DAG_NO_ROOT_NODES` has been removed from the stable error catalogue and subsumed under `ERR_DAG_CYCLE_DETECTED`. A finite non-empty directed graph with zero in-degree 0 nodes is mathematically cyclic (P14-G1-17). Unifying this produces a single, unambiguous diagnostic for cyclic dependencies (such as $A \to B \to C \to A$).
> 2. `ERR_DAG_DISCONNECTED_COMPONENT` has been removed from the structural error catalogue (Option B, P14-G1-18). Disconnected acyclic subgraphs are completely valid DAG execution topologies that are naturally handled across parallel topological waves. An unsupported warning claim is strictly purged from the stable structural error catalogue.
> 3. `ERR_DAG_INVALID_TASK_BINDING` is governed strictly by Invariant I-02 (Node ID Uniqueness, Task Binding & Anti-Reflexivity). The erroneous reference to Invariant I-06 (Deterministic Sortability) has been corrected (P14-G1-20).
> 4. `ERR_DAG_DUPLICATE_EDGE` architectural scope is consolidated to cover both duplicate edge identity (`edgeId`) and duplicate directed dependency pair `(sourceNodeId, targetNodeId)` violations under Invariant I-04 (P14-G1-21).
> 5. `ERR_DAG_NODE_TYPE_MISMATCH` is introduced as a dedicated stable fatal error code (governed by Invariant I-05 and Section 4.1 Item 5) to cleanly separate topological classification mismatches from task binding violations (`ERR_DAG_INVALID_TASK_BINDING`), expanding the stable structural error catalogue to exactly 11 fatal error codes (P14-G1-22).

---

## 14. State Domain Segregation (Phase 1.4 DAG vs. Phase 1.2 Task)

To eliminate state machine contamination, EEOS-O establishes a strict boundary between the macro-orchestrator's DAG node states and the atomic Task FSM states:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            STATE DOMAIN SEGREGATION                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   PHASE 1.4 DAG NODE STRUCTURAL STATE (Macro-Orchestrator Scope)                 │
│   Controls graph dependency ordering, topological release, and wave queuing:     │
│   [ BLOCKED ] ───> [ ELIGIBLE ] ───> [ DISPATCHED ] ───> [ COMPLETED ]           │
│                                              │                                   │
│                                              └───> [ FAILED / CANCELLED ]        │
│                                                                                  │
│                                     │ BINDS TO VIA taskId                        │
│                                     ▼                                            │
│                                                                                  │
│   PHASE 1.2 TASK FSM STATE (Micro-Execution Scope)                               │
│   Controls single-task internal lifecycle executed by agent turn session:        │
│   [ DRAFT ] ──> [ READY ] ──> [ ASSIGNED ] ──> [ IN_EXECUTION ] ──> [ ACCEPTED ]│
│                                                    │                             │
│                                                    └──> [ REWORK_REQUIRED ]      │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Domain Mapping Table:
| DAG Node Structural State | Corresponding Phase 1.2 Task FSM State | Orchestration Interpretation |
| :--- | :--- | :--- |
| **`BLOCKED`** | `DRAFT` or `READY` | Task exists, but upstream dependencies remain unsatisfied. |
| **`ELIGIBLE`** | `READY` | All predecessors satisfied; queued for agent dispatch. |
| **`DISPATCHED`** | `ASSIGNED` $\to$ `IN_EXECUTION` | Dispatched to agent container under `WP-P14-02` concurrency slot. |
| **`COMPLETED`** | `ACCEPTED` | Deliverables produced and accepted; dependent edges satisfied. |
| **`FAILED`** | `FAILED` or `REJECTED` | Execution halted due to terminal failure. |
| **`CANCELLED`** | `CANCELLED` | Evicted or aborted via upstream cascade. |

*Crucial Boundary Invariant*: Phase 1.4 never transitions Phase 1.2 internal task states directly; it triggers lifecycle transition requests through authorized Phase 1.2 task interfaces.

---

## 15. Synthetic Architectural Examples

### Example A: Sequential Dependency Chain
```text
[ NODE-A ] ──→ [ NODE-B ] ──→ [ NODE-C ]

Graph Definition:
  Nodes: { NODE-A, NODE-B, NODE-C }
  Edges: { (NODE-A → NODE-B), (NODE-B → NODE-C) }

Validation & Sorting Result:
  Cycle Detected : FALSE
  Wave 0 (Stage 0): [ NODE-A ]
  Wave 1 (Stage 1): [ NODE-B ]
  Wave 2 (Stage 2): [ NODE-C ]
  Deterministic Sequence: < NODE-A, NODE-B, NODE-C >
```

### Example B: Forking Parallel Branches
```text
                  ┌──→ [ NODE-B ]
[ NODE-A ] ───────┤
                  └──→ [ NODE-C ]

Graph Definition:
  Nodes: { NODE-A, NODE-B, NODE-C }
  Edges: { (NODE-A → NODE-B), (NODE-A → NODE-C) }

Validation & Sorting Result:
  Cycle Detected : FALSE
  Wave 0 (Stage 0): [ NODE-A ]
  Wave 1 (Stage 1): [ NODE-B, NODE-C ]  (Tie-broken lexicographically: NODE-B before NODE-C)
  Deterministic Sequence: < NODE-A, NODE-B, NODE-C >
```

### Example C: Multi-Predecessor Join Barrier
```text
[ NODE-A ] ───┐
              ├──→ [ NODE-D ]
[ NODE-B ] ───┘

Graph Definition:
  Nodes: { NODE-A, NODE-B, NODE-D }
  Edges: { (NODE-A → NODE-D), (NODE-B → NODE-D) }

Validation & Sorting Result:
  Cycle Detected : FALSE
  Wave 0 (Stage 0): [ NODE-A, NODE-B ]  (Roots with in-degree 0)
  Wave 1 (Stage 1): [ NODE-D ]          (inDegree = 2; blocked until BOTH A and B are SATISFIED)
  Deterministic Sequence: < NODE-A, NODE-B, NODE-D >
```

### Example D: Directed Cycle Rejection
```text
[ NODE-A ] ──→ [ NODE-B ] ──→ [ NODE-C ] ──┐
    ▲                                      │
    └──────────────────────────────────────┘

Graph Definition:
  Nodes: { NODE-A, NODE-B, NODE-C }
  Edges: { (NODE-A → NODE-B), (NODE-B → NODE-C), (NODE-C → NODE-A) }

Validation & Sorting Result:
  Root Nodes (inDegree = 0): 0 found.
  Cycle Detected : TRUE
  Action: REJECT GRAPH IMMEDIATELY (ERR_DAG_CYCLE_DETECTED: [NODE-A, NODE-B, NODE-C]).
  Execution Halted: Fail-closed.
```

---

## 16. JSON Schema Validation & Expressiveness Boundary

The machine-readable contract is formally specified in:
> [`docs/eeos-o/specs/phase-1.4/schemas/dag-graph-schema.json`](file:///e:/Projects/Os_Darta/docs/eeos-o/specs/phase-1.4/schemas/dag-graph-schema.json)

### Division of Validation Responsibilities:
* **Covered by JSON Schema Draft 2020-12 (Syntactic & Structural Validation)**:
  - Property types, formats (`uuid`), and regex patterns (`nodeId`, `taskId`, `edgeId`, `graphId`, `wpId`).
  - Strict required fields on all records (`nodes`, `edges`, `graphMetadata.totalNodeCount`, `graphMetadata.totalEdgeCount`, `graphMetadata.rootNodeCount`, `graphMetadata.leafNodeCount`, `graphMetadata.isAcyclic`, `graphMetadata.maxLayerDepth`, `graphMetadata.deterministicSortOrder`, `dagNode.predecessors`, `dagNode.successors`, `executionMetadata.priority`).
  - Formal RFC 4122 UUIDv4 pattern validation: `^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`.
  - Cardinality boundaries (`minItems: 1` on `nodes`).
  - Enum membership constraints (`nodeType`, `structuralState`, `dependencyType`, `edgeState`, `graphState`).
  - Whole-object array uniqueness via `uniqueItems: true` (rejecting duplicate identical complete node or edge JSON objects).
* **Covered by Algorithmic Traversal & Graph Validation (`WP-P14-01`)**:
  - **Property-Level Node ID Uniqueness (Invariant I-02, P14-G1-09)**: Verifies that no two distinct node records share identical `nodeId` (`ERR_DAG_DUPLICATE_NODE`), which standard JSON Schema array keywords cannot enforce across object properties.
  - **Bijective Task Binding & Task ID Uniqueness (Invariant I-02, P14-G1-16, P14-G1-20)**: Verifies that `nodeId == "NODE-" + v.taskId` and no two distinct nodes share identical `taskId` (`ERR_DAG_INVALID_TASK_BINDING`).
  - **Edge Identity & Directed Edge Pair Uniqueness (Invariant I-04, P14-G1-10, P14-G1-21)**: Verifies that no two distinct edge records share identical `edgeId` (edge identity uniqueness) and no two distinct edge records share identical `(sourceNodeId, targetNodeId)` (directed dependency pair uniqueness), both raising `ERR_DAG_DUPLICATE_EDGE`. Ordinary JSON Schema `uniqueItems: true` only guards against identical whole-object JSON elements, necessitating algorithmic property-level enforcement for both distinct invariant checks.
  - **Referential Integrity & Self-Loops (Invariants I-01, I-02)**: Verifies that edge endpoints exist in $V$ (`ERR_DAG_UNRESOLVED_NODE`) and no self-loops exist (`ERR_DAG_SELF_LOOP`).
  - **Authoritative Edge Parity (Invariant I-05, P14-G1-11)**: Verifies that node fields `predecessors`, `successors`, `inDegree`, and `outDegree` match authoritative edges $E$ identically (`ERR_DAG_IN_DEGREE_MISMATCH`, `ERR_DAG_OUT_DEGREE_MISMATCH`).
  - **Singular NodeType Precedence & Parity (Invariant I-05, P14-G1-13, P14-G1-22)**: Enforces deterministic role mapping based on in/out degree precedence ladder and validates declared `nodeType` against topologically derived classification, raising `ERR_DAG_NODE_TYPE_MISMATCH` upon divergence.
  - **Global Acyclicity Validation (Invariant I-03, P14-G1-17)**: Traverses graph via Kahn's algorithm to enforce strict acyclicity and fail-closed cycle rejection (`ERR_DAG_CYCLE_DETECTED`).
  - **Topological Layer Depth Assignment**: Computes stage wave indices (`stageIndex`) and assigns execution layers.
  - **Derived Metadata Verification (Invariant I-08, P14-G1-12, P14-G1-14, P14-G1-15)**: Calculates and cross-validates all 7 metadata fields (`totalNodeCount`, `totalEdgeCount`, `rootNodeCount`, `leafNodeCount`, `isAcyclic`, `maxLayerDepth`, `deterministicSortOrder`) against graph topology (`ERR_DAG_METADATA_MISMATCH`). Non-topological timestamps (`createdAt`) are strictly excluded from the derived DAG metadata contract.
  - **External Governance Integration**: Evaluates external orchestrator halt context ($\neg \text{IsOrchestratorHalted}(\Omega_{\text{gov}})$) during dispatch readiness evaluation.

---

## 17. Downstream Consumption Contracts

`WP-P14-01` exports stable architectural primitives consumed by subsequent Phase 1.4 modules:

| Downstream Module | Consumed Primitives from WP-P14-01 | Architectural Handshake |
| :--- | :--- | :--- |
| **`WP-P14-02`** (Fork/Join & Concurrency) | `nodeType == JOIN_GATEWAY`, `predecessors`, `inDegree` | `WP-P14-02` uses join-node structures to model synchronization barriers and concurrency throttles. |
| **`WP-P14-03`** (Ripple Invalidation) | `edges`, `successors`, `edgeState` | `WP-P14-03` traverses downstream adjacency edges to trigger invalidation upon upstream rework. |
| **`WP-P14-04`** (Merge Gating) | `DAGEdge.requiredArtifacts`, `JOIN_GATEWAY` release predicates | `WP-P14-04` evaluates validation tokens against structural join conditions before releasing nodes. |
| **`WP-P14-INTEGRATION`** | `DAGGraph` unified schema, topological sort invariants | Enforces cross-module consistency against this foundational schema. |

---

## 18. Requirements Traceability Matrix

| Source Requirement | Authoritative Source Document | Section in this Spec | Verification Method |
| :--- | :--- | :---: | :--- |
| **Core Scope Item 4** | Master Spec v1.1 Sec 8; Scope Prep Sec 5 | Sec 4, 5, 6 | Formal JSON Schema & Topological Kahn Algorithm. |
| **Node Identity Derivation & Task Binding (P14-G1-16, P14-G1-20)** | Phase 1.1 WP Contract Sec 7; Phase 1.2 Task Sec 6 | Sec 4.1 (I-02), 6.1 (I-02), 7, 10.2, 13 (I-02), 16 | Bijective mapping `nodeId == "NODE-" + v.taskId` and uniqueness of `taskId` under Invariant I-02; raises `ERR_DAG_INVALID_TASK_BINDING`. |
| **Node ID Uniqueness (P14-G1-09)**| MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 4.1, 6.1 (I-02), 10.2, 16 | Algorithmic set uniqueness check; raises `ERR_DAG_DUPLICATE_NODE`. |
| **Edge Identity & Pair Uniqueness (P14-G1-10, P14-G1-21)**| MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 5.1, 6.1 (I-04), 10.2, 13, 16 | Algorithmic set checks for both `edgeId` uniqueness and `(sourceNodeId, targetNodeId)` pair uniqueness under Invariant I-04; raises `ERR_DAG_DUPLICATE_EDGE`. |
| **Edge Parity (P14-G1-11)** | MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 4.1, 6.1 (I-05), 10.2, 16 | Authoritative edge derivation; raises degree mismatch errors. |
| **Metadata Derivation (P14-G1-12, P14-G1-14, P14-G1-15)**| MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 6.1 (I-08), 10.2, 16 | Derived state verification of 7 fields (inc. maxLayerDepth; createdAt purged); raises `ERR_DAG_METADATA_MISMATCH`. |
| **NodeType Precedence & Parity (P14-G1-13, P14-G1-22)**| MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 4.1, 6.1 (I-05), 7, 10.2, 13 (I-05), 16 | Deterministic precedence ladder: JOIN > FORK > ROOT > TERM > STD; divergence raises `ERR_DAG_NODE_TYPE_MISMATCH`. |
| **Graph State Vocabulary (P14-G1-19)**| MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 6, 6.2, 16 | Complete 8-state lifecycle enum synchronized with JSON Schema. |
| **Decomposition Mapping** | Phase 1.1 WP Contract Sec 7/18 (`taskDecompositionRef`) | Sec 7 | 1-to-1 Mapping rules from `DO_WP` tasks to DAG nodes. |
| **Dependency Semantics** | MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 5, 8 | Edge lifecycle (`PENDING` $\to$ `SATISFIED` $\to$ `STALE` $\to$ `INVALIDATED`). |
| **Node Eligibility Predicate** | MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 9 | $\text{Eligible}(v, \Omega_{\text{gov}})$ decoupled from node schema. |
| **Deterministic Topological Sort** | MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 10, 11 | Lexicographical Kahn's Algorithm pseudocode & tie-breaking. |
| **Fail-Closed Cycle Detection (P14-G1-17)** | MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 10.2, 12, 15 | Pre-execution cycle abort; zero-root cycles unified under `ERR_DAG_CYCLE_DETECTED`. |
| **Structural Error Model (P14-G1-18, P14-G1-22)** | MWP-EEOS-O-PHASE-1.4 Sec 4.1 | Sec 13 | Complete catalogue of 11 stable fatal error codes (`ERR_DAG_...`). Dedicated node type mismatch code introduced. |
| **Phase 1.2 State Boundary** | Phase 1.2 Task Contract Sec 10 (15-State FSM) | Sec 14 | Domain segregation between DAG structural state & Task FSM. |
| **Phase 1.3 Container Boundary** | Phase 1.3 Agent Contract Sec 27 | Sec 4, 14, 17 | Task binding via `taskId`; single-agent container immutable. |
| **Machine-Readable Contract** | JSON Schema Draft 2020-12 | Sec 16 | Formal schema synchronized with all Markdown obligations. |
| **Downstream Handshakes** | MWP-EEOS-O-PHASE-1.4 Sec 5.2 | Sec 17 | Defined input interfaces for P14-02, P14-03, P14-04. |
| **Gate G1 Preconditions** | MWP-EEOS-O-PHASE-1.4 Sec 9 (`Gate G1`) | Sec 19 | Verified complete against all sub-work package exit criteria. |

---

## 19. Gate G1 Completion Criteria & Status

`WP-P14-01` satisfies all formal preconditions established in `MWP-EEOS-O-PHASE-1.4` Section 9:

* [x] **DAG Node Contract Complete**: Formally specified with types, mutability, bijective `nodeId == "NODE-" + v.taskId`, and uniqueness rules under Invariant I-02 (Section 4, Section 4.1).
* [x] **DAG Edge Contract Complete**: Formally specified with strict directional convention $u \to v$, independent `edgeId` uniqueness, dependency pair uniqueness under Invariant I-04, and isolated edge states (Section 5, Section 5.1).
* [x] **Graph Contract Complete**: Bounded by formal invariants I-01 through I-08, complete 8-state `graphState` enum, and UUIDv4 pattern validation (Section 6).
* [x] **Decomposition Mapping Complete**: Deterministic translation of `DO_WP` tasks to DAG nodes with preserved bijective binding (Section 7).
* [x] **Dependency Semantics Defined**: Full edge lifecycle from `PENDING` to `SATISFIED` / `INVALIDATED` (Section 8).
* [x] **Node Eligibility Formally Predicated**: Structural eligibility separated from external governance halts (Section 9).
* [x] **Deterministic Topological Algorithm Defined**: Complete lexicographical Kahn's algorithm with tie-breaking and task binding validation (Section 10).
* [x] **Cycle Detection Formally Specified**: Fail-closed cycle detection mechanism with zero-root cycle unification (Section 12).
* [x] **Structural Error Model Catalogued**: Exactly 11 stable architectural fatal error codes defined (Section 13).
* [x] **Phase 1.2 Compatibility Verified**: Strict segregation between DAG structural states and Task FSM states (Section 14).
* [x] **Downstream Consumption Handshakes Established**: Primitives exposed for `WP-P14-02`, `WP-P14-03`, `WP-P14-04` (Section 17).
* [x] **Machine-Readable JSON Schema Published**: JSON Schema Draft 2020-12 created, synchronized, and linked (Section 16).
* [x] **Zero Implementation**: 100% architectural specification; zero software code, SQL DDL, or runtime packages.

### Formal Status:
> ### **GATE G1 STATUS: NOT CLEARED — AWAITING INDEPENDENT G1 AUDIT**
> *(Gate G1 clearance is not self-granted; awaiting independent controller re-audit per governance rules).*

---

## 20. HARD STOP DECLARATION

```text
══════════════════════════════════════════════════════════════════════════════════

                                  HARD STOP

                 WP-P14-01 SPECIFICATION COMPLETE (GATE G1 CANDIDATE)

               DAG GRAPH & TOPOLOGICAL MODEL FORMALLY CODIFIED

              ZERO WORK PERFORMED ON WP-P14-02, 03, 04, OR OAQS
              ZERO SOFTWARE IMPLEMENTATION OR CODE CREATED
              AWAIT INDEPENDENT CONTROLLER GATE G1 AUDIT

══════════════════════════════════════════════════════════════════════════════════
```
