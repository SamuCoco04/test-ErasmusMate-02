# ErasmusMate — Full Execution Plan

## Purpose
Build ErasmusMate from zero as a **workflow-driven, full-stack, locally runnable, client-presentable product demo**.

This repository starts from:
- `AGENTS.md`
- `/artifacts`
- `/figma`

Implementation must be driven primarily by the **approved workflows**, with requirements defining scope and business rules defining constraints.

The project has two clearly separated layers:
1. **Institutional / manual-assisted Erasmus mobility management core**
2. **Secondary social-support layer**

The institutional core must remain primary in:
- architecture
- navigation
- implementation order
- product emphasis

The social-support layer must remain secondary, clearly separated, and must not distort official workflows.

---

## Planning principles

### Build around workflows first
The safest approach is to build around **stateful workflows first**, then fit:
- UI
- API
- database
- services
- validation

to those workflows.

Do **not** build primarily by screen or Figma page.

### Backend must arrive early
Backend and persistence must be introduced early enough to avoid:
- decorative frontend behavior
- disconnected state transitions
- rework caused by late integration

### Architecture and patterns are allowed
Implementation may make strong technical decisions when the artifacts do not prescribe every detail, provided that:
- scope remains faithful to the approved artifacts
- architecture stays maintainable
- the product remains locally runnable and demo-ready

---

# 0. Root-cause analysis of likely instability

## Why projects like this fail early

### Screen-first implementation drift
Building directly from Figma pages often creates:
- disconnected behavior
- fake workflows
- missing state transitions
- poor frontend/backend coherence

### Institutional/social boundary collapse
If social features are mixed into institutional navigation:
- official workflows become confusing
- compliance-sensitive behavior becomes harder to maintain
- role boundaries weaken

### State model mismatch between frontend and backend
Core workflows contain strict state transitions for:
- submissions
- reviews
- reopen/resubmit
- exceptions
- deadlines
- moderation
- social connections

If the UI shows states not enforced by backend guards and persistence:
- invalid transitions become possible
- data becomes inconsistent
- demos fail in real usage

### Late persistence integration
If backend is postponed:
- frontend becomes decorative
- navigation works superficially but not semantically
- refactor cost increases sharply

### Map treated as placeholder
The map is not optional polish.
It must be implemented as a **real functional feature** with:
- filtering
- place-context data
- moderation/privacy constraints
- safe visibility rules

It must **not** remain a static or fake mock.

---

# 1. Recommended architecture

## 1.1 Repository shape
Use a **single Next.js application** with App Router.

Do **not** split into multiple apps unless a strong reason appears later.

### Route groups
- `app/(institutional)/student/...`
- `app/(institutional)/coordinator/...`
- `app/(institutional)/admin/...`
- `app/(social)/student/...`

### Module structure
- `src/modules/institutional/*`
- `src/modules/social/*`
- `src/modules/shared/*`

### Persistence
- Prisma
- SQLite
- migrations
- deterministic seed data

### API
- Next.js route handlers under `app/api/*`

### Validation
- Zod schemas shared across:
  - forms
  - request parsing
  - API boundaries
  - workflow inputs

## 1.2 Layered architecture
### UI layer
- Next.js pages/layouts
- shadcn/ui
- React Hook Form
- role-aware navigation
- clear institutional/social separation

### Application layer
- services implementing workflow use cases
- orchestration of operations
- transaction entry points

### Domain layer
- transition guards
- policy checks
- business constraints
- state logic
- workflow semantics

### Infrastructure layer
- Prisma repositories
- map adapter
- notification/outbox adapter
- persistence helpers
- seed setup

---

# 2. Recommended design patterns

## Workflow engine-lite
Use explicit transition maps per aggregate for:
- document submissions
- exceptions
- mobility records
- social connections
- moderation cases

This prevents invalid transitions and centralizes lifecycle logic.

## Repository + Service separation
Keep Prisma access out of higher-level business logic.
Use repositories for persistence and services for use cases.

## Policy / Guard objects
Encode permission and constraint logic as reusable guards:
- role permissions
- consent
- visibility
- moderation
- deadline checks
- state transition conditions

## DTO + Zod boundary
All request/response and form boundaries should use explicit schemas and DTOs.

## Audit-first command handlers
Any critical state change should:
1. validate guard conditions
2. apply the state transition
3. write audit trail records
4. optionally write notification/outbox events

## Social feature scoping policy
Feature scoping and enable/disable logic must exist for the social layer.

---

# 3. Backend architecture

## 3.1 Domain modules

### Institutional
- mobility-record
- procedure-definition
- document-submission
- signature-routing
- deadline-governance
- exception-request
- delegation

### Social
- social-profile
- discovery-connection
- messaging
- recommendations-reviews
- moderation
- map-discovery

### Shared
- auth / RBAC
- audit
- notification
- retention / policy
- incident handling

## 3.2 API style
Use **workflow-oriented route handlers**, not page-oriented handlers.

### Reads
- `GET` list/detail endpoints

### Mutations
- `POST` / `PATCH` endpoints for:
  - state-changing operations
  - creation flows
  - moderation/reporting
  - decision actions

Server actions may be used only where tightly coupled and clearly beneficial, but core logic must remain in services.

## 3.3 Transaction strategy
All status-changing operations should use transactions.

Transaction shape:
1. validate guards
2. validate current state
3. apply transition
4. write workflow event history
5. write audit record
6. write notification/outbox event when needed

On integration-style failure, preserve pre-action consistency.

---

# 4. First database entities to implement

## Phase 1 schema — minimum viable institutional core
- `UserAccount`
- `RoleAssignment`
- `Institution`
- `MobilityRecord`
- `MobilityContext`
- `ProcedureDefinition`
- `ProcedureVersion`
- `ProcedureApplicabilityRule`
- `DocumentSubmission`
- `SubmittedDocumentVersion`
- `Deadline`
- `OfficialObligation`
- `ExceptionRequest`
- `AuditRecord`
- `OfficialNotificationRecord`

## Phase 2 schema — social layer
- `SocialSupportProfile`
- `SocialVisibilitySettings`
- `SocialConsentSettings`
- `SocialConnection`
- `MessageThread`
- `Message`
- `Recommendation`
- `Opinion`
- `Favorite`
- `PlaceContext`
- `ModerationReport`
- `ModerationCase`
- `SocialAuditEvent` or unified audit approach with domain tagging

### Notes
For map support:
- `PlaceContext` must represent only **public, Erasmus-relevant, safe place references**
- no private address exposure
- no unsafe personal location data
- no live tracking

---

# 5. First API endpoints to implement

## Institutional-first MVP APIs
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/mobility-records/:id`
- `GET /api/procedures/applicable?mobilityRecordId=...`
- `POST /api/submissions`
- `PATCH /api/submissions/:id/submit`
- `PATCH /api/submissions/:id/review`
- `PATCH /api/submissions/:id/reopen`
- `POST /api/exceptions`
- `PATCH /api/exceptions/:id/decision`
- `GET /api/coordinator/review-queue`
- `GET /api/deadlines`
- `GET /api/audit/:entityType/:entityId`

## Social second-wave APIs
- `GET /api/social/discover`
- `POST /api/social/connections`
- `PATCH /api/social/connections/:id/respond`
- `POST /api/social/messages`
- `POST /api/social/recommendations`
- `POST /api/social/opinions`
- `POST /api/social/reports`
- `GET /api/social/map/items`
- `GET /api/social/map/items/:id`
- `POST /api/social/map/items/:id/report`

---

# 6. Workflow-driven implementation order

Implementation order must follow workflows, not isolated screens.

## Institutional-first
1. `WF-014` + RBAC base (auth/account bootstrap)
2. `WF-001` Mobility lifecycle read model
3. `WF-003` Submission flow
4. `WF-006` Deadline governance
5. `WF-005` Exception requests
6. `WF-015` Delegation (if achievable in institutional milestone)

## Social second
7. `WF-009` Social profile / consent gating
8. `WF-010` Discovery + connection lifecycle
9. `WF-011` Accepted-connection messaging
10. `WF-012` Recommendations / opinions / favorites
11. `WF-013` Moderation queue + threshold handling
12. `WF-008` Map-based social discovery

## Final hardening
13. hardening
14. observability
15. demo scripts
16. presentation polish

---

# 7. Map integration choice

## Recommended choice
- Leaflet
- React-Leaflet
- OpenStreetMap tiles  
  or equivalent public-safe tile provider if a key is required

## Why this choice
- low complexity
- good local demo fit
- stable ecosystem
- good support for marker rendering and filtering
- easy preview/detail flows
- no vendor lock-in for the prototype

## Map rules
The map must:
- render real markers
- support filtering
- support marker preview/detail
- support reporting of mapped content
- respect moderation and visibility rules server-side

The map must not:
- do route planning
- track users in real time
- expose unsafe private locations
- behave like a generic tourism app

---

# 8. Task / phase decomposition

## Phase 0 — Discovery & architecture lock
- read all approved artifacts
- extract traceability matrix
- convert workflows + rules into backlog
- lock architecture decisions
- decide route map
- decide module boundaries

## Phase 1 — Scaffold & foundations
- Next.js + TypeScript + Tailwind + shadcn/ui + RHF + Zod + Prisma + SQLite
- base layouts
- role switch dev mode or initial auth bootstrap
- error / loading / empty state primitives
- repository foundation

## Phase 2 — Institutional core MVP (end-to-end)
- mobility record dashboard/read model
- procedure applicability listing
- submission workflow
- coordinator review queue
- decision screens
- deadline views
- exception submission/decision
- audit rendering for critical actions

## Phase 3 — Institutional hardening
- reopen/resubmit edge cases
- delegation support
- simulated integration-style incident handling
- stronger guards and transitions

## Phase 4 — Social foundation
- social profile
- consent / visibility
- student discovery
- connection lifecycle
- accepted-only messaging

## Phase 5 — Content + moderation
- recommendations / tips / reviews CRUD
- favorites
- reporting
- moderation queue
- moderation actions
- threshold hidden behavior

## Phase 6 — Real map discovery
- place context catalog
- backend-filtered map endpoint
- marker rendering
- side panel
- preview-to-detail navigation
- report action

## Phase 7 — Demo polish & reliability
- realistic seed scenarios
- Student / Coordinator / Admin demo journeys
- accessibility baseline
- i18n baseline if feasible
- visual polish
- documentation

---

# 9. Validation checkpoints after each phase

Each phase must pass at least:

- install works
- build works
- start works
- no blocking runtime errors
- routing is coherent for implemented roles
- happy path works
- one negative/rejection/exception path works
- persistence is refresh-safe where backend exists
- audit records exist for critical transitions
- no obvious cross-role access leakage
- map shows only allowed content (later phases)

No phase should be considered complete if it only “looks good”.

---

# 10. Risks and trade-offs

## Complex institutional state logic
Risk:
- workflow states become inconsistent or fragile

Mitigation:
- explicit state maps
- guard objects
- service-level transition control

## Overbuilding social too early
Risk:
- institutional core remains weak while social adds breadth

Mitigation:
- strict institutional-first phase gates

## Map privacy / moderation leakage
Risk:
- unsafe or unmoderated content reaches the map

Mitigation:
- server-filtered queries only
- no direct unsafe client joins
- moderation and visibility checks before render

## Demo fragility
Risk:
- product works only in ideal situations

Mitigation:
- deterministic seeds
- clear demo scenarios
- stable dates and data
- end-to-end test run-throughs

## Scope creep
Risk:
- extra social features dilute delivery quality

Mitigation:
- remain inside approved artifacts
- no feed
- no route planning
- no real-time tracking
- no unrelated lifestyle expansion

---

# 11. Recommended first implementation phase

## Phase 1 target
Scaffold + institutional workflow skeleton backed by real persistence.

### First sprint goals
- boot app with role-aware layouts and route groups
- Prisma schema + migrations for core institutional entities
- deterministic seed data
- implement `WF-003` minimal end-to-end:
  - student draft
  - student submit
  - coordinator approve/reject with rationale
  - reopen
  - resubmit
  - audit trail creation

## Why this first
It gives the fastest proof of:
- real backend-backed institutional value
- workflow-driven implementation
- local demo credibility
- reduced project risk early

---

# Implementation guardrails

## Must do
- follow workflows
- keep institutional core primary
- backend early
- map real, not fake
- make architectural decisions when needed
- split into as many tasks as needed if that improves quality

## Must not do
- redesign the product from scratch
- build by screen only
- leave backend until the end
- mix institutional and social navigation
- implement route planning
- implement real-time tracking
- expose private location data
- replace working architecture with hacks for speed

---

# Definition of done
The project is considered ready when it becomes a **locally runnable, reliable, client-presentable full-stack prototype**.

That means:
- app runs locally
- frontend and backend communicate correctly
- core institutional workflows work end-to-end
- social workflows work end-to-end
- map is real and functional
- navigation is coherent
- seed scenarios support a reliable demo
- product feels like a working system, not a collection of mock screens
