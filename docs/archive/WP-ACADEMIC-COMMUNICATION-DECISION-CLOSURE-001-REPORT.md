# WP-ACADEMIC-COMMUNICATION-DECISION-CLOSURE-001-REPORT

**Work Package ID**: `WP-ACADEMIC-COMMUNICATION-DECISION-CLOSURE-001`  
**Title**: EEOS Academic Domain Decision Closure — Academic Context, Calendar & Communication  
**Mode**: AUDIT / DECISION CLOSURE ONLY  
**Scope**: Academic Context Boundary + Academic Calendar + Unified Calendar Projection + Announcement CMS  
**Authority**: Product Owner Final Decision  
**Status**: STRICTLY DOMAIN DECISION CLOSURE (Zero Database / Schema / Code Mutations)  
**Date**: 2026-09-17  

---

## A. Executive Summary

This formal closure report marks the complete resolution and official locking of all open business and architectural decisions within the **Academic Context Boundary, Academic Calendar, Unified Calendar Projections, and Announcement CMS** domains of the APP MA'HAD SaaS platform.

Under the governance of the **EEOS Master Execution Law**, no technical schema design, migration script, repository method, or frontend interface may be implemented prior to explicit, unambiguous domain closure. Through a structured interview process, all open decisions (`DECISION-005` through `DECISION-012`) have been conclusively decided and authorized by the Product Owner.

### Core Architectural Theorem Closed:
$$\mathbf{Tenant} \xrightarrow{\quad\text{Contains}\quad} \mathbf{Madrasah\ (Academic\ Governance\ Boundary)} \xrightarrow{\quad\text{Owns}\quad} \left\{ \begin{array}{l} \mathbf{Academic\ Calendar\ (Independent)} \\ \mathbf{Academic\ Year\ \&\ Periods} \\ \mathbf{Announcement\ CMS\ (Independent)} \end{array} \right\}$$

### Final State Summary:
- **Academic Sovereignty**: Permanently established per Madrasah. No shared calendar state across institutions.
- **Unified Presentations**: "Agenda Saya" and "Pengumuman Saya" exist strictly as **presentation/projection layers** (read-time queries), guaranteeing zero data leakage or state coupling between madrasahs.
- **Communication Workflows**: Structured around two distinct archetypes (`INFORMATION` and `INVITATION`), with role-based autonomous publishing, waiting-list capacity management, authenticated guardian RSVPs, and decoupled WhatsApp broadcasting.
- **Domain Decisions**: **100% LOCKED**.
- **Next Engineering Gate**: Authorized to proceed to **Technical Schema Design & Migration Specification Review** (`WP-ACADEMIC-COMMUNICATION-SCHEMA-001`).

---

## B. Confirmed Architecture

The finalized, locked architecture establishes a clean separation between **Institutional Domain Ownership** and **Consolidated User Experience**:

```
+─────────────────────────────────────────────────────────────────────────+
|                                TENANT                                   |
|                      (Pondok Pesantren Foundation)                      |
+─────────────────────────────────────────────────────────────────────────+
        │                                                 │
        ▼                                                 ▼
+───────────────────────────+                     +───────────────────────────+
|       MADRASAH MTs        |                     |     MADRASAH TAHFIZH      |
| (Academic Boundary MTs)   |                     | (Academic Boundary TFZ)   |
+───────────────────────────+                     +───────────────────────────+
| • Sovereign Calendar      |                     | • Sovereign Calendar      |
| • Academic Year 2026/2027 |                     | • Academic Year 1447/1448 |
| • Independent Terms       |                     | • Independent Marhalah    |
| • Announcement CMS MTs    |                     | • Announcement CMS TFZ    |
+───────────────────────────+                     +───────────────────────────+
        │                                                 │
        └───────────────────────┬─────────────────────────┘
                                │
                                ▼  (Read-Time Projection / Presentation Layer)
+─────────────────────────────────────────────────────────────────────────+
|                       UNIFIED USER PROJECTIONS                          |
+─────────────────────────────────────────────────────────────────────────+
| 1. "AGENDA SAYA" (Unified Calendar View):                               |
|    • Aggregates events strictly from user's authorized memberships.     |
|    • Color-coded badges per Madrasah ([MTs], [Tahfizh]).                |
|    • Instant client-side filters (Semua Madrasah / MTs Saja / TFZ Saja).|
|                                                                         |
| 2. "PENGUMUMAN SAYA" (Unified Guardian/Teacher Feed):                   |
|    • Single chronological timeline sorted by published_at DESC.         |
|    • Color-coded badges and child relevance pills.                      |
|    • Filter pills per child/madrasah.                                   |
+─────────────────────────────────────────────────────────────────────────+
```

---

## C. Decision Register

The following register documents the authoritative decisions formally chosen and locked by the Product Owner:

| ID | Decision Area | Chosen Option | Description & Architectural Impact | Status | Authority |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **005** | **Calendar Ownership** | **Option A** | **Independent Calendar per Madrasah**: Each Madrasah owns its independent calendar, year lifecycle, terms, and events. Zero runtime coupling, zero cascade overrides. | **LOCKED** | Product Owner |
| **006** | **Unified Presentation** | **Option A** | **Unified Presentation / Projection**: Agenda Saya aggregates authorized madrasah events at read-time. It is strictly a projection layer, never a shared database table. | **LOCKED** | Product Owner |
| **007** | **Schema Direction** | **Option A** | **Madrasah-Aware Academic Context**: Academic entities (calendar, years, terms, announcements) must be scoped by `madrasah_id` with composite multi-tenant constraints. | **LOCKED** | Product Owner |
| **008** | **Approval Workflow** | **Option B** | **Role-Based Autonomous Publishing**: Kepala Madrasah and authorized PR/TU can publish directly; Teachers can publish autonomously to their assigned Rombel/Tingkat, while institutional announcements require approval. | **LOCKED** | Product Owner |
| **009** | **RSVP Capacity** | **Option B** | **Waiting List (Soft Cap)**: When invitation capacity is filled, subsequent respondents enter status `WAITING_LIST`. Prevents empty seats from no-shows and gives visibility into event demand. | **LOCKED** | Product Owner |
| **010** | **Wali RSVP Auth** | **Option A** | **Authenticated Portal**: Guardians must log into their verified Portal Wali account to confirm RSVPs. Guarantees absolute identity verification, auditability, and abuse prevention. | **LOCKED** | Product Owner |
| **011** | **WhatsApp Syndication** | **Option B** | **Decoupled Broadcast Module**: CMS publishes the announcement and generates a draft broadcast; review of quota, rate limits, and dispatch is executed in the Broadcast module to prevent catastrophic mass-spam. | **LOCKED** | Product Owner |
| **012** | **Parent Multi-Child Feed**| **Option A** | **Unified Chronological Feed**: Single chronological feed with prominent Madrasah/Child badges and quick filter pills. Delivers optimal mobile-first UX without siloed tab friction. | **LOCKED** | Product Owner |

---

## D. Confirmed Business Rules

1. **Academic Sovereignty Invariant**:  
   A Madrasah is an autonomous academic governing body. Data and lifecycle events belonging to Madrasah A (gradebooks, ranking, calendar events, circulars) never bleed into or affect Madrasah B.
2. **Tripartite User Modeling**:  
   $$\mathbf{User\ Identity} \quad \neq \quad \mathbf{Academic\ Membership} \quad \neq \quad \mathbf{Academic\ Assignment}$$  
   Users (teachers and students) maintain a single global identity under the tenant, but hold distinct, independent academic memberships across one or more madrasahs.
3. **Multi-Madrasah Student & Teacher Sovereignty**:
   - A student can be enrolled concurrently in Madrasah MTs (Tingkat 2) and Madrasah Tahfizh (Tingkat 1). Progression, grading, transcripts, and report cards remain completely independent.
   - A teacher can teach in Madrasah MTs and Madrasah MA with different subject assignments and homeroom duties.
4. **Announcement Independence**:  
   Academic announcements are owned strictly by the originating Madrasah (`madrasah_id`). Tenant-level announcements are restricted to infrastructure/maintenance banners.
5. **Decoupling of Announcement from Calendar Event**:  
   An announcement is an editorial broadcast; a calendar event is a structural temporal marker. An announcement may optionally reference an `academic_event_id`, but deleting or editing an announcement has zero effect on the underlying calendar event.
6. **Dual Content Archetypes**:
   - **`INFORMATION`**: Content-centric circulars, policy updates, schedules, and achievements.
   - **`INVITATION`**: Event-centric invitations with specific dates, commencement times, venue/meeting links, and optional RSVP tracking.

---

## E. Security Invariants

The platform enforces the following uncompromisable security boundaries:

1. **The Zero-Bleed Calendar Invariant**:  
   Querying calendar events or unified agendas can **never** return records from a Madrasah where the authenticated user holds zero active academic memberships.
2. **The Non-Persistent Projection Invariant**:  
   Consolidated views ("Agenda Saya" and "Pengumuman Saya") exist exclusively in client presentation memory or server query responses. They are **never stored as unified/shared rows** in the database.
3. **Double-Lock Database Scoping**:  
   All database operations for academic calendars, announcements, and invitations must enforce the composite tenant and institutional predicate:
   $$\mathbf{WHERE\ tenant\_id = :tenantId\ AND\ madrasah\_id = :activeMadrasahId}$$
4. **Authenticated RSVP Guarantee**:  
   Per `DECISION-010`, anonymous or unauthenticated RSVP submissions are rejected. The submitting actor must be authenticated via their verified Supabase Auth session as an authorized guardian of a student in that Madrasah.
5. **GSAP Presentation Isolation**:  
   GSAP (GreenSock) is restricted 100% to presentation-layer visual enhancements (scroll reveals, staggered card entrances). Business validation, authorization checks, and publishing state transitions are strictly forbidden inside animation callbacks.

---

## F. Context Isolation Rules

To prevent accidental cross-madrasah data contamination during active user sessions:

```
[ Active Session ]
       │
       ▼
[ Active Context State: { tenantId, activeMadrasahId, activeAcademicYearId } ]
       │
       ├─► Navigation / UI Context: Updates breadcrumbs, active branding, and active tab.
       │
       ├─► Backend API Requests: Automatically injects x-madrasah-id header.
       │
       └─► Database Layer: Query builders bind madrasahId to all SELECT, INSERT, UPDATE predicates.
```

- When an administrator switches context from *MTs* to *Tahfizh*, client-side caches for announcements and rosters are immediately cleared and re-fetched against the new context.
- Target audience selection within the announcement CMS (e.g., selecting specific Rombels or Tingkats) is physically constrained to entities matching `activeMadrasahId`.

---

## G. Cross-Domain Impact Matrix

| Subsystem | Impact of Closed Decisions | Governing Actor |
| :--- | :--- | :--- |
| **Academic Calendar** | Independent per Madrasah (`DECISION-005`). No shared synchronization. | Kepala Madrasah / TU |
| **Personal Agenda** | Aggregated presentation query ("Agenda Saya") with color badges (`DECISION-006`). | Authenticated User |
| **Announcement CMS** | Scoped to Madrasah. Supports `INFORMATION` and `INVITATION`. | Humas / Kepala Madrasah |
| **Publishing Pipeline** | Role-based autonomy: Rombel announcements direct; Madrasah-wide via approval (`DECISION-008`). | Guru / Kepala Madrasah |
| **Event Logistics & RSVP**| Waiting-list support on capacity overflow (`DECISION-009`); verified portal login (`DECISION-010`). | Wali Santri / Panitia |
| **Communication Gateway**| Broadcast decoupled from publishing (`DECISION-011`). Drafts reviewed before dispatch. | Tim Broadcast / TU |
| **Guardian Mobile Feed** | Unified chronological timeline with child/madrasah badges and quick filters (`DECISION-012`). | Wali Santri |
| **Placement & Transit** | Transit pools remain strictly scoped to Madrasah Tingkat. Unaffected by calendar events. | Kurikulum |

---

## H. Deferred Decisions & Future Work

No open decisions remain within the scope of this Work Package. All 8 decisions are fully locked.

The following downstream items are acknowledged as future operational concerns:
1. **Automated Reminder Cron**: Triggering automated push notifications 24 hours prior to an invitation's event start time (deferred to Notification Engine WP).
2. **Waiting List Promotion Algorithm**: Automatic vs. manual promotion of respondents from waiting list to confirmed when a seat opens (deferred to Event Operations WP).
3. **Public Portal Custom Domains**: Subdomain mapping per Madrasah (e.g., `mts.pesantrendarussalam.id`) (deferred to SaaS Infrastructure WP).

---

## FINAL DOMAIN VERDICT & EEOS STATUS

All business rules, architectural principles, domain state machines, and decision options for **Academic Context, Calendar Sovereignty, Unified Agenda Projections, and Announcement CMS** have been formally audited, resolved, and locked.

```text
================================================================================
EEOS FINAL GATEWAY STATUS:

DECISION CLOSURE: COMPLETE (Decisions 005 through 012 are 100% LOCKED)

DOMAIN ARCHITECTURE STATUS:
[ ] INCOMPLETE
[ ] BLOCKED — OPEN DECISIONS
[ ] READY FOR PRODUCT OWNER REVIEW
[x] DOMAIN ARCHITECTURE LOCKED

SCHEMA STATUS:
NOT STARTED

MIGRATION STATUS:
NOT AUTHORIZED

CODING / IMPLEMENTATION STATUS:
NOT AUTHORIZED

NEXT GATE:
DOMAIN → TECHNICAL SCHEMA DESIGN & SPECIFICATION REVIEW (WP-ACADEMIC-COMMUNICATION-SCHEMA-001)

NEXT AUTHORITY:
PRODUCT OWNER
================================================================================
```
