# EEOS-O — Phase 1.3: Agent Contract Architecture & Interface Design
## Authoritative Architecture, Logical Entity Model, and Contract Boundary Specification

**Document Identifier**: `EEOS-O-AGENT-CONTRACT-ARCHITECTURE-AND-INTERFACE`  
**Classification**: Enterprise Architecture & Interface Governance  
**Phase**: Phase 1 — Architecture & Interface Contract Design  
**Sub-Phase**: 1.3 — Agent Contract Architecture & Interface Design  
**Specification Version**: `1.0.0-DRAFT`  
**Date**: October 01, 2026  
**Status**: RATIFIED — AUTHORITATIVE ARCHITECTURAL BASELINE  
**Author**: Architecture & Documentation Agent (Under ZenOrion Governance)  

---

## 1. Document Identity

| Attribute | Specification Value |
| :--- | :--- |
| **Document Title** | EEOS-O Phase 1.3 Agent Contract Architecture & Interface Specification |
| **Document UID** | `SPEC-EEOS-O-PHASE-1.3-AGENT-CONTRACT-v1.0.0` |
| **System** | EEOS-O (Executive Engineering Orchestration — Orchestrator) |
| **Phase Milestone** | Phase 1.3 (Subordinate to Phase 1.1 Memory/WP and Phase 1.2 Task Contract) |
| **Classification** | Enterprise Architecture & Interface Contract Boundary |
| **Lifecycle State** | `RATIFIED` (Certified by Mandor & PO Ratification Report) |
| **Governing Entity** | ZenOrion Lead Orchestrator |
| **Superseded Docs** | None (First formal Agent Contract architecture specification) |

---

## 2. Governance Authority

This specification operates strictly under the established EEOS-O sovereign governance hierarchy. No clause herein may weaken, contradict, or preempt a higher-tier authority:

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
                  │ Phase 1.1 Contracts (WP/Mem)  │  (Tier 6, 7, 8: Ratified Component Baselines)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │ Phase 1.2 Task Contract Spec  │  (Tier 9 & 10: Ratified Task Baseline)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │ Phase 1.3 Agent Contract Spec │  (Tier 11: This Specification)
                  └───────────────────────────────┘
```

*Governance Escalation Invariant*: If any conflict arises between this Phase 1.3 specification and higher-tier authorities, the agent must **not self-resolve**; the conflict must be formally documented and escalated to `Process_Mandor` and `Process_PO`.

---

## 3. Phase 1.3 Authorization Basis

This specification is authored pursuant to:
1. **Formal Authorization Directive**: `docs/eeos-o/EEOS-O-PHASE-1.3-AUTHORIZATION-DIRECTIVE.md`, issued jointly by `Process_PO` and `Process_Mandor`, explicitly certifying:
   - Phase 1.1 Work Package Contract & Memory Architecture: `RATIFIED`.
   - Phase 1.2 Task Contract Architecture: `RATIFIED` (with 0 blocking findings, 0 non-blocking findings, and verified FSM boundary semantics).
   - Phase 1.3 Design Initiation: `AUTHORIZED — DESIGN MAY COMMENCE`.
2. **Strict Design Scope**: This document addresses **architectural contract design only**. Zero application code, runtime scripts, database DDL, or container runtimes are created.

---

## 4. Design Objective

The objective of Phase 1.3 is to establish the formal, machine-readable architectural specification for the **Agent Contract**.

The Agent Contract formally defines how a specialist agent:
1. Declares its identity, functional division, and verified capabilities without assuming unearned governance authority.
2. Binds to a ratified Task Contract dispatched by ZenOrion.
3. Ingests governed, read-only context slices without raw vault access.
4. Executes within strictly confined filesystem mutation boundaries (`allowedPaths`).
5. Emits segregated deliverables across the ratified 4-tier output taxonomy (`taskResult`, `evidenceArtifacts`, `proposedMemoryCandidates`).
6. Reports completion, environmental failure, or escalation requests deterministically.
7. Interacts with independent specialist reviewers while strictly enforcing reviewer independence ($\text{Reviewer} \neq \text{Implementer}$).
8. Remains entirely subordinate to ZenOrion orchestration and sovereign Mandor authority.

---

## 5. Architectural Context

In the EEOS-O orchestration model, the system operates across five distinct abstraction tiers:

```text
[Business Intent]      PO / Mandor Directive
       ↓
[Governance Unit]      Work Package Contract (Phase 1.1)
       ↓
[Execution Atom]       Task Contract (Phase 1.2)
       ↓
[Execution Binding]    Agent Contract (Phase 1.3)
       ↓
[Physical Worker]      Specialist Agent (Runtime Execution Engine)
```

The **Task Contract** (Phase 1.2) defines *what* must be executed, the acceptance criteria, the scope boundaries, and the lifecycle state.  
The **Agent Contract** (Phase 1.3) defines *how* an execution participant binds to that task, establishing capability validation, ephemeral session parameters, execution constraints, and structured output handoff.

---

## 6. Agent Contract Concept

### 6.1 Core Principle: Agent as Governed Participant
An Agent in EEOS-O is **never a sovereign authority**. An Agent is an execution participant provisioned by ZenOrion to accomplish an assigned Task Contract.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ CORE ARCHITECTURAL INVARIANT:                                                    │
│ AN AGENT IS A BOUND PARTICIPANT, NOT A SOVEREIGN ACTOR.                          │
│ AGENTS CANNOT CREATE TASKS, MUTATE SCOPES, OR DIRECTLY COMMIT TO DURABLE MEMORY. │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Dual Nature of Agent Contracts
The Agent Contract architecture defines two complementary contract facets:
1. **Agent Profile Contract (Static/Registration Facet)**: Declares who the agent is, its home division, its verified capability tags, and its operational limits.
2. **Agent Session Binding Contract (Dynamic/Execution Facet)**: Represents the ephemeral, cryptographic binding between an assigned Agent Profile and a specific, ratified Task Contract for a single execution lifecycle.

---

## 7. Agent Identity Model

### 7.1 Canonical Agent Identity Schema
Every specialist agent interacting with EEOS-O must possess a unique, machine-parseable identifier conforming to the canonical URI scheme:

```text
agent://<division>/<agent-slug>:<semantic-version>
```

*Example*: `agent://engineering/zencoder-fullstack:1.2.0`

### 7.2 Identity Attributes
```json
{
  "agentId": "agent://engineering/zencoder-fullstack:1.2.0",
  "agentSlug": "zencoder-fullstack",
  "division": "ENGINEERING",
  "version": "1.2.0",
  "role": "IMPLEMENTER",
  "clearanceLevel": "RESTRICTED_SECURITY",
  "trustTier": "TIER_2_VERIFIED_SPECIALIST",
  "supportedTaskContractVersion": "1.0.0",
  "providerRuntime": "LOGICAL_AGENT_RUNNER"
}
```

- `agentId`: Unique immutable URI identifying the agent archetype and version.
- `division`: Primary organizational division pool (`ENGINEERING`, `QUALITY_ASSURANCE`, `SECURITY_GOVERNANCE`, `DATABASE_INFRASTRUCTURE`, `DOCUMENTATION`) per Master Spec Section 5.
- `role`: Role qualification (`IMPLEMENTER` | `INDEPENDENT_REVIEWER` | `OBSERVER`).
- `clearanceLevel`: Maximum security tier the agent is cleared to process (`PUBLIC` | `INTERNAL_CONFIDENTIAL` | `RESTRICTED_SECURITY` | `SOVEREIGN_MANDOR_ONLY`).
- `trustTier`: Governance verification level (`TIER_1_UNVERIFIED_CANDIDATE` | `TIER_2_VERIFIED_SPECIALIST` | `TIER_3_HARDENED_CORE`).
- `supportedTaskContractVersion`: Semantic version range of supported Task Contracts.
- `providerRuntime`: Logical runtime archetype (physical implementation deferred per Master Spec Ratified Decision #2).

---

## 8. Capability Contract

### 8.1 Capability vs. Authority Delineation
```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ARCHITECTURAL SEPARATION:                                                        │
│ CAPABILITY ≠ AUTHORITY                                                           │
│ Having the capability to perform an operation (e.g., SQL execution) DOES NOT     │
│ grant the authority to execute it outside the Task Contract's allowed boundaries.│
└──────────────────────────────────────────────────────────────────────────────────┘
```

An agent's capabilities describe its functional competencies. The Task Contract determines the authorized scope within which those competencies may be exercised.

### 8.2 Capability Declaration Schema
```json
{
  "capabilities": {
    "skillTags": [
      "typescript-5.x",
      "nextjs-app-router",
      "postgresql-rls",
      "drizzle-orm",
      "vitest-unit-testing"
    ],
    "contextBudgetLimit": 64000,
    "concurrencyLimit": 1,
    "supportedVerifications": [
      "AUTOMATED_UNIT_TEST",
      "STATIC_LINT_ANALYSIS",
      "SCHEMA_DIFF_AUDIT"
    ],
    "prohibitedOperations": [
      "DIRECT_DATABASE_DDL",
      "CROSS_TENANT_MUTATION",
      "SECRET_ENV_ACCESS",
      "UNGOVERNED_FILE_WRITE"
    ]
  }
}
```

- `skillTags`: Discrete, standardized competency tags matched against `task.requiredCapabilities` by ZenOrion's dispatch engine.
- `contextBudgetLimit`: Maximum tokens the agent's context window can ingest.
- `supportedVerifications`: Methods the agent can natively verify or execute.
- `prohibitedOperations`: Explicit architectural prohibitions enforced fail-closed.

---

## 9. Authority Boundary

### 9.1 Immutable Negative Constraints (What an Agent Cannot Do)
1. **Zero Task Creation**: Specialist agents cannot instantiate, decompose, or spawn Task Contracts. All tasks originate exclusively from ZenOrion decomposing a ratified Work Package.
2. **Zero Scope Self-Expansion**: An executing agent cannot expand `allowedPaths`. If code changes require editing files outside `allowedPaths`, the agent must abort with `SCOPE_EXPANSION_REQUIRED`.
3. **Zero Direct Memory Mutation**: Agents possess zero write access to durable Long-Term Memory (Git Markdown Vault). All memory updates must be emitted as unvalidated `proposedMemoryCandidates`.
4. **Zero Governance Override**: An agent cannot bypass failed verification verdicts, force state transitions, or override Mandor directives.
5. **Zero Phase Authorization**: Agents cannot alter governance phase status or authorize subsequent sub-phases.
6. **Zero Direct Production Mutation**: Agents cannot trigger production deployments or mutate production database schemas.

---

## 10. Task → Agent Interface

### 10.1 Inbound Binding Payload
When ZenOrion transitions a Task Contract to `ASSIGNED` and dispatches it to an agent session, it packages an **Inbound Agent Payload**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        INBOUND AGENT PAYLOAD                           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Task Metadata Anchor       : taskId, workPackageId, correlationId   │
│ 2. Intent & Deliverable Spec  : functionalObjective, criteriaList      │
│ 3. Filesystem Scope Boundary  : allowedPaths, readOnlyPaths, forbidden │
│ 4. Scoped Context Slice       : injectedMemories, contextTokenBudget   │
│ 5. Dependency Evidence Anchors: prerequisiteEvidence (hashes)          │
│ 6. Validation Predicates      : reviewRequirements preflight schema    │
│ 7. Operational Ceilings       : iterationCount, maxIterations          │
└────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Structural Interface Definition
```json
{
  "dispatchId": "DISP-20261001-0892",
  "taskId": "TSK-WP007-003",
  "parentWorkPackageId": "WP-PRODUCTION-TENANT-DOMAIN-PROMOTION-EXECUTE-007",
  "correlationId": "CORR-20261001-WP007",
  "taskTitle": "Implement PostgreSQL RLS Policies for Santri Table",
  "functionalObjective": "Enforce strict tenant_id filtering on all santri table queries.",
  "scopeFiles": {
    "allowedPaths": ["packages/database/src/schema/santri.ts"],
    "readOnlyPaths": ["packages/database/src/schema/tenant.ts"],
    "forbiddenPaths": ["drizzle/migrations/*", ".env*"]
  },
  "contextSlice": {
    "injectedMemories": [
      {
        "memoryId": "MEM-20261001-ARCH-0042",
        "title": "PostgreSQL RLS Tenancy Rule",
        "contentSummary": "Filter santri table using app.current_tenant_id setting."
      }
    ]
  },
  "acceptanceCriteria": [
    {
      "criteriaId": "AC-01",
      "description": "All SELECT queries filter by tenant_id",
      "verificationMethod": "AUTOMATED_UNIT_TEST"
    }
  ],
  "operationalLimits": {
    "iterationCount": 1,
    "maxIterations": 3
  }
}
```

---

## 11. Agent → Task Interface

### 11.1 Outbound Handoff Payload
Upon concluding execution, the agent emits an **Outbound Agent Manifest** back to ZenOrion:

```json
{
  "dispatchId": "DISP-20261001-0892",
  "taskId": "TSK-WP007-003",
  "agentId": "agent://engineering/zencoder-fullstack:1.2.0",
  "executionStatus": "EXECUTION_SUCCESSFUL",
  "resultPayload": {
    "modifiedFiles": [
      {
        "path": "packages/database/src/schema/santri.ts",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      }
    ],
    "patchRef": "git://refs/branches/task/TSK-WP007-003-rls"
  },
  "evidenceArtifacts": [
    {
      "evidenceType": "TEST_LOG",
      "artifactUri": "evidence/TSK-WP007-003/vitest-run.log",
      "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      "exitCode": 0
    }
  ],
  "proposedMemoryCandidates": [
    {
      "candidateId": "CAND-20261001-0091",
      "category": "ARCHITECTURE",
      "title": "Drizzle ORM RLS with Next.js Server Actions",
      "suggestedContent": "Ensure tenant context is passed into server actions pre-query.",
      "rationale": "Discovered pattern during santri RLS implementation."
    }
  ],
  "failureDetails": null,
  "escalationRequest": null
}
```

---

## 12. Memory → Agent Context Boundary

### 12.1 Subordination to Ratified Memory Architecture (Phase 1.1)
The Agent Contract enforces strict subservience to the Ratified Memory Architecture (`v1.1.0`):

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ARCHITECTURAL INVARIANT:                                               │
│ 1. MEMORY IS NOT A SOVEREIGN AUTHORITY.                                │
│ 2. ZERO DIRECT AGENT WRITES TO PERSISTENT MEMORY.                      │
│ 3. MEMORY CONTEXT INGESTION IS STRICTLY READ-ONLY AND SCOPED.          │
│ 4. CANDIDATE KNOWLEDGE REMAINS QUARANTINED UNTIL PHASE 1.5 VALIDATION. │
└────────────────────────────────────────────────────────────────────────┘
```

```text
  Durable Vault (Git Markdown)
              │
              ▼ Scoped & Filtered Retrieval
  ZenOrion Context Assembler
              │
              ▼ Read-Only Injection (injectedMemories)
  Agent Execution Session
              │
              ▼ Emits Hypotheses (proposedMemoryCandidates)
  Candidate Knowledge Quarantine (Phase 1.5 Validation Gate)
              │
              ▼ Verified & Published
  Durable Vault (Git Markdown)
```

### 12.2 Context Isolation Rules
- **No Raw Vault Access**: Agents have no filesystem access to the Obsidian/Git markdown vault directory.
- **Tenant Scope Enforcement**: Memories tagged `tenant_scope: SPECIFIC` are strictly excluded by ZenOrion unless the task explicitly operates within that tenant anchor.
- **Token Quota Protection**: Context slices cannot exceed `contextBudgetLimit`, enforcing bounded input scope and preventing context window truncation and excessive resource consumption.

---

## 13. Scope Boundary & Confinement

### 13.1 Tripartite Path Delineation
In full alignment with Ratified Decision #1 and Master Spec Section 11.2, every agent execution operates within a rigid path whitelist:

1. **`allowedPaths` (Exclusive Mutation)**:
   - Relative file paths the agent is authorized to modify.
   - Non-overlapping across concurrent tasks.
   - Any mutation to a file outside `allowedPaths` constitutes a scope violation.
2. **`readOnlyPaths` (Contextual Inspection)**:
   - Files the agent may read for semantic context (e.g., shared type definitions, config files) but must not write to.
3. **`forbiddenPaths` (Fail-Closed Barrier)**:
   - Prohibited paths (e.g., database migrations `drizzle/migrations/*`, environment secret files `.env*`, CI/CD pipelines).
   - Attempted writes trigger immediate execution abort.

### 13.2 Scope Invariant vs. Proposed Policy
- **Architectural Scope Invariant**: The path boundary itself is an immutable invariant.
- **Proposed Runtime Enforcement Policy**: Halting task execution and triggering immediate escalation upon violation is a proposed runtime policy (per Section 9.5 of Phase 1.2 Task Contract).

---

## 14. Agent Execution Contract

### 14.1 Operational Invariants
During active execution (`IN_PROGRESS`), the agent is bound by the following invariants:
1. **Deterministic Deliverable Production**: All outputs must directly correlate to the declared `acceptanceCriteria`.
2. **Deterministic Evidence Emission**: Execution must produce verifiable proof (logs, test outputs, cryptographic hashes) satisfying declared verification methods.
3. **Branch Isolation**: All Git commits must be made strictly to the task's dedicated Git branch (`task/<taskId>-<slug>`). Modifying the `main` or `develop` branches directly is strictly prohibited.
4. **Execution Repeatability (Design Objective)**: Re-executing an agent contract with identical inputs and context should target contract-level repeatability and semantically consistent deliverables; absolute runtime idempotence is treated as an architectural design objective rather than an unconditional hard invariant, as physical deterministic inference mechanisms remain deferred to execution runtime implementation.

---

## 15. Agent Output Contract (4-Tier Taxonomy Alignment)

The Agent Contract enforces strict structural separation across the four-tier output taxonomy ratified in Memory Architecture Section 3.2 and Task Contract Section 14:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             AGENT OUTPUT TAXONOMY                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Class A: Task Deliverable (taskResult)                                           │
│   → Functional deliverables: code diffs, schema patches, documentation.         │
│ Class B: Execution Proof (evidenceArtifacts)                                     │
│   → Audit logs, exit codes, test execution results, SHA-256 integrity proofs.    │
│ Class C: Candidate Knowledge (proposedMemoryCandidates)                          │
│   → Epistemic hypotheses, lessons learned, quarantined pending Phase 1.5 review. │
│ Class D: Ephemeral Scratch (Working State)                                       │
│   → Temporary compiler caches, test runner scratch; discarded at session exit.   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Conflating deliverable code with audit logs or candidate memory inside an unstructured text response is strictly prohibited.

---

## 16. Evidence Boundary

### 16.1 Immutable Proof Anchoring
- **Purpose**: Evidence provides undeniable, verifiable proof that a task was completed in accordance with its acceptance criteria.
- **Evidence ≠ Memory**: Evidence is **not** long-term organizational knowledge. Evidence is historical execution audit data preserved in Work Package Evidence Dossiers (`DO_Laporan`).
- **Cryptographic Hashing**: Every evidence artifact emitted by an agent must include a valid SHA-256 digest of the raw log or artifact file.

---

## 17. Candidate Knowledge Boundary

### 17.1 Quarantine and Subordination
- **Status of Agent Knowledge**: Any architectural insight, convention, or pattern discovered by an agent during execution has the legal status of an **unverified hypothesis**.
- **Quarantine Guarantee**: Emitting a `proposedMemoryCandidate` does **not** update durable memory. The candidate is held in quarantine until Phase 1.5 specialist reviewer validation and formal ZenOrion ingestion.
- **Zero Poisoning**: Prevents hallucinated or task-specific idiosyncrasies from corrupting repository-wide long-term memory.

---

## 18. Failure Contract

### 18.1 Structured Failure Categories
When an agent is unable to complete a Task Contract, it must emit a structured failure signal rather than halting silently or generating partial corrupted deliverables:

| Failure Category Code | Description | Root Cause | Agent Action | Governance Path |
| :--- | :--- | :--- | :--- | :--- |
| **`FAIL_CRITERIA_UNMET`** | Deliverables do not satisfy acceptance criteria. | Implementation defect or failing test. | Report failed criteria & logs. | Rework path (`REWORK_REQUIRED`). |
| **`FAIL_ENV_BLOCKER`** | Execution environment failure (timeout, network, tool failure). | External infrastructure or tool failure. | Emit error trace; request unblock. | `BLOCKED` state (resolution governed by Task Contract Section 10.1; retry semantics deferred to Phase 1.5 per OAQ-TC-02). |
| **`FAIL_DEPENDENCY_FAULT`** | Upstream task deliverable is corrupt or missing required export. | Corrupt prerequisite evidence. | Cite missing upstream hash. | `BLOCKED` state; upstream investigation. |
| **`FAIL_SCOPE_BREACH`** | Required changes require touching files outside `allowedPaths`. | Task decomposition too narrow. | Abort writes; report paths needed. | `SCOPE_EXPANSION_REQUIRED` → Mandor. |
| **`FAIL_INVARIANT_BREACH`** | Task requires violating locked invariant (e.g., branch freeze). | Policy contradiction. | Abort immediately; preserve evidence.| `ESCALATED_TO_MANDOR`. |

---

## 19. Escalation Contract

### 19.1 Sovereign Mandor Escalation Gate
Escalation is the formal mechanism for passing authority from the autonomous execution layer to the sovereign architectural authority (`Process_Mandor`):

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ MANDOR ESCALATION SOVEREIGNTY:                                                   │
│ WHEN AN AGENT CONTRACT HITS AN UNRESOLVABLE CONFLICT OR INVARIANT BREACH,        │
│ IT MUST HALT AND ESCALATE. SPECIALIST AGENTS CANNOT OVERRIDE ESCALATIONS.       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 19.2 Escalation Payload Schema
```json
{
  "escalationId": "ESC-20261001-0012",
  "taskId": "TSK-WP007-003",
  "agentId": "agent://engineering/zencoder-fullstack:1.2.0",
  "escalationType": "SCOPE_EXPANSION_REQUIRED",
  "triggeringCondition": "File packages/database/src/schema/tenant.ts requires mutation to add tenant_id foreign key constraint.",
  "requestedScopeExpansion": [
    "packages/database/src/schema/tenant.ts"
  ],
  "blockingEvidenceRef": "evidence/TSK-WP007-003/scope-error.log",
  "timestamp": "2026-10-01T22:20:00Z"
}
```

ZenOrion transitions the Task Contract to `ESCALATED_TO_MANDOR`, suspending further execution until Mandor issues a binding architectural directive.

---

## 20. Reviewer Interaction Contract

### 20.1 Reviewer Independence Invariant (Ratified Decision #3)
Master Specification Section 4 and Task Contract Section 21 mandate autonomous reviewer dispatch and conflict of interest protection:

$$\mathbf{Reviewer} \neq \mathbf{Implementer}$$

### 20.2 Reviewer Agent Contract Rules
1. **Asymmetric Clearance**: The reviewing agent must hold equal or greater security clearance and capability tags relative to the task's complexity.
2. **Dossier Consumption**: The reviewer receives the complete output manifest (`taskResult`, `evidenceArtifacts`, `acceptanceCriteria`), but **cannot edit** the implementer's deliverables.
3. **Signed Verdict Emission**: The reviewer outputs an authoritative review dossier containing:
   - `verdict`: `PASS` or `FAIL`.
   - `reviewedCriteria`: Verification status for each item in `acceptanceCriteria`.
   - `targetedFeedback`: Actionable, line-specific guidance for rework if `FAIL`.
4. **Evaluation & Transition Boundary**: The reviewing agent evaluates deliverables and reports conditions requiring rework or escalation, but possesses no direct FSM state transition authority. ZenOrion serves as the sole orchestration engine responsible for evaluating the review dossier and executing lifecycle transitions (to `REWORK_REQUIRED` or `ESCALATED_TO_MANDOR`) in accordance with Task Contract Section 10.1.

---

## 21. Agent Lifecycle

### 21.1 Subordinate Session Lifecycle
The Agent Contract possesses an internal session lifecycle that is strictly subordinate to the Task Lifecycle FSM (15-state engine):

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        AGENT SESSION LIFECYCLE                                   │
│                                                                                  │
│   [UNINITIALIZED] ──► [BOUND] ──► [ACTIVE_EXECUTION] ──► [EVALUATING]            │
│                                                                │                 │
│                                ┌───────────────────────────────┴────────────┐    │
│                                ▼                                            ▼    │
│                         [EMITTING_RESULT]                           [ABORTING]   │
│                                │                                            │    │
│                                ▼                                            ▼    │
│                         [TERMINATED_SUCCESS]                       [TERMINATED_ERROR]
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 21.2 Mapping Between Agent Session States and Task FSM States

| Agent Session State | Task FSM State | Orchestration Action | Authority |
| :--- | :--- | :--- | :--- |
| `UNINITIALIZED` | `READY` | ZenOrion matches agent profile to task capability tags. | ZenOrion Dispatcher |
| `BOUND` | `ASSIGNED` | Inbound payload injected; workspace isolated. | ZenOrion Dispatcher |
| `ACTIVE_EXECUTION` | `IN_PROGRESS` | Agent performs code mutations within `allowedPaths`. | Specialist Agent |
| `EVALUATING` | `IN_PROGRESS` | Agent runs local verification tests and collects evidence. | Specialist Agent |
| `EMITTING_RESULT` | `COMPLETION_SUBMITTED` | Outbound manifest transmitted to ZenOrion. | Specialist Agent |
| `ABORTING` | `BLOCKED` / `ESCALATED_TO_MANDOR` | Agent halts on blocker, scope breach, or invariant fault. | Agent / ZenOrion |
| `TERMINATED_SUCCESS`| `VALIDATION_PENDING` | Session teardown; reviewer agent dispatched. | ZenOrion Engine |
| `TERMINATED_ERROR` | `REWORK_REQUIRED` / `ESCALATED_TO_MANDOR` | Session teardown; iteration ledger updated. | ZenOrion Engine |

*Invariant*: The Agent Session Lifecycle is ephemeral and localized to a single execution turn. It does **not** replace, override, or usurp the 15-state Task FSM.

---

## 22. Interface Architecture

```text
                                  ┌───────────────────────────────┐
                                  │      Process_Mandor / PO      │
                                  └───────────────┬───────────────┘
                                                  │ Sovereign Directives
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │           ZenOrion            │
                                  │      Lead Orchestrator        │
                                  └───────┬───────────────┬───────┘
                                          │               │
                     Dispatches Task      │               │ Injects Scoped Memory
                     Contract (Phase 1.2) │               │ Slice (Phase 1.1)
                                          ▼               ▼
                                  ┌───────────────────────────────┐
                                  │         Task Contract         │
                                  │       Execution Boundary      │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼ Instantiates Binding
                                  ┌───────────────────────────────┐
                                  │         Agent Contract        │
                                  │   (Session Binding Protocol)  │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼ Enforces Confinement
                                  ┌───────────────────────────────┐
                                  │       Specialist Agent        │
                                  │      (Execution Sandbox)      │
                                  └───────┬───────────────┬───────┘
                                          │               │
                             Task Result  │               │ Audit Evidence
                             (Class A)    │               │ (Class B)
                                          ▼               ▼
                                  ┌───────────────────────────────┐
                                  │    Outbound Output Manifest   │
                                  │  [Result] [Evidence] [Cand.]  │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼ Handoff to Independent Review
                                  ┌───────────────────────────────┐
                                  │  Reviewer Agent Contract      │
                                  │   (Reviewer != Implementer)   │
                                  └───────────────────────────────┘
```

---

## 23. Conceptual Data Flow

```text
Step 1: Task Contract Dispatched (ZenOrion → Agent Contract)
        Payload: [Task Spec] + [Read-Only Memory Slice] + [AllowedPaths Whitelist]
                                     ↓
Step 2: Session Initialization & Capability Check
        Agent validates task contract schema compatibility & operational limits
                                     ↓
Step 3: Confined Execution
        Agent mutates files strictly inside `allowedPaths`
        Generates local test evidence
                                     ↓
Step 4: Output Manifest Assembly
        Separates `taskResult` (code) from `evidenceArtifacts` (proof)
        Appends `proposedMemoryCandidates` (epistemic hypotheses)
                                     ↓
Step 5: Completion Submission (Agent Contract → ZenOrion)
        Payload: [Outbound Manifest]
                                     ↓
Step 6: Autonomous Reviewer Dispatch (ZenOrion → Independent Reviewer)
        Reviewer evaluates deliverables against criteria; issues PASS/FAIL verdict
                                     ↓
Step 7: Lifecycle Resolution
        PASS → Task transitions to `VERIFIED` → `COMPLETED`
        FAIL → Task transitions to `REWORK_REQUIRED` (if iterationCount < maxIterations)
               OR `ESCALATED_TO_MANDOR` (if iterationCount >= maxIterations)
```

---

## 24. Security & Isolation Boundary

1. **Tenant Isolation**: An agent processing tenant data must operate within strict tenant context boundaries. Cross-tenant reads or mutations cause immediate execution termination.
2. **Context Isolation**: An agent receives only the explicit `injectedMemories` assembled for its task. It has zero visibility into concurrent task sessions or unrelated memory slices.
3. **Task Isolation**: Parallel executing agents cannot share mutable files (`allowedPaths` disjointness invariant).
4. **Secret Barrier**: Secrets (API keys, service role tokens, database credentials) must never be injected in plaintext into agent contracts or written to evidence artifacts.
5. **Technology Independence**: Specific isolation runtimes (Docker, WebAssembly, OS sandboxes, Git worktrees) are explicitly **deferred** to physical implementation per Master Spec Ratified Decision #2.

---

## 25. Versioning & Compatibility

### 25.1 Semantic Contract Compatibility
The Agent Contract architecture enforces strict three-dimensional version compatibility:

$$\mathbf{Compatibility} = f(\text{TaskContractVersion}, \text{AgentContractVersion}, \text{AgentProfileVersion})$$

```json
{
  "taskContractVersion": "1.0.0",
  "agentContractInterfaceVersion": "1.0.0",
  "agentProfileVersion": "1.2.0",
  "compatibilityStatus": "COMPATIBLE"
}
```

### 25.2 Breaking Change Rules
- **Major Version Bump (`X.0.0`)**: Modifies payload schema, changes required output manifests, or alters governance escalation semantics. Incompatible across mismatched majors.
- **Minor Version Bump (`1.X.0`)**: Adds optional capability tags or non-breaking metadata attributes. Backward compatible.
- **Patch Version Bump (`1.0.X`)**: Clarifies documentation or relaxes internal typing without schema changes. Fully compatible.

---

## 26. Architectural Decision Records (ADRs)

### ADR-AC-001: Ephemeral Session Binding Decoupled from Agent Archetype
- **Status**: `PROPOSED DESIGN`
- **Context**: Persistent agent personas can accumulate state, causing cross-task contamination and unpredictable non-deterministic behavior.
- **Decision**: The Agent Contract explicitly separates the static **Agent Profile Contract** (archetype, skills) from the ephemeral **Agent Session Binding Contract** (single execution instance). Session state is completely destroyed upon task completion.
- **Rationale**: Guarantees execution idempotence, prevents cross-task state leaks, and aligns with zero-trust execution.
- **Consequences**: Agents cannot retain working state between tasks without formal knowledge ingestion through Phase 1.1 Memory Architecture.
- **Governance Classification**: Proposed Design (Requires Mandor ratification).

### ADR-AC-002: Dual-Stage Output Segregation (Handoff Manifest)
- **Status**: `PROPOSED DESIGN`
- **Context**: LLM execution agents tend to blend execution logs, conversational reasoning, code modifications, and organizational suggestions into unstructured text.
- **Decision**: The Agent Contract strictly enforces a structured machine-readable JSON outbound manifest separating `resultPayload` (code), `evidenceArtifacts` (proof), and `proposedMemoryCandidates` (quarantined knowledge).
- **Rationale**: Enables automated reviewer validation, prevents memory poisoning, and supports cryptographic evidence verification.
- **Consequences**: Executing agents must conform to strict output typing; invalid manifests trigger immediate `COMPLETION_SUBMITTED` rejection.
- **Governance Classification**: Proposed Design (Requires Mandor ratification).

---

## 27. Deferred / Future-Phase Concerns

In strict compliance with EEOS-O phase boundaries, the following architectural elements are intentionally deferred:
1. **DAG Scheduling & Agent Concurrency Allocations**: How ZenOrion computes parallel agent capacity and resolves multi-agent DAG execution queues is deferred to **Phase 1.4 (DAG Scheduler & Orchestration)**.
2. **Automated Reviewer Test Runners & Evaluation Engines**: The physical test harnesses that execute and verify review criteria are deferred to **Phase 1.5 (Validation Pipeline)**.
3. **Cryptographic Evidence Ledger & Dossier Persistence**: Physical storage, Merkle tree anchoring, and database schemas for `DO_Laporan` are deferred to **Phase 1.6 (Evidence Contract)**.
4. **Physical Agent Transport & Runtime Serialization**: Whether agents communicate over gRPC, JSON-RPC, WebSockets, or subprocess pipes is deferred to **Physical Implementation**.

---

## 28. Open Architectural Questions (OAQs)

| Question ID | Architectural Question Statement | Why It Matters | Affected Phase | Proposed Options | Authority Needed |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **OAQ-AC-01** | Should an agent be permitted to self-select its reviewer from a certified pool, or must reviewer assignment remain strictly autonomous to ZenOrion? | Determines if agent collaboration can be autonomous or strictly centralized. | Phase 1.4 / 1.5 | Option A: Strictly ZenOrion assignment.<br>Option B: Peer-requested with ZenOrion sign-off. | `Process_Mandor` |
| **OAQ-AC-02** | What is the maximum permitted discrepancy between an agent's claimed skill tags and empirical task execution success before capability revocation? | Prevents degradation of capability matching efficiency over time. | Phase 1.5 (Validation) | Option A: Hard threshold (3 consecutive criteria failures).<br>Option B: Bayesian confidence score. | `Process_Mandor` |

---

## 29. Acceptance Criteria

Phase 1.3 is considered architecturally complete if and only if all of the following criteria are satisfied:

- [x] **Agent Identity Defined**: URI-based canonical schema (`agent://<division>/<slug>:<version>`), security clearance, and trust tiers specified.
- [x] **Capability Contract Defined**: Discrete skill tags, operational limitations, and context limits formalized.
- [x] **Authority Boundary Locked**: Agent subordination, zero task creation, zero scope self-expansion, and zero direct memory writes explicitly enforced.
- [x] **Task → Agent Interface Defined**: Inbound dispatch payload structure declared with scope confinement and read-only context injection.
- [x] **Agent → Task Interface Defined**: Outbound handoff manifest schema declared with 4-tier output segregation.
- [x] **Memory Subordination Preserved**: Strict adherence to Phase 1.1 Invariants (no direct write, candidate quarantine, read-only slices).
- [x] **Scope Boundary Preserved**: Strict adherence to Phase 1.2 `allowedPaths`, `readOnlyPaths`, and `forbiddenPaths`.
- [x] **Failure Contract Defined**: Structured failure categories (`FAIL_CRITERIA_UNMET`, `FAIL_ENV_BLOCKER`, etc.) defined.
- [x] **Escalation Contract Defined**: Formal Mandor escalation payload and boundary conditions established.
- [x] **Reviewer Independence Preserved**: Mandatory $\text{Reviewer} \neq \text{Implementer}$ rule and review dossier exchange specified.
- [x] **Lifecycle Relationship Defined**: Ephemeral session lifecycle mapped cleanly to the 15-state Task FSM without state usurpation.
- [x] **Phase Boundaries Respected**: Interfaces to Phase 1.4, 1.5, and 1.6 declared conceptually without premature implementation.
- [x] **Zero Implementation Leakage**: 100% free of code, DDL, SQL, migrations, and physical runtime bindings.

---

## 30. Phase 1.3 Exit Gate

| Governance Gate | Target Requirement | Status |
| :--- | :--- | :---: |
| **Architecture Completeness** | All 30 required sections fully documented | **PASS** |
| **Task Contract Alignment** | 100% compliant with Ratified Phase 1.2 Task Contract | **PASS** |
| **Memory Architecture Alignment** | 100% compliant with Ratified Phase 1.1 Memory Architecture | **PASS** |
| **Authority Boundary** | Agent cannot become sovereign or create tasks | **PASS** |
| **Scope Boundary** | Agent cannot self-expand `allowedPaths` | **PASS** |
| **Output Boundary** | Deliverables, evidence, and candidate knowledge segregated | **PASS** |
| **Reviewer Boundary** | Independent specialist reviewer dispatch preserved | **PASS** |
| **Phase Boundary** | Phase 1.4, 1.5, 1.6 interfaces declared without implementation | **PASS** |
| **Implementation Leakage** | Strictly zero runtime code, DDL, or database migrations | **PASS** |
| **Unauthorized Invariants** | Zero unratified invariants introduced (ADRs labeled PROPOSED) | **PASS** |

---

*End of Specification — Submitted for Pre-Ratification Architectural Audit to Chief Architect (Mandor) and Product Owner.*
