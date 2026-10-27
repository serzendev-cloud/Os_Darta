# EEOS-O — Phase 1.1: Work Package Contract Architecture Design
## Authoritative Machine-Readable Contract Specification

**Document Identifier**: `EEOS-O-PHASE-1.1-WORK-PACKAGE-CONTRACT`  
**Classification**: System Architecture & Interface Contract  
**Phase**: Phase 1 — Architecture & Interface Contract Design  
**Sub-Phase**: 1.1 — Work Package Contract  
**Contract Version**: `1.1.0`  
**Standard**: JSON Schema Draft 2020-12  
**Date**: October 01, 2026  
**Status**: DESIGN COMPLETE — PENDING RATIFICATION  
**Author**: Architecture & Documentation Agent (Under ZenOrion Governance)  
**Authority Hierarchy**:  
1. `BPMN — EEOS-O (v2.1) Proses Orkestrasi oleh ZenOrion` (Visual Authority)  
2. `EEOS-O-MASTER-SYSTEM-SPECIFICATION-v1.1` (Ratified Architecture)  
3. `EEOS-O-BPMN-BASELINE-RECONCILIATION-REPORT` (Reconciliation Baseline)  
4. This Phase 1.1 Contract Design  

---

## 1. Document Status

This document defines the formal, machine-readable **Work Package (WP) Contract** for the **EEOS-O (Executive Engineering Orchestration — Orchestrator)** platform. It establishes the schema, invariants, classification, and validation rules governing a Work Package from initial business proposal by the Product Owner, through architectural ratification by the Mandor, decomposition and execution by ZenOrion, to final delivery and closure.

In strict compliance with Phase 1 governance directives:
- **Zero Application Code**: No implementation code (TypeScript/Next.js/Node.js) is created.
- **Zero Database Schema / Migrations**: No SQL, DDL, or Drizzle ORM definitions are executed.
- **Zero Physical Runtime Locking**: Physical execution models (workers, containers, daemons) remain intentionally deferred.
- **Contract Isolation**: Task contracts, agent registries, DAG engine internals, and evidence artifact payloads are referenced symbolically rather than prematurely defined.

---

## 2. Purpose

The primary question answered by this specification is:
> *"What is the authoritative, machine-readable representation of a Work Package before ZenOrion decomposes, schedules, executes, validates, and closes it?"*

The Work Package Contract provides:
1. A **strict data boundary** separating business requirements (Product Owner), architectural directives (Mandor), and orchestration state (ZenOrion).
2. A **fail-closed validation schema** that prevents incomplete, ambiguous, or architecturally contradictory Work Packages from being ingested into execution.
3. An **immutable audit foundation** that preserves intent and guarantees traceability across the entire engineering lifecycle.

---

## 3. Authoritative Sources

This design traces directly to:
- **`BPMN — EEOS-O (v2.1)`**: Specifically Data Objects `DO_WP` (Dokumen WP), `DO_Arch` (Direktif Arsitektur), and `DO_Laporan` (Laporan WP), and the interaction between Pools `Process_PO`, `Process_Mandor`, and `Process_ZenOrion`.
- **`EEOS-O-MASTER-SYSTEM-SPECIFICATION-v1.1`**: Specifically Section 8 (Work Package Model), Section 4 (Rule Classification Framework), Section 16 (Branch-Only Freeze), and Section 5 (Authority Hierarchy).
- **`EEOS-O-MASTER-SYSTEM-RATIFICATION-REPORT`**: Specifically Ratified Decisions #1 (Branch-Only Freeze), #2 (Logical Registry vs. Deferred Runtime), and #3 (Autonomous Reviewer Dispatch).

---

## 4. Scope

### In-Scope:
- Formal Work Package identity, metadata, and correlation models.
- Business intent, user value, and acceptance criteria representation.
- Architectural directives, locked decisions, and security boundary references.
- Target environment and execution window parameters.
- Macroscopic Work Package lifecycle state machine.
- Branch-only freeze ledger and global freeze controls.
- Symbolic references to Task Decomposition, DAG Topology, and Evidence Dossiers.
- Field mutability, classification, validation rules, and JSON Schema Draft 2020-12.

### Out-of-Scope (Deferred to Later Sub-Phases):
- Detailed internal schema of individual tasks (deferred to **Phase 1.2 — Task Contract**).
- Agent registry schema and internal capability profiles (deferred to **Phase 1.3 — Agent Contract**).
- DAG traversal algorithms, cycle detection, and scheduling mechanics (deferred to **Phase 1.4 — DAG Contract**).
- Multi-dimensional specialist review checklists and report schemas (deferred to **Phase 1.5 — Validation Contract**).
- Cryptographic evidence hashing and storage protocols (deferred to **Phase 1.6 — Evidence Contract**).

---

## 5. Contract Boundary & System Relationships

The Work Package Contract serves as the root orchestration aggregate in the EEOS-O system. It links upstream governance with downstream execution:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           UPSTREAM GOVERNANCE LAYER                             │
│  Product Owner (Business Intent)        Mandor (Architectural Directives)       │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      WORK PACKAGE CONTRACT (PHASE 1.1)                          │
│  - Identity & Metadata                  - Target Environment & Execution Window │
│  - Business Intent & Acceptance         - Architectural Directive References   │
│  - WP Lifecycle State                   - Branch-Only Freeze Ledger             │
│  - Task References [Phase 1.2]          - DAG Graph Reference [Phase 1.4]       │
│  - Evidence Dossier Reference [Phase 1.6]- Sign-off & Audit Ledger              │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼ Ingested & Decomposed by
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     DOWNSTREAM ORCHESTRATION LAYER (ZENORION)                   │
│  Task DAG Engine [Phase 1.4]  ◄───►  Agent Pools [Phase 1.3]  ◄───►  Validation│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Work Package Core Concepts

A Work Package represents a cohesive engineering initiative. Within the contract, five fundamental conceptual layers are codified:
1. **The Contract Envelope**: Versioning, correlation, and system metadata ensuring schema compatibility.
2. **The Intent Layer**: What must be achieved, why it matters, and the empirical criteria required for business sign-off.
3. **The Governance Layer**: Architectural constraints, locked invariants, and security boundaries ratified by the Mandor.
4. **The Orchestration Context**: Target deployment environment, execution milestones, and freeze status.
5. **The Delivery Manifest**: Machine-readable references to decomposed tasks, DAG topology, and verified evidence dossiers.

---

## 7. Field Inventory

The Work Package Contract consists of 10 logical sections comprising 32 specific properties:

```text
WorkPackageContract
├── 1. contractVersion                 (String, Semver)
├── 2. wpId                            (String, Standard WP Pattern)
├── 3. correlationId                   (String, UUIDv4)
├── 4. title                           (String, Human-readable)
├── 5. description                     (String, Narrative)
├── 6. targetEnvironment               (Enum: preview | production | development)
├── 7. executionWindow                 (Object)
│   ├── estimatedStart                 (String, ISO-8601, Optional)
│   └── targetCompletion               (String, ISO-8601, Optional)
├── 8. createdAt                       (String, ISO-8601)
├── 9. createdBy                       (String, Actor ID)
├── 10. lastUpdatedAt                  (String, ISO-8601)
├── 11. governance                     (Object)
│   ├── productOwner                   (Object: id, name, status, signedAt)
│   ├── mandor                         (Object: id, name, status, ratifiedAt, directiveRef)
│   └── leadOrchestrator               (Object: id, status, acknowledgedAt)
├── 12. businessIntent                 (Object)
│   ├── executiveSummary               (String)
│   ├── userValue                      (String)
│   └── problemStatement               (String)
├── 13. acceptanceCriteria             (Array of Objects: id, description, verificationMethod, isMet)
├── 14. scopeBoundary                  (Object)
│   ├── inScope                        (Array of Strings)
│   └── outOfScope                     (Array of Strings)
├── 15. architecturalDirectivesRef     (Object)
│   ├── directiveId                    (String, Optional)
│   ├── documentRef                    (String, URI / Path)
│   ├── lockedDecisions                (Array of Strings)
│   └── securityBoundaries             (Array of Strings)
├── 16. lifecycle                      (Object)
│   ├── state                          (Enum: DRAFT..ACCEPTED)
│   ├── enteredAt                      (String, ISO-8601)
│   └── stateHistory                   (Array of Objects: state, timestamp, actor, rationale)
├── 17. freezeStatus                   (Object)
│   ├── isGlobalFrozen                 (Boolean)
│   ├── globalFreezeReason             (String, Optional)
│   ├── globalFrozenBy                 (String, Optional)
│   ├── globalFrozenAt                 (String, ISO-8601, Optional)
│   └── activeFrozenBranches           (Array of Strings, Task IDs / Branch Names)
├── 18. taskDecompositionRef           (Object)
│   ├── isDecomposed                   (Boolean)
│   ├── totalTaskCount                 (Integer)
│   ├── criticalPathLength             (Integer, Optional)
│   ├── tasks                          (Array of TaskReference Objects)
│   └── dagTopologyRef                 (String, URI / Path, Optional)
├── 19. evidenceDossierRef             (Object)
│   ├── artifactReferences             (Array of Strings, Artifact URIs)
│   ├── validationSummary              (Object: totalPassed, totalFailed, totalReworked)
│   └── finalReportRef                 (String, URI / Path, Optional)
└── 20. signOffLedger                  (Object)
    ├── poSubmissionSignOff            (String, Optional)
    ├── mandorRatificationSignOff      (String, Optional)
    ├── zenOrionClosureSeal            (String, Optional)
    └── poFinalAcceptanceSignOff       (String, Optional)
```

---

## 8. Field Classification & Mutability

To prevent unauthorized state corruption during execution, every field is classified by **Obligation** (Required, Optional, Derived) and **Mutability** (Immutable, Mutable, System-Managed):

| Field Path | Obligation | Mutability | Managing Authority | Classification Rationale |
| :--- | :---: | :---: | :---: | :--- |
| `contractVersion` | **REQUIRED** | **IMMUTABLE** | System Standard | Guarantees schema interpretation compatibility. |
| `wpId` | **REQUIRED** | **IMMUTABLE** | Mandor / PO | Unique macroscopic identity; renaming corrupts DAG. |
| `correlationId` | **REQUIRED** | **IMMUTABLE** | System / Client | Root trace ID for distributed event logging. |
| `title` | **REQUIRED** | **IMMUTABLE** | Product Owner | Definitive human-readable title. |
| `description` | **REQUIRED** | **IMMUTABLE** | Product Owner | Core context; altering changes underlying contract. |
| `targetEnvironment` | **REQUIRED** | **IMMUTABLE** | Mandor / PO | Prevents accidental promotion across environments. |
| `executionWindow` | **OPTIONAL** | **MUTABLE** | PO / ZenOrion | Schedule estimates change as capacity fluctuates. |
| `createdAt` | **REQUIRED** | **IMMUTABLE** | System | Audit timestamp. |
| `createdBy` | **REQUIRED** | **IMMUTABLE** | Product Owner | Identity of submitting human / agent persona. |
| `lastUpdatedAt` | **REQUIRED** | **SYSTEM-MANAGED**| ZenOrion | Automatically bumped on every state transition. |
| `governance.productOwner`| **REQUIRED** | **MUTABLE** | Product Owner | Records PO proposal, review, and final acceptance. |
| `governance.mandor` | **REQUIRED** | **MUTABLE** | Mandor | Records Mandor architectural ratification/rejection. |
| `governance.leadOrchestrator`| **REQUIRED**| **SYSTEM-MANAGED**| ZenOrion | Records ZenOrion operational ingestion. |
| `businessIntent.*` | **REQUIRED** | **IMMUTABLE** | Product Owner | Business intent cannot be rewritten by implementers. |
| `acceptanceCriteria` | **REQUIRED** | **IMMUTABLE** (Items) / **SYSTEM-MANAGED** (`isMet`) | PO (Items) / ZenOrion (`isMet`) | Criteria are locked; verification status is derived. |
| `scopeBoundary.*` | **REQUIRED** | **IMMUTABLE** | Product Owner | Whitelist/blacklist boundaries cannot drift. |
| `architecturalDirectivesRef.*`| **REQUIRED**| **IMMUTABLE** | Mandor | Architectural constraints cannot be bypassed. |
| `lifecycle.state` | **REQUIRED** | **SYSTEM-MANAGED**| ZenOrion / Governance | High-level WP state transitioned via valid gates. |
| `lifecycle.stateHistory`| **REQUIRED** | **SYSTEM-MANAGED**| ZenOrion | Append-only audit ledger of lifecycle changes. |
| `freezeStatus.isGlobalFrozen`| **REQUIRED**| **SYSTEM-MANAGED**| Mandor / PO | WP-wide freeze requires executive authority. |
| `freezeStatus.activeFrozenBranches`| **REQUIRED**| **SYSTEM-MANAGED**| ZenOrion | Tracks localized branch freezes per Decision #1. |
| `taskDecompositionRef.*`| **REQUIRED**| **SYSTEM-MANAGED**| ZenOrion | Populated upon decomposition; references Phase 1.2. |
| `evidenceDossierRef.*` | **REQUIRED**| **SYSTEM-MANAGED**| ZenOrion / Specialists| Compiled during validation and completion. |
| `signOffLedger.*` | **OPTIONAL** | **SYSTEM-MANAGED**| Governance Actors | Digital cryptographic signatures for milestones. |

---

## 9. Contract Invariants

The Work Package Contract enforces 8 mandatory invariants. Any payload violating these invariants is rejected immediately:

### `INV-WP-01: Identity Immutability`
Once created, `wpId`, `contractVersion`, and `correlationId` **MUST NEVER** be mutated. Any change requires instantiating a new Work Package.  
*Status*: **SUPPORTED (Architectural Invariant)**

### `INV-WP-02: Business Intent Permanence`
`businessIntent`, `scopeBoundary`, and `acceptanceCriteria` descriptions **MUST NOT** be modified, deleted, or reduced after the WP transitions beyond `APPROVED`. If business scope changes, the WP must be formally returned to `DRAFT` or cancelled by the Product Owner.  
*Status*: **SUPPORTED (Architectural Invariant)**

### `INV-WP-03: Architectural Directive Supremacy`
`architecturalDirectivesRef` is established exclusively by the Mandor. Implementation tasks and decomposition DAGs **CANNOT** alter, weaken, or omit locked architectural decisions or security boundaries.  
*Status*: **SUPPORTED (Architectural Invariant)**

### `INV-WP-04: Branch-Only Freeze by Default (Ratified Decision #1)`
Failure of a task review (`REWORK_REQUIRED`) or escalation of a local task **MUST NOT** set `freezeStatus.isGlobalFrozen = true`. Localized rework must be recorded exclusively in `freezeStatus.activeFrozenBranches`. Independent parallel branches continue execution.  
*Status*: **SUPPORTED (Architectural Invariant)**

### `INV-WP-05: Global Freeze Authority Guard`
`freezeStatus.isGlobalFrozen` can transition to `true` **ONLY** if `globalFrozenBy` belongs to an authenticated Mandor or Product Owner actor. ZenOrion and Division Agents possess zero authority to declare a global WP freeze autonomously.  
*Status*: **SUPPORTED (Architectural Invariant)**

### `INV-WP-06: Completion Precondition Gate`
A Work Package **CANNOT** transition to `EVALUATING` or `ACCEPTED` while:
1. `freezeStatus.isGlobalFrozen == true`
2. `freezeStatus.activeFrozenBranches` contains unresolved branches.
3. Any task in `taskDecompositionRef.tasks` has `state != "COMPLETED"`.
4. Any criterion in `acceptanceCriteria` has `isMet != true`.  
*Status*: **SUPPORTED (Architectural Invariant)**

### `INV-WP-07: Task Reference Domain Consistency`
All task identifiers in `taskDecompositionRef.tasks` **MUST** match the regex: `^T-{WP_SHORT_ID}-[0-9]{2,}$` and belong strictly to the parent `wpId`. Cross-referencing tasks from foreign Work Packages is strictly forbidden.  
*Status*: **SUPPORTED (Architectural Invariant)**

### `INV-WP-08: Separation of System Contracts`
The Work Package Contract **MUST NOT** embed full task execution logic, agent physical container configurations, or raw database connection strings. All sub-contracts must be integrated via clean reference interfaces.  
*Status*: **SUPPORTED (Architectural Invariant)**

---

## 10. JSON Schema Specification (Draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://serzen-dev.my.id/schemas/eeos-o/work-package-contract.v1.json",
  "title": "EEOS-O WorkPackage Contract",
  "description": "Authoritative contract schema for EEOS-O Work Packages before execution, decomposition, and closure.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "contractVersion",
    "wpId",
    "correlationId",
    "title",
    "description",
    "targetEnvironment",
    "createdAt",
    "createdBy",
    "lastUpdatedAt",
    "governance",
    "businessIntent",
    "acceptanceCriteria",
    "scopeBoundary",
    "architecturalDirectivesRef",
    "lifecycle",
    "freezeStatus",
    "taskDecompositionRef",
    "evidenceDossierRef"
  ],
  "properties": {
    "contractVersion": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "Semver version of the Work Package contract schema."
    },
    "wpId": {
      "type": "string",
      "pattern": "^WP-[A-Z0-9_-]{3,30}$",
      "description": "Unique macroscopic Work Package identifier (e.g., WP-AUTH-08)."
    },
    "correlationId": {
      "type": "string",
      "format": "uuid",
      "description": "Distributed correlation identifier for tracing."
    },
    "title": {
      "type": "string",
      "minLength": 5,
      "maxLength": 150,
      "description": "Concise human-readable title of the Work Package."
    },
    "description": {
      "type": "string",
      "minLength": 10,
      "maxLength": 2000,
      "description": "Narrative overview of the objective and requirements."
    },
    "targetEnvironment": {
      "type": "string",
      "enum": ["development", "preview", "production"],
      "description": "Target deployment and execution environment."
    },
    "executionWindow": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "estimatedStart": { "type": "string", "format": "date-time" },
        "targetCompletion": { "type": "string", "format": "date-time" }
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "createdBy": {
      "type": "string",
      "minLength": 3
    },
    "lastUpdatedAt": {
      "type": "string",
      "format": "date-time"
    },
    "governance": {
      "type": "object",
      "additionalProperties": false,
      "required": ["productOwner", "mandor", "leadOrchestrator"],
      "properties": {
        "productOwner": {
          "type": "object",
          "additionalProperties": false,
          "required": ["id", "name", "status"],
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "status": { "type": "string", "enum": ["SUBMITTED", "APPROVED", "REJECTED", "ACCEPTED"] },
            "signedAt": { "type": "string", "format": "date-time" }
          }
        },
        "mandor": {
          "type": "object",
          "additionalProperties": false,
          "required": ["id", "name", "status"],
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "status": { "type": "string", "enum": ["PENDING", "RATIFIED", "REJECTED"] },
            "ratifiedAt": { "type": "string", "format": "date-time" },
            "directiveReference": { "type": "string" }
          }
        },
        "leadOrchestrator": {
          "type": "object",
          "additionalProperties": false,
          "required": ["id", "status"],
          "properties": {
            "id": { "type": "string" },
            "status": { "type": "string", "enum": ["ASSIGNED", "ACTIVE", "COMPLETED"] },
            "acknowledgedAt": { "type": "string", "format": "date-time" }
          }
        }
      }
    },
    "businessIntent": {
      "type": "object",
      "additionalProperties": false,
      "required": ["executiveSummary", "userValue", "problemStatement"],
      "properties": {
        "executiveSummary": { "type": "string", "minLength": 10 },
        "userValue": { "type": "string", "minLength": 10 },
        "problemStatement": { "type": "string", "minLength": 10 }
      }
    },
    "acceptanceCriteria": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "description", "verificationMethod"],
        "properties": {
          "id": { "type": "string", "pattern": "^AC-[0-9]{2,}$" },
          "description": { "type": "string", "minLength": 5 },
          "verificationMethod": { "type": "string", "minLength": 3 },
          "isMet": { "type": "boolean", "default": false }
        }
      }
    },
    "scopeBoundary": {
      "type": "object",
      "additionalProperties": false,
      "required": ["inScope", "outOfScope"],
      "properties": {
        "inScope": {
          "type": "array",
          "minItems": 1,
          "items": { "type": "string" }
        },
        "outOfScope": {
          "type": "array",
          "minItems": 1,
          "items": { "type": "string" }
        }
      }
    },
    "architecturalDirectivesRef": {
      "type": "object",
      "additionalProperties": false,
      "required": ["documentRef", "lockedDecisions", "securityBoundaries"],
      "properties": {
        "directiveId": { "type": "string" },
        "documentRef": { "type": "string" },
        "lockedDecisions": {
          "type": "array",
          "items": { "type": "string" }
        },
        "mandatoryStandards": {
          "type": "array",
          "items": { "type": "string" }
        },
        "securityBoundaries": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "lifecycle": {
      "type": "object",
      "additionalProperties": false,
      "required": ["state", "enteredAt", "stateHistory"],
      "properties": {
        "state": {
          "type": "string",
          "enum": [
            "DRAFT",
            "UNDER_REVIEW",
            "APPROVED",
            "DECOMPOSED",
            "ACTIVE",
            "BLOCKED",
            "EVALUATING",
            "ACCEPTED",
            "REJECTED",
            "CANCELLED"
          ]
        },
        "enteredAt": { "type": "string", "format": "date-time" },
        "stateHistory": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["state", "timestamp", "actor"],
            "properties": {
              "state": { "type": "string" },
              "timestamp": { "type": "string", "format": "date-time" },
              "actor": { "type": "string" },
              "rationale": { "type": "string" }
            }
          }
        }
      }
    },
    "freezeStatus": {
      "type": "object",
      "additionalProperties": false,
      "required": ["isGlobalFrozen", "activeFrozenBranches"],
      "properties": {
        "isGlobalFrozen": { "type": "boolean" },
        "globalFreezeReason": { "type": "string" },
        "globalFrozenBy": { "type": "string" },
        "globalFrozenAt": { "type": "string", "format": "date-time" },
        "activeFrozenBranches": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "taskDecompositionRef": {
      "type": "object",
      "additionalProperties": false,
      "required": ["isDecomposed", "totalTaskCount", "tasks"],
      "properties": {
        "isDecomposed": { "type": "boolean" },
        "totalTaskCount": { "type": "integer", "minimum": 0 },
        "criticalPathLength": { "type": "integer", "minimum": 0 },
        "dagTopologyRef": { "type": "string" },
        "tasks": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["taskId", "title", "division", "state", "requires", "requiredBy"],
            "properties": {
              "taskId": { "type": "string", "pattern": "^T-[A-Z0-9_-]+-[0-9]{2,}$" },
              "title": { "type": "string" },
              "division": { "type": "string" },
              "state": { "type": "string" },
              "requires": { "type": "array", "items": { "type": "string" } },
              "requiredBy": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      }
    },
    "evidenceDossierRef": {
      "type": "object",
      "additionalProperties": false,
      "required": ["artifactReferences"],
      "properties": {
        "artifactReferences": {
          "type": "array",
          "items": { "type": "string" }
        },
        "validationSummary": {
          "type": "object",
          "additionalProperties": false,
          "required": ["totalPassed", "totalFailed", "totalReworked"],
          "properties": {
            "totalPassed": { "type": "integer", "minimum": 0 },
            "totalFailed": { "type": "integer", "minimum": 0 },
            "totalReworked": { "type": "integer", "minimum": 0 }
          }
        },
        "finalReportRef": { "type": "string" }
      }
    },
    "signOffLedger": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "poSubmissionSignOff": { "type": "string" },
        "mandorRatificationSignOff": { "type": "string" },
        "zenOrionClosureSeal": { "type": "string" },
        "poFinalAcceptanceSignOff": { "type": "string" }
      }
    }
  }
}
```

---

## 11. Realistic Valid Example Contract

```json
{
  "contractVersion": "1.1.0",
  "wpId": "WP-AUTH-MULTI-TENANT-RLS-008",
  "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Multi-Tenant Row-Level Security Hardening for Core Santri Schema",
  "description": "Implement strictly enforced Supabase PostgreSQL Row-Level Security (RLS) policies isolating tenant santri records by tenant_id under dedicated application DB roles.",
  "targetEnvironment": "preview",
  "executionWindow": {
    "estimatedStart": "2026-10-05T08:00:00Z",
    "targetCompletion": "2026-10-07T18:00:00Z"
  },
  "createdAt": "2026-10-01T10:00:00Z",
  "createdBy": "PO:KyaiAhmad",
  "lastUpdatedAt": "2026-10-01T14:30:00Z",
  "governance": {
    "productOwner": {
      "id": "PO-01",
      "name": "Kyai Ahmad",
      "status": "APPROVED",
      "signedAt": "2026-10-01T10:30:00Z"
    },
    "mandor": {
      "id": "MANDOR-CHIEF-01",
      "name": "Chief Architect",
      "status": "RATIFIED",
      "ratifiedAt": "2026-10-01T12:00:00Z",
      "directiveReference": "docs/architecture/ADR-008-RLS-POLICIES.md"
    },
    "leadOrchestrator": {
      "id": "ZenOrion",
      "status": "ACTIVE",
      "acknowledgedAt": "2026-10-01T12:05:00Z"
    }
  },
  "businessIntent": {
    "executiveSummary": "Eliminate cross-tenant data leakage risks across 100+ Pesantren by enforcing kernel-level database isolation.",
    "userValue": "Pesantren administrators and guardians have cryptographically hardened data protection preventing accidental or malicious access across tenant boundaries.",
    "problemStatement": "Application-layer WHERE filters are vulnerable to developer omission. Multi-tenant isolation must be enforced fail-closed at the PostgreSQL RLS layer."
  },
  "acceptanceCriteria": [
    {
      "id": "AC-01",
      "description": "All SELECT queries on public.santri without active tenant session return 0 rows.",
      "verificationMethod": "Automated Vitest RLS Security Contract Suite",
      "isMet": false
    },
    {
      "id": "AC-02",
      "description": "Tenant A admin attempting direct query on Tenant B santri_id receives empty record set.",
      "verificationMethod": "E2E Preview Cross-Tenant Simulation Test",
      "isMet": false
    }
  ],
  "scopeBoundary": {
    "inScope": [
      "drizzle/schema/santri.ts",
      "drizzle/migrations/0008_santri_rls.sql",
      "tests/contracts/santri-rls.contract.test.ts"
    ],
    "outOfScope": [
      "src/app/api/auth/**",
      "Production database live migrations",
      "Modifications to tenant table structure"
    ]
  },
  "architecturalDirectivesRef": {
    "directiveId": "DIR-ARCH-008",
    "documentRef": "docs/architecture/WP-GATE04-DATABASE-RLS-ARCHITECTURE-DECISION-001.md",
    "lockedDecisions": [
      "RLS-2 DEDICATED APPLICATION DB ROLE",
      "MB-06 Ratified Tenant Resolution & Identity Model"
    ],
    "mandatoryStandards": [
      "Drizzle ORM Idempotent Migrations",
      "Zero Service-Role Key Bypass in Client Routes"
    ],
    "securityBoundaries": [
      "Strict fail-closed tenant scoping on auth.users",
      "Zero plaintext logging of tenant query parameters"
    ]
  },
  "lifecycle": {
    "state": "ACTIVE",
    "enteredAt": "2026-10-01T12:05:00Z",
    "stateHistory": [
      {
        "state": "DRAFT",
        "timestamp": "2026-10-01T10:00:00Z",
        "actor": "PO:KyaiAhmad",
        "rationale": "Initial Work Package proposal submitted."
      },
      {
        "state": "UNDER_REVIEW",
        "timestamp": "2026-10-01T10:30:00Z",
        "actor": "Mandor",
        "rationale": "Evaluating architectural compatibility and locked RLS directives."
      },
      {
        "state": "APPROVED",
        "timestamp": "2026-10-01T12:00:00Z",
        "actor": "Mandor",
        "rationale": "Architectural directives established; scope ratified."
      },
      {
        "state": "DECOMPOSED",
        "timestamp": "2026-10-01T12:04:00Z",
        "actor": "ZenOrion",
        "rationale": "Task DAG generated with 3 sequential and parallel task nodes."
      },
      {
        "state": "ACTIVE",
        "timestamp": "2026-10-01T12:05:00Z",
        "actor": "ZenOrion",
        "rationale": "Initial parallel task branches dispatched to qualified division agents."
      }
    ]
  },
  "freezeStatus": {
    "isGlobalFrozen": false,
    "activeFrozenBranches": [
      "T-AUTH-MULTI-TENANT-RLS-008-02"
    ]
  },
  "taskDecompositionRef": {
    "isDecomposed": true,
    "totalTaskCount": 3,
    "criticalPathLength": 2,
    "dagTopologyRef": "docs/eeos-o/dags/WP-AUTH-MULTI-TENANT-RLS-008.dag.json",
    "tasks": [
      {
        "taskId": "T-AUTH-MULTI-TENANT-RLS-008-01",
        "title": "Draft PostgreSQL RLS DDL Migration Script",
        "division": "DIV_DATA",
        "state": "COMPLETED",
        "requires": [],
        "requiredBy": ["T-AUTH-MULTI-TENANT-RLS-008-02", "T-AUTH-MULTI-TENANT-RLS-008-03"]
      },
      {
        "taskId": "T-AUTH-MULTI-TENANT-RLS-008-02",
        "title": "Implement Drizzle Schema Policy Mappings",
        "division": "DIV_ENG",
        "state": "REWORK_REQUIRED",
        "requires": ["T-AUTH-MULTI-TENANT-RLS-008-01"],
        "requiredBy": []
      },
      {
        "taskId": "T-AUTH-MULTI-TENANT-RLS-008-03",
        "title": "Construct Automated Multi-Tenant RLS Contract Tests",
        "division": "DIV_QA",
        "state": "IN_PROGRESS",
        "requires": ["T-AUTH-MULTI-TENANT-RLS-008-01"],
        "requiredBy": []
      }
    ]
  },
  "evidenceDossierRef": {
    "artifactReferences": [
      "drizzle/migrations/0008_santri_rls.sql",
      "docs/architecture/WP-008-AUDIT-EVIDENCE.md"
    ],
    "validationSummary": {
      "totalPassed": 1,
      "totalFailed": 1,
      "totalReworked": 1
    }
  },
  "signOffLedger": {
    "poSubmissionSignOff": "SIG-PO-77491-SUBMITTED",
    "mandorRatificationSignOff": "SIG-MANDOR-99214-RATIFIED"
  }
}
```

---

## 12. Invalid Contract Examples & Failure Analysis

### Example 1: Missing Core Identity (`wpId`)
```json
{
  "contractVersion": "1.1.0",
  "title": "Anonymous WP Without Identifier",
  "targetEnvironment": "preview"
}
```
- **Why Invalid**: Violates schema `required: ["wpId", ...]`.
- **Expected Result**: `SCHEMA_VALIDATION_ERROR: must have required property 'wpId'`.
- **System Safeguard**: Ingestion rejected; anonymous Work Packages cannot be tracked or decomposed in the DAG.

### Example 2: Premature Completion Invariant Violation (`INV-WP-06`)
```json
{
  "wpId": "WP-TEST-01",
  "lifecycle": {
    "state": "ACCEPTED"
  },
  "taskDecompositionRef": {
    "tasks": [
      {
        "taskId": "T-TEST-01-01",
        "state": "IN_PROGRESS"
      }
    ]
  }
}
```
- **Why Invalid**: A Work Package claims `ACCEPTED` status while tasks within its decomposition remain `IN_PROGRESS`.
- **Expected Result**: `INVARIANT_VIOLATION [INV-WP-06]: Cannot transition WP to ACCEPTED while tasks remain incomplete`.
- **System Safeguard**: Prevents false completion claims; enforces strict evidence-based closure.

### Example 3: Unauthorized Global Freeze Attempt (`INV-WP-05`)
```json
{
  "wpId": "WP-TEST-02",
  "freezeStatus": {
    "isGlobalFrozen": true,
    "globalFreezeReason": "Local unit test failed in engineering branch",
    "globalFrozenBy": "AGENT:ZenCoder-1"
  }
}
```
- **Why Invalid**: A sub-agent (`ZenCoder-1`) attempted to declare a global Work Package freeze due to a localized unit test failure.
- **Expected Result**: `AUTHORITY_VIOLATION [INV-WP-05]: globalFrozenBy must be an authorized Mandor or Product Owner persona`.
- **System Safeguard**: Preserves Ratified Decision #1 (*Branch-Only Freeze*); prevents localized rework from starving unrelated parallel tasks.

### Example 4: Foreign Task Cross-Contamination (`INV-WP-07`)
```json
{
  "wpId": "WP-AUTH-008",
  "taskDecompositionRef": {
    "tasks": [
      {
        "taskId": "T-BILLING-999-01",
        "title": "Invoice calculation logic"
      }
    ]
  }
}
```
- **Why Invalid**: A task belonging to foreign Work Package `WP-BILLING-999` is referenced inside `WP-AUTH-008`.
- **Expected Result**: `DOMAIN_CONSISTENCY_ERROR [INV-WP-07]: taskId T-BILLING-999-01 does not match parent wpId pattern`.
- **System Safeguard**: Prevents task cross-contamination and namespace hijacking across Work Packages.

### Example 5: Post-Approval Business Intent Mutation (`INV-WP-02`)
```json
{
  "wpId": "WP-TEST-05",
  "lifecycle": {
    "state": "ACTIVE"
  },
  "acceptanceCriteria": []
}
```
- **Why Invalid**: `acceptanceCriteria` has been cleared (`minItems: 1` violated) during active execution.
- **Expected Result**: `INVARIANT_VIOLATION [INV-WP-02]: acceptanceCriteria cannot be stripped or mutated while ACTIVE`.
- **System Safeguard**: Guarantees that business goals cannot be silently erased to bypass verification.

### Example 6: Rework Cascading to Global Freeze (`INV-WP-04`)
```json
{
  "wpId": "WP-TEST-06",
  "freezeStatus": {
    "isGlobalFrozen": true,
    "globalFreezeReason": "Specialist peer review issued FAIL on Task T-TEST-06-02",
    "globalFrozenBy": "ZenOrion"
  }
}
```
- **Why Invalid**: ZenOrion escalated a routine specialist review `FAIL` into a systemic global freeze.
- **Expected Result**: `INVARIANT_VIOLATION [INV-WP-04]: Routine rework must populate activeFrozenBranches, not isGlobalFrozen`.
- **System Safeguard**: Enforces localized branch freeze; independent branches must continue parallel execution.

---

## 13. Validation Rules

Before a Work Package payload is ingested into ZenOrion's orchestration engine, it must pass a three-tiered programmatic validation pipeline:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      WP INGESTION VALIDATION PIPELINE                  │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 1: Syntactic Validation (JSON Schema Draft 2020-12 Compliance)   │
│         - Validates types, required fields, formats, regex patterns    │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Semantic Integrity Validation (Contract Invariants INV-01..08) │
│         - Validates cross-field consistency and authority rules        │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Governance State Verification (Signature & Milestone Ledger)   │
│         - Verifies PO approval and Mandor architectural ratification   │
└────────────────────────────────────────────────────────────────────────┘
```

If any tier fails, ZenOrion halts ingestion and emits an error event: `WP_INGESTION_REJECTED` citing the exact validation tier and failed property path.

---

## 14. Gap Analysis

The Master System Specification v1.1 established the macroscopic WP lifecycle and governance principles. In designing this formal machine-readable contract, the following gaps were identified and categorized:

| Gap Identified | Description | Resolution Category | Handling Strategy in Phase 1.1 |
| :--- | :--- | :---: | :--- |
| **WP State vs. Task FSM Conflation** | Master Spec v1.0 listed 9 WP states, but did not define formal entry/exit gates separate from the 16-state Task FSM. | **A. Resolved inside Phase 1.1** | Explicitly decoupled the macroscopic WP lifecycle (`DRAFT`..`ACCEPTED`) from task states (`CREATED`..`COMPLETED`). |
| **Branch Freeze Tracking Schema** | Ratified Decision #1 mandated branch-only freeze, but did not specify the data structure to track frozen branches. | **A. Resolved inside Phase 1.1** | Designed `freezeStatus` separating `isGlobalFrozen` from `activeFrozenBranches[]`. |
| **Task Internal Schema** | Need to represent tasks inside WP without defining their complete execution mechanics. | **B. Belongs to Phase 1.2** | Used `TaskReference` object containing only routing keys (`taskId`, `division`, `state`, `requires`, `requiredBy`). |
| **DAG Serialization Format** | How the complete DAG graph is serialized (JSON adjacency list vs DOT vs JSON-LD). | **B. Belongs to Phase 1.4** | Represented as an external reference URI (`dagTopologyRef`) with high-level task node references. |
| **Evidence Payload Structure** | How file diffs, test logs, and hashes are formally encapsulated. | **B. Belongs to Phase 1.6** | Abstracted into `evidenceDossierRef.artifactReferences[]`. |
| **Mandor Digital Signature Cryptography** | Exact cryptographic algorithm for digital sign-offs (`signOffLedger`). | **E. Deferred Implementation Detail** | Modeled as opaque string tokens (`SIG-*`), leaving algorithm selection (Ed25519 vs HMAC) open. |

---

## 15. Contract Versioning Rules

To ensure long-term stability across multi-tenant enterprise releases, the contract distinguishes between **Contract Schema Versioning** and **Work Package Instance Identity**:

1. **`wpId` $\neq$ `contractVersion`**:
   - `wpId` is the unique operational identifier of a specific engineering job (e.g. `WP-AUTH-08`).
   - `contractVersion` is the Semver schema version of the contract specification itself (e.g. `1.1.0`).
2. **Semver Evolution Semantics**:
   - **Patch (`1.1.x`)**: Non-breaking structural clarifications, regex optimizations, or documentation additions.
   - **Minor (`1.x.0`)**: Backwards-compatible additions of optional fields or relaxed constraints.
   - **Major (`x.0.0`)**: Breaking changes (removal of fields, restructuring of core invariant sections, or changes to mandatory state enums).
3. **Strict Validation Pinning**: ZenOrion inspects `contractVersion` upon ingestion. Any payload claiming a major version higher than ZenOrion's supported parser is rejected fail-closed with `UNSUPPORTED_CONTRACT_VERSION`.

---

## 16. Relationship to Future Contracts

This Work Package Contract establishes clean structural hooks that will be populated by subsequent Phase 1 sub-phases:

```text
WP Contract Field Hook                 Target Sub-Phase & Contract
─────────────────────────────────────────────────────────────────────────────
taskDecompositionRef.tasks[]   ─────► Phase 1.2: Task Contract (TaskDefinition)
governance.leadOrchestrator    ─────► Phase 1.3: Agent Registry & Profile Contract
taskDecompositionRef.dagRef    ─────► Phase 1.4: DAG & Dependency Contract
evidenceDossierRef.validation  ─────► Phase 1.5: Specialist Review Contract
evidenceDossierRef.artifacts[] ─────► Phase 1.6: Evidence Artifact Contract
```

---

## 17. Open Governance Decisions

All intra-contract design boundaries for Phase 1.1 are completely resolved. One external governance topic is highlighted for Mandor consideration during Phase 1.2:
- **Task Scope File Granularity**: *Should the Task Contract enforce file whitelisting strictly at the file path level (e.g. `src/proxy.ts`), or allow glob patterns (e.g. `src/lib/auth/**`)*?  
  *(Recommendation: Strict exact file path whitelisting for mutable files; globs permitted for read-only reference files.)*

---

## 18. Phase 1.1 Completion Criteria Checklist

- [x] **WP Contract boundary clearly defined**: Root envelope separates business intent, architecture, and orchestration.
- [x] **WP fields formally inventoried**: 32 structured fields across 10 logical sections.
- [x] **Required / Optional / Derived classification exists**: Formally tabulated in Section 8.
- [x] **Immutable / Mutable / System-managed classification exists**: Explicit mutability rules established per field.
- [x] **Contract invariants explicitly documented**: 8 non-bypassable invariants codified (`INV-WP-01` through `INV-WP-08`).
- [x] **JSON Schema provided**: Full JSON Schema Draft 2020-12 specification included.
- [x] **One valid realistic example exists**: Complete valid JSON payload demonstrated in Section 11.
- [x] **At least five invalid examples exist**: 6 invalid failure scenarios documented with root causes and expected errors.
- [x] **Validation rules documented**: 3-tiered ingestion pipeline defined.
- [x] **Freeze semantics preserve BRANCH-ONLY FREEZE**: `freezeStatus` models localized branch freezes without triggering global holds.
- [x] **WP lifecycle decoupled from Task FSM**: Macroscopic WP states (`DRAFT`..`ACCEPTED`) separated from internal task FSM.
- [x] **Sub-contracts isolated**: Tasks, DAG, Agents, and Evidence referenced symbolically without premature expansion.
- [x] **Gaps explicitly categorized**: Gap analysis table categorized by handling phase.
- [x] **No unsupported architecture invented**: 100% faithful to ratified visual BPMN v2.1 and Master Spec v1.1.
- [x] **No implementation work performed**: Documentation and contract design only.
- [x] **Master Specification v1.1 preserved unchanged**: Baseline remains intact.

---

*End of Phase 1.1 Work Package Contract Architecture Design.*
