# ErasmusMate — PLAN.md

## Iteration context
This plan replaces the previous first-iteration execution plan as the **current main plan** for the second iteration.

This iteration is focused on:
- improving product quality
- improving visual alignment with the mockups
- refining the institutional core
- preserving the existing institutional + social baseline
- adding a realistic structured academic workflow for course equivalences
- keeping the product locally runnable, backend-backed, and demo-ready

This is **not** a full platform redesign.

---

# 1. Executive recommendation

Implement this as a second-iteration institutional refinement called a **Learning Agreement workflow (table-first)**.

## Recommended approach
- Add a new structured academic workflow inside the institutional core.
- Keep the current institutional and social baseline intact.
- Start with a **minimal auditable model**:
  - proposal
  - rows
  - events
- Use a **derived summary view** in `My Mobility Record` first.
- Do **not** introduce an early materialized snapshot unless later justified.
- Treat UI quality and coordinator ergonomics as first-class iteration goals.
- Keep all other institutional procedures on the current upload/review model.

---

# 2. Recommended naming and product framing

## UX-facing naming
Recommended labels:

- **Editable artifact:** Learning Agreement (Course Equivalences)
- **Student working page:** My Learning Agreement
- **Coordinator page:** Learning Agreement Review
- **Final read-only view:** Mobility Record – Academic Summary

## Product framing
`My Mobility Record` remains the umbrella institutional page.

Inside it, clearly separate:

1. **Learning Agreement**
   - editable / reviewable workflow artifact
   - row-based academic equivalence proposal

2. **Academic Summary**
   - read-only polished view
   - derived from approved latest rows
   - official-looking institutional summary

This keeps the Erasmus language natural and avoids overly technical labels.

---

# 3. Refined workflow model

## Student workflow
1. Create or edit Learning Agreement rows.
2. Save draft.
3. Submit for coordinator review.
4. Receive row-level outcomes:
   - approved
   - denied
5. Revise denied rows.
6. Optionally revise previously approved rows using safe revision semantics.
7. Resubmit.
8. Once accepted, view approved rows in Academic Summary.

## Coordinator workflow
1. Open Learning Agreement Review queue/detail.
2. Review rows individually.
3. Approve or deny each row.
4. Deny requires rationale.
5. Optionally leave review notes/rationales visible to student.
6. Finalize aggregate proposal outcome:
   - accepted
   - partially approved
   - changes requested

## Safe approved-row edit rule
If a student edits an already approved row:

- do **not** mutate the approved row in place
- create a **new revision row**
- new revision row returns to review state
- previous approved row remains immutable historical evidence

This rule is mandatory.

---

# 4. Minimal viable data model

The first implementation slice should use only what is necessary.

## Core entities

### LearningAgreement
Proposal-level artifact.

Suggested fields:
- `id`
- `mobilityRecordId`
- `studentId`
- `coordinatorId`
- `state`
- `version`
- `submittedAt`
- `lastReviewedAt`
- `acceptedAt`
- timestamps

### LearningAgreementRow
Row-level equivalence proposal.

Suggested fields:
- `id`
- `agreementId`
- `rowKey` (logical row identity across revisions)
- `revision`
- `supersedesRowId` (nullable)
- `isLatest`
- `homeCourseCode`
- `homeCourseName`
- `destinationCourseCode`
- `destinationCourseName`
- `ects`
- `semester`
- `grade` (nullable, optional, non-governing in first slice)
- `status`
- `decisionRationale` (nullable)
- `reviewedById` (nullable)
- `reviewedAt` (nullable)
- timestamps

### LearningAgreementEvent
Append-only workflow/event history.

Suggested fields:
- `id`
- `agreementId`
- `rowId` (nullable when event is agreement-level)
- `actorId`
- `actionType`
- `fromState` (nullable)
- `toState` (nullable)
- `noteOrRationale` (nullable)
- `createdAt`

## Why this is enough
This model supports:
- draft/edit/submit
- row-level review
- denial rationale
- partial approval
- safe approved-row revisions
- auditable history

without introducing unnecessary complexity too early.

---

# 5. Deferred / optional later-model extensions

Defer these unless implementation proves they are necessary:

- separate `LearningAgreementRowDecision` table
- separate threaded comment entity
- materialized `PublishedAcademicPlan` snapshot table
- advanced grade history entity
- bulk-decision tooling
- rubric-like metadata

## Rationale
The second iteration should remain pragmatic and implementable.
Start with the smallest correct model.

---

# 6. API plan

Use an institutional namespace such as:

- `/api/learning-agreements/*`

## Core endpoints

### Agreement lifecycle
- `POST /api/learning-agreements`
  - create draft agreement for a mobility record, or return active draft

- `GET /api/learning-agreements/:id`
  - agreement detail for authorized student/coordinator/admin
  - returns agreement, latest rows, event history, permissions

- `PATCH /api/learning-agreements/:id`
  - update agreement metadata if needed

### Row operations
- `POST /api/learning-agreements/:id/rows`
  - add row

- `PATCH /api/learning-agreements/:id/rows/:rowId`
  - edit row
  - if row is approved, create new revision row instead of mutating in place

### Workflow transitions
- `POST /api/learning-agreements/:id/submit`
  - submit for review

- `POST /api/learning-agreements/:id/rows/:rowId/decision`
  - coordinator approve/deny row
  - deny requires rationale

- `POST /api/learning-agreements/:id/resubmit`
  - resubmit after denied-row revision checks

### Read models
- `GET /api/learning-agreements/review-queue?coordinatorId=...`
  - coordinator queue

- `GET /api/mobility-records/:id/academic-summary`
  - derived read model for final summary view

## Optional later endpoints
- reopen endpoint
- dedicated comments endpoint
- publish/snapshot endpoint if snapshotting is later introduced

## RBAC requirement
Endpoints must enforce role access on the backend:

- student detail only for owning student and authorized institutional roles
- coordinator review/detail only for assigned coordinator and authorized institutional roles
- academic summary only for owning student and authorized institutional roles

Do not rely on frontend-only protection.

---

# 7. UI plan

This is a product-quality iteration, so UX is first-class.

## Student experience

### My Learning Agreement
Table-first editable page with:
- strong column structure
- row status badges
- inline validation
- clear draft/save/submit actions
- filters:
  - all
  - denied
  - approved
  - in review

### Resubmission-focused UX
The student must clearly see:
- denied rows
- coordinator rationale
- what still requires change
- whether resubmission is currently blocked

Recommended elements:
- denied-row highlighting
- checklist summary
- “Denied rows still unchanged” warning
- clear resubmit affordance

### Mobility Record – Academic Summary
Read-only polished institutional summary showing:
- latest approved rows
- course equivalences
- ECTS
- semester
- official-looking visual treatment aligned with mockup direction

## Coordinator experience

### Learning Agreement Review
Recommended structure:
- queue/list of agreements needing action
- detail panel for selected agreement
- row-by-row review workspace
- approve/deny per row
- rationale input required on deny
- progress indicators:
  - approved count
  - denied count
  - pending count

### UX goals
- minimize clicks
- make pending work obvious
- preserve institutional seriousness
- expose traceability without clutter

## First-slice visibility rule for comments/rationales
The first slice should support:
- student-visible denial rationales
- event notes visible where appropriate

Internal coordinator-only discussion threads are deferred.

---

# 8. State model

## Record-level states
Minimal set:

- `DRAFT`
- `SUBMITTED`
- `IN_REVIEW`
- `PARTIALLY_APPROVED`
- `CHANGES_REQUESTED`
- `ACCEPTED`

`PUBLISHED` is deferred unless a materialized snapshot is later introduced.

## Row-level states
Required set:

- `IN_REVIEW`
- `APPROVED`
- `DENIED`

## Record-level transitions
- `DRAFT -> SUBMITTED`
- `SUBMITTED -> IN_REVIEW`

- `IN_REVIEW -> ACCEPTED`
  - only if all latest rows are approved

- `IN_REVIEW -> PARTIALLY_APPROVED`
  - if latest rows contain both approved and denied outcomes

- `IN_REVIEW -> CHANGES_REQUESTED`
  - if no latest rows are approved, or coordinator explicitly returns the agreement for revision before acceptance

- `PARTIALLY_APPROVED -> SUBMITTED`
  - on valid resubmission

- `CHANGES_REQUESTED -> SUBMITTED`
  - on valid resubmission

## Row-level transitions
- `IN_REVIEW -> APPROVED`
- `IN_REVIEW -> DENIED`

- denied-row revision:
  - prior denied row remains as history
  - new latest row revision becomes reviewable again

- approved-row edit:
  - old approved row stays immutable
  - new latest revision enters review again

## Important clarification
Rows belong to an agreement that may be in `DRAFT`, but the row-level review lifecycle becomes meaningful once the agreement enters a review cycle.
Do not invent in-place mutable approved states.

---

# 9. Validation and workflow rules

## Required row fields
Each row must require:
- home course code
- home course name
- destination course code
- destination course name
- ECTS
- semester

## Grade rule
For the first slice:
- `grade` is optional
- `grade` is nullable
- `grade` is non-governing
- `grade` must not be required for agreement approval

This avoids mixing equivalence planning with final recognition too early.

## Submission guards
Submission must be blocked if:
- the agreement has zero rows
- required row fields are missing
- invalid ECTS or semester values exist
- duplicate/conflicting equivalence rows exist
- latest rows fail schema validation

## Decision guards
A coordinator decision must be blocked if:
- coordinator is not authorized for that agreement
- row is not latest revision
- row is incomplete
- deny is attempted without rationale

## Resubmission guard
If any latest row is denied:
- the student must revise denied rows before resubmitting

“Revise” must mean:
- actual row change
- or explicit replacement revision

A denied row must not be resubmitted unchanged.

## Aggregate-state computation rule
The record-level state must always be computed from **latest row revisions**, not from stale historical rows.

---

# 10. Integration with existing institutional flows

## Coexistence rule
This workflow replaces the generic upload/review model **only for the academic-equivalence / Learning Agreement process**.

All other official procedures remain on the current:
- document upload
- submission
- review
- deadline
- exception

model.

## Integration points
- reuse coordinator authorization patterns
- reuse audit infrastructure style
- reuse deadline integration only if a Learning Agreement deadline is configured
- keep exception requests separate, with later linkage only if clearly needed
- leave social modules untouched except for preserving separation

This is an institutional vertical slice, not a platform-wide rewrite.

---

# 11. Incremental delivery strategy

## Phase A — Minimal vertical slice
Must-have implementation:
- schema for agreement + row + event
- student draft/edit/submit
- coordinator row decisions
- partial approval
- denied-row resubmission enforcement
- derived academic summary in mobility record

## Phase B — Product-quality refinement
Second-iteration quality improvements:
- stronger visual alignment with mockups
- better table ergonomics
- better row-level rationale UX
- coordinator productivity improvements
- polished summary presentation

## Phase C — Controlled enhancements
Optional later additions:
- dedicated comments entity
- reopen endpoint/workflow polish
- snapshot materialization if truly needed
- expanded grade lifecycle tools

## Migration/coexistence strategy
- introduce as a new institutional vertical slice and route
- keep legacy submissions untouched for non-academic procedures
- migrate only the academic-equivalence path to this workflow

---

# 12. Risks / trade-offs

## Too-minimal model risk
Event-based notes may feel limited.
This is acceptable for the first slice.

## Revision complexity
Safe approved-row revision introduces complexity, but it is necessary for institutional integrity and auditability.

## UI density
Row-level review can become dense.
Requires filtering, hierarchy, and progressive disclosure.

## State ambiguity risk
Must compute agreement state strictly from latest row revisions.

## Grade scope creep
If grade becomes central too early, it can derail delivery.
Keep it secondary for now.

---

# 13. Definition of done

This workflow is done when all of the following are true:

- student can create, edit, and submit Learning Agreement rows with backend persistence
- coordinator can approve or deny rows individually with rationale
- partial approval works and is clearly visible
- denied rows must be revised before resubmission, and this is server-enforced
- approved rows are never silently mutable; edits create reviewable revisions
- full workflow is auditable via event history and audit records
- `My Mobility Record` shows a polished read-only Academic Summary derived from latest approved rows
- other institutional procedures continue using the current upload/review flow unchanged
- institutional/social separation remains intact
- the UX is coherent, demo-ready, and aligned with second-iteration quality goals
