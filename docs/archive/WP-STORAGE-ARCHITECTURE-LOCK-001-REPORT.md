# WP-STORAGE-ARCHITECTURE-LOCK-001
# MASTER DATA & FILE STORAGE ARCHITECTURE SPECIFICATION
## Authoritative Architecture Decision Record (ADR) & Operational Invariants for MA'HAD MANAGER

**Document Identifier**: `WP-STORAGE-ARCHITECTURE-LOCK-001-REPORT`  
**Work Package ID**: `WP-STORAGE-ARCHITECTURE-LOCK-001`  
**Author**: Senior Principal Systems Architect & Multi-Tenant SaaS Companion  
**Classification**: ARCHITECTURAL DECISION RECORD (LOCKED INVARIANT)  
**Date**: 2026-09-14  
**Target Horizon**: 10-Year Enterprise Lifecycle (100+ Pesantren / Tenants)  
**Status**: CANONICAL ARCHITECTURAL INVARIANT — LOCKED BY PRODUCT OWNER  

---

## 1. Executive Summary & Architectural Invariant

The Master Data and File Storage Architecture for **MA'HAD MANAGER** is **OFFICIALLY LOCKED**.

This document formally records the architectural contract, systemic separation of concerns, multi-tenant isolation guarantees, and operational invariants governing structured application data and binary file storage.

### The Canonical Architectural Formula

```
========================================================================================
                          CANONICAL ARCHITECTURE INVARIANT
========================================================================================
APPLICATION DATABASE (Source of Truth)  =  SUPABASE POSTGRESQL
DATABASE ACCESS LAYER & ORM             =  DRIZZLE ORM
AUTHENTICATION & IDENTITY               =  SUPABASE AUTH (auth.users -> public.users)
PHYSICAL FILE / BINARY STORAGE          =  TENANT-SPECIFIC GOOGLE DRIVE
DOCUMENT METADATA & RELATIONSHIPS       =  SUPABASE POSTGRESQL (Drizzle ORM)
PHYSICAL DOCUMENT BINARY                =  TENANT'S PRIVATE GOOGLE DRIVE
========================================================================================
```

---

## 2. Forensic Context & Historical Precedent

Prior to this lock:
1. **Database Sprawl Risk**: Storing binary document files (e.g., Kartu Keluarga, Akta Kelahiran, Ijazah, Rapor PDF, Bukti Pembayaran) directly inside PostgreSQL via `bytea` or BLOBs was identified as a severe anti-pattern that would explode database size, degrade table scans, bloat WAL archives, and render `pg_dump` backups unmanageable as tenant scale expands from 10 to 100+ Pesantren.
2. **Platform Storage Centralization Risk**: Centralizing all tenant files into a single platform-owned AWS S3 or Supabase Storage bucket creates high cloud egress billing liabilities for the SaaS provider and violates data sovereignty expectations of Pesantren institutions.
3. **The Pesantren Reality**: Pesantren institutions frequently maintain existing Google Workspace for Education or Google One domains. Storing their operational documents inside **their own Google Drive space** empowers institutional ownership, guarantees zero egress surcharges for the platform, and respects Islamic educational data sovereignty.

---

## 3. The 16 Locked Architectural Decisions

```
+--------------------------------------------------------------------------------------------------+
| #  | Domain Dimension         | Locked Architectural Mandate                                     |
+----+--------------------------+------------------------------------------------------------------+
| 1  | Application Database     | SUPABASE POSTGRESQL is the sole canonical source of truth.       |
| 2  | ORM & Access Layer       | DRIZZLE ORM is the sole database access layer and migration tool.|
| 3  | Authentication           | SUPABASE AUTH is the sole identity and authentication provider.  |
| 4  | File Storage             | GOOGLE DRIVE is the physical file storage. PostgreSQL is not.    |
| 5  | Tenant Google Drive      | Each Tenant MUST have its own isolated Google Drive integration. |
| 6  | Google OAuth2 Security   | Server-side only, encrypted at rest, never leaked to client/Git. |
| 7  | Data vs File Separation  | DB stores metadata + references; Google Drive stores binaries.   |
| 8  | ID vs Path Invariant     | Stable Google Drive IDs are canonical; folder paths are not.     |
| 9  | Document Access Flow     | Multi-layer verification: Auth -> Tenant -> RBAC -> Drive API.   |
| 10 | Service Abstraction      | Document Service -> Storage Provider -> Google Drive Provider.   |
| 11 | Drive Folder Hierarchy   | Standard provisioned tree (Santri, Guru, Pegawai, Dokumen Umum). |
| 12 | Name Change Resilience   | Renames update Drive labels; DB stable ID references never break.|
| 13 | File Deletion Policy     | Soft-delete metadata + trash/archive in Drive (No hard delete).  |
| 14 | OCR Integration Pipeline | Human-in-the-loop: Drive -> OCR -> Preview Form -> Confirmed DB. |
| 15 | Strict Tenant Isolation  | Zero cross-tenant credential, metadata, or file ID access.       |
| 16 | Architecture Invariant   | The 6-part stack formula is non-negotiable across all WPs.       |
+--------------------------------------------------------------------------------------------------+
```

---

## 4. Deep Architectural Evaluation & Systems Design

As **Senior Principal Systems Architect**, this section provides a critical, objective, and constructive architectural analysis of this locked stack, detailing technical challenges, edge cases, trade-offs, and hardened mitigation patterns.

### 4.1 Separation of Concerns: Database Metadata vs Physical Binary

```
[System Architecture Separation of Concerns]

  +---------------------------------------------------------------------+
  |                         SUPABASE POSTGRESQL                         |
  |                        (Application Database)                       |
  +---------------------------------------------------------------------+
  | * santri (Master Santri)                                            |
  | * guru (Master Guru)                                                |
  | * mapel (Mata Pelajaran)                                            |
  | * kelas (Halaqah / Rombel)                                          |
  | * academic_ledger_records (Nilai Rapor)                             |
  | * hifzh_journal_entries (Jurnal Hafalan Al-Qur'an)                  |
  |                                                                     |
  | +-----------------------------------------------------------------+ |
  | |                 public.document_records                         | |
  | |-----------------------------------------------------------------| |
  | | * id: text (PK)                                                 | |
  | | * tenant_id: text (FK -> tenants.id)                            | |
  | | * category: 'santri_kk' | 'santri_akta' | 'ijazah' | 'rapor_pdf'| |
  | | * entity_type: 'santri' | 'guru' | 'keuangan'                   | |
  | | * entity_id: text (e.g. santri_id)                              | |
  | | * google_drive_file_id: text (CANONICAL EXTERNAL REFERENCE)     | |
  | | * google_drive_folder_id: text                                  | |
  | | * filename: text ("001_Ahmad_KartuKeluarga.pdf")                | |
  | | * mime_type: text ("application/pdf")                           | |
  | | * file_size_bytes: bigint (1548201)                             | |
  | | * file_checksum: text (SHA-256 for integrity verification)       | |
  | | * status: 'active' | 'archived' | 'trashed'                     | |
  | | * created_at, updated_at, created_by                            | |
  | +-----------------------------------------------------------------+ |
  +---------------------------------------------------------------------+
                                     |
                          Metadata Relationship
                                     |
                                     v
  +---------------------------------------------------------------------+
  |                       TENANT'S GOOGLE DRIVE                         |
  |                      (Physical File Storage)                        |
  +---------------------------------------------------------------------+
  | [Root: Ma'had Manager - Pesantren Al-Fatih]                         |
  |   └── Santri/                                                       |
  |         └── Ahmad Fauzi (ID: snt_98af21)/                           |
  |               ├── KK_Ahmad_Fauzi.pdf  [ID: 1a2B3c4D_file_kk]        |
  |               └── Akta_Kelahiran.pdf  [ID: 5e6F7g8H_file_akta]      |
  +---------------------------------------------------------------------+
```

### 4.2 Critical Architectural Analysis: Google Drive as Multi-Tenant File Storage

#### A. Distinct Advantages (Why this works for Pesantren)
1. **Institutional Ownership**: Pesantren leaders maintain physical control of student records within their own Google Workspace / Google One account. If they ever leave the platform, their documents remain in their Google Drive.
2. **Zero SaaS Egress Costs**: Bandwidth costs for heavy PDF/image downloads are absorbed by Google's infrastructure rather than the SaaS platform's cloud provider.
3. **Familiarity & Trust**: Pesantren administrators already utilize Google Workspace for office operations; onboarding friction is near zero.

#### B. Engineering Challenges & Hardened Mitigations

##### 1. Google Drive API Quotas & Rate Limits
- **Threat**: During PPDB (Penerimaan Peserta Didik Baru), hundreds of parents submit documents simultaneously. Google Drive API enforces a quota of **12,000 requests per 100 seconds per project** and **20,000 queries per 100 seconds per user**. Exceeding this triggers `HTTP 429 Too Many Requests`.
- **Mitigation**:
  - Implement **Chunked Resumable Uploads** (`uploadType=resumable`) for files $> 5\text{MB}$.
  - Introduce an asynchronous upload queue with **Exponential Backoff and Jitter** (`2^n + random_jitter_ms`).
  - Cache folder hierarchy mappings in Redis/PostgreSQL to prevent redundant `files.list` API calls to locate folders.

##### 2. OAuth2 Refresh Token Expiry & Security
- **Threat**: If the tenant's Google OAuth2 app is in "Testing" mode, refresh tokens expire every 7 days. If the administrator changes their Google password, tokens are revoked. If stored in plaintext in the database, a database leak exposes all tenant Google Drives.
- **Mitigation**:
  - The platform's Google Cloud Console OAuth App must be **Published / Production Verified** with standard Scopes (`https://www.googleapis.com/auth/drive.file`).
  - Store tokens in `tenant_storage_configs` using **Envelope Encryption** (AES-256-GCM) with an encryption key derived from environment secrets (`process.env.STORAGE_ENCRYPTION_KEY`), never in plaintext.
  - Implement an automated health check probe that attempts a lightweight API handshake (`files.about.get`) once daily, alerting the administrator before token expiration breaks halaqah or PPDB workflows.

##### 3. Two-Phase Commit & Orphan File Prevention
- **Threat**: A network drop after uploading a file to Google Drive but before committing the database transaction leaves an "orphan" file in Google Drive. Conversely, creating the DB row before the upload finishes creates a broken link.
- **Mitigation**:
  - **Phase 1 (Pending Entry)**: Insert database record with `status = 'UPLOADING'`.
  - **Phase 2 (Drive Upload)**: Stream binary to Google Drive; capture `google_drive_file_id`.
  - **Phase 3 (Commit)**: Update database record to `status = 'ACTIVE'`, writing `google_drive_file_id` and SHA-256 checksum.
  - **Reconciliation Job**: A nightly cron scans for records in `UPLOADING` state $> 2\text{ hours}$ and cleans up partial Drive files.

---

## 5. Security & Isolation Architecture

```
[Secure Document Streaming & Access Proxy Flow]

   Client Browser / Mobile
            │
            │ 1. GET /api/v1/documents/:id/download
            │    (Headers: Authorization Bearer JWT)
            ▼
   Next.js API Route / Middleware
            │
            │ 2. Authenticate Session via Supabase Auth (Extract user_id)
            │ 3. Resolve Tenant Context via user_tenant_memberships (Extract tenant_id)
            │ 4. Verify RBAC Permission (e.g. Permission.VIEW_SANTRI or VIEW_OWN_DATA)
            ▼
   Document Service Layer
            │
            │ 5. Query public.document_records WHERE id = :id AND tenant_id = :tenant_id
            │    (Database enforces strict tenant isolation)
            │ 6. Retrieve Decrypted Tenant Google OAuth2 Token from tenant_storage_configs
            ▼
   Google Drive Storage Provider
            │
            │ 7. Authenticated Google Drive API Stream:
            │    drive.files.get({ fileId: record.google_drive_file_id, alt: 'media' })
            ▼
   Next.js Streaming Response
            │
            │ 8. Stream binary chunks directly to client response
            │    (Headers: Content-Type, Content-Disposition: attachment, Content-Length)
            ▼
   Client Receives Decrypted File Stream
```

### Critical Security Principles
1. **Never Make Google Drive Files Public**: Files in tenant Drive spaces must **never** be set to "Anyone with the link can view". They remain private to the tenant's OAuth authorization.
2. **Never Return Direct Google Drive URLs**: Clients must never receive raw `drive.google.com` URLs. All access is mediated through the secure streaming proxy `GET /api/v1/documents/:id/download`, ensuring RBAC and audit logging on every view.
3. **No Arbitrary Drive ID Parameter Injection**: The client cannot request a download by passing an arbitrary Google Drive file ID. The client requests by internal document `id`; the backend verifies tenant ownership before resolving the Drive file ID.

---

## 6. Target Standard Tenant Google Drive Hierarchy

When a tenant completes Google Drive integration, the platform automatically provisions the following structured folder hierarchy:

```
📁 Ma'had Manager - [Nama Pesantren]  (Root Folder ID: gdir_root_xxx)
│
├── 📁 01_Santri  (Folder ID: gdir_santri_xxx)
│   ├── 📁 2026_Angkatan_14
│   │   ├── 📁 snt_001_Ahmad_Fauzi
│   │   │   ├── 📄 KK_Ahmad_Fauzi.pdf
│   │   │   ├── 📄 Akta_Ahmad_Fauzi.pdf
│   │   │   └── 📄 Ijazah_Ahmad_Fauzi.pdf
│   │   └── 📁 snt_002_Fathimah_Azzahra
│   └── 📁 2025_Angkatan_13
│
├── 📁 02_Guru_dan_Pegawai  (Folder ID: gdir_pegawai_xxx)
│   ├── 📁 gru_001_Ust_Ahmad_Zain
│   │   ├── 📄 KTP_Ust_Zain.pdf
│   │   └── 📄 Ijazah_S1_Ust_Zain.pdf
│   └── 📁 gru_002_Ust_Budi_Santoso
│
├── 📁 03_Akademik_dan_Kurikulum  (Folder ID: gdir_akademik_xxx)
│   ├── 📁 Rapor_Semester_Ganjil_2026
│   └── 📁 Silabus_dan_Modul_Ajar
│
├── 📁 04_Keuangan_dan_SPP  (Folder ID: gdir_keuangan_xxx)
│   └── 📁 Bukti_Transfer_Manual_2026
│
└── 📁 05_Dokumen_Institusi  (Folder ID: gdir_institusi_xxx)
    ├── 📄 SK_Kemenag_Pendirian.pdf
    └── 📄 Akta_Wakaf_Pesantren.pdf
```

### Stable ID Naming Convention (MBD-037)
Folder names include the immutable domain ID (e.g. `snt_001_Ahmad_Fauzi`). If the student's legal name is corrected in the database (e.g. "Ahmad Fauzi" $\rightarrow$ "Ahmad Fauzi Shiddiq"), the folder can be renamed via the API without breaking any database foreign keys, because the database stores the stable Google Drive Folder ID (`1F3k...`) and student ID (`snt_001`).

---

## 7. Future Schema Blueprint: Storage Configuration & Document Records

Target Drizzle schemas to be implemented in the dedicated Document Storage Work Package:

```typescript
// Blueprint for src/lib/db/schema/document_storage.ts

import { pgTable, text, bigint, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { tenants } from '../schema';

// ── 1. Tenant Storage Integration Configuration ──────────────────────────────
export const tenantStorageConfigs = pgTable('tenant_storage_configs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  provider: text('provider').default('GOOGLE_DRIVE').notNull(), // 'GOOGLE_DRIVE'
  
  // Encrypted OAuth2 Credentials (AES-256-GCM Envelope Encryption)
  encryptedRefreshToken: text('encrypted_refresh_token').notNull(),
  encryptedAccessToken: text('encrypted_access_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  oauthEmail: text('oauth_email').notNull(), // Google account email (e.g. "admin@alfatih.sch.id")
  
  // Provisioned Root Folder IDs
  rootFolderId: text('root_folder_id').notNull(),
  santriFolderId: text('santri_folder_id').notNull(),
  guruFolderId: text('guru_folder_id').notNull(),
  keuanganFolderId: text('keuangan_folder_id').notNull(),
  
  // Health & Operational Status
  connectionStatus: text('connection_status').default('CONNECTED').notNull(), // 'CONNECTED' | 'REVOKED' | 'EXPIRED' | 'ERROR'
  lastHealthCheckAt: timestamp('last_health_check_at').defaultNow().notNull(),
  lastErrorMessage: text('last_error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── 2. Unified Document Records (Metadata Catalog) ───────────────────────────
export const documentRecords = pgTable('document_records', {
  id: text('id').primaryKey(), // e.g. "doc_98af21b3"
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Entity Association
  entityType: text('entity_type').notNull(), // 'SANTRI' | 'GURU' | 'KEUANGAN' | 'INSTITUSI'
  entityId: text('entity_id').notNull(),     // e.g. santri.id
  documentCategory: text('document_category').notNull(), // 'KK' | 'AKTA' | 'IJAZAH' | 'RAPOR' | 'BUKTI_BAYAR'
  
  // Physical Storage Reference (Google Drive)
  googleDriveFileId: text('google_drive_file_id').notNull(),
  googleDriveFolderId: text('google_drive_folder_id').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  fileChecksumSha256: text('file_checksum_sha256'),
  
  // Lifecycle & Audit
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'ARCHIVED' | 'TRASHED'
  uploadedByUserId: text('uploaded_by_user_id').notNull(),
  trashedAt: timestamp('trashed_at'),
  trashedByUserId: text('trashed_by_user_id'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantEntityIdx: index('idx_doc_tenant_entity').on(table.tenantId, table.entityType, table.entityId),
  tenantDriveFileIdx: index('idx_doc_tenant_drive_file').on(table.tenantId, table.googleDriveFileId),
  tenantCategoryIdx: index('idx_doc_tenant_category').on(table.tenantId, table.documentCategory),
}));
```

---

## 8. Document Service Abstraction Pattern

To ensure high testability, maintainability, and architectural decoupling, all application modules interact exclusively with the `DocumentService` boundary:

```
[Application Layers]
PPDB Wizard / Santri Bio / Rapor Generator / Keuangan
                    │
                    ▼
           IDocumentService
           - uploadDocument(tenantId, file, metadata)
           - downloadDocumentStream(tenantId, documentId)
           - trashDocument(tenantId, documentId)
           - listDocumentsByEntity(tenantId, entityType, entityId)
                    │
                    ▼
           IStorageProvider
           - createFolder(credentials, folderName, parentId)
           - putStream(credentials, stream, filename, mimeType, folderId)
           - getStream(credentials, fileId)
           - moveToTrash(credentials, fileId)
                    │
                    ▼
        GoogleDriveStorageProvider
        (googleapis / google.drive({ version: 'v3' }))
```

- **Mockable in CI/CD**: In vitest unit and contract tests, `IStorageProvider` is substituted with an in-memory or temporary local disk mock, eliminating live Google Drive API dependencies during test runs.
- **Production Provider**: In staging and production, `GoogleDriveStorageProvider` executes authenticated HTTPS calls against Google's API.

---

## 9. OCR Integration Pipeline (Human-in-the-Loop Architecture)

When OCR (Optical Character Recognition) is enabled for automatic extraction of identity documents (e.g. scanning Kartu Keluarga or Akta Kelahiran during PPDB registration), the process strictly adheres to the **Human-in-the-Loop Principle**:

```
[OCR Invariant Pipeline]

  Parent / Staff Uploads KK (PDF/Image)
                    │
                    ▼
       Stored in Tenant Google Drive
                    │
                    ▼
        Document Service OCR Worker
        (Extracts NIK, No. KK, Nama, Tgl Lahir)
                    │
                    ▼
         Temporary Extraction JSON
        (Stored in staging / draft session)
                    │
                    ▼
       ┌───────────────────────────────┐
       │   STAFF VERIFICATION SCREEN   │
       │                               │
       │  [KK Image]   vs   [Extracted]│
       │                     NIK: [___]│
       │                     Nama:[___]│
       │                               │
       │  [ ✓ Approve ]   [ ✗ Correct ]│
       └───────────────────────────────┘
                    │
                    ▼
  Master Data Updated ONLY AFTER Human Confirmation
```

> [!CAUTION]
> **Strict Invariant**: OCR extraction engines are **never** permitted to mutate master database tables (`santri`, `wali`, `users`) autonomously. Automated extraction must always pass through human visual confirmation.

---

## 10. Audit & Compliance Invariants

1. **OAuth2 Secrets are Non-Auditable**: Encryption keys, access tokens, refresh tokens, and client secrets must be masked as `[REDACTED_SECRET]` in all logger payloads and cannot be committed to `public.audit_logs`.
2. **Every Download is Audited**: Every invocation of `downloadDocumentStream` records an audit event in `public.audit_logs`:
   ```json
   {
     "action": "DOCUMENT_ACCESSED",
     "target_entity": "document_records",
     "target_id": "doc_98af21b3",
     "details": "User Ust. Zain downloaded KK_Ahmad_Fauzi.pdf for Santri snt_001"
   }
   ```
3. **Data Protection & Legal Compliance**: Student records contain Minor Protected Data (UU Perlindungan Data Pribadi / GDPR-equivalent). Physical file placement on the tenant's own Google Drive establishes the Pesantren as the legal **Data Controller**, while MA'HAD MANAGER operates strictly as the **Data Processor**.

---

## 11. Work Package Status & Sign-Off

```
============================================================
MASTER DATA & FILE STORAGE ARCHITECTURE LOCK
============================================================

STATUS:
CANONICAL ARCHITECTURE INVARIANT LOCKED

APPLICATION DATABASE:
SUPABASE POSTGRESQL (Canonical Source of Truth)

DATABASE ACCESS / ORM:
DRIZZLE ORM (Type-Safe Schema & Migrations)

AUTHENTICATION:
SUPABASE AUTH (auth.users -> public.users)

PHYSICAL FILE STORAGE:
TENANT-SPECIFIC GOOGLE DRIVE (Zero Centralized Binary Bloat)

DOCUMENT METADATA:
SUPABASE POSTGRESQL (document_records)

MULTI-TENANT ISOLATION:
STRICTLY ENFORCED (Separate OAuth2 Credentials & Drive Spaces)

SECURITY:
ENVELOPE ENCRYPTION (AES-256-GCM) + RBAC STREAMING PROXY

NEXT ACTION:
APPLY AS CANONICAL CONSTRAINT TO ALL FUTURE WPs

============================================================
RECORDED & LOCKED.
```
