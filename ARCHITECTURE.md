# AutoZap OS — Architecture

## Goal

Internal operations system for AutoZap: Leads → Sales → Partners → Catalog → Store → Launch → Support → Analytics.

Designed for future Bitrix24 sync **without** coupling the core domain to Bitrix.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| App | Next.js 15 (App Router) + TypeScript | SSR, API routes, modular UI |
| UI | Tailwind CSS | Fast, clean CRM-style tables/forms |
| DB | SQLite (dev/MVP) via Prisma → Postgres-ready | Relational, portable; migrate via Prisma |
| Auth | NextAuth credentials + bcrypt | Server-side sessions, role checks |
| Files | Local `uploads/` | Catalogs XLSX/CSV attachments |
| Import/Export | `xlsx` + CSV parsers | Stage 4 data portability |

## Domain model (core entities)

```
User ── Role
  │
  ├── Lead ──► Company, Contact, Deal, Partner (on convert)
  ├── Company ◄── Contact, Lead, Deal, Partner, Catalog, Store, Task, Activity
  ├── Deal (Kanban stages)
  ├── Partner (ops lifecycle)
  │     └── Catalog ──► validation report
  ├── Store
  ├── Task
  ├── Activity / Comment / Attachment
  ├── StatusHistory / AuditLog
  ├── Notification
  └── ExternalIdMap (AutoZap ID ↔ Bitrix24 ID)  [integration module]
```

All entities share:

- `id` — UUID (stable, export-safe)
- `createdAt`, `updatedAt`
- `createdById`, `updatedById` (where relevant)
- `deletedAt` — soft delete / archive (`null` = active)
- `archivedAt` — explicit archive marker (archived ≠ deleted permanently)

**Soft delete policy:** UI “Archive” sets `archivedAt` + `deletedAt`. Physical `DELETE` only for `ADMIN` and only from Archive after confirmation.

## Status machines

### Lead
`NEW → IN_PROGRESS → NO_ANSWER → CONTACTED → QUALIFIED → PROPOSAL_SENT → NEGOTIATION → AGREED → REGISTRATION → CONVERTED | REJECTED | NOT_SUITABLE | DEFERRED`

### Deal (Kanban)
`NEW → CONTACT → PROPOSAL → NEGOTIATION → APPROVAL → REGISTRATION → LAUNCH → WON | LOST`

### Partner
`NEW → REGISTRATION → WAITING_CATALOG → CATALOG_RECEIVED → CATALOG_REVIEW → CATALOG_UPLOAD → STORE_PROCESSING → READY_TO_PUBLISH → PUBLISHED → ACTIVE | NEEDS_ATTENTION | SUSPENDED | ARCHIVED`

### Catalog
`EXPECTED → RECEIVED → REVIEW → ERRORS → FIXING → READY → SENT_TO_UPLOAD → UPLOADED`

### Store
`CREATING → SETUP → CATALOG_LOADING → REVIEW → READY → PUBLISHED → ACTIVE | SUSPENDED | ARCHIVED`

### Task
`NEW → IN_PROGRESS → REVIEW → DONE | OVERDUE | CANCELLED`

Every status change → `StatusHistory` + `AuditLog` + optional automation.

## Roles

| Role | Scope |
|------|--------|
| `ADMIN` | Full CRUD, permanent delete, settings, all reports |
| `MANAGER_LEAD` (Руководитель) | All CRM/ops data, reports, assign anyone |
| `MANAGER` | Own records (`responsibleId = self`) + create |

Enforcement: server (API + server actions), not only UI.

## API shape

REST under `/api/v1/*`:

- `GET /api/v1/{resource}` — list + filters + pagination
- `GET /api/v1/{resource}/:id`
- `POST /api/v1/{resource}`
- `PATCH /api/v1/{resource}/:id`
- `POST /api/v1/{resource}/:id/archive`
- `POST /api/v1/{resource}/:id/restore`
- `DELETE /api/v1/{resource}/:id` — permanent (ADMIN only)
- `GET /api/v1/search?q=`
- `POST /api/v1/import`
- `GET /api/v1/export?format=csv|xlsx|bitrix24`
- `GET /api/v1/dashboard`
- `GET /api/v1/analytics`

Resources: `companies`, `contacts`, `leads`, `deals`, `partners`, `catalogs`, `stores`, `tasks`, `users`, `activities`, `notifications`, `audit`.

## Bitrix24 readiness (no runtime dependency)

1. Stable UUIDs on every entity  
2. `ExternalIdMap { entityType, localId, externalSystem, externalId }`  
3. Export adapter `lib/integrations/bitrix24/` mapping AutoZap fields → Bitrix CRM fields  
4. Status enums kept separate from Bitrix STAGE_ID; mapping table in adapter  
5. Dedup keys (INN, phone, email) align with Bitrix match rules  

Future sync service only talks to adapters — core domain stays Bitrix-agnostic.

## Automations (Stage 5)

Event bus in-process: `onStatusChange(entity, from, to)` → rules create tasks / notifications.

| Trigger | Action |
|---------|--------|
| Lead → PROPOSAL_SENT | Task «Связаться с клиентом» |
| Partner → WAITING_CATALOG | Task «Получить каталог» |
| Catalog → RECEIVED | Task «Проверить каталог» |
| Catalog → READY | Task «Передать на загрузку» |
| Store → PUBLISHED | Task «Проверить запуск» |
| Task overdue (cron/check) | Notify responsible |

## App routes (UI)

```
/(auth)/login
/(app)/dashboard
/(app)/crm/leads|companies|contacts|deals
/(app)/funnel
/(app)/partners
/(app)/catalogs
/(app)/stores
/(app)/tasks
/(app)/activities
/(app)/analytics
/(app)/archive
/(app)/settings
/(app)/[entity]/[id]
```

## Folder structure

```
src/
  app/                 # routes + API
  components/          # UI (layout, tables, forms, kanban)
  lib/
    db.ts
    auth.ts
    permissions.ts
    audit.ts
    automations.ts
    search.ts
    import-export/
    integrations/bitrix24/
    validators/
  types/
prisma/
  schema.prisma
  seed.ts
uploads/
```

## MVP readiness checklist

Employee can: create lead/company/contact/deal/partner/catalog/store/task; move statuses; comment; search; filter; archive/restore; import/export; see audit + dashboard + overdue tasks — all against real DB.
