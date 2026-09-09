# Sprint 1 Bounded Context Map & Boundary Relationships
**APP MA'HAD Enterprise SaaS ERP — Architecture Blueprint**

---

## 1. Context Map Overview

The **Context Map** defines structural dependencies, communication patterns, and integration boundaries between the bounded contexts of **APP MA'HAD Enterprise SaaS ERP**.

```mermaid
graph TD
    Identity["Identity & Access (Upstream Core)"]
    Academic["Academic Context (Upstream Master)"]
    Santri["Santri Core Context (Domain Hub)"]
    Dormitory["Dormitory Context (Downstream Operational)"]
    Financial["Financial Context (Downstream Ledger & Billing)"]
    Governance["Governance Context (Downstream Discipline & Health)"]
    Monitoring["Monitoring & Executive Dashboard (Read-Only Subscriber)"]
    Notification["Notification Engine (Event Subscriber)"]

    Identity -->|Shared Kernel / Customer-Supplier| Academic
    Identity -->|Shared Kernel / Customer-Supplier| Santri
    Identity -->|Shared Kernel / Customer-Supplier| Financial

    Academic -->|Upstream / Downstream (Published Language)| Santri
    Santri -->|Upstream / Downstream (Domain Events)| Dormitory
    Santri -->|Upstream / Downstream (Domain Events)| Financial
    Santri -->|Upstream / Downstream (Domain Events)| Governance

    Financial -->|Published Language (Flip Webhook ACL)| Notification
    Santri -->|Domain Events| Notification
    Governance -->|Domain Events| Notification

    Academic -.->|Read Aggregates| Monitoring
    Santri -.->|Read Aggregates| Monitoring
    Dormitory -.->|Read Aggregates| Monitoring
    Financial -.->|Read Aggregates| Monitoring
```

---

## 2. Context Relationship Matrix

| Upstream Context | Downstream Context | Relationship Pattern | Data Flow & Protocol | Integration Mechanism | Anti-Corruption Layer (ACL) Required? |
|---|---|---|---|---|---|
| **Identity & Access** | **ALL Contexts** | **Shared Kernel / Provider** | `tenant_id` context propagation & User identity reference. | Context Middleware (`src/middleware.ts`) & AST Linter. | **No** — Standard internal platform contract. |
| **Academic** | **Santri Core** | **Upstream / Downstream** | `kelas_id`, `jenjang_id`, `tingkat_id` referenced by Santri. | Direct ID reference & Published Language. | **No** — Direct internal domain reference. |
| **Santri Core** | **Dormitory** | **Upstream / Downstream** | `santri_id`, status transitions (`ACTIVE`, `SUSPENDED`). | Async Domain Events (`SantriActivatedEvent`, `SantriSuspendedEvent`). | **No** — Internal event payload. |
| **Santri Core** | **Financial** | **Upstream / Downstream** | `santri_id`, `wali_id`, lifecycle status updates. | Async Domain Events (`SantriRegisteredEvent`, `AlumniFinalizedEvent`). | **No** — Standard published domain events. |
| **Santri Core** | **Governance** | **Upstream / Downstream** | `santri_id`, behavior points, violation cases. | Direct ID reference & Domain Events. | **No** — Shared internal domain primitives. |
| **External Payment Gateway (Flip.id)** | **Financial** | **Customer / Supplier (External)** | Webhook payment notifications (`bill_id`, `status`). | REST Webhook Listener (`/api/webhooks/flip`). | **YES (Mandatory ACL)** — Webhook signature validator & payload translator. |
| **Financial / Santri / Governance** | **Notification** | **Publisher / Subscriber** | Dispatches WhatsApp/push alerts on domain events. | Outbox Event Queue (`outbox_events`). | **YES** — Notification engine isolates third-party WA gateway driver details. |
| **Operational Contexts** | **Monitoring** | **Upstream / Downstream** | Aggregated SQL metrics & audit log entries. | Read-only Database Views & `AuditLogs`. | **No** — Internal analytics read store. |

---

## 3. Relationship Pattern Definitions

### 3.1 Shared Kernel (`Identity & Access` $\longleftrightarrow$ Operational Contexts)
The `tenant_id` parameter and `UserSessionContext` constitute a **Shared Kernel**. All operational contexts share the exact definition of tenant scope and user roles. Any modification to `TenantContextScope` requires synchronized updates across all bounded contexts.

### 3.2 Upstream / Downstream (Customer-Supplier)
- `CTX-SANTRI` is Upstream to `CTX-DORMITORY` and `CTX-FINANCIAL`. If a Santri transitions to `SUSPENDED` or `TRANSFERRED`, downstream contexts react to update room occupancy and bill generation.

### 3.3 Anti-Corruption Layer (ACL)
An **Anti-Corruption Layer** is mandatory at two specific integration boundaries:
1. **Flip.id Payment Gateway ACL**: Translates external Flip HTTP webhook payloads into internal `PaymentReceivedEvent` objects, preventing external vendor schema changes from corrupting the internal `CTX-FINANCIAL` domain model.
2. **Third-Party WhatsApp / SMS Gateway ACL**: Translates internal `Notification` requests into vendor-specific API structures (`waGatewayApiKey`), insulating the core platform from messaging provider changes.

### 3.4 Event-Driven Asynchronous Boundary
Inter-context state synchronization MUST occur via domain events rather than direct synchronous database mutations across context boundaries. For instance, when an `Invoice` is paid in `CTX-FINANCIAL`, it emits `PaymentReceivedEvent`. `CTX-NOTIFICATION` consumes this event asynchronously to send a WhatsApp receipt to the parent.
