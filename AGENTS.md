# ErasmusMate — AGENTS.md

## Project status
This repository starts from scratch.

At the beginning of the work, the repository may contain only:
- this AGENTS.md file
- /artifacts with approved project documents
- /figma with visual references and exported screens

Assume there is no reliable implementation yet.
Do not assume an existing stable codebase.
Do not assume current frontend or backend logic is correct unless it is explicitly present and working.

---

## Mission
Build ErasmusMate as a locally runnable, client-presentable full-stack web application.

The product has two clearly separated layers:
1. a **primary institutional/manual-assisted Erasmus mobility management core**
2. a **secondary social-support layer**

The institutional core must remain primary in architecture, navigation, and implementation priority.
The social-support layer must remain clearly separated and must not distort official workflows.

---

## Source of truth
Always read these first before planning or implementing:

1. all files inside `/artifacts`
2. all files inside `/figma`
3. this `AGENTS.md`

Treat `/artifacts` as the functional and domain source of truth:
- final requirements
- business rules
- workflows
- domain diagrams
- any approved extensions or merged baselines

Treat `/figma` as visual and UX reference:
- screen structure
- navigation patterns
- layout intentions
- visual hierarchy
- role separation
- map experience

If there is any conflict:
- approved requirements/business rules/workflows from `/artifacts` prevail
- `/figma` refines presentation, not product scope

---

## Core implementation principle
Use the **approved workflows as the main implementation backbone**.

Requirements define scope.
Business rules define constraints and governing logic.
Workflows define the primary implementation order, state transitions, frontend actions, backend behavior, and end-to-end user journeys.

When in doubt:
- do not implement by screen alone
- implement by workflow / use case / lifecycle

---

## Architectural autonomy
You are explicitly allowed and expected to make strong technical decisions.

When implementation details are not fully prescribed by the repository artifacts:
- choose the architecture you judge best
- choose maintainable design patterns
- choose robust state-management and API boundaries
- choose clear module boundaries
- choose patterns that reduce fragility, duplication, and hidden coupling

Prefer:
- maintainability over hacks
- workflow-driven implementation over page-by-page patching
- full-stack coherence over frontend-only simulation
- explicit domain boundaries over ad hoc shortcuts
- simple robust architecture over overengineering

If multiple solutions are possible, choose the one that best supports:
- local execution
- demo reliability
- clear separation of concerns
- future extension
- clean reviewability

---

## Product priorities
The highest priorities are:

1. product stability
2. end-to-end workflow completion
3. frontend/backend communication
4. backend-backed persistence for key flows
5. client-demo readiness

Do not optimize for shallow breadth.
Optimize for a product that works convincingly in a demo.

---

## Required technical direction
Build a real full-stack application in the same repository.

Preferred stack:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Prisma
- SQLite

Backend direction:
- implement backend inside the same Next.js repository
- use route handlers / server actions / equivalent maintainable Next.js backend patterns
- use Prisma for schema and DB access
- use SQLite for local development/demo
- add seed data
- use real backend persistence for the highest-value flows
- keep mocks only temporarily and only where replacement has not yet happened

Frontend direction:
- responsive web app
- role-aware navigation
- institutional core clearly separated from social layer
- robust data fetching and mutation patterns
- stable navigation and route coherence
- strong loading / error / empty / success handling

---

## Map requirement
Do not leave the map as a fake/static placeholder.

The social map area must use a **real map integration** suitable for local demo use.

Requirements:
- real map library
- public map tiles or equivalent
- marker rendering for Erasmus-relevant public content
- detail/preview flow from markers
- filtering support
- moderation/privacy constraints respected

Still preserve:
- no route planning
- no real-time user tracking
- no exposure of unsafe private locations
- no generic tourism-only behavior

Choose the map stack you consider most maintainable and appropriate for the current product.

---

## Scope guardrails
Do NOT:
- redesign the product from scratch
- invent major scope beyond the approved repository artifacts
- merge institutional and social navigation into one confusing space
- add open-ended social-media feed behavior
- add route planning
- add real-time geolocation tracking of users
- expose private personal addresses or sensitive location data
- postpone backend until the very end
- leave core flows as decorative UI only

Do:
- preserve the approved institutional core
- preserve the approved social-support scope
- keep social-support secondary but meaningful
- build real end-to-end behavior for the most important workflows

---

## Implementation strategy
You may decompose the work into as many phases, tasks, or subproblems as needed.

You are encouraged to split by:
- workflow
- module
- technical concern
- role area
- frontend stabilization vs backend foundation
- map integration
- integration and polish

Do not force everything into one giant implementation batch if phased execution is safer or better.

Preferred execution order:
1. planning and architectural decisions
2. project scaffolding and foundation
3. routing / navigation / role coherence
4. institutional core workflows
5. social-support workflows
6. map integration
7. backend foundation
8. frontend/backend integration
9. polish and client-demo readiness

If you judge another order better, explain why in the plan.

---

## High-value workflows to implement first
These workflows are the implementation backbone:

### Institutional core
- student submission flow
- coordinator review / reject / reopen / approve flow
- exception request flow
- procedure/deadline-sensitive mobility management flow

### Social-support layer
- student discovery / connection flow
- accepted-connection messaging flow
- recommendation / tip / review creation and moderation flow
- map-based social discovery flow

Implement them as real working flows, not as disconnected screens.

---

## Design-pattern expectations
Apply reasonable software design patterns where useful.

Good patterns include, when appropriate:
- repository/service separation
- domain-oriented modules
- validation boundaries
- clear DTO/form/schema separation
- role-aware route/layout separation
- shared UI primitives
- server/client responsibility separation
- explicit workflow state handling
- robust error boundaries and safe data loading patterns

Do not add patterns just for elegance.
Use them when they improve maintainability and correctness.

---

## Planning requirements
When asked to `/plan`, produce a serious execution plan before coding.

The plan should include:
1. root-cause analysis of current or likely instability
2. workflow-driven implementation order
3. recommended architecture
4. recommended design patterns and why
5. database entities to implement first
6. API endpoints to implement first
7. map integration choice and why
8. task decomposition into phases/modules/workflows
9. validation checkpoints after each phase
10. risks and trade-offs
11. recommended first implementation phase

If the repository contains no implementation yet, the plan must explicitly start from:
- reading artifacts
- synthesizing architecture
- scaffolding the app
- then implementing workflows in priority order

Do not start coding in a `/plan` response unless explicitly asked.

---

## Validation discipline
After each implementation phase, validate before moving on.

Minimum validation expectations:
- project installs
- app compiles
- app boots
- no blocking runtime errors on first load
- routing works
- role-based navigation is coherent
- implemented flows are actually usable
- backend-backed flows persist and return consistent data

If a phase is unstable, fix it before moving on.

---

## Definition of done
The project is not done when it merely looks complete.

It is done when:
- the app runs locally
- frontend and backend communicate properly
- the main institutional workflows work end-to-end
- the main social workflows work end-to-end
- the map is real and functional
- role-based navigation is coherent
- the product is reliable enough to present to a client as a convincing demo

Prefer a smaller but working product over a larger but shallow one.

---

## First-run instruction
If this repository contains only `/artifacts`, `/figma`, and `AGENTS.md`, then your first responsibility is:

1. read all source artifacts
2. infer the best architecture and implementation plan
3. propose a phased workflow-driven plan
4. only after approval, begin implementation
