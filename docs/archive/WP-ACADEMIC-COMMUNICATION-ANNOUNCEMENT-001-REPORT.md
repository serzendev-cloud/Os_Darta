# WP-ACADEMIC-COMMUNICATION-ANNOUNCEMENT-001-REPORT

**Work Package ID**: `WP-ACADEMIC-COMMUNICATION-ANNOUNCEMENT-001`  
**Title**: Madrasah Calendar View & Announcement CMS — Domain Architecture Refinement  
**Mode**: DOMAIN ARCHITECTURE REFINEMENT ONLY  
**Authority**: Product Owner / Business Owner  
**Date**: 2026-09-15  
**Prerequisite Foundation**: `WP-ACADEMIC-STRUCTURE-CLOSURE-001`, `WP-ACADEMIC-PLACEMENT-DOMAIN-DECISION-001`, `WP-ACADEMIC-PLACEMENT-DOMAIN-REFINEMENT-002`, `WP-ACADEMIC-CONTEXT-BOUNDARY-001`  
**Status**: STRICTLY DOMAIN DECISION ONLY (Zero Database / Schema / Code Mutations)  

---

## 1. Executive Summary

This work package establishes the authoritative domain architecture for **Academic Calendars**, **Unified Calendar Projections**, and the **Madrasah Announcement & Publication CMS** within the APP MA'HAD SaaS platform.

Building directly upon the locked foundation of `WP-ACADEMIC-CONTEXT-BOUNDARY-001`, this document formalizes that **Madrasah is the sovereign owner of both its Academic Calendar and its official Announcement CMS**.

### Fundamental Architectural Tenet:
> **Domain Ownership is strictly independent per Madrasah.**  
> **User Presentation can be unified across authorized Madrasahs.**  
> **Authorization is always enforced per Madrasah.**

### Key Decisions Locked in this Refinement:
1. **Academic Calendar Sovereignty Formally Locked (`OPEN-DECISION-005 = OPTION A`)**:
   As directed by the Product Owner, every Madrasah operates its own completely independent Academic Calendar. The platform strictly rejects master campus calendars, runtime inheritance, and cascade date overrides.
2. **Unified Calendar View ("Agenda Saya") as a Projection**:
   Users active across multiple Madrasahs (e.g., Ustaz Abdullah who teaches in MTs and Tahfizh) are provided with an integrated schedule view. This is strictly a **Presentation / Projection Layer** (query-time aggregation) and **never** a shared database entity.
3. **Madrasah Announcement CMS**:
   Each Madrasah manages its own communication engine for broadcasting news, circulars, and invitations. Announcements are owned by the Madrasah, scoped to targeted audiences, and published through a formal editorial lifecycle.
4. **Distinct Content Types**:
   The CMS recognizes two primary archetypes: **`INFORMATION`** (content-centric updates, policy notices, circulars) and **`INVITATION`** (event-centric notices with date, location, agenda, and optional RSVP).
5. **Decoupling Announcement from Calendar Event**:
   An announcement is **not** a calendar event. An announcement may reference or promote a calendar event, but both entities maintain separate domain identities, lifecycles, and data structures.
6. **GSAP Presentation Boundary**:
   GSAP is codified strictly as an interaction/presentation layer tool for mobile-first editorial elegance. It is prohibited from housing business rules, state transitions, or publishing logic.

---

## 2. Existing Architecture Context & Codebase Forensic Trace

Inspection of the existing repository confirms that the communication and calendar domains currently exist as pure placeholders or prototype stubs:

```text
CURRENT IMPLEMENTATION TRACE:
1. Calendar Module:
   File: src/app/dashboard/kalender-akademik/page.tsx
   State: Pure placeholder ("Modul Kalender Akademik — Coming Soon").
   Finding: Clean slate. Zero legacy schema locks or active business dependencies.

2. Announcement Module:
   File: src/app/dashboard/pengumuman/page.tsx
   State: Pure placeholder ("Modul Pengumuman — Coming Soon").
   Finding: Clean slate. Zero conflicting database tables.

3. Global Broadcast Prototype:
   File: src/app/dashboard/saas/pengaturan-global/page.tsx
   State: Global SaaS tenant notification banner ("Pengumuman Global Siaran").
   Distinction: This is a system-wide maintenance/emergency banner for SaaS operators,
   completely distinct from Madrasah Academic Announcements.

4. Permission Definitions:
   Files: src/config/permissions.ts & src/lib/authz/canonical-permissions.ts
   Codes: VIEW_PENGUMUMAN ('view_pengumuman'), MANAGE_NOTIFIKASI ('manage_notifikasi').
   Finding: Permissions exist at the string constant level, ready to be scoped by madrasah_id.
```

---

## 3. Business Rules (Locked by Product Owner)

The following core rules are locked as architectural law:

1. **Madrasah is the Academic Governance Boundary**: Madrasah has sole sovereignty over its academic calendar, academic periods, curriculum, courses, placements, gradebooks, transcripts, and official announcements.
2. **Calendar Independence**: $1\ \text{Tenant} \neq 1\ \text{Academic Calendar}$. Each Madrasah possesses its own calendar, independent start/end dates, exam windows, holiday schedules, and academic events.
3. **Product Owner Choice on Calendar Model**: `OPEN-DECISION-005` is locked as **OPTION A**. There is no runtime coupling between madrasah calendars. If two madrasahs share a holiday (e.g., 17 August or 1 Syawal), both independently author their own event.
4. **Unified Calendar View is a Presentation Projection**: Aggregation across multiple madrasahs is performed strictly at the read/presentation layer for authenticated users. The underlying data remains strictly partitioned.
5. **Announcement Ownership**: Every announcement is owned by a Madrasah (`madrasah_id`). The platform rejects global tenant announcements as the source of academic communications.
6. **Separation of Concerns**: Announcement $\neq$ Academic Calendar Event.
7. **Animation Isolation**: GSAP is an aesthetic and UX interaction enhancement tool, completely separated from domain and business logic.

---

## 4. Academic Calendar Sovereignty

Under **OPTION A**, the Academic Calendar domain is modeled with absolute institutional sovereignty:

```
+─────────────────────────────────────────────────────────────────────────+
|                                TENANT                                   |
+─────────────────────────────────────────────────────────────────────────+
        │                                                 │
        ▼                                                 ▼
+───────────────────────────+                     +───────────────────────────+
|       MADRASAH MTs        |                     |     MADRASAH TAHFIZH      |
+───────────────────────────+                     +───────────────────────────+
        │                                                 │
        ▼                                                 ▼
+───────────────────────────+                     +───────────────────────────+
|   ACADEMIC CALENDAR MTs   |                     | ACADEMIC CALENDAR TAHFIZH |
+───────────────────────────+                     +───────────────────────────+
| • TA 2026/2027            |                     | • TA 1447/1448 H          |
| • Semester 1: Jul–Des     |                     | • Marhalah 1: Syawal–Zulq |
| • Ujian PTS MTs: Okt 2026 |                     | • Tasmi' Akbar: Sya'ban   |
| • Libur Semester MTs      |                     | • Libur Ramadhan Tahfizh  |
+───────────────────────────+                     +───────────────────────────+
```

### Invariants of Calendar Sovereignty:
- **Zero Runtime Synchronization**: Modifying or rescheduling an exam in Madrasah MTs never fires triggers, cascades, or locks against Madrasah Tahfizh.
- **Independent Academic Cycles**: Madrasahs can run Gregorian (Juli–Juni) or Hijri (Syawal–Ramadhan) cycles concurrently within the same tenant.
- **Independent Event Catalog**: Each Madrasah manages its own events (`academic_events`) tied to its own academic year and period.

---

## 5. Unified Calendar View ("Agenda Saya")

While calendar ownership is strictly partitioned, a user holding active memberships across multiple madrasahs requires a consolidated personal schedule.

### 5.1 Conceptual Architecture (Projection Layer)
The **Unified Calendar View ("Agenda Saya")** is an ephemeral, read-only projection:

$$\mathbf{AgendaSaya}(\text{UserID}) = \bigcup_{m \in \mathbf{AuthorizedMemberships}(\text{UserID})} \mathbf{QueryEvents}(m,\; \text{DateRange})$$

```
[ User: Ustaz Abdullah ]
├── Membership 1: Madrasah MTs
└── Membership 2: Madrasah Tahfizh

                 DATABASE QUERIES (Parallel / Scoped)
                 ├── SELECT FROM events WHERE madrasah_id = 'mts'
                 └── SELECT FROM events WHERE madrasah_id = 'tahfizh'
                                      │
                                      ▼
                        UNIFIED CALENDAR PROJECTION
                     (In-Memory Merge & Sort by Date)
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ AGENDA SAYA — September 2026                                            │
│                                                                         │
│ 15 Sep  08:00 - 10:00  Ujian Bahasa Arab     [MTs]      ● Biru          │
│ 16 Sep  06:00 - 08:00  Tasmi' Al-Qur'an      [Tahfizh]  ● Hijau         │
│ 18 Sep  13:00 - 15:00  Rapat Dewan Asatidz   [MTs]      ● Biru          │
│ 19 Sep  09:00 - 11:00  Evaluasi Halaqah      [Tahfizh]  ● Hijau         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Interactive Filter Matrix
The user interface must provide instantaneous client-side context toggles:
- **Mode 1: `ALL` (Semua Madrasah)** — Default view merging all authorized madrasahs.
- **Mode 2: `SINGLE CONTEXT` (Konteks Tunggal)** — Filters view to display only events from one chosen Madrasah (e.g., `MTs Saja`).
- **Mode 3: `CATEGORY FILTER`** — Filters by event classification (e.g., *Hanya Ujian*, *Hanya Libur*, *Hanya Pertemuan*).

---

## 6. Calendar Access & Security Invariants

The Unified Calendar View must strictly adhere to the following security invariants:

1. **The Zero-Bleed Invariant**:
   A user can **never** see calendar events from a Madrasah where they hold zero active academic memberships.
2. **The Non-Persistent Projection Invariant**:
   The merged calendar projection exists purely in presentation memory (React state / server response). It is **never stored** in the database as a "shared calendar" entity.
3. **Audience-Aware Event Visibility**:
   Within an authorized Madrasah, events are filtered by role:
   - `PUBLIC_ACADEMIC`: Visible to teachers, students, parents, and public portal.
   - `TEACHER_INTERNAL`: Visible only to users with teacher memberships (e.g., Rapat Kurikulum).
   - `EXAM_SCHEDULE`: Visible to teachers and students of relevant Tingkat/Rombel.

---

## 7. Announcement Domain & Institutional Ownership

The **Madrasah Announcement CMS** is the authoritative broadcast vehicle for an educational institution.

### 7.1 Structural Hierarchy:
```
TENANT (Pondok Pesantren)
  │
  ├── MADRASAH MTs
  │     └── ANNOUNCEMENT CMS (MTs News, Circulars, Exam Notices, Event Invites)
  │
  ├── MADRASAH MA
  │     └── ANNOUNCEMENT CMS (MA News, University Prep Notices, Invites)
  │
  └── MADRASAH TAHFIZH
        └── ANNOUNCEMENT CMS (Tasmi' Announcements, Halaqah Schedules)
```

### 7.2 Anti-Pattern Rejection:
- Academic announcements belong strictly to the **Madrasah**.
- A "Global Tenant Announcement" table as the primary source of academic communication is officially rejected as an anti-pattern. Global tenant announcements are restricted exclusively to infrastructure/maintenance banners.

---

## 8. Announcement Types: Information vs. Invitation

To serve the dual needs of institutional notification and formal event gathering, the CMS categorizes all content into two distinct domain archetypes:

```
                           MADRASAH ANNOUNCEMENT
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       TYPE: INFORMATION                       TYPE: INVITATION
  (Pemberitahuan / Berita / Edaran)     (Undangan Kegiatan / Pertemuan)
```

| Dimension | Type: `INFORMATION` | Type: `INVITATION` |
| :--- | :--- | :--- |
| **Core Objective** | Disseminating knowledge, policy updates, schedules, guidelines, or achievements. | Convening a physical or virtual gathering requiring attendance and logistics. |
| **Temporal Anchor** | Publication Date & optional Expiration Date. | Specific Event Date, Start Time, and End Time. |
| **Locational Anchor** | None (Informational). | Physical Venue, Room, or Virtual Meeting URL. |
| **Audience Action** | Read, download attachments, follow links, acknowledge receipt. | Attend, calendar sync, RSVP confirmation. |
| **Logistics / Quota** | Unlimited readers. | Venue capacity, seat limits, guest count. |

---

## 9. Information Content Model

The `INFORMATION` archetype is structured for rich editorial communication:

### 9.1 Field Specifications:
| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Required | Unique surrogate primary key. |
| `tenant_id` | Text | Required | SaaS tenant isolation boundary. |
| `madrasah_id` | Text | Required | Authoritative institutional owner. |
| `type` | Enum | Required | Fixed value: `'INFORMATION'`. |
| `title` | Text | Required | Headline (e.g., *"Pemberitahuan Pelaksanaan Penilaian Akhir Semester Ganjil"*). |
| `slug` | Text | Required | URL-safe identifier unique per Madrasah for public publication. |
| `summary` | Text | Required | Concise abstract for notification feeds, mobile push, and cards. |
| `body` | JSONB / Text | Required | Structured rich text / block content of the announcement. |
| `cover_image_url` | Text | Optional | Featured banner image for editorial presentation. |
| `gallery_urls` | Text[] | Optional | Supplementary photo gallery. |
| `attachments` | JSONB | Optional | Array of downloadable PDFs, official letters (*Surat Edaran*), forms. |
| `cta_label` | Text | Optional | Action button text (e.g., *"Unduh Surat Edaran PDF"*). |
| `cta_url` | Text | Optional | Target URL of action button. |
| `published_at` | Timestamp | Conditional | Set when status transitions to `'PUBLISHED'`. |
| `expires_at` | Timestamp | Optional | Automated archival threshold. |

---

## 10. Invitation Content Model

The `INVITATION` archetype encompasses all attributes of `INFORMATION` plus rigorous logistical and RSVP parameters:

### 10.1 Additional Field Specifications:
| Field | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `event_date` | Date | Required | Calendar date of the event (e.g., `2026-10-25`). |
| `start_time` | Time | Required | Commencement time (e.g., `08:30:00`). |
| `end_time` | Time | Optional | Concluding time (or null if open-ended). |
| `location_type` | Enum | Required | `'OFFLINE'`, `'ONLINE'`, or `'HYBRID'`. |
| `venue_name` | Text | Conditional | Required if offline/hybrid (e.g., *"Aula Utama Kampus Putri"*). |
| `meeting_url` | Text | Conditional | Required if online/hybrid (e.g., Zoom/Google Meet link). |
| `dress_code` | Text | Optional | Recommended attire (e.g., *"Baju Koko Putih / Gamis Syar'i"*). |
| `contact_person` | Text | Optional | Name and WhatsApp contact of committee coordinator. |
| `rsvp_required` | Boolean | Required | Flag determining whether attendance confirmation is tracked. |
| `rsvp_deadline` | Timestamp | Conditional | Required if `rsvp_required = true`. |
| `capacity_limit` | Integer | Optional | Maximum attendees permitted. |
| `calendar_event_id`| Text | Optional | Reference to an existing Academic Calendar Event. |

---

## 11. Target Audience Modeling

To prevent information overload and preserve institutional privacy, announcements are targeted to specific cohorts within the Madrasah:

```
[ ANNOUNCEMENT CREATION ]
          │
          ▼
   SELECT AUDIENCE
          │
          ├── ALL_MADRASAH          (Seluruh civitas akademika madrasah)
          ├── TEACHERS_ONLY         (Seluruh guru & asatidz madrasah)
          ├── STUDENTS_ONLY         (Seluruh santri aktif madrasah)
          ├── PARENTS_ONLY          (Seluruh wali santri madrasah)
          ├── HOMEROOM_TEACHERS     (Khusus wali kelas madrasah)
          ├── SPECIFIC_GRADE        (Santri & wali pada Tingkat tertentu)
          └── SPECIFIC_ROMBEL       (Santri & wali pada Rombel tertentu)
```

### Audience Scoping Invariant:
- When an author selects `SPECIFIC_GRADE` or `SPECIFIC_ROMBEL`, the options presented in the UI and validated by the backend are **strictly restricted to Tingkats and Rombels belonging to that author's Madrasah**. A teacher in Madrasah MTs can never broadcast an announcement to a Rombel in Madrasah MA.

---

## 12. Visibility States

Every announcement carries an explicit visibility classification:

1. **`INTERNAL`**:
   Accessible **only** to authenticated users who hold an active academic membership in that Madrasah matching the target audience. Hidden from public portals and unauthenticated visitors.
2. **`PUBLIC`**:
   Eligible for syndication on the public web portal of that Madrasah (e.g., announcements of public seminars, haflah graduations, or holiday notices).
3. **`PRIVATE_DRAFT`**:
   Restricted strictly to the author and designated editorial approvers prior to publication.

---

## 13. Publishing Lifecycle

Announcements progress through a deterministic lifecycle state machine:

```
                  [ Author drafts announcement ]
                               │
                               ▼
                         ┌───────────┐
                         │   DRAFT   │
                         └─────┬─────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
       (Requires Approval)             (Direct Publish)
                │                             │
                ▼                             ▼
       ┌─────────────────┐             ┌───────────┐
       │PENDING_APPROVAL │             │ PUBLISHED │◄────────────┐
       └────────┬────────┘             └─────┬─────┘             │
                │                            │                   │
         ┌──────┴──────┐                     │              (Auto-Publish)
         │             │                     │                   │
     (Reject)      (Approve)                 │                   │
         │             │                     │                   │
         ▼             ▼                     │                   │
   ┌───────────┐ ┌───────────┐               │             ┌───────────┐
   │ REJECTED  │ │ SCHEDULED │───────────────┼────────────►│ SCHEDULED │
   └───────────┘ └───────────┘               │             └───────────┘
                                             │
                                     (Archive / Expire)
                                             │
                                             ▼
                                       ┌───────────┐
                                       │ ARCHIVED  │
                                       └───────────┘
```

### Lifecycle States:
- **`DRAFT`**: Work in progress. Editable only by author and editors.
- **`PENDING_APPROVAL`**: Submitted for review by the Kepala Madrasah or Head of Public Relations (see `OPEN-DECISION-008`).
- **`SCHEDULED`**: Approved with a future publication timestamp. Automatically becomes active when the clock reaches `published_at`.
- **`PUBLISHED`**: Actively broadcast across feeds, notifications, and public portals.
- **`ARCHIVED`**: Preserved for historical audit, but removed from active mobile feeds.
- **`CANCELLED` / `REJECTED`**: Voided prior to publication.

---

## 14. CMS Content Model & Editor Strategy

### 14.1 Editorial Format Recommendation: Structured Hybrid Block Model
The platform recommends a **Structured Hybrid Block Model** rather than an unrestricted raw HTML WYSIWYG editor.

**Why Raw HTML WYSIWYG is Rejected**:
- Injects arbitrary HTML, inline CSS, and broken tags that ruin mobile responsiveness.
- Poses Cross-Site Scripting (XSS) risks.
- Breaks native mobile app rendering.

**Structured Block Specification**:
The announcement body is stored as an array of semantic JSON blocks:
```json
[
  { "type": "paragraph", "content": "Diberitahukan kepada seluruh wali santri..." },
  { "type": "callout", "variant": "warning", "title": "Penting", "content": "Batas akhir registrasi..." },
  { "type": "image", "url": "https://...", "caption": "Denah Lokasi Ujian" },
  { "type": "attachment", "fileUrl": "https://...", "fileName": "Surat_Edaran_001.pdf", "fileSize": "1.2 MB" },
  { "type": "cta_button", "label": "Konfirmasi Kehadiran", "actionUrl": "https://..." }
]
```
This guarantees flawless, responsive rendering on iOS, Android, and web without layout degradation.

---

## 15. Public Publication Experience

When an announcement is marked `visibility = 'PUBLIC'`, the CMS must render an elegant, institutional-grade editorial page.

### 15.1 UX & Editorial Benchmarks (Inspiration from Modern Education Portals):
Referencing modern editorial patterns (such as `sekolahsabilillah.sch.id/ospis2026` as an experience benchmark):
- **Hero Banner**: High-resolution cover image with prominent institutional badge (`Madrasah Tsanawiyah Darussalam`), publication date, and reading time.
- **Clear Information Architecture**: Distinct visual blocks for event metadata (Date, Time, Venue, Google Maps link).
- **Sticky / Accessible Action Bar**: Mobile-bottom action bar providing immediate access to *"Unduh Surat Edaran PDF"* or *"Isi Formulir Kehadiran (RSVP)"*.
- **Author & Sign-off Provenance**: Formal digital signature block displaying Kepala Madrasah credentials and official stamp.

---

## 16. GSAP Presentation Boundary

GSAP (GreenSock Animation Platform) is officially classified as a **Client-Side Presentation & Interaction Enhancement Tool**.

```
+─────────────────────────────────────────────────────────────────────────+
|                           DOMAIN / BUSINESS                             |
|          (PostgreSQL, Drizzle ORM, Next.js Server Components)           |
|                                                                         |
|  * Authorization, State Machines, Data Queries, RLS, Integrity          |
|  * ZERO DEPENDENCY ON GSAP                                              |
+─────────────────────────────────────────────────────────────────────────+
                                    │
                                    ▼
+─────────────────────────────────────────────────────────────────────────+
|                     PRESENTATION / INTERACTION LAYER                    |
|                        (React Client Components)                        |
|                                                                         |
|  * GSAP ScrollTrigger: Editorial card reveals, smooth hero headers      |
|  * GSAP Stagger: Polished entrance of calendar event lists              |
|  * Micro-interactions: RSVP button click states, drawer reveals         |
+─────────────────────────────────────────────────────────────────────────+
```

### Strict GSAP Architectural Invariants:
1. **No Business Logic in Animations**: GSAP tweens and timelines must **never** govern whether an announcement is published, authorized, or visible.
2. **Progressive Enhancement**: If GSAP fails to load or JavaScript is limited, the entire publication page must remain $100\%$ readable and functional as standard HTML/CSS.
3. **Accessibility First (`prefers-reduced-motion`)**: All GSAP animations must immediately disable or collapse to instant transitions when a user has enabled reduced motion preferences.
4. **Mobile Performance**: Heavy scroll hijacks or CPU-intensive canvas animations are prohibited on mobile viewports.

---

## 17. Multi-Madrasah User Communication Experience

For users operating across multiple institutions, the communication portal offers a unified personal experience:

```
[ User: Bu Aisyah (Wali Santri) ]
├── Anak 1: Farhan (Madrasah MTs)
└── Anak 2: Maryam (Madrasah MA)

                 UNIFIED FEED: "PENGUMUMAN SAYA"
┌─────────────────────────────────────────────────────────────────────────┐
│ Filter: [ Semua Madrasah ▼ ]  [ Belum Dibaca ]                          │
├─────────────────────────────────────────────────────────────────────────┤
│ [MTs]  Pemberitahuan Ujian Akhir Semester Ganjil        ● 2 jam lalu    │
│        Wajib dibawa: Kartu Peserta Ujian & Alat Tulis                   │
├─────────────────────────────────────────────────────────────────────────┤
│ [MA]   Undangan Rapat Orang Tua Kelas 12 (Persiapan PTN)● Kemarin       │
│        Sabtu, 28 Okt 2026 | Aula MA Lt. 2 | [RSVP: Hadir]               │
└─────────────────────────────────────────────────────────────────────────┘
```

- Each card is clearly tagged with its originating Madrasah badge (`[MTs]` or `[MA]`).
- Tapping an announcement opens the full editorial view scoped strictly to that Madrasah's branding.

---

## 18. Authorization & Cross-Madrasah Isolation

### 18.1 Role-Based Access Control (RBAC) Matrix:
| Role within Madrasah | Create Draft | Edit Own Draft | Edit Others' Draft | Publish / Schedule | Delete / Archive |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Kepala Madrasah** | Yes | Yes | Yes | Yes | Yes |
| **Staf Tata Usaha / PR** | Yes | Yes | Conditional | Yes (or via approval) | Yes |
| **Guru / Asatidz** | Yes | Yes | No | No (Requires approval) | No |
| **Santri / Wali** | No | No | No | No | No |

### 18.2 Data Isolation Invariant:
All database queries for announcements, audiences, and RSVPs must enforce the double-lock predicate:
$$\text{Query Predicate: } \mathbf{WHERE\ tenant\_id = :tenantId\ AND\ madrasah\_id = :activeMadrasahId}$$

---

## 19. Calendar vs. Announcement Relationship

To prevent conceptual confusion, the distinction between an **Academic Calendar Event** and an **Announcement** is locked:

```
+─────────────────────────────────────────+     +─────────────────────────────────────────+
|          ACADEMIC CALENDAR EVENT        |     |         ANNOUNCEMENT / INVITATION       |
+─────────────────────────────────────────+     +─────────────────────────────────────────+
| • Temporal marker on academic schedule  |     | • Rich editorial broadcast to community |
| • Owned by Academic Calendar            |     | • Owned by Announcement CMS             |
| • Example: "Ujian Akhir Semester Genap" |     | • Example: "Pengumuman Teknis PAS Genap"|
| • Start/End Date, Event Type, Term ID   |     | • Body text, attachments, RSVP, covers  |
| • Target: Structural Academic Planning  |     | • Target: Human Engagement & Logistics  |
+─────────────────────────────────────────+     +─────────────────────────────────────────+
                     │                                               │
                     └────────────────── [ Optional ] ───────────────┘
                                     announcement references
                                        calendar_event_id
```

- An Announcement **MAY** reference an `academic_event_id` to display an official calendar badge or add-to-calendar action.
- A Calendar Event **NEVER** requires an announcement.
- Modifying or deleting an announcement **NEVER** deletes the underlying calendar event.

---

## 20. Cross-Domain Impact Matrix

| Subsystem | Impact of Calendar & Announcement Architecture |
| :--- | :--- |
| **Global Navbar** | Displays Madrasah Context Switcher. Switching madrasah updates the active calendar and announcement feed. |
| **Dashboard** | Embeds two primary widgets: *"Agenda Saya"* (merged calendar) and *"Pengumuman Terbaru"* (scoped feed). |
| **Teacher Portal** | Teachers view deadlines from their authorized madrasahs and author announcement drafts. |
| **Parent Portal (Wali)** | Parents receive announcements filtered to their children's respective madrasahs and RSVP to invitations. |
| **Notification Center** | Publishing an announcement dispatches targeted mobile push notifications / WhatsApp alerts. |
| **Public Landing Page** | Public announcements are syndicated to each Madrasah's public portal (`/m/:slug/announcements`). |

---

## 21. Anti-Patterns (FORMALLY REJECTED)

The following 8 anti-patterns are strictly prohibited:

| ID | Anti-Pattern Name | Violation Description | Architectural Remedy |
| :--- | :--- | :--- | :--- |
| **AP-A1** | **Global Tenant Announcement** | Publishing academic announcements globally at the tenant level without madrasah scoping. | Announcements must be owned by `madrasah_id`. |
| **AP-A2** | **Un-owned Announcements** | Creating announcements without an authoritative Madrasah owner. | `madrasah_id` is a mandatory non-null foreign key. |
| **AP-A3** | **Unauthorized Read Bleed** | Allowing teachers to view internal announcements of madrasahs where they hold no membership. | Enforce strict membership checks on read queries. |
| **AP-A4** | **Unscoped Public Portal** | Aggregating public announcements from all madrasahs into a single unbranded page. | Public feeds are strictly partitioned by madrasah slug. |
| **AP-A5** | **Shared Calendar Table** | Merging independent madrasah events into a single database row or shared calendar table. | Use read-time projections ("Agenda Saya") only. |
| **AP-A6** | **Calendar Cascade Coupling**| Modifying a calendar event in one madrasah altering or locking events in another. | Calendars are 100% independent (`OPTION A`). |
| **AP-A7** | **Conflated Event-Announcement**| Forcing announcements and calendar events to be the same database entity. | Separate `academic_events` from `announcements`. |
| **AP-A8** | **GSAP Business Logic Trap** | Writing state transitions, access checks, or publication logic inside GSAP callbacks. | GSAP is confined to visual presentation only. |

---

## 22. Domain Entity Classification: The `madrasah_id` Audit

Classification of communication and calendar entities:

### Category A: Wajib Memiliki Konteks `madrasah_id` Secara Eksplisit
*Must store `madrasah_id` directly for query performance and native database-level isolation:*
1. **`academic_calendars`** (Root of academic schedule)
2. **`academic_events`** (Specific dates, exams, holidays on calendar)
3. **`announcements`** (The core editorial publication record)
4. **`announcement_audiences`** (Targeting criteria per announcement)

### Category B: Mewarisi Konteks dari Parent Entity (Inherited / Derived)
*Inherits `madrasah_id` cleanly through parent foreign key:*
1. **`announcement_attachments`** (Inherited from `announcement_id`)
2. **`announcement_blocks`** (Inherited from `announcement_id`)
3. **`announcement_rsvps`** (Inherited from `announcement_id` and `user_id`)

### Category C: Global Tenant Entities (Dilarang Memiliki `madrasah_id` Langsung)
*Tenant-level entities that remain neutral:*
1. **`users`** (Human identity account)
2. **`system_notifications`** (Low-level push delivery logs)
3. **`saas_broadcast_banners`** (Universal SaaS maintenance pop-ups)

---

## 23. Schema Consequences (For Future Implementation WPs)

When authorized in downstream schema work packages, the following database structures will be designed:
1. **`announcements` Table**:
   - Primary key, `tenant_id`, `madrasah_id`, `type ('INFORMATION' | 'INVITATION')`, `status ('DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED')`, `title`, `slug`, `summary`, `body_json`, `cover_image_url`, `visibility ('INTERNAL' | 'PUBLIC')`, `published_at`, `expires_at`, `created_by`.
2. **`announcement_invitation_meta` Table** (or 1-to-1 extension):
   - `announcement_id`, `event_date`, `start_time`, `end_time`, `location_type`, `venue_name`, `meeting_url`, `rsvp_required`, `rsvp_deadline`, `capacity_limit`.
3. **`announcement_rsvps` Table**:
   - `id`, `tenant_id`, `announcement_id`, `user_id`, `response ('ATTENDING' | 'DECLINED' | 'TENTATIVE')`, `guest_count`, `notes`, `submitted_at`.
4. **Indexes**:
   - Composite unique index on `(tenant_id, madrasah_id, slug)`.
   - Index on `(tenant_id, madrasah_id, status, published_at)`.

---

## 24. Open Decisions (Submitted for Product Owner Review)

The following 5 decisions require formal Product Owner direction:

### `OPEN-DECISION-008`: Approval Workflow for Announcement Publishing
- **Problem**: Who is authorized to publish announcements directly to the public or student body?
- **Option A (Strict Approval)**: Teachers and staff may only author `DRAFT` announcements. Publishing requires formal sign-off by the Kepala Madrasah or Head of Public Relations (`PENDING_APPROVAL -> PUBLISHED`).
- **Option B (Role-Based Autonomous Publishing — Recommended)**: Kepala Madrasah and authorized PR Staff can publish directly. Ordinary teachers can publish to their own Rombel, but institutional announcements require approval.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

### `OPEN-DECISION-009`: RSVP Capacity Enforcement Policy
- **Problem**: What happens when an invitation's `capacity_limit` is reached?
- **Option A (Hard Cap — Recommended)**: System automatically disables the "Hadir" option once capacity is reached and displays *"Kuota Penuh"*.
- **Option B (Waiting List / Soft Cap)**: System allows subsequent respondents to register with status `'WAITING_LIST'`.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

### `OPEN-DECISION-010`: Wali Santri RSVP Authentication Method
- **Problem**: How do parents confirm attendance on mobile devices?
- **Option A (Authenticated Portal Login — Recommended)**: Parents log into the App Ma'had portal with their verified Wali account to submit RSVPs.
- **Option B (One-Click Tokenized Magic Link)**: Notification sends a WhatsApp link with a secure unique token allowing one-click RSVP without logging in.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

### `OPEN-DECISION-011`: Automated Social / WhatsApp Gateway Syndication
- **Problem**: When a public announcement or emergency circular is published, should the CMS automatically dispatch WhatsApp messages via the tenant's WA Gateway?
- **Option A (Integrated Auto-Dispatch)**: Authors can tick a checkbox *"Kirim Siaran WhatsApp ke Wali Santri"* upon publishing.
- **Option B (Manual Broadcast Decoupling — Recommended)**: The CMS publishes the announcement and generates a standardized broadcast text with a link, allowing administrators to review and dispatch via the Broadcast module separately.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

### `OPEN-DECISION-012`: Multi-Madrasah Parent Feed Sorting
- **Problem**: In the "Pengumuman Saya" unified view for parents with children in multiple madrasahs, how should the feed be sorted?
- **Option A (Strict Chronological — Recommended)**: Merged feed sorted purely by `published_at DESC`, with prominent color badges for each Madrasah.
- **Option B (Grouped by Child / Madrasah)**: Feed partitioned into separate tabs/sections per child.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

---

## 25. Final Domain Verdict

The domain architecture for **Madrasah Calendar Sovereignty**, **Unified Calendar Projections ("Agenda Saya")**, and the **Madrasah Announcement & Publication CMS** is fully codified and validated. It enforces strict multi-tenant isolation, protects academic sovereignty, provides rich editorial flexibility, and cleanly separates presentation enhancements (GSAP) from business rules.

---

```text
================================================================================
DOMAIN ARCHITECTURE STATUS:

[ ] INCOMPLETE
[ ] BLOCKED — OPEN DECISIONS
[x] READY FOR PRODUCT OWNER REVIEW
[ ] DOMAIN ARCHITECTURE LOCKED

SCHEMA:
NOT STARTED

MIGRATION:
NOT STARTED

CODING:
NOT AUTHORIZED

NEXT AUTHORITY:
PRODUCT OWNER
================================================================================
```
