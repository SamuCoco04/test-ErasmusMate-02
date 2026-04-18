# ErasmusMate — Phase 2 (Institutional Core MVP)

This phase extends the institutional foundation to deliver end-to-end workflow coverage for:
- mobility dashboard/read model (WF-001)
- procedure applicability listing (REQ-018)
- submission + coordinator review flow (WF-003)
- deadline views/governance read model (WF-006)
- exception submission and decision flow (WF-005)
- critical-action audit rendering (REQ-072/REQ-073)

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite
- Zod validation at route boundaries

## Institutional routes
- Student dashboard: `/student/dashboard?userId=student-1`
- Student submissions: `/student/submissions?userId=student-1`
- Student deadlines: `/student/deadlines?userId=student-1`
- Student exceptions: `/student/exceptions?userId=student-1`
- Coordinator queue: `/coordinator/review-queue?userId=coordinator-1`
- Coordinator deadlines: `/coordinator/deadlines?userId=coordinator-1`
- Coordinator exceptions: `/coordinator/exceptions?userId=coordinator-1`

## APIs introduced in phase 2
- `GET /api/mobility-records`
- `GET /api/procedures/applicable`
- `GET /api/deadlines`
- `GET /api/exceptions`
- `POST /api/exceptions`
- `PATCH /api/exceptions/:exceptionId/decision`

## Notes
- Social layer is intentionally not started in this phase.
- Workflow transitions remain backend-enforced and audit-backed.
