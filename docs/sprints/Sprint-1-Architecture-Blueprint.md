# Sprint 1 Architecture Blueprint
**APP MA'HAD Enterprise SaaS ERP — Layered Multi-Tenant System Architecture**

---

## 1. Multi-Tenant Architectural Layering

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION LAYER (Next.js 16 App Router / Server & Client Components)  │
│    /app/dashboard/* | /app/wali/* | UI Design System / Vanilla CSS          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. APPLICATION SERVICES LAYER (API Handlers & Middleware Context)           │
│    /app/api/* | Middleware Context Tenant Extractor (x-tenant-id)           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. DOMAIN LOGIC LAYER (Pure Domain Entities & State Machines)              │
│    /modules/santri/domain/ | Lifecycle Transition Guards | Business Rules    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. DATA ACCESS LAYER (Drizzle ORM & AST Static Verification)                │
│    /lib/db/schema/* | AST Linter (enforce-tenant-id-param) | Query Chains   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. INFRASTRUCTURE LAYER (Redis Cache Manager & Event Outbox)               │
│    /core/cache/ (Tenant Key Tagging) | /core/events/ (Outbox Dispatcher)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Repository Structure & Module Placement

```
src/
├── app/                        # Next.js 16 App Router Page Routes & API Handlers
│   ├── api/                    # REST API Endpoints (Auth, Academic, Santri, Finance)
│   ├── dashboard/              # Admin & Staff Backoffice Management UI
│   └── wali/                   # Parent Portal UI
├── core/                       # Shared Cross-Cutting Enterprise Infrastructure
│   ├── cache/                  # Multi-Tenant Redis Cache Manager (tenant tagging)
│   ├── domain/                 # Core domain enums, translations & interfaces
│   └── events/                 # Outbox Pattern Event Bus & Event Dispatchers
├── lib/                        # Framework & Database Infrastructure
│   ├── db/                     # Drizzle ORM Schemas & Database Services
│   └── tenant/                 # Multi-Tenant Context & Session Extractors
├── modules/                    # Domain-Driven Modules (Isolated Business Logic)
│   └── santri/                 # Santri Domain (Entities, State Machine, Value Objects)
└── tools/                      # Static AST Rule Checkers & Baseline CLI Runners
```

---

## 3. Domain Boundaries & Tenant Data Isolation

### 3.1 Hardened Database Schema Isolation
Every database table managed by Drizzle ORM includes a mandatory `tenant_id` column indexed for performance:

```typescript
// Standard Multi-Tenant Table Definition Pattern
export const santriTable = pgTable('santri', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantTable.id),
  nis: varchar('nis', { length: 20 }).notNull(),
  namaLengkap: varchar('nama_lengkap', { length: 100 }).notNull(),
  status: varchar('status', { length: 30 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('santri_tenant_idx').on(table.tenantId),
  tenantNisUnique: unique('santri_tenant_nis_unique').on(table.tenantId, table.nis),
}));
```

### 3.2 Static AST Verification Rule
The custom linter rule `tools/eslint-rules/enforce-tenant-id-param.js` enforces that all Drizzle `select()`, `insert()`, `update()`, and `delete()` chains explicitly include a `.where(eq(table.tenantId, ...))` filter or value assignment.

---

## 4. State Management & Data Flow Architecture

```
[User Action] ──> [Zustand Store / React Hook] ──> [Fetch API Route (/api/*)]
                                                         │
[Cache Hit]   <── [Redis Cache Manager] <── [Tenant Context Middleware]
    │                                                    │
[UI Re-render] <── [JSON Response] <── [Drizzle Query (tenantId Filtered)]
```

- **Client State**: Lightweight Zustand stores (`auth-store.ts`) for session state and active tenant switches.
- **Server State**: Next.js Server Components and REST API routes fetch directly via Drizzle ORM.
- **Cache Strategy**: Multi-tenant Redis key tagging (`tenant:{tenantId}:{cacheKey}`) with tag-based invalidations.
