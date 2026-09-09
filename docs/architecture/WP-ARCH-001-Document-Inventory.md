# WP-ARCH-001 — Master Document Inventory & Classification Register

> **WORK PACKAGE:** WP-ARCH-001  
> **TITLE:** COMPLETE REPOSITORY DOCUMENT INVENTORY  
> **BRANCH:** `preview`  
> **DATE:** 2026-09-01  
> **STATUS:** AUDITED & CLASSIFIED

---

## 1. Document Inventory Overview

This inventory indexes all **120+ architectural, specification, execution, policy, and planning documents** across the project repository, classifying their status and authority level.

---

## 2. Document Classification Table

| Document Path | Category | Date | Status | Authority Level | Notes / Classification |
|---|---|:---:|:---:|:---:|---|
| `AGENTS.md` | Product Vision & Governance | 2026-09-01 | **LOCKED** | **Level S0** | 10-Year Enterprise Multi-Tenant SaaS Vision |
| `docs/architecture/EARS-Part-1-Enterprise-Foundation.md` | Architecture Specification | 2026-08-15 | **APPROVED** | **Level S1** | Enterprise architecture foundation |
| `docs/architecture/EARS-Part-2-Enterprise-Business-Architecture.md` | Business Architecture | 2026-08-15 | **APPROVED** | **Level S1** | Business & pesantren domain model |
| `docs/architecture/EARS-Part-3-Core-Platform-Architecture.md` | Core Platform | 2026-08-15 | **APPROVED** | **Level S1** | Core SaaS platform specification |
| `docs/architecture/EARS-Part-4-Domain-Architecture.md` | Domain Architecture | 2026-08-15 | **APPROVED** | **Level S1** | Bounded contexts & domain models |
| `docs/architecture/EARS-Part-5-Enterprise-Data-Architecture.md` | Data Architecture | 2026-08-15 | **APPROVED** | **Level S1** | Enterprise database standards |
| `docs/architecture/EARS-Part-6-Blueprint-Integration-Architecture.md` | Integration | 2026-08-15 | **APPROVED** | **Level S1** | External API & webhook integration |
| `docs/architecture/Sprint-1-Domain-Architecture.md` | Sprint Domain Architecture | 2026-08-20 | **APPROVED** | **Level S1** | Domain repository mapping & contracts |
| `docs/architecture/Sprint-1-WP-101-Tenant-Web-Identity-Authorization-Contract.md` | Identity Contract | 2026-08-22 | **LOCKED** | **Level S1** | Tenant identity & authorization contract |
| `docs/architecture/WP-SAAS-PORTAL-001-Tenant-Portal-Domain-Architecture-Discovery-Report.md` | Portal Architecture | 2026-08-28 | **COMPLETE** | **Level S3** | Forensic portal discovery report |
| `docs/architecture/WP-SAAS-PORTAL-002-Execution-Report.md` | Portal Execution | 2026-08-29 | **CERTIFIED** | **Level S3** | Public portal landing foundation (`fbed9fd`) |
| `docs/architecture/WP-SAAS-PORTAL-003-Execution-Report.md` | Subdomain Proxy Execution | 2026-08-30 | **CERTIFIED** | **Level S3** | Hostname subdomain resolution (`620395e`) |
| `docs/architecture/WP-SAAS-BRAND-001-Tenant-Branding-Discovery-Report.md` | Branding Discovery | 2026-09-01 | **COMPLETE** | **Level S1** | Audit of 7 branding fields |
| `docs/architecture/WP-SAAS-SEC-001-Tenant-RLS-Forensic-Discovery-Report.md` | Security Discovery | 2026-09-01 | **COMPLETE** | **Level S1** | Audit of 57 database tables |
| `docs/architecture/WP-SAAS-SEC-002-Execution-Report.md` | RLS Hardening Execution | 2026-09-01 | **CERTIFIED** | **Level S3** | Migration 0002 RLS hardening (`955757e`) |
| `docs/architecture/WP-SAAS-SEC-002-PreMigration-Audit.md` | RLS Pre-Migration | 2026-09-01 | **APPROVED** | **Level S3** | Pre-migration table classification |
| `docs/architecture/WP-SAAS-SEC-002-RLS-Policy-Matrix.md` | RLS Specification | 2026-09-01 | **APPROVED** | **Level S3** | SQL policy matrix specification |
| `docs/architecture/WP-SAAS-SEC-002-Security-Test-Report.md` | Security Test Evidence | 2026-09-01 | **CERTIFIED** | **Level S4** | 15/15 security tests passed |
| `docs/architecture/WP-SAAS-SEC-003-RLS-E2E-Audit.md` | RLS E2E Audit | 2026-09-01 | **CERTIFIED** | **Level S3** | PostgreSQL RLS audit report |
| `docs/architecture/WP-SAAS-SEC-003-RLS-Coverage-Matrix.md` | RLS Matrix | 2026-09-01 | **CERTIFIED** | **Level S3** | 57-table coverage matrix |
| `docs/architecture/WP-SAAS-SEC-003-Security-Test-Report.md` | Security Test Evidence | 2026-09-01 | **CERTIFIED** | **Level S4** | 18/18 E2E security tests passed |
| `docs/architecture/WP-SAAS-SEC-003-Execution-Report.md` | Final RLS Certification | 2026-09-01 | **CERTIFIED** | **Level S3** | Production RLS certification (`6d99a92`) |
| `docs/architecture/WP-LIB-001-Library-Architecture-Discovery-Report.md` | Library Discovery | 2026-08-25 | **COMPLETE** | **Level S1** | Library domain discovery report |
| `docs/architecture/WP-LIB-001A-Execution-Report.md` | Library Execution | 2026-08-26 | **CERTIFIED** | **Level S3** | Schema foundation implemented |
| `docs/architecture/WP-UI-001-Master-UI-UX-Governance-Baseline.md` | UI/UX Baseline | 2026-08-20 | **APPROVED** | **Level S1** | Master UI/UX design tokens |
| `docs/architecture/WP-UI-002-UI-UX-Implementation-Roadmap-and-Prioritization-Audit.md` | UI Roadmap | 2026-08-20 | **APPROVED** | **Level S5** | UI implementation roadmap |
| `docs/architecture/WP-UI-010-Final-Integration-Audit-Report.md` | Responsive UI Execution | 2026-08-22 | **CERTIFIED** | **Level S3** | Touch responsive primitives |
| `docs/architecture/WP-UI-020C-4-Final-Integration-Certification-Report.md` | Responsive Data Presentation | 2026-08-24 | **CERTIFIED** | **Level S3** | Data presentation & tables |
| `docs/architecture/WP-UI-020D-Wallet-Freeze-Implementation-Report.md` | Wallet Freeze UI | 2026-08-25 | **CERTIFIED** | **Level S3** | Wallet freeze feature |
| `docs/architecture/WP-UI-020E-2-Health-Gate-Integration-Audit-Report.md` | UKS Health UI | 2026-08-26 | **CERTIFIED** | **Level S3** | UKS health module |
| `docs/architecture/WP-UI-020F-2-Academic-Curriculum-Integration-Audit-Report.md` | Curriculum UI | 2026-08-27 | **CERTIFIED** | **Level S3** | Academic curriculum management |
| `docs/engineering/Engineering-Quality-Policy.md` | Engineering Quality Policy | 2026-08-15 | **LOCKED** | **Level S1** | Quality gates & code standards |
| `docs/engineering/Quality-Gates.md` | Quality Gates | 2026-08-15 | **LOCKED** | **Level S1** | CI/CD testing criteria |
| `src/lib/firebase/` (Legacy Files) | Legacy Prototype Code | 2026-07-01 | **LEGACY** | **Level S6** | Deprecated Firebase prototype code |
