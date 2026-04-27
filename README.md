# ErasmusMate — Phase 7 Demo Polish & Reliability

ErasmusMate is a locally runnable, full-stack Next.js prototype with:

- **Primary institutional Erasmus mobility management workflows** (student/coordinator/admin)
- **Secondary social-support layer** (discovery, connections, messaging, content, moderation, map)
- Prisma + SQLite persistence and deterministic demo seeding

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + reusable UI primitives
- Prisma + SQLite
- Zod validation for API boundaries

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma client and apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
3. Seed deterministic demo data:
   ```bash
   npm run db:seed
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

## Demo users and role routes

Use `/` as the demo entry screen to switch presets (student/coordinator/admin) quickly.
Query-parameter deep links remain fully supported and continue to carry deterministic identity context for scripted walkthroughs.

### Institutional layer
- Student dashboard: `/student/dashboard`
- Student submissions: `/student/submissions`
- Coordinator queue: `/coordinator/review-queue`
- Admin dashboard: `/admin`
- *(Scripted deep-link equivalents keep working, e.g. `/student/dashboard?userId=student-1`)*

### Institutional layer (deep-link mode)
- Student dashboard: `/student/dashboard?userId=student-1`
- Student submissions: `/student/submissions?userId=student-1`
- Student deadlines: `/student/deadlines?userId=student-1`
- Student exceptions: `/student/exceptions?userId=student-1`
- Coordinator queue: `/coordinator/review-queue?userId=coordinator-1`
- Coordinator deadlines: `/coordinator/deadlines?userId=coordinator-1`
- Coordinator exceptions: `/coordinator/exceptions?userId=coordinator-1`
- Admin dashboard: `/admin?userId=admin-1`
- Admin moderation queue: `/admin/moderation?userId=admin-1`

### Social layer
- Social home: `/social`
- Discover + connections: `/social/discover`
- Messages: `/social/messages`
- Content board: `/social/content`
- Map discovery: `/social/map`
- *(Deep-link mode with `?userId=student-1` remains available.)*

### Social layer (deep-link mode)
- Social home: `/social?userId=student-1`
- Discover + connections: `/social/discover?userId=student-1`
- Messages: `/social/messages?userId=student-1`
- Content board: `/social/content?userId=student-1`
- Map discovery: `/social/map?userId=student-1`

## Phase 7 demo journeys (seed-backed)

### 1) Student submission + coordinator decision
1. Open `/student/submissions?userId=student-1`.
2. Review seeded draft (`sub-1`) and rejected case (`sub-2`).
3. Submit or resubmit from student view.
4. Open `/coordinator/review-queue?userId=coordinator-1` and run start review / approve / reject / reopen.

### 2) Exception request workflow
1. Open `/student/exceptions?userId=student-1` and submit a new exception.
2. Open `/coordinator/exceptions?userId=coordinator-1`.
3. Process requests through start review / approve / reject / apply / close.

### 3) Discovery → connection → messaging
1. Open `/social/discover?userId=student-1` to view discoverable peers.
2. Send or respond to seeded pending requests.
3. Open `/social/messages?userId=student-1` to message accepted connections.

### 4) Content + moderation + admin queue
1. Open `/social/content?userId=student-1` and create/report/favorite items.
2. Open `/admin/moderation?userId=admin-1` for review queue actions.
3. Confirm moderation states are reflected in social content visibility.

### 5) Map discovery
1. Open `/social/map?userId=student-1`.
2. Apply filters, select markers, open detail, and report from map panel.
3. Verify map lists only approved/public place contexts and visible content.

## Reliability & demo notes

- Data is deterministic: rerun `npm run db:seed` to reset to baseline.
- Main role journeys persist across refresh and navigation.
- Institutional and social layers remain separated by route groups and shell layouts.
- Accessibility baseline improvements include clearer empty/loading/error states and better interactive control semantics in key institutional pages.
