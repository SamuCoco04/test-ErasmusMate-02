# ErasmusMate — Phase 1 (Institutional Foundation)

This phase implements the first backend-backed institutional workflow skeleton (WF-003) with a local full-stack foundation.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- shadcn-style UI primitives (local components)
- Prisma + SQLite
- Zod + React Hook Form (foundation included)

## Architectural choices
- **Institutional-first route grouping** under `src/app/(institutional)` with separate layouts for Student, Coordinator, and Administrator.
- **Workflow-driven backend module** (`src/modules/submissions/service.ts`) where state transition guards enforce WF-003 lifecycle paths.
- **Audit-first transitions**: each critical state change writes `SubmissionEvent` and `AuditRecord` in the same transaction.

## WF-003 delivered
- Student: create draft, submit, resubmit (when allowed)
- Coordinator: start review, approve, reject with rationale, reopen with rationale
- Persistence and audit trail are backend-backed (Prisma + SQLite)

## Local run
1. Install dependencies
   ```bash
   npm install
   ```
2. Apply migration and generate Prisma client
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
3. Seed deterministic demo data
   ```bash
   npm run db:seed
   ```
4. Start app
   ```bash
   npm run dev
   ```

## Demo routes
- Student: `http://localhost:3000/student/submissions?userId=student-1`
- Coordinator: `http://localhost:3000/coordinator/review-queue?userId=coordinator-1`
