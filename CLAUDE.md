# Kanban Task Manager — Project Context

## Overview

Fullstack Kanban task manager built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, and Prisma. Portfolio project demonstrating modern fullstack architecture with drag & drop, authentication, and clean code practices.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests (run once)
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest with coverage
npm run test:e2e     # Playwright E2E tests
npm run test:all     # Unit + E2E
npm run format       # Prettier format all
npx tsc --noEmit     # Type check without build

# Database
docker compose up -d       # Start PostgreSQL
npx prisma migrate dev     # Run migrations
npx prisma db push         # Push schema changes
npx prisma studio          # Open Prisma Studio
npx prisma db seed         # Seed database
```

## Architecture

### Layer Pattern (Service/Repository)

```
Route Handler / Server Action
        |
   Service (business logic + Zod validation)
        |
   Repository (Prisma queries — ONLY layer that talks to DB)
        |
   PostgreSQL
```

### State Management

- **React Query** — Server state (data from DB: tasks, boards, columns)
- **Zustand** — UI state only (modals, sidebar, theme)
- **Rule**: If data comes from the server, it goes in React Query. If it's UI state, Zustand. Never duplicate.

### Key Directories

```
src/
├── app/           Next.js App Router (pages + API routes)
├── components/    UI components (board/, ui/, layout/, auth/)
├── hooks/         React Query hooks
├── services/      Business logic (server-side)
├── repositories/  Prisma queries (only DB access layer)
├── schemas/       Zod schemas (shared frontend <-> backend)
├── store/         Zustand stores (UI state only)
├── lib/           Config & utilities (prisma.ts, auth.ts, utils.ts)
├── types/         TypeScript types/interfaces
docs/
├── planning/      Base project docs (don't modify per feature)
├── standards/     Code, UI/UX, Testing standards
├── features/      Feature plans (Planner creates before coding)
├── reviews/       Review reports (Reviewer creates after review)
├── decisions/     ADRs (Architecture Decision Records)
├── roadmap/       Sprint roadmap
tests/
├── e2e/           Playwright E2E tests (.spec.ts)
├── setup/         Vitest setup
├── helpers/       Test utilities (render wrappers, mocks)
```

## Agent Workflow

Three agents work on each feature in sequence:
1. **Planner** — Creates `docs/features/feat-[name].md` BEFORE any coding
2. **Coder** — Implements the plan, writes tests alongside code
3. **Reviewer** — Reviews against standards, creates `docs/reviews/review-[name].md`

**Rule**: No agent advances without documentation. See `docs/planning/02-AGENT-WORKFLOW.md`.

## Critical Rules

- **Zero `any`** — use `unknown` + Zod or proper types
- **Session check** on all API routes (NextAuth)
- **Zod shared** between frontend (React Hook Form) and backend (API validation)
- **Layer separation** — only repositories import Prisma
- **All UI states** — loading (skeleton), empty, error, success
- **Tests must pass** before merge: `npm run test && npm run build`
- **Conventional commits**: `feat(scope):`, `fix(scope):`, `test(scope):`

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL 16 (Docker) + Prisma ORM
- **Auth**: NextAuth.js (GitHub + Google OAuth + Credentials)
- **State**: React Query (server) + Zustand (UI)
- **Forms**: React Hook Form + Zod
- **Drag & Drop**: @hello-pangea/dnd
- **Testing**: Vitest + React Testing Library + Playwright
- **Formatting**: Prettier + ESLint + Husky + lint-staged
