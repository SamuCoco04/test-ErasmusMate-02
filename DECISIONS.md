# ErasmusMate — Technical Decisions Ledger

This document captures architectural and workflow decisions that can be verified against the current repository implementation (schema, migrations, API routes, module services, and app shells). When implementation evidence is partial, the decision is explicitly labeled as inferred.

## Stack and framework

### Decision: Use a Next.js 14 + TypeScript monorepo-style app with integrated frontend and backend
- **Rationale:** The codebase is organized as a single Next.js application with App Router pages and route handlers, enabling UI + API in one deployable project.
- **Consequences/Trade-offs:**
  - Pros: Shared types and validation boundaries, simpler local run path, fewer cross-repo integration issues.
  - Cons: Tighter coupling between frontend and backend release cadence.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Use Tailwind utility styling and local UI primitives
- **Rationale:** UI components and shells use Tailwind class patterns and shared primitives under `src/components/ui/*`.
- **Consequences/Trade-offs:**
  - Pros: Fast iteration and consistent styling primitives.
  - Cons: Visual system discipline depends on class usage conventions rather than a hard design token pipeline.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Use React Hook Form + Zod-compatible validation flow at API/module boundaries
- **Rationale:** Zod is a direct dependency and route handlers parse payloads via module schemas before invoking services.
- **Consequences/Trade-offs:**
  - Pros: Runtime validation and clearer contract enforcement.
  - Cons: Requires schema maintenance whenever payload contracts evolve.
- **Status:** active.
- **Evidence level:** Confirmed.

## API architecture and role guards

### Decision: Route handlers act as thin transport layer; workflow logic is centralized in `src/modules/*/service.ts`
- **Rationale:** API handlers mostly parse request input, call service functions, and normalize error responses.
- **Consequences/Trade-offs:**
  - Pros: Better reuse and testability of domain logic.
  - Cons: Service files grow quickly if domain split is not further refined.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Role and ownership checks are implemented in service-layer assertions (student/coordinator/admin constraints)
- **Rationale:** Services enforce actor role and resource ownership/assignment before state mutations and restricted reads.
- **Consequences/Trade-offs:**
  - Pros: Consistent business guardrails independent of route shape.
  - Cons: Current model relies on caller-supplied user identity input rather than authenticated server session.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Use explicit workflow state machines represented as string states plus event/audit writes
- **Rationale:** Institutional and social flows store state transitions and related event records.
- **Consequences/Trade-offs:**
  - Pros: Good auditability and alignment with workflow-driven implementation.
  - Cons: State consistency depends on service invariants (no DB-level enum constraints in SQLite schema).
- **Status:** active.
- **Evidence level:** Confirmed.

## Prisma/SQLite persistence + seed strategy

### Decision: Use Prisma ORM with SQLite datasource for local demo persistence
- **Rationale:** Prisma schema is configured with SQLite datasource and migrations define full relational model.
- **Consequences/Trade-offs:**
  - Pros: Fast local setup and deterministic migration flow.
  - Cons: SQLite behavior differs from production-grade multi-user RDBMS in concurrency and scaling.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Keep an additive, phase-oriented migration trail for institutional core, social layer, moderation, map, and learning agreements
- **Rationale:** Migration folders are segmented by implementation slices and progressively introduce domain tables/indexes.
- **Consequences/Trade-offs:**
  - Pros: Historical traceability of capability growth.
  - Cons: Refactors may require additional compatibility migration steps instead of clean-slate redesign.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Seed script resets and repopulates all major tables with demo-ready institutional + social fixtures
- **Rationale:** Seed performs full cleanup followed by deterministic creation of users, mobility records, procedures, deadlines, social and moderation-related data.
- **Consequences/Trade-offs:**
  - Pros: Reliable demo data bootstrap.
  - Cons: Destructive reset behavior is unsuitable for preserving ad-hoc local test data between runs.
- **Status:** active.
- **Evidence level:** Confirmed.

## Institutional/social route and shell separation

### Decision: Keep institutional layer and social-support layer in separate route groups and distinct shell components
- **Rationale:** Institutional routes use `AppShell` with role-scoped navigation; social routes use `SocialShell` with explicit back-link to institutional core.
- **Consequences/Trade-offs:**
  - Pros: Preserves primary/secondary product hierarchy and reduces workflow ambiguity.
  - Cons: Some user context (e.g., selected mobility scope) may need repeated query-param plumbing across shells.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Use role-targeted institutional side navigation (student/coordinator/admin)
- **Rationale:** Institutional shell switches nav links by role and exposes role-specific route entry points.
- **Consequences/Trade-offs:**
  - Pros: Clear role coherence during demo usage.
  - Cons: Static role selection in shell links signals simplified identity/session handling.
- **Status:** active.
- **Evidence level:** Confirmed.

## Social map integration approach (Leaflet + OSM + moderation constraints)

### Decision: Implement real interactive map with Leaflet and OpenStreetMap tiles on client side
- **Rationale:** Social map canvas loads Leaflet assets dynamically, initializes map, renders markers, and uses OSM tile endpoint.
- **Consequences/Trade-offs:**
  - Pros: Real map interaction (markers, popups, viewport fit, selection flow) suitable for demo.
  - Cons: Runtime depends on third-party CDN/tile availability.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Restrict map content exposure through moderation/privacy gating before marker/detail visibility
- **Rationale:** Social services only return map content when moderation state and profile discoverability/consent constraints are satisfied.
- **Consequences/Trade-offs:**
  - Pros: Reduces unsafe exposure risk and aligns social-support scope guardrails.
  - Cons: Additional filtering can reduce visible map density and may require stronger admin tooling for dispute handling.
- **Status:** active.
- **Evidence level:** Confirmed.

## Learning Agreement and derived Academic Summary model

### Decision: Model Learning Agreement as one record per mobility record with revisioned rows and event log
- **Rationale:** Schema enforces unique `mobilityRecordId` in LearningAgreement, and rows use `rowKey` + `revision` + `isLatest` strategy with event history.
- **Consequences/Trade-offs:**
  - Pros: Supports controlled row-level evolution without losing historical revisions.
  - Cons: Query complexity increases due to latest-revision filtering.
- **Status:** active.
- **Evidence level:** Confirmed.

### Decision: Expose Academic Summary as a derived read model from approved latest rows (not as a separate persisted snapshot table)
- **Rationale:** Academic summary endpoint delegates to service that assembles summary from mobility record + accepted/latest approved agreement rows at read time.
- **Consequences/Trade-offs:**
  - Pros: No synchronization overhead between source and snapshot tables.
  - Cons: No immutable historical summary snapshots unless introduced later.
- **Status:** active.
- **Evidence level:** Confirmed.

## Deferred complexity

### Decision: Full authentication/session infrastructure is deferred; current API access pattern uses explicit role/user inputs plus service assertions
- **Rationale:** Route handlers accept query/body user context and do not integrate full auth/session middleware.
- **Consequences/Trade-offs:**
  - Pros: Speeds vertical-slice delivery for local demo.
  - Cons: Not production-grade identity assurance; endpoint trust boundary is simplified.
- **Status:** deferred.
- **Evidence level:** Confirmed.

### Decision: Advanced moderation operations tooling (workflow analytics, escalations, richer reviewer operations) is deferred beyond current queue/action baseline
- **Rationale:** Implementation includes moderation cases/reports/actions, but no evidence of extended operational tooling (e.g., SLA dashboards, escalation ladders, bulk adjudication UX).
- **Consequences/Trade-offs:**
  - Pros: Focus remains on core end-to-end moderation lifecycle.
  - Cons: Admin throughput and governance sophistication may be limited at scale.
- **Status:** deferred.
- **Evidence level:** Inferred from implementation.

### Decision: Persistent/temporal academic snapshot strategy is deferred in favor of live derived summary
- **Rationale:** Current model computes summary dynamically and does not include separate snapshot persistence artifacts.
- **Consequences/Trade-offs:**
  - Pros: Lower data duplication and simpler write flows.
  - Cons: Historical point-in-time reporting and audit snapshots need future design.
- **Status:** deferred.
- **Evidence level:** Confirmed.

## Governance rule

No implementation phase is considered complete until meaningful technical, architecture, workflow, and UX decisions are appended to `DECISIONS.md` with: Decision, Rationale, Consequences/Trade-offs, Status, and Evidence level.
