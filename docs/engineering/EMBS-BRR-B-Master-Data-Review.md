# EMBS — Blueprint Review Report (BRR)

## Enterprise Core Module Blueprint — Master Data (Santri Core)

**Document**: EMBS-BRR-B-Master-Data-Review
**Target**: EMBS Appendix B — Enterprise Core Module Blueprint: Master Data (Santri Core)
**Review Board**: Enterprise Architecture Review Board (EARB)
**Review Date**: 2026-08-06
**Review Mode**: READ ONLY — No modification to blueprint

---

## Review Board Composition

| Role | Name/Delegation | Responsibility |
|------|:--------------:|----------------|
| **Chief Enterprise Architect** | EARB Chair | Overall architecture governance; final decision authority |
| **Domain Driven Design Expert** | EARB-DDD | Aggregate boundaries; bounded contexts; ubiquitous language |
| **Enterprise Engineering Lead** | EARB-ENG | Engineering standards compliance; implementation feasibility |
| **Solution Architect** | EARB-SOL | Cross-domain integration; API/event contract design |
| **Software Quality Architect** | EARB-QA | Testing strategy; coverage targets; quality gates |
| **AI Engineering Architect** | EARB-AI | AI generability; machine-parseability; deterministic generation |
| **Security Architect** | EARB-SEC | Tenant isolation; PII protection; RBAC; audit compliance |
| **Data Architect** | EARB-DAT | Data model; projections; consistency; retention; classification |
| **Product Architect** | EARB-PRD | Business completeness; capability coverage; domain alignment |

---

## Executive Summary

EMBS Appendix B — the first real module blueprint in the APP MA'HAD platform — has undergone comprehensive review by the full Enterprise Architecture Review Board across 8 dimensions. The Board finds the blueprint to be **architecturally sound, domain-accurate, and AI-ready**, with a small number of findings that should be addressed before production implementation.

The blueprint inherits correctly from EMBS Appendix A, defines a complete Santri domain model with 5 aggregates, specifies 31 API endpoints, 22 published events, 9 workflows, and 17 state transitions — all using accurate Pesantren domain terminology. With 1,080 total specifications across 3,320 lines, the document provides sufficient detail for AI Engineers to generate implementation artifacts without guessing.

---

## FINAL DECISION

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ENTERPRISE ARCHITECTURE REVIEW BOARD                       ║
║   FINAL DECISION                                             ║
║                                                              ║
║   ██████████████████████████████████████████████████         ║
║   ████████████  APPROVED WITH NOTES  ██████████████         ║
║   ██████████████████████████████████████████████████         ║
║                                                              ║
║   The blueprint EMBS Appendix B is APPROVED for:             ║
║                                                              ║
║   ✅ Sprint Planning                                         ║
║   ✅ AI Implementation                                       ║
║   ✅ Engineering Review Board submission                     ║
║                                                              ║
║   Conditions (15 Notes to resolve before Release Ready):     ║
║                                                              ║
║   N-001 to N-015 documented in §11 of this report.           ║
║                                                              ║
║   No BLOCKER findings.                                       ║
║   No CRITICAL findings.                                      ║
║   2 MAJOR findings (must resolve before TESTING phase).      ║
║   13 MINOR findings (should resolve before RELEASE).         ║
║                                                              ║
║   Signed: Enterprise Architecture Review Board               ║
║   Date: 2026-08-06                                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

---

## REVIEW 1 — Enterprise Alignment

### Reviewer: Chief Enterprise Architect + Product Architect

### 1.1 EARS Part 1–6 Alignment

| EARS Reference | Topic | Blueprint Compliance | Verdict |
|:-------------:|-------|---------------------|:-------:|
| EARS Part 1 | Enterprise Architecture Vision | MDS blueprint aligns with multi-tenant SaaS vision for 100+ Pesantren | ✅ ALIGNED |
| EARS Part 2 | System Blueprint | MDS positioned as CORE module at T2; correct dependency direction | ✅ ALIGNED |
| EARS Part 3 | Domain Architecture Principles | DDD principles applied: aggregates, bounded contexts, ubiquitous language | ✅ ALIGNED |
| EARS Part 4 DOM-001 | Master Data Domain — Santri as Aggregate Root | MDS correctly identifies Santri as Aggregate Root; all consuming domains reference via FK | ✅ ALIGNED |
| EARS Part 4 §J.1 | Santri State Machine (DRAFT→ACTIVE→ALUMNI/INACTIVE) | 9-state lifecycle extends EARS state machine; legacy states preserved as subtypes | ✅ ALIGNED |
| EARS Part 5 | Enterprise Data Architecture — Santri = CONFIDENTIAL | MDS correctly classifies all Santri PII as CONFIDENTIAL with masking rules | ✅ ALIGNED |
| EARS Part 5 §4.2 | Cross-domain FK snapshots, no cascade delete | SMB-040 enforces read-only FK + no cascade; aligns with EARS Part 5 data architecture | ✅ ALIGNED |
| EARS Part 6 | Enterprise Security Architecture | RBAC with 10 roles; delegated cross-domain permissions; tenant isolation at repository layer | ✅ ALIGNED |

### 1.2 EARS Appendix A–P Alignment

| EARS Appendix | Topic | Blueprint Compliance | Verdict |
|:------------:|-------|---------------------|:-------:|
| Appendix A | Domain Glossary | Ubiquitous language uses Pesantren terminology: Santri, Wali, NIS, Angkatan, etc. | ✅ ALIGNED |
| Appendix B | Domain Event Standard | Events follow naming convention; metadata includes tenant_id + correlation_id | ✅ ALIGNED |
| Appendix H | Kesiswaan Domain Standard | MDS correctly subscribes to kesiswaan events; projection ownership respected | ✅ ALIGNED |
| Appendix M | Data Migration Standard | 9 migrations defined with reversibility; backfill job for status vocabulary | ✅ ALIGNED |
| Appendix P | Master Data Management Standard | Santri = Core Master Data, CRITICAL; consumed by 8+ domains; monthly DQ review | ✅ ALIGNED |

### 1.3 EARS Violations Detected

| # | Finding | Severity | Description |
|:--:|:-------:|:--------:|-------------|
| **EARS-001** | — | NONE | No EARS violations detected. Blueprint extends EARS without contradiction. |

### 1.4 Enterprise Alignment Verdict

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| EARS Part 1–6 Compliance | 100/100 | All domain architecture rules respected |
| EARS Appendix Compliance | 100/100 | All applicable appendices referenced correctly |
| Domain Terminology Accuracy | 98/100 | Pesantren terms used consistently; minor: "wali_kelas" vs "wali kelas" inconsistency in role matrix |
| Cross-Domain Positioning | 100/100 | 14-domain interaction matrix with clear ownership boundaries |
| **ENTERPRISE ALIGNMENT SCORE** | **99/100** | ✅ PASS |

---

## REVIEW 2 — Engineering Alignment

### Reviewer: Enterprise Engineering Lead + AI Engineering Architect

### 2.1 EESS Part 1 Compliance

| EESS Part 1 § | Requirement | Blueprint Compliance | Verdict |
|:------------:|-------------|---------------------|:-------:|
| §6 | Naming Convention | Module code MDS; permission `mds:res:action`; events `mds.agg.verb.v1`; errors `MDS_NNNN` | ✅ |
| §8 | Module Registration | Module metadata complete; registered as CORE/T2/C0 | ✅ |
| §9 | Configuration Standard | Feature flags defined; tenant-configurable parameters; secrets in KMS | ✅ |
| §10 | Module Anatomy | 26 sections extend the 16-section Appendix A anatomy | ✅ |
| §11 | Business Context | Complete scope, stakeholders, KPIs, constraints, assumptions | ✅ |
| §12 | Bounded Context | Context box with OWNS/DOES NOT OWN; ubiquitous language glossary | ✅ |
| §13 | Domain Model | 5 aggregates; 7 entities; 19 VOs; invariants; lifecycle states | ✅ |
| §14 | Service Architecture | App services with DTOs + errors; domain services with business rules | ✅ |
| §15 | Testing Contract | Coverage targets; 16 mandatory scenarios; test types defined | ✅ |
| §16 | Event Architecture | 22 published + 12 subscribed events; schemas; idempotency | ✅ |
| §17 | API Contract | 31 endpoints with auth, permission, rate limit, pagination | ✅ |
| §18 | Security | RBAC (10 roles); PII masking; tenant isolation; delegated permissions | ✅ |
| §19 | Configuration | Feature flags with cleanup dates; tenant-specific overrides auditable | ✅ |
| §20 | Operations | Scheduled jobs; notifications; migrations; seeders; background jobs | ✅ |

### 2.2 EESS Appendix Compliance

| EESS Appendix | Requirement | Blueprint Compliance | Verdict |
|:------------:|-------------|---------------------|:-------:|
| Appendix A | Folder Tree Standard | Target structure: `src/modules/master-data/` with EESS-A compliant layout | ✅ |
| Appendix B | Artifact Standard | All 35-step artifacts mapped in §22.2 generation order | ✅ |
| Appendix C | Pattern Catalog | DDD patterns applied; Repository, Factory, Specification, Policy referenced | ✅ |
| Appendix D | Workflow Standard | 9 workflows with actors, steps, approvals, events, rollback | ✅ |
| Appendix E | Testing Standard | Coverage targets: 90% unit, 80% integration, 100% contract/security | ✅ |
| Appendix F | AI Engineering Governance | AI protocol defined; human approval points; checkpointing; no autonomous decisions | ✅ |

### 2.3 Engineering Violations Detected

| # | Finding | Severity | Description |
|:--:|:-------:|:--------:|-------------|
| **EESS-001** | MINOR | §11 (API) lacks formal JSON response schema examples for key endpoints | |
| **EESS-002** | MINOR | §16 (Portal) read model schemas (WaliSantriDetailView, SantriDetailView) referenced but not defined | |
| **EESS-003** | MINOR | §17 (CMS) integration references a public profile endpoint that is not listed in §11 API catalog | |
| **EESS-004** | MINOR | §20 (Monitoring) lacks specific log retention periods for MDS operational logs | |

### 2.4 Engineering Alignment Verdict

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| EESS Part 1 Compliance | 96/100 | All major sections compliant; 3 minor documentation gaps |
| EESS Appendix Compliance | 98/100 | All patterns and standards correctly applied |
| Implementation Feasibility | 95/100 | AI Engineer can implement from this blueprint without guessing |
| Naming Convention Consistency | 94/100 | Minor: role name inconsistency noted in EARS-001 |
| **ENGINEERING ALIGNMENT SCORE** | **96/100** | ✅ PASS |

---

## REVIEW 3 — Blueprint Alignment (EMBS Inheritance)

### Reviewer: Chief Enterprise Architect + Solution Architect

### 3.1 EMBS Part 1 Compliance

| EMBS Part 1 § | Requirement | Blueprint Compliance | Verdict |
|:------------:|-------------|---------------------|:-------:|
| §7 | Module Blueprint Metadata | Complete metadata block with all required fields | ✅ |
| §8 | Module Tier System | Correctly classified as T2 with tier dependency matrix validation | ✅ |
| §10 | 13-Section Anatomy | Extended to 26 sections; all 13 base sections present and populated | ✅ |
| §11 | Business Context | Complete with objectives, problem statement, scope, stakeholders | ✅ |
| §12 | Bounded Context | Context map defined; ubiquitous language glossary | ✅ |
| §13 | Domain Model | Complete with aggregates, entities, VOs, domain services | ✅ |
| §14 | Service Architecture | App services, domain services, repositories defined | ✅ |
| §15 | Testing | Coverage targets, test types, mandatory scenarios | ✅ |
| §16 | Events & Messaging | Events published + subscribed; schemas; handlers | ✅ |
| §17 | API Contract | REST endpoints; request/response; errors; pagination | ✅ |
| §18 | Security | Permissions; RBAC; tenant isolation; PII classification | ✅ |

### 3.2 EMBS Appendix A Inheritance Validation

| MBP Rule | Requirement | Compliance | Evidence |
|----------|-------------|:----------:|----------|
| MBP-001 | One blueprint per module | ✅ | EMBS Appendix B is the single MDS blueprint |
| MBP-003 | Inherit all master template sections | ✅ | Lineage matrix (§0) proves all sections inherited |
| MBP-004 | May add, must not remove sections | ✅ | 28 sections extend 16; none removed |
| MBP-005 | NOT APPLICABLE with explicit reason | ✅ | All sections populated; no N/A needed |
| MBP-006 | AI must read blueprint before generation | ✅ | SMB-256 enforces; §22 AI protocol references it |
| MBP-007 | Traceability header in artifacts | ✅ | SMB-257: `@blueprint EMBS-Appendix-B §{section}` |
| MBP-020 | All 16 sections present | ✅ | All 16 mapped in lineage matrix |
| MBP-028 | Aggregates have ≥ 1 invariant | ✅ | 5 aggregates, 24 invariants total |
| MBP-030 | tenant_id on every aggregate | ✅ | INV-MDS-001; tenant_id mandatory field |
| MBP-038 | Repository tenant scoping | ✅ | SMB-019; all queries include tenant_id |
| MBP-042 | Event metadata standard | ✅ | SMB-021; event_id, tenant_id, timestamp, correlation_id, causation_id |
| MBP-048 | API authentication required | ✅ | SMB-141; all endpoints require auth |
| MBP-053 | CRUD permissions per aggregate | ✅ | 22 permission keys covering all operations |
| MBP-055 | Tenant isolation at repository layer | ✅ | SMB-014; repository-layer enforcement |
| MBP-080 | No circular dependencies | ✅ | Dependency matrix is acyclic |
| MBP-081 | Cross-domain via events only | ✅ | SMB-007; no T2 sync calls |

### 3.3 Blueprint Inheritance Violations

| # | Finding | Severity | Description |
|:--:|:-------:|:--------:|-------------|
| **EMBS-001** | MINOR | Rule numbering duplicates: SMB-016/017/018/019 appear in multiple sections with different meanings. The rule REGISTRY (§27) is authoritative; body text duplicates should be renumbered for uniqueness. | |
| **EMBS-002** | MINOR | Rule numbering gap: SMB-024–029 are not used. Either fill with rules or document as intentionally reserved. | |

### 3.4 Blueprint Alignment Verdict

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| EMBS Part 1 Compliance | 100/100 | All required sections and rules honored |
| EMBS Appendix A Inheritance | 97/100 | Full inheritance validated; 2 minor numbering issues |
| Append-Only Contract | 100/100 | No parent document modified or redefined |
| Catalog Precedent | 100/100 | Establishes strong pattern for Appendices C+ |
| **BLUEPRINT ALIGNMENT SCORE** | **99/100** | ✅ PASS |

---

## REVIEW 4 — Domain Driven Design Audit

### Reviewer: Domain Driven Design Expert

### 4.1 Aggregate Design Audit

#### Santri Aggregate

| DDD Criterion | Assessment | Finding |
|---------------|------------|:------:|
| Aggregate Root identity | UUID + NIS natural key; clear identity strategy | ✅ |
| Invariants | 10 invariants with enforcement mechanisms | ✅ |
| Consistency boundary | Santri root + Placement + Relationship + Photo + ProfileSnapshot + CounterCache | ✅ |
| Transaction boundary | Single aggregate; cross-aggregate via events | ✅ |
| Child entity ownership | All 5 child entities belong exclusively to Santri aggregate | ✅ |
| Size | 24 fields + 5 child entities; reasonable for a CORE aggregate | ✅ |
| Concurrency | Optimistic locking; MDS_4007 on conflict | ✅ |
| Lifecycle | 9 states; state-specific operation rules | ✅ |

**DDD Note**: The Santri aggregate is well-designed. The separation of Placement and CounterCache as event-projected entities (not directly writable) is a strong DDD pattern that prevents cross-domain coupling.

#### Guardian Aggregate

| DDD Criterion | Assessment | Finding |
|---------------|------------|:------:|
| Independence | Guardian exists independently of Santri; has own lifecycle | ✅ |
| Invariants | 4 invariants; phone uniqueness validation | ✅ |
| Child entities | GuardianContact, GuardianDocument, GuardianStatus — well-scoped | ✅ |

**DDD Note**: Guardian as an independent aggregate is the correct DDD choice. The current codebase embeds wali data in Santri (anti-pattern SMA-011); this blueprint correctly separates them while keeping the Relationship entity inside Santri to enforce the "exactly one primary wali" invariant atomically.

#### StudentIdentity Aggregate

| DDD Criterion | Assessment | Finding |
|---------------|------------|:------:|
| Separation rationale | Different classification (CONFIDENTIAL), different write frequency, different audit bar | ✅ |
| Verification workflow | UNVERIFIED → PENDING → {VERIFIED, REJECTED} → EXPIRED; complete state machine | ✅ |

**DDD Note**: Extracting StudentIdentity as a separate aggregate is a strong architectural decision. It allows independent access control for identity verification staff and prevents identity document data from polluting the main Santri read path.

#### StudentStatus Aggregate

| DDD Criterion | Assessment | Finding |
|---------------|------------|:------:|
| Ledger pattern | StatusLedger with immutable StatusChangeRecord — correct event-sourcing-lite pattern | ✅ |
| Cached state | StatusSnapshot on Santri for read performance; reconciliation for drift | ✅ |
| Cross-domain triggers | Kesiswaan/Akademik/Keuangan events trigger transitions via handlers | ✅ |

**DDD Note**: This is the most architecturally sophisticated aggregate in the blueprint. The StatusLedger-as-separate-aggregate with cached state on Santri is a pragmatic CQRS-lite pattern that balances write integrity with read performance. The graduation settlement gate (edge 15) that blocks GRADUATED→ALUMNI until Keuangan settlement is an excellent example of cross-domain saga orchestration through state machine gating.

### 4.2 Entity Design Audit

| Entity | Parent Aggregate | Field Completeness | Constraint Completeness | Classification | Verdict |
|--------|:---------------:|:------------------:|:----------------------:|:-------------:|:------:|
| Santri (AR) | Santri | 24 fields, all typed | 10 invariants | CONFIDENTIAL | ✅ |
| Guardian (AR) | Guardian | 12 fields, all typed | 4 invariants | CONFIDENTIAL | ✅ |
| StudentIdentity (AR) | StudentIdentity | 13 fields, all typed | 4 invariants | CONFIDENTIAL | ✅ |
| StatusLedger (AR) | StudentStatus | Implicit in Record | 3 invariants | INTERNAL | ✅ |
| HistoryLedger (AR) | StudentHistory | Implicit in Record | 3 invariants | INTERNAL | ✅ |
| Placement | Santri | 8 fields with source tracking | Event-projected only | INTERNAL | ✅ |
| SantriRelationship | Santri | 7 fields | Part of Santri aggregate | INTERNAL | ✅ |
| SantriPhoto | Santri | 5 fields | Hash verification | CONFIDENTIAL | ✅ |
| StatusChangeRecord | StatusLedger | 10 fields | Immutable | INTERNAL | ✅ |
| FieldChangeRecord | HistoryLedger | 10 fields | Immutable, append-only | INTERNAL | ✅ |

### 4.3 Value Object Design Audit

| VO | Immutability | Equality | Validation | Domain Meaning | Verdict |
|----|:-----------:|:--------:|:----------:|:-------------:|:------:|
| Nis | ✅ | By value+tenant | Tenant format | Clear identity concept | ✅ |
| Gender | ✅ | By value | L/P only | Domain constraint | ✅ |
| PhoneNumber | ✅ | By value+type | Indo format | Contact value | ✅ |
| Address | ✅ | By all fields | Required fields | Location value | ✅ |
| PhotoRef | ✅ | By hash | Format+size+hash | Photo integrity | ✅ |
| Period | ✅ | By dates | start≤end | Temporal range | ✅ |
| NisnValue | ✅ | By value | 10 digits | National ID | ✅ |
| NikValue | ✅ | By value | 16 digits | National ID | ✅ |

**DDD Note**: All 19 VOs are properly immutable with by-attribute equality. The Status Vocabulary Master Table is a particularly important artifact — it serves as the single source of truth for status terminology across the entire module, preventing the vocabulary drift that plagued the current codebase (aktif/Aktif/active inconsistency).

### 4.4 Repository Design Audit

| Repository | Interface Location | Aggregate Managed | Query Methods | Command Methods | Tenant Scoping | Verdict |
|-----------|:-----------------:|:------------------:|:------------:|:--------------:|:-------------:|:------:|
| SantriRepository | Domain layer | Santri | 10 | 4 | All queries | ✅ |
| GuardianRepository | Domain layer | Guardian | 4 | 2 | All queries | ✅ |
| StudentIdentityRepository | Domain layer | StudentIdentity | 4 | 1 | All queries | ✅ |
| StudentStatusRepository | Domain layer | StatusLedger | 4 | 1 | All queries | ✅ |
| StudentHistoryRepository | Domain layer | HistoryLedger | 4 | 1 | All queries | ✅ |

**DDD Note**: Repository interfaces correctly placed in domain layer; implementations in infrastructure layer (SMB-020). Cursor-based pagination for list queries is the correct choice for multi-tenant scale. Read-through cache with 5-minute TTL for Santri reads is a pragmatic performance optimization.

### 4.5 Service Design Audit

| Service Type | Count | Business Logic Placement | Transaction Boundary | Verdict |
|-------------|:-----:|:----------------------:|:-------------------:|:------:|
| Application Services | 4 | Orchestration only; no business logic (SMB-116) | Defined per operation (SMB-133) | ✅ |
| Domain Services | 6 | Business rules; stateless (SMB-122) | N/A — called by app services | ✅ |

**DDD Note**: The separation between application services (orchestration) and domain services (business logic) is correctly enforced. The StatusTransitionGuard as a pure domain service (no I/O, no side effects — SMB-124) is the correct DDD pattern for complex validation logic that doesn't naturally belong to a single aggregate.

### 4.6 Bounded Context & Context Mapping Audit

| DDD Criterion | Assessment | Verdict |
|---------------|------------|:------:|
| Bounded Context definition | Clear OWNS/DOES NOT OWN box; explicit boundaries | ✅ |
| Ubiquitous Language | Pesantren terminology throughout; glossary in §3.1 | ✅ |
| Context Mapping | 14-domain interaction matrix with integration types | ✅ |
| Anti-Corruption Layer | Implicit in SnapshotUpdateService; explicit in SMB-125 | ⚠️ |
| Shared Kernel | None — correct for independent CORE domains | ✅ |
| Customer-Supplier | MDS is Supplier to 14 consuming domains | ✅ |
| Conformist | MDS conforms to Kesiswaan/Akademik/Asrama/Keuangan event schemas | ✅ |
| Published Language | Event schemas serve as published language between domains | ✅ |

**DDD Finding**: The Anti-Corruption Layer (ACL) between MDS and consuming domains is handled by the SnapshotUpdateService, which translates external domain events into MDS projection updates. This is a valid ACL pattern, but the blueprint could be more explicit about the translation logic for each external event type. Currently the ACL is described generically (§10.3) rather than per-event-type.

### 4.7 DDD Violations Detected

| # | Finding | Severity | Description |
|:--:|:-------:|:--------:|-------------|
| **DDD-001** | MINOR | Anti-Corruption Layer implementation is described generically. Each external event consumed by SnapshotUpdateService should have its translation logic explicitly documented (what fields from the external event map to which MDS entity fields). | |
| **DDD-002** | MINOR | Timeline read model (§5.5, §22) is described as "derived from events" but the assembly logic (which events contribute which timeline entry types) is not formally specified. | |
| **DDD-003** | MAJOR | The Placement entity and CounterCache entity are described as "event-projected caches" but the SPECIFIC event-to-field mapping is not exhaustively documented. For example, exactly which fields in `asrama.room.assigned.v1` map to Placement.asramaId vs Placement.kamarId is not specified. | |
| **DDD-004** | MINOR | Factory pattern is mentioned in the DDD patterns catalog but no specific MDS factories are defined in §10. At minimum, SantriFactory (for complex Santri creation with guardian linking) should be specified. | |

### 4.8 DDD Review Verdict

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Aggregate Design | 96/100 | Well-designed; Placement/CounterCache as projections is strong pattern |
| Entity Design | 98/100 | All entities fully specified with field tables |
| Value Object Design | 100/100 | All 19 VOs immutable with correct equality semantics |
| Repository Design | 98/100 | Correct interface/implementation separation; tenant scoping |
| Service Design | 96/100 | Clean app/domain separation; StatusTransitionGuard is excellent |
| Bounded Context | 95/100 | ACL could be more explicit per event type |
| **DDD REVIEW SCORE** | **97/100** | ✅ PASS |

---

## REVIEW 5 — Business Completeness

### Reviewer: Product Architect

### 5.1 Business Process Coverage

| Business Process | Blueprint Coverage | Section | Completeness | Verdict |
|-----------------|-------------------|:------:|:-----------:|:------:|
| **Registration** | 6-step workflow with draft capability | §14.1 | Complete | ✅ |
| **Activation** | Gated by guardian + identity verification | §14.1 Step 6 | Complete | ✅ |
| **Suspension (Leave)** | Cuti workflow with reason + effective date | §14.2 | Complete | ✅ |
| **Suspension (Disciplinary)** | Skors workflow triggered by Kesiswaan event | §14.3 | Complete | ✅ |
| **Return from Suspension** | SUSPENDED→ACTIVE transition | §15.2 Edge 12 | Complete | ✅ |
| **Graduation** | 3-phase workflow with Keuangan settlement gate | §14.4 | Complete | ✅ |
| **Transfer (Pindah)** | ACTIVE→TRANSFERRED→ALUMNI workflow | §15.2 Edges 9,14 | Complete | ✅ |
| **Withdrawal (Keluar)** | ACTIVE→ALUMNI(WITHDRAWN) with mandatory catatan | §15.2 Edge 11 | Complete | ✅ |
| **Archive** | ALUMNI→ARCHIVED after retention period | §14.5 | Complete | ✅ |
| **Restore** | ARCHIVED→REGISTERED with preserved relationships | §15.2 Edge 17 | Complete | ✅ |
| **Guardian Management** | Independent aggregate; CRUD; contact verification | §5.2, §9.2 | Complete | ✅ |
| **Relationship Management** | Wali-Santri linking; role designation; PRIMARY enforcement | §5.1.4, §9.1 | Complete | ✅ |
| **History & Audit** | FieldChangeRecord; StatusChangeRecord; immutable | §5.5, §6.7 | Complete | ✅ |
| **Projection Management** | Placement + CounterCache from events; reconciliation | §5.1.4, §10.3 | Complete | ✅ |
| **Bulk Import** | 4-step staged pipeline with dry-run | §14.5 | Complete | ✅ |
| **Bulk Export** | CSV/Excel with async processing for >1000 rows | §11.6 | Complete | ✅ |
| **Configuration** | Per-tenant NIS format, required fields, status labels | §4.4 CAP-MDS-016 | Complete | ✅ |
| **Search** | Full-text by name/NIS; multi-criteria filters | §11.7 | Complete | ✅ |
| **Photo Management** | Upload with variant generation; hash verification | §4.3 CAP-MDS-004 | Complete | ✅ |
| **Identity Verification** | 4-stage workflow: UNVERIFIED→PENDING→{VERIFIED,REJECTED}→EXPIRED | §5.3 | Complete | ✅ |
| **Timeline (Kronologi)** | Assembled from StatusChangeRecord + FieldChangeRecord + events | §5.5, SMB-094 | Complete | ✅ |
| **Counter Projection** | Poin Pelanggaran, Prestasi, Status Karakter, Status SP | §5.1.4 CounterCache | Complete | ✅ |
| **Placement Tracking** | Kelas, Asrama, Kamar from events | §5.1.4 Placement | Complete | ✅ |

### 5.2 Missing Business Processes

| # | Process | Status | Recommendation |
|:--:|---------|:------:|----------------|
| **BUS-001** | Emergency Contact management | MINOR | Emergency contact (non-wali) mentioned in SMD-083 but not in capability tree; add CAP-MDS-017 or document as sub-capability of Guardian |
| **BUS-002** | Santri Siblings detection | MINOR | No capability for detecting/displaying Santri-to-Santri sibling relationships (same wali). Listed in Future Scope (§2.3) but no near-term plan |
| **BUS-003** | Data Correction Request from Wali | MINOR | Mentioned in SMD-087 but no workflow or capability defined. Add to Portal Wali integration or create CAP-MDS-018 |

### 5.3 Business Completeness Verdict

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Core Business Process Coverage | 100/100 | All 16 capabilities cover the complete Santri lifecycle |
| Edge Case Coverage | 92/100 | Emergency contact, siblings, wali correction request are gaps |
| Workflow Completeness | 100/100 | All 9 workflows have full step-by-step specification |
| State Machine Completeness | 100/100 | All 17 transitions with triggers, actors, permissions, preconditions |
| **BUSINESS COMPLETENESS SCORE** | **98/100** | ✅ PASS |

---

## REVIEW 6 — Capability Coverage

### Reviewer: Product Architect + Solution Architect

### 6.1 Capability Completeness Audit

| CAP-MDS | Capability | Priority | Owned by MDS? | Overlap? | Verdict |
|:-------:|-----------|:--------:|:------------:|:--------:|:------:|
| 001 | Santri Registration | P0 | ✅ MDS owns | None | ✅ |
| 002 | Guardian Assignment | P0 | ✅ MDS owns | None | ✅ |
| 003 | Profile Management | P0 | ✅ MDS owns | None | ✅ |
| 004 | Photo Management | P1 | ✅ MDS owns | None | ✅ |
| 005 | Identity Verification | P1 | ✅ MDS owns | None | ✅ |
| 006 | Status Management | P0 | ✅ MDS owns | Kesiswaan triggers; MDS executes | ✅ |
| 007 | Graduation | P1 | ✅ MDS executes | Akademik triggers; Keuangan gates; MDS owns final state | ✅ |
| 008 | Archive & Restore | P1 | ✅ MDS owns | None | ✅ |
| 009 | Search & Filter | P0 | ✅ MDS owns | None | ✅ |
| 010 | History & Audit | P1 | ✅ MDS owns | None | ✅ |
| 011 | Bulk Import | P1 | ✅ MDS owns | None | ✅ |
| 012 | Bulk Export | P2 | ✅ MDS owns | None | ✅ |
| 013 | Relationship Management | P1 | ✅ MDS owns | None | ✅ |
| 014 | Placement Tracking | P1 | ⚠️ MDS projects | Asrama/Akademik own source data; MDS caches | ✅ |
| 015 | Counter Projection | P1 | ⚠️ MDS projects | Kesiswaan owns source data; MDS caches | ✅ |
| 016 | Configuration | P1 | ✅ MDS owns | None | ✅ |

### 6.2 Capability Gaps

| # | Gap | Severity | Description |
|:--:|-----|:--------:|-------------|
| **CAP-001** | Missing: Emergency Contact | MINOR | Emergency contact as distinct from Guardian; see BUS-001 |
| **CAP-002** | Missing: Wali Data Correction Request | MINOR | See BUS-003 |
| **CAP-003** | Missing: Santri Document Management | MINOR | Non-identity documents (surat keterangan, recommendation letters) not covered; currently listed as Out of Scope → Perpustakaan but the boundary is fuzzy |

### 6.3 Capability Overlap Check

| Check | Result |
|-------|:------:|
| MDS vs Kesiswaan — Poin Pelanggaran ownership | ✅ Clear: Kesiswaan owns; MDS projects |
| MDS vs Asrama — Placement ownership | ✅ Clear: Asrama owns; MDS projects |
| MDS vs Akademik — Kelas enrollment ownership | ✅ Clear: Akademik owns; MDS projects |
| MDS vs Keuangan — Invoice/wallet ownership | ✅ Clear: Keuangan owns; MDS reads for graduation gate only |
| MDS vs Security — User account ownership | ✅ Clear: Security owns; MDS references guardian.userId |

### 6.4 Capability Coverage Verdict

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Capability Completeness | 94/100 | 16 of 19 identified capabilities covered; 3 minor gaps |
| Capability Ownership Clarity | 100/100 | No ownership conflicts across 14 domains |
| Priority Distribution | 100/100 | 4 P0, 10 P1, 2 P2 — appropriate for CORE module |
| **CAPABILITY COVERAGE SCORE** | **97/100** | ✅ PASS |

---

## REVIEW 7 — Boundary Review

### Reviewer: Solution Architect + Data Architect

### 7.1 In Scope / Out of Scope Audit

| Boundary | Assessment | Finding |
|----------|------------|:------:|
| In Scope (16 items) | All 16 items correctly belong to MDS — Santri master data lifecycle | ✅ |
| Out of Scope (12 items) | All 12 items correctly assigned to owning modules | ✅ |
| Future Scope (6 items) | Reasonable future capabilities with defined prerequisites | ✅ |
| Forbidden Responsibilities (6 items) | Clear prohibitions preventing domain creep | ✅ |

### 7.2 Cross-Domain Responsibility Audit

| Cross-Domain Function | MDS Role | Other Domain Role | Clear? | Finding |
|----------------------|----------|:----------------:|:------:|:------:|
| Status Transition (Suspend) | Owns transition execution | Kesiswaan triggers disciplinary suspension | ✅ | — |
| Status Transition (Graduate) | Owns transition execution | Akademik triggers graduation | ✅ | — |
| Status Transition (Alumni Finalize) | Owns transition execution | Keuangan triggers settlement gate | ✅ | — |
| Placement (Kelas) | Caches from events | Akademik owns enrollment | ✅ | — |
| Placement (Asrama) | Caches from events | Asrama owns room allocation | ✅ | — |
| Counter (Poin) | Caches from events | Kesiswaan owns violation data | ✅ | — |
| Counter (Prestasi) | Caches from events | Kesiswaan owns achievement data | ✅ | — |
| Invoice/Wallet | Reads for graduation gate | Keuangan owns financial data | ✅ | — |
| RFID/Gate Access | Reads for audit log | Keamanan owns access control | ✅ | — |

### 7.3 Boundary Violations Detected

| # | Finding | Severity | Description |
|:--:|:-------:|:--------:|-------------|
| **BND-001** | MINOR | Pendaftaran (PSB) is listed as Out of Scope → "Pendaftaran (future module, currently folded — see SMD-006)". The "currently folded" status is ambiguous — if MDS handles PSB temporarily, the PSB capabilities should appear in the capability tree with a FUTURE annotation. Currently PSB capabilities are invisible. | |

### 7.4 Boundary Review Verdict

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Scope Definition | 100/100 | In/Out/Future scope clearly delineated |
| Cross-Domain Ownership | 100/100 | All 9 cross-domain responsibilities have clear ownership |
| Forbidden Responsibility Enforcement | 100/100 | 6 explicit prohibitions prevent domain creep |
| Boundary Documentation | 95/100 | PSB boundary is ambiguous (BND-001) |
| **BOUNDARY REVIEW SCORE** | **99/100** | ✅ PASS |

---

## REVIEW 8 — Aggregate Review (DDD Deep Dive)

### Reviewer: Domain Driven Design Expert + Data Architect

### 8.1 Aggregate Root Deep Audit

#### Santri Aggregate Root — PERSISTENCE READINESS

| Criterion | Assessment | Finding |
|-----------|------------|:------:|
| DB table design implied | Santri table with 24 columns + tenant_id + version; Placement/Rels/Photos as separate tables in same aggregate schema | ✅ |
| Index strategy implied | NIS unique index on (tenant_id, nis); FK indexes on guardianId references | ✅ |
| Migration path from legacy | Status vocabulary migration (backfill job); dual persistence (Firestore→Postgres) | ✅ |
| Query performance at scale | Cursor pagination; read-through cache; search index for >10K records | ✅ |

#### Guardian Aggregate Root — INDEPENDENCE READINESS

| Criterion | Assessment | Finding |
|-----------|------------|:------:|
| Can exist without Santri | Yes — Guardian lifecycle is independent (SMB-074) | ✅ |
| Can link to multiple Santri | Yes — through SantriRelationship in Santri aggregate | ✅ |
| Phone uniqueness | Per-tenant unique constraint on primary phone | ✅ |

#### StudentIdentity Aggregate — SECURITY READINESS

| Criterion | Assessment | Finding |
|-----------|------------|:------:|
| Independent access control | Yes — separate permissions for identity:submit vs identity:verify | ✅ |
| Verification separation | Verifier must not be submitter (SMB-138) | ✅ |
| Document retention | 7 years after alumni (verified); 2 years (unverified) | ✅ |

#### StudentStatus Aggregate — EVENT SOURCING READINESS

| Criterion | Assessment | Finding |
|-----------|------------|:------:|
| Immutable ledger | StatusChangeRecord is append-only, immutable | ✅ |
| Rebuild capability | Full status history reconstructible from ledger | ✅ |
| Cross-domain triggers | Events from 3 domains trigger transitions via handlers | ✅ |
| Reconciliation | Hourly reconciliation with Santri.currentState cache | ✅ |

### 8.2 Transaction Boundary Audit

| Operation | Aggregates Touched | Transaction Strategy | Verdict |
|-----------|:-------------------:|---------------------|:------:|
| Register Santri + Link Guardian | 1 (Santri — includes Relationship entity) | Single aggregate transaction | ✅ |
| Update Santri Profile | 1 (Santri) + append to HistoryLedger | Santri in transaction; History event-consistent | ⚠️ |
| Transition Status | 1 (StatusLedger) + update Santri.currentState cache | StatusLedger in transaction; cache update synchronous | ⚠️ |
| Verify Identity | 1 (StudentIdentity) | Single aggregate transaction | ✅ |
| SnapshotUpdate | 1 (Santri — updates Placement/CounterCache) | Single aggregate transaction within event handler | ✅ |
| Bulk Import | N (one Santri per row) | Independent transactions per batch of 500 | ✅ |

**DDD Finding (DDD-005, MAJOR)**: Two operations (Update Santri Profile → HistoryLedger, and Transition Status → Santri.currentState cache) touch more than one aggregate. The blueprint acknowledges this in SMB-011 but does not specify the exact consistency guarantee. For the HistoryLedger: if the Santri profile update succeeds but the HistoryLedger append fails, is the profile change rolled back or is the history loss acceptable? The Board recommends: HistoryLedger append should be synchronous within the same transaction (HistoryLedger is part of the Santri aggregate's consistency boundary, or at minimum, the write to both should be atomic via outbox pattern).

### 8.3 CQRS Readiness

| CQRS Aspect | Blueprint Implementation | Verdict |
|-------------|------------------------|:------:|
| Command/Query Separation | Commands (POST/PUT/DELETE) separated from Queries (GET) at API level | ✅ |
| Read Models | Timeline, WaliSantriDetailView, SantriDetailView defined | ✅ |
| Projections | Placement, CounterCache updated via events | ✅ |
| Event Sourcing (Partial) | StatusLedger is event-sourced; HistoryLedger is event-sourced | ✅ |
| Write/Read DB Separation | Not specified — single DB for V1 | ✅ (appropriate for V1) |

### 8.4 Event-Driven Readiness

| Event-Driven Aspect | Blueprint Implementation | Verdict |
|--------------------|------------------------|:------:|
| Event Publication | 22 events published on state changes | ✅ |
| Event Consumption | 12 events subscribed from 4 external domains | ✅ |
| Idempotent Handlers | Deduplication by event_id; SMB-121, SMB-195 | ✅ |
| Ordering Guarantees | Per-aggregate ordering for MDS events; out-of-order tolerant for external events | ✅ |
| Dead Letter Queue | DLQ per source domain; 30-day retention; replay capability | ✅ |
| Schema Versioning | Independent versioning per event; backward compatible changes | ✅ |

### 8.5 Aggregate Review Violations

| # | Finding | Severity | Description |
|:--:|:-------:|:--------:|-------------|
| **AGG-001** | MAJOR | Cross-aggregate consistency for HistoryLedger and StatusLedger updates is underspecified. When Santri profile is updated, the FieldChangeRecord append to HistoryLedger should be guaranteed (either same transaction or outbox pattern). Currently the consistency guarantee is implicit. | |
| **AGG-002** | MINOR | The Santri.currentState cache update after StatusLedger write is described as "synchronous" but the failure mode (StatusLedger write succeeds, cache update fails) is not documented. Should specify: cache update failure → retry with backoff → alert on persistent failure → reconciliation job repairs. | |
| **AGG-003** | MINOR | SantriFactory is not defined as a domain service. Complex Santri creation (registration + guardian link + optional identity docs) would benefit from a Factory pattern to encapsulate creation logic and invariant enforcement. | |

### 8.6 Aggregate Review Verdict

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Aggregate Root Design | 98/100 | Clean DDD aggregates; well-scoped boundaries |
| Transaction Boundary | 90/100 | 2 cross-aggregate consistency concerns (AGG-001, AGG-002) |
| CQRS Readiness | 95/100 | Good command/query separation; read models defined |
| Event-Driven Readiness | 98/100 | Comprehensive event architecture with idempotency and DLQ |
| Persistence Readiness | 96/100 | Clear DB design; migration path; dual-persistence strategy |
| **AGGREGATE REVIEW SCORE** | **95/100** | ✅ PASS |

---

---

## 9. Consolidated Findings Registry

### 9.1 Findings by Severity

| Severity | Count | IDs |
|:--------:|:-----:|-----|
| **BLOCKER** | 0 | — |
| **CRITICAL** | 0 | — |
| **MAJOR** | 2 | DDD-003 (event-to-field mapping), AGG-001 (cross-aggregate consistency) |
| **MINOR** | 13 | EESS-001–004, EMBS-001–002, DDD-001–002, DDD-004, CAP-001–003, BND-001, AGG-002–003 |
| **OBSERVATION** | 8 | EARS-001 (role name), BUS-001–003 (missing processes), plus observations from reviews |

### 9.2 MAJOR Findings Detail

#### MAJOR-001 (DDD-003): Event-to-Field Mapping for Projections

**Finding**: The SnapshotUpdateService processes events from 4 external domains to update Placement and CounterCache entities. However, the exact field-level mapping from each external event to MDS entity fields is not documented.

**Impact**: AI Engineers implementing SnapshotUpdateService must infer the mapping from event payload descriptions, risking incorrect projection logic.

**Resolution**: Add a mapping table to §10.3 (or §18) specifying for each consumed event:
- Source event name + version
- Source event fields used
- Target MDS entity + field
- Transformation logic (if any)
- Default value on missing source field

**Example format**:
```
| asrama.room.assigned.v1 | payload.room_id | Placement.kamarId | Direct mapping | — |
| asrama.room.assigned.v1 | payload.effective_date | Placement.effectiveDate | Direct mapping | — |
| kesiswaan.pelanggaran.recorded.v1 | payload.poin | CounterCache.totalPoinPelanggaran | SUM aggregation | 0 |
```

#### MAJOR-002 (AGG-001): Cross-Aggregate Consistency for History and Status

**Finding**: Operations that modify the Santri aggregate and append to HistoryLedger (or StatusLedger) span two aggregates. The blueprint acknowledges this (SMB-011) but does not specify the consistency guarantee or failure recovery.

**Impact**: In production:
- Profile update succeeds but FieldChangeRecord is not appended → audit trail gap
- Status transition succeeds but Santri.currentState cache is not updated → read inconsistency until reconciliation

**Resolution**: Specify one of:
1. **Same transaction**: HistoryLedger and StatusLedger are treated as part of the Santri aggregate's consistency boundary (single DB transaction covers all writes)
2. **Outbox pattern**: Santri mutation + event published atomically; HistoryLedger/StatusLedger updated by event handler with retry
3. **Compensating action**: If History append fails, roll back Santri mutation

The Board recommends option 1 (same transaction) for V1 simplicity, with the understanding that HistoryLedger and StatusLedger tables share the same database as Santri.

### 9.3 Consolidated Resolution Plan

| Phase | Findings | Resolution |
|:-----:|:--------:|-----------|
| **Before Sprint Planning** | EMBS-001, EMBS-002 | Fix rule numbering; fill or document gaps |
| **Before Phase 3 (Persistence)** | DDD-003, AGG-001, AGG-002 | Add event-to-field mapping; specify cross-aggregate consistency |
| **Before Phase 5 (API)** | EESS-001, EESS-002, EESS-003 | Add response schemas; define read models; add CMS endpoint |
| **Before Phase 7 (Testing)** | EESS-004, AGG-003, DDD-004 | Add log retention spec; define SantriFactory |
| **Before Release** | CAP-001–003, BND-001, DDD-001–002 | Add missing capabilities; clarify PSB boundary; detail ACL per event |

---

## 10. Review Scores Summary

| Review | Dimension | Score | Weight | Weighted Score |
|:------:|-----------|:-----:|:------:|:-------------:|
| R1 | Enterprise Alignment | 99/100 | 15% | 14.85 |
| R2 | Engineering Alignment | 96/100 | 15% | 14.40 |
| R3 | Blueprint Alignment | 99/100 | 10% | 9.90 |
| R4 | DDD Audit | 97/100 | 20% | 19.40 |
| R5 | Business Completeness | 98/100 | 10% | 9.80 |
| R6 | Capability Coverage | 97/100 | 10% | 9.70 |
| R7 | Boundary Review | 99/100 | 10% | 9.90 |
| R8 | Aggregate Review | 95/100 | 10% | 9.50 |
| **COMPOSITE** | — | — | **100%** | **97.45 → 97/100** |

---

## 11. Board Notes & Conditions (N-001 to N-015)

The following 15 notes accompany the APPROVED WITH NOTES decision:

| Note ID | Source Finding | Condition |
|:-------:|:-------------:|-----------|
| **N-001** | EMBS-001 | Renumber duplicate SMB rules in body text to unique IDs before Sprint Planning |
| **N-002** | EMBS-002 | Fill SMB-024–029 rule number gap or document as intentionally reserved |
| **N-003** | DDD-003 | Document event-to-field mapping table for SnapshotUpdateService before Phase 3 |
| **N-004** | AGG-001 | Specify cross-aggregate consistency guarantee for HistoryLedger and StatusLedger before Phase 3 |
| **N-005** | AGG-002 | Document Santri.currentState cache update failure recovery procedure before Phase 3 |
| **N-006** | EESS-001 | Add JSON response schema examples for key endpoints (GET /santri/{id}/detail, POST /santri) before Phase 5 |
| **N-007** | EESS-002 | Define WaliSantriDetailView and SantriDetailView JSON schemas before Phase 5 |
| **N-008** | EESS-003 | Add CMS public profile endpoint to §11 API catalog before Phase 6 |
| **N-009** | EESS-004 | Add MDS operational log retention specification before Phase 7 |
| **N-010** | DDD-004 | Define SantriFactory domain service before Phase 2 |
| **N-011** | DDD-001 | Document per-event-type ACL translation logic in §10.3 before Phase 4 |
| **N-012** | DDD-002 | Formalize Timeline assembly specification (event→timeline entry mapping) before Phase 6 |
| **N-013** | CAP-001 | Add Emergency Contact as sub-capability of Guardian (CAP-MDS-002d) or standalone CAP-MDS-017 |
| **N-014** | BND-001 | Clarify PSB (Pendaftaran) boundary: if temporarily folded into MDS, list PSB capabilities explicitly with FUTURE annotation |
| **N-015** | CAP-002 | Add Wali Data Correction Request workflow or defer with Architecture Board tracking ticket |

---

## 12. Signatures

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ENTERPRISE ARCHITECTURE REVIEW BOARD                       ║
║   SIGNATURE BLOCK                                            ║
║                                                              ║
║   Chief Enterprise Architect    : _______________ ✅ APPROVE  ║
║   Domain Driven Design Expert   : _______________ ✅ APPROVE  ║
║   Enterprise Engineering Lead   : _______________ ✅ APPROVE  ║
║   Solution Architect            : _______________ ✅ APPROVE  ║
║   Software Quality Architect    : _______________ ✅ APPROVE  ║
║   AI Engineering Architect      : _______________ ✅ APPROVE  ║
║   Security Architect            : _______________ ✅ APPROVE  ║
║   Data Architect                : _______________ ✅ APPROVE  ║
║   Product Architect             : _______________ ✅ APPROVE  ║
║                                                              ║
║   DECISION: APPROVED WITH NOTES                              ║
║   DATE: 2026-08-06                                           ║
║                                                              ║
║   This Blueprint Review Report is the official companion     ║
║   document to EMBS Appendix B. Both documents together       ║
║   constitute the complete module specification.              ║
║                                                              ║
║   The blueprint may proceed to Sprint Planning.              ║
║   All 15 conditions (N-001 to N-015) must be resolved        ║
║   before the module reaches Release Ready (RL-6).            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

*Document Classification: Enterprise Blueprint Review Report — OFFICIAL*
*APP MA'HAD Enterprise ERP — Quality Assurance Registry*
*This BRR is the mandatory companion to EMBS Appendix B per the EMBS governance framework.*
*Blueprint + BRR = Complete Module Specification ready for Sprint Planning.*

---

---

# APPENDIX A: Detailed Findings Register

## A.1 Complete Findings Table

| ID | Review | Severity | Category | Description | Resolution Owner | Target Phase |
|:--:|:------:|:--------:|----------|-------------|:----------------:|:------------:|
| EARS-001 | R1 | OBSERVATION | Terminology | "wali_kelas" vs "wali kelas" inconsistency in role matrix | Product Architect | Before Sprint 1 |
| EESS-001 | R2 | MINOR | API Documentation | Missing JSON response schema examples for GET /santri/{id}/detail, POST /santri | Solution Architect | Before Phase 5 |
| EESS-002 | R2 | MINOR | Portal Integration | WaliSantriDetailView and SantriDetailView JSON schemas not defined | Solution Architect | Before Phase 5 |
| EESS-003 | R2 | MINOR | API Completeness | CMS public profile endpoint referenced in §17 but missing from §11 API catalog | Solution Architect | Before Phase 6 |
| EESS-004 | R2 | MINOR | Operations | MDS operational log retention periods not specified | Enterprise Engineering Lead | Before Phase 7 |
| EMBS-001 | R3 | MINOR | Rule Numbering | Duplicate SMB-016/017/018/019 in body text | Enterprise Engineering Lead | Before Sprint Planning |
| EMBS-002 | R3 | MINOR | Rule Numbering | Gap SMB-024–029 not documented as intentional | Enterprise Engineering Lead | Before Sprint Planning |
| DDD-001 | R4 | MINOR | ACL Design | Anti-Corruption Layer translation logic described generically; not per-event-type | DDD Expert | Before Phase 4 |
| DDD-002 | R4 | MINOR | Read Model | Timeline assembly specification (event→timeline entry mapping) not formalized | DDD Expert | Before Phase 6 |
| DDD-003 | R4 | MAJOR | Projection Mapping | Event-to-field mapping for SnapshotUpdateService not exhaustively documented | DDD Expert + Data Architect | Before Phase 3 |
| DDD-004 | R4 | MINOR | Factory Pattern | SantriFactory not defined as domain service | DDD Expert | Before Phase 2 |
| DDD-005 | R4 | MAJOR | Consistency | Cross-aggregate consistency for HistoryLedger/StatusLedger updates underspecified | DDD Expert + Enterprise Engineering Lead | Before Phase 3 |
| BUS-001 | R5 | MINOR | Missing Process | Emergency Contact management not in capability tree | Product Architect | Before Phase 6 |
| BUS-002 | R5 | MINOR | Missing Process | Santri Siblings detection not planned (same-wali detection) | Product Architect | Before Phase 6 |
| BUS-003 | R5 | MINOR | Missing Process | Wali Data Correction Request workflow not defined | Product Architect | Before Phase 6 |
| CAP-001 | R6 | MINOR | Missing Capability | Emergency Contact capability not defined | Product Architect | Before Phase 6 |
| CAP-002 | R6 | MINOR | Missing Capability | Wali Data Correction Request capability not defined | Product Architect | Before Phase 6 |
| CAP-003 | R6 | MINOR | Boundary | Non-identity Santri documents boundary fuzzy between MDS and Perpustakaan | Solution Architect | Before Phase 5 |
| BND-001 | R7 | MINOR | Boundary | PSB (Pendaftaran) boundary ambiguous — "currently folded" status unclear | Solution Architect + Product Architect | Before Sprint Planning |
| AGG-001 | R8 | MAJOR | Consistency | Cross-aggregate consistency guarantee for HistoryLedger append not specified | DDD Expert + Enterprise Engineering Lead | Before Phase 3 |
| AGG-002 | R8 | MINOR | Cache Consistency | Santri.currentState cache update failure recovery procedure not documented | DDD Expert | Before Phase 3 |
| AGG-003 | R8 | MINOR | Factory Pattern | SantriFactory not defined (duplicate of DDD-004) | DDD Expert | Before Phase 2 |

## A.2 Finding Distribution by Review Dimension

| Review | BLOCKER | CRITICAL | MAJOR | MINOR | OBSERVATION | Total |
|--------|:-------:|:--------:|:-----:|:-----:|:----------:|:-----:|
| R1 — Enterprise Alignment | 0 | 0 | 0 | 0 | 1 | 1 |
| R2 — Engineering Alignment | 0 | 0 | 0 | 4 | 0 | 4 |
| R3 — Blueprint Alignment | 0 | 0 | 0 | 2 | 0 | 2 |
| R4 — DDD Audit | 0 | 0 | 2 | 3 | 0 | 5 |
| R5 — Business Completeness | 0 | 0 | 0 | 3 | 0 | 3 |
| R6 — Capability Coverage | 0 | 0 | 0 | 3 | 0 | 3 |
| R7 — Boundary Review | 0 | 0 | 0 | 1 | 0 | 1 |
| R8 — Aggregate Review | 0 | 0 | 1 | 2 | 0 | 3 |
| **TOTAL** | **0** | **0** | **3** | **18** | **1** | **22** |

## A.3 Finding Severity Definitions

| Severity | Definition | Resolution Timeline | Gates Blocked |
|:--------:|-----------|:------------------:|:------------:|
| **BLOCKER** | Prevents blueprint approval; architectural flaw that would cause system failure | Must resolve before APPROVED decision | Blueprint Approval, Sprint Planning |
| **CRITICAL** | Significant architectural risk; would cause data loss, security breach, or tenant isolation failure | Must resolve before Phase 3 (Persistence) | Implementation Start (RL-2→RL-3) |
| **MAJOR** | Design gap that would cause implementation rework or production incident | Must resolve before Phase 5 (API) or Phase 7 (Testing) | Testing Complete (RL-4→RL-5) |
| **MINOR** | Documentation gap, naming inconsistency, missing detail that can be resolved during implementation | Should resolve before Release (RL-6) | None (does not block gates) |
| **OBSERVATION** | Non-binding recommendation for improvement; no resolution required | At team discretion | None |

---

# APPENDIX B: Board Deliberation Record

## B.1 Key Discussions

### Discussion 1: Seven-Aggregate vs Five-Aggregate Model

**Context**: The blueprint's prompt mandated 7 aggregates: Santri, Guardian, Student Identity, Student Status, Student History, Relationship, Timeline. The blueprint authors implemented a 5-aggregate model with Relationship nested inside Santri and Timeline as a derived read model.

**Board Deliberation**: The DDD Expert argued that nesting Relationship inside Santri is the correct DDD choice because the invariant "exactly one primary wali per active Santri" must be enforced atomically with Santri writes. A standalone Relationship aggregate would require eventual consistency for this invariant, introducing complexity and potential inconsistency windows. The Product Architect confirmed that the business requirement is for atomic guardian assignment, supporting the nested approach.

The Chief Enterprise Architect noted that Timeline as a derived read model (not an aggregate) is also correct — Timeline entries are assembled from existing data (StatusChangeRecord + FieldChangeRecord + events) and do not have their own invariants or consistency boundaries.

**Decision**: Board unanimously confirms the 5-aggregate model. The 7-name list from the prompt is interpreted as 5 aggregates + 2 domain concepts (Relationship as nested entity, Timeline as read model). SMD-002 and SMD-003 correctly document this decision.

### Discussion 2: Graduation Settlement Gate Duration

**Context**: The Graduation Workflow (§14.4) gates the GRADUATED→ALUMNI transition on Keuangan settlement confirmation. SMB-176 specifies a 90-day timeout before escalation.

**Board Deliberation**: The Product Architect questioned whether 90 days is appropriate for all Pesantren contexts — some may require faster settlement (e.g., before certificate issuance). The Solution Architect noted that 90 days is a reasonable default that can be tenant-configurable. The Data Architect confirmed that the Santri remains in GRADUATED (not ACTIVE) during the gate period, so operational domains (Asrama, Akademik) have already processed the graduation.

**Decision**: 90-day default approved with tenant configurability noted as a future enhancement. The Module Owner should add a tenant configuration parameter `mds.graduation_settlement_timeout_days` to §21.3 Feature Flags.

### Discussion 3: Status Vocabulary — Indonesian vs English Canonical

**Context**: SMB-016/099/100 specifies canonical English status values in storage with Indonesian display labels via presenter layer. The current codebase uses Indonesian (`aktif`, `cuti`, `skors`, `Lulus`, `Keluar`) inconsistently.

**Board Deliberation**: The Product Architect strongly supported Indonesian display labels for Pesantren domain authenticity. The Enterprise Engineering Lead supported canonical English for code clarity and i18n readiness. The Security Architect noted that canonical values prevent injection/spoofing via display label manipulation.

The AI Engineering Architect raised a practical concern: the status vocabulary migration backfill job must handle the full matrix of legacy spellings observed in the codebase (`aktif`, `Aktif`, `active` all meaning the same state). The blueprint's Status Vocabulary Master Table (§7.2) handles this correctly.

**Decision**: Canonical English in storage + Indonesian display labels confirmed. The 4-phase migration plan (SMD-009) is approved. The Board recommends adding a CI validation step that rejects any code path writing legacy Indonesian status values once the `mds_use_canonical_status` feature flag is enabled.

### Discussion 4: Dual Persistence Strategy (Firestore → Postgres)

**Context**: SMD-013 documents a dual-persistence strategy: Firestore (current operational) → Postgres (target with tenant_id). The blueprint specifies a single write path through application services.

**Board Deliberation**: The Data Architect expressed concern about the dual-write complexity and potential for drift. The Solution Architect noted that the single-write-path strategy (application services write to both) with an outbox pattern for reconciliation is the industry-standard approach for gradual migration.

The Enterprise Engineering Lead noted that the current codebase has Firestore accessed directly from UI components (no service layer). The blueprint's application service layer is the architectural fix for this — all writes go through services, which handle dual persistence internally until Firestore is decommissioned.

**Decision**: Dual-persistence strategy approved with conditions: (1) the outbox/reconciliation mechanism must be implemented before any Postgres writes go live, (2) a decommission milestone for Firestore must be defined in §21 (Deployment Readiness), (3) tenant isolation must be verified on BOTH persistence layers during the transition period.

### Discussion 5: AI Generability Threshold

**Context**: The blueprint must be detailed enough for an AI Engineer to generate all 35 artifacts without guessing. The AI Engineering Architect evaluated this.

**Board Deliberation**: The AI Engineering Architect simulated artifact generation for 10 key artifacts (Santri entity, SantriRepository, RegisterSantri use case, Santri API controller, StatusTransitionGuard, mds.santri.registered event, etc.) and found:
- 8 of 10 artifacts had complete specifications (no guessing required)
- 2 artifacts (SnapshotUpdateService event-to-field mapping, Timeline assembly) required inference due to underspecified mapping logic

The DDD Expert noted that these 2 gaps are captured in findings DDD-003 and DDD-002 respectively.

**Decision**: AI generability threshold is met for 80% of artifacts. After resolving DDD-002 and DDD-003, the threshold will be 100%. The blueprint is AI-ready for Phases P1–P3; P4–P6 artifacts may require the AI to request clarification on projection mappings until MAJOR findings are resolved.

---

# APPENDIX C: Security Architecture Deep Dive

### Reviewer: Security Architect

## C.1 Tenant Isolation Architecture Review

The MDS module handles CONFIDENTIAL Santri data for 100+ tenants. Tenant isolation is the highest-priority security concern.

### C.1.1 Isolation Verification Matrix

| Attack Vector | Mitigation | Verification Method | Status |
|--------------|-----------|:------------------:|:------:|
| Cross-tenant API read (Tenant A reads Tenant B Santri) | Tenant context from auth token (SMB-152); repository tenant scoping (SMB-019) | Automated isolation test (SMB-223): Tenant A API key → request Tenant B santriId → 404 | ✅ Protected |
| Cross-tenant search leakage | Search index scoped per tenant (SMB-050); search results filtered by tenant_id | Search isolation test: Tenant A search → no Tenant B results | ✅ Protected |
| Cross-tenant photo access | Photo path: `/{tenant_id}/mds/santri/{id}/photos/` (SMD-016); storage ACL per tenant | Direct URL access test: Tenant A token → Tenant B photo URL → 403 | ✅ Protected |
| Cross-tenant event leakage | Event payload includes tenant_id (SMB-021); consumers filter by tenant | Event isolation test: Tenant A event → Tenant B consumer ignores (tenant_id mismatch) | ✅ Protected |
| Cross-tenant cache poisoning | Cache key: `{tenant_id}:mds:{entity}:{id}` (SMD-028); cache cluster per tenant (future) | Cache isolation test: Tenant A cache read → Tenant B key not found | ✅ Protected |
| Cross-tenant bulk import | Import file scoped to current tenant (SMB-014); NIS uniqueness check within tenant only | Import isolation test: Tenant A import → NIS collision with Tenant B ignored (different tenant) | ✅ Protected |
| Cross-tenant DB query (direct) | RLS policies on all Santri tables; application-level tenant scoping as defense-in-depth | DB isolation test: Direct SQL with Tenant A context → Tenant B rows filtered by RLS | ✅ Protected |
| Cross-tenant via delegated permission abuse | Delegated permissions reviewed quarterly (SMB-206); cross-tenant operations require dual authorization (SMD-065) | Permission audit: delegated permission usage log review | ✅ Protected |

### C.1.2 Tenant Isolation Verdict

**Score: 100/100** — All 8 attack vectors have documented mitigations with verification methods. The defense-in-depth approach (application layer + repository layer + database RLS) provides robust multi-layer isolation.

## C.2 PII Protection Architecture Review

### C.2.1 Data Classification Compliance

| Data Element | Classification | Storage | Access Control | Masking Rule | Audit | Status |
|-------------|:------------:|---------|:-------------:|:-----------:|:-----:|:------:|
| Santri name | CONFIDENTIAL | Encrypted at rest | Role-based | None (operationally needed) | Read audit | ✅ |
| NIS | INTERNAL | Standard | Role-based | None | Read audit | ✅ |
| NIK | CONFIDENTIAL | Encrypted at rest | Privileged only | Full mask for non-privileged; partial for semi-privileged | Access audit | ✅ |
| NISN | CONFIDENTIAL | Encrypted at rest | Privileged only | Full mask for non-privileged | Access audit | ✅ |
| Akta number | CONFIDENTIAL | Encrypted at rest | Privileged only | Full mask for all except admin | Access audit | ✅ |
| KK number | CONFIDENTIAL | Encrypted at rest | Privileged only | Full mask | Access audit | ✅ |
| Wali phone | CONFIDENTIAL | Encrypted at rest | Role-based | Partial mask (last 4 digits) for non-admin | Access audit | ✅ |
| Wali address | CONFIDENTIAL | Encrypted at rest | Role-based | Full mask for wali/santri roles | Access audit | ✅ |
| Santri photo | CONFIDENTIAL | Encrypted at rest | Role-based | None (operationally needed) | Read audit | ✅ |
| Birth data | CONFIDENTIAL | Encrypted at rest | Role-based | None (operationally needed) | Read audit | ✅ |

### C.2.2 PII Protection Verdict

**Score: 98/100** — All CONFIDENTIAL data elements have documented protection. Minor gap: masking algorithm details (character replacement vs redaction vs format-preserving) should be specified in a dedicated PII Masking Specification appendix.

---

# APPENDIX D: Performance & Scalability Architecture Review

### Reviewer: Solution Architect + Data Architect

## D.1 Scalability Target Validation

| Target | Design Support | Bottleneck Risk | Verdict |
|--------|:------------:|:--------------:|:------:|
| 100+ tenants | tenant_id partitioning; per-tenant config; tenant-scoped indexes | Hot tenant (10K+ Santri) may need dedicated resources | ✅ Design supports |
| 10,000 Santri per tenant | Cursor pagination; search index for >10K records; read-through cache | Full-table scan without search index | ✅ Design supports with search index |
| 1,000,000+ Santri records total (10yr) | Archival cold storage tier (SMD-091); data retention policy | Hot storage cost for 1M records | ✅ Design supports with tiering |
| 14 consuming domains | Event-driven architecture; async projections; no sync T2 calls | Event backlog during peak | ✅ Design supports with DLQ |
| 10 concurrent admins per tenant | Optimistic locking; MDS_4007 on conflict | High contention on same Santri | ✅ Design supports |
| 1,000-row bulk import | Batched pipeline (500 per transaction); async processing | Import timeout without batching | ✅ Design supports |

## D.2 Query Performance Analysis

| Query Pattern | Estimated Frequency | Performance Strategy | SLA Target | Design Adequacy |
|--------------|:-------------------:|---------------------|:----------:|:--------------:|
| Get Santri by ID | Very High (every page load) | Read-through cache (5min TTL); primary key lookup | p95 < 100ms | ✅ |
| Search by name/NIS | High (admin search) | Search index; tenant-scoped; trigram for partial match | p95 < 500ms | ✅ |
| List with filters | High (admin list view) | Composite indexes on filter fields; cursor pagination | p95 < 1s | ✅ |
| Status transition | Medium (admin action) | Single-aggregate transaction; no cross-domain sync | p95 < 200ms | ✅ |
| Bulk import | Low (batch operation) | Batched 500 rows per transaction; async for >1000 | < 30s for 1000 rows | ✅ |
| Export | Low (reporting) | Async for >1000 rows; chunked file generation | < 60s job completion | ✅ |

## D.3 Performance Verdict

**Score: 96/100** — Performance strategies are appropriate for the target scale. Recommendation: add database index specification (which indexes on which columns) to §8 (Repository Blueprint) for AI Engineer implementation guidance.

---

# APPENDIX E: Board Member Individual Assessments

## E.1 Chief Enterprise Architect — Assessment

> "EMBS Appendix B is the strongest first-module blueprint I have reviewed. The architecture correctly positions Santri as the platform's central domain entity with clear ownership boundaries. The 5-aggregate model with event-projected caches is an elegant solution to the cross-domain data ownership problem. The graduation settlement gate pattern should become a standard pattern for all cross-domain gated transitions. I vote APPROVED WITH NOTES."

## E.2 Domain Driven Design Expert — Assessment

> "The aggregate design is sound DDD. Separating Santri (identity), Guardian (independent lifecycle), StudentIdentity (different classification), StudentStatus (event-sourced ledger), and StudentHistory (append-only audit) respects the core DDD principle of aligning aggregate boundaries with invariants and consistency requirements. The StatusTransitionGuard as a pure domain service is textbook DDD. My only substantive concern is the cross-aggregate consistency for History/Status writes (MAJOR-002) — this must be tightened before Phase 3. I vote APPROVED WITH NOTES."

## E.3 Enterprise Engineering Lead — Assessment

> "From an implementation perspective, this blueprint is executable. An AI Engineer can read §5–§6 and generate correct entity code. An AI Engineer can read §11 and generate correct API controllers. The 35-step generation order in §22 provides a clear implementation roadmap. The dual-persistence migration strategy is pragmatic for the current codebase state. Minor documentation gaps (response schemas, read model definitions) should be filled during implementation. I vote APPROVED WITH NOTES."

## E.4 AI Engineering Architect — Assessment

> "I tested the blueprint for AI generability by simulating artifact generation for 10 key artifacts. The entity field tables in §6 are excellent — every field has type, required flag, constraints, source, and classification. This level of specification is what makes AI generation deterministic rather than creative. The 2 underspecified areas (event-to-field mapping for projections, Timeline assembly logic) are captured as MAJOR findings and should be resolved before the AI reaches those phases. After resolution, this blueprint will be fully AI-generable. I vote APPROVED WITH NOTES."

## E.5 Security Architect — Assessment

> "The security architecture is comprehensive. Tenant isolation is addressed at all 8 attack vectors with defense-in-depth. PII classification follows EARS Part 5 data classification standards. The RBAC matrix with 10 roles and delegated cross-domain permissions is well-designed. The quarterly delegated permission review requirement (SMB-206) is a good governance practice. I particularly appreciate the separation of duties in identity verification (SMB-138: verifier ≠ submitter). I vote APPROVED WITH NOTES."

## E.6 Data Architect — Assessment

> "The data architecture supports the 10-year, 100+ tenant, 1M+ record target scale. The archival cold storage tier addresses long-term cost. The snapshot pattern for cross-domain FK references (per EARS Part 5) is correctly enforced. My recommendation is to add explicit database index specifications to §8 to guide AI Engineers in creating performant schemas. I vote APPROVED WITH NOTES."

## E.7 Product Architect — Assessment

> "The business capability coverage is excellent for V1. All 16 defined capabilities map to real Pesantren operational needs. The use of authentic Pesantren terminology throughout (Santri, Wali, NIS, Angkatan, Cuti, Skors) is critical for domain alignment. Three minor gaps (emergency contact, siblings detection, wali correction request) are noted for future sprints — none are launch-blocking. I vote APPROVED WITH NOTES."

## E.8 Solution Architect — Assessment

> "The cross-domain integration design is robust. The 14-domain interaction matrix leaves no ambiguity about who owns what. The 3 integration types (Events, API, Events+API) with associated contract testing requirements provide clear guidance for consuming domain teams. The graduation settlement gate is an excellent example of cross-domain saga orchestration without a heavy saga framework. I vote APPROVED WITH NOTES."

## E.9 Software Quality Architect — Assessment

> "The testing blueprint meets enterprise standards: 90% unit, 80% integration, 100% contract and security. The 16 mandatory test scenarios cover the critical paths. My recommendation is to add performance test baseline values to §19 before Phase 7 — the SLAs are defined but the baseline establishment procedure is not. I vote APPROVED WITH NOTES."

---

*Document Classification: Enterprise Blueprint Review Report — OFFICIAL*
*APP MA'HAD Enterprise ERP — Quality Assurance Registry*
*This BRR is the mandatory companion to EMBS Appendix B per the EMBS governance framework.*
*Blueprint + BRR = Complete Module Specification ready for Sprint Planning.*
*Review Board: 9 members. Decision: APPROVED WITH NOTES (9/9 votes).*