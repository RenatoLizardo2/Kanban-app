# Roadmap

PlanBoard — Kanban Task Manager with drag & drop, auth, and clean architecture

## Deployment assumptions

- Branch: `main`
- Single developer (solo portfolio project)
- Agent workflow: Planner -> Coder -> Reviewer per feature
- Each phase must be stable before advancing to the next
- Conventional commits: `type(scope): description`

## Status legend

| Status        | Meaning                                        | Who changes it |
| ------------- | ---------------------------------------------- | -------------- |
| `pending`     | Not started                                    | —              |
| `claimed`     | Plan created, branch pushed, waiting for Coder | Planner        |
| `in_progress` | Implementation underway                        | Coder          |
| `completed`   | Approved by Reviewer, ready for merge          | Reviewer       |

**Task-level markers:**

- `- [ ]` = pending
- `- [ ] Task (claimed)` = Planner has created a plan covering this task
- `- [x]` = completed

## Workstreams

### Backend (bottom-up per feature)

- Prisma schema, repositories, services, API route handlers
- Zod schemas (shared with frontend)
- NextAuth configuration

### Frontend (top-down per feature)

- React Query hooks, Zustand stores
- Components (board, ui, layout, auth)
- Forms with React Hook Form + Zod resolver

---

# Phase 0 — Project Foundations

**Goal:** Working dev environment with database, tooling, and base infrastructure ready to build features on top of.

**Sprint:** 1
**Status:** completed

## Backend / Infra

- [x] Create `docker-compose.yml` with PostgreSQL 16
- [x] Create `.env` and `.env.example` with all required variables
- [x] Install and initialize Prisma (`npx prisma init`)
- [x] Write complete `prisma/schema.prisma` (User, Account, Session, VerificationToken, Board, Column, Task, Priority enum)
- [ ] Run initial migration (`npx prisma migrate dev --name init`) — pending Docker setup
- [x] Create Prisma Client singleton (`src/lib/prisma.ts`)
- [x] Create utility helpers (`src/lib/utils.ts` with `cn()`)
- [x] Create custom error classes (`src/lib/errors.ts` — NotFoundError, UnauthorizedError, ValidationError)

## Frontend / Tooling

- [x] Configure Tailwind CSS 4 with CSS variables (design tokens from UI standards)
- [x] Set up `globals.css` with color variables (light + dark mode tokens)
- [x] Configure Prettier (`.prettierrc` + `.prettierignore`)
- [x] Configure Husky + lint-staged (pre-commit hook)
- [x] Update `package.json` scripts (test, format, db commands)
- [x] Configure `tsconfig.json` with strict mode options

## Testing Setup

- [x] Install and configure Vitest (`vitest.config.mts` + `tests/setup/vitest.setup.ts`)
- [x] Install and configure Playwright (`playwright.config.ts`)
- [x] Create test helpers (`tests/helpers/render-with-providers.tsx`, `tests/helpers/mock-session.ts`)

## Shared

- [x] Create folder structure under `src/` (components, hooks, services, repositories, schemas, store, lib, types)
- [x] Verify `npm run dev` starts correctly
- [x] Verify `npm run build` compiles without errors
- [ ] Verify Docker + Prisma connection works — pending Docker setup

**Exit criteria:** `docker compose up -d && npm run dev` works, Prisma connects to DB, build passes, test runner works.

---

# Phase 1 — Authentication

**Goal:** Users can register, login (credentials + OAuth), and logout. Protected routes redirect unauthenticated users.

**Sprint:** 1-2
**Status:** pending

## Backend

- [ ] Configure NextAuth (`src/lib/auth.ts` + `src/lib/auth.config.ts`)
- [ ] Create NextAuth API route (`src/app/api/auth/[...nextauth]/route.ts`)
- [ ] Set up GitHub OAuth provider
- [ ] Set up Google OAuth provider
- [ ] Set up Credentials provider with bcrypt password hashing
- [ ] Create `auth.schema.ts` (loginSchema, registerSchema)
- [ ] Create auth service (`src/services/auth.service.ts` — register with password hash)
- [ ] Create user repository (`src/repositories/user.repository.ts`)
- [ ] Add session check utility for API routes

## Frontend

- [ ] Create `LoginForm` component (`src/components/auth/login-form.tsx`) with React Hook Form + Zod
- [ ] Create `RegisterForm` component (`src/components/auth/register-form.tsx`)
- [ ] Create auth pages (`src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`)
- [ ] Create `(auth)` layout — centered, no sidebar
- [ ] Create `useAuth` hook (`src/hooks/useAuth.ts` — session wrapper)
- [ ] Implement middleware for protected routes (`src/middleware.ts`)
- [ ] Add OAuth sign-in buttons (GitHub, Google)

## UI Components (needed by auth)

- [ ] Create `Button` component (`src/components/ui/button.tsx`) — all variants and states
- [ ] Create `Input` component (`src/components/ui/input.tsx`) — with label, error display
- [ ] Create `Toast` component/system (`src/components/ui/toast.tsx`)

## Tests

- [ ] Unit: `auth.schema.test.ts`
- [ ] Unit: `auth.service.test.ts`
- [ ] Component: `login-form.test.tsx`
- [ ] Component: `register-form.test.tsx`
- [ ] E2E: `tests/e2e/auth.spec.ts` (register, login, logout, invalid credentials)

**Exit criteria:** User can register with email/password, login with credentials or OAuth, session persists, protected routes redirect to `/login`.

---

# Phase 2 — Board & Column CRUD + Dashboard

**Goal:** Authenticated users can create, view, edit, and delete boards. Each board has columns. Dashboard shows list of user's boards.

**Sprint:** 2-3
**Status:** pending

## Backend

- [ ] Create `board.schema.ts` (createBoardSchema, updateBoardSchema)
- [ ] Create `column.schema.ts` (createColumnSchema, updateColumnSchema)
- [ ] Create `board.repository.ts` (create, findById, findByUserId, update, delete)
- [ ] Create `column.repository.ts` (create, findByBoardId, update, delete, reorder)
- [ ] Create `board.service.ts` (CRUD + ownership validation + auto-create default columns: To Do, In Progress, Done)
- [ ] Create `column.service.ts` (CRUD + board ownership check)
- [ ] Create API routes:
  - [ ] `GET/POST /api/boards` (list user boards, create board)
  - [ ] `GET/PUT/DELETE /api/boards/[boardId]` (single board operations)
  - [ ] `GET /api/boards/[boardId]/columns` (columns of a board)
  - [ ] `PUT/DELETE /api/columns/[columnId]` (column operations)

## Frontend

- [ ] Create `useBoards` hook (React Query — list, create, update, delete)
- [ ] Create `useBoard` hook (React Query — single board with columns)
- [ ] Create dashboard page (`src/app/(dashboard)/page.tsx`) — list of boards as cards
- [ ] Create `(dashboard)` layout with sidebar + navbar
- [ ] Create `Sidebar` component (`src/components/layout/sidebar.tsx`) — board list, create button
- [ ] Create `Navbar` component (`src/components/layout/navbar.tsx`) — user info, logout
- [ ] Create board card component for dashboard
- [ ] Create "Create Board" modal with form
- [ ] Create "Edit Board" modal
- [ ] Create "Delete Board" confirmation dialog
- [ ] Implement empty state for dashboard (no boards yet)
- [ ] Implement loading skeletons for dashboard

## UI Components (needed by boards)

- [ ] Create `Modal` component (`src/components/ui/modal.tsx`) — overlay, close on Esc, focus trap
- [ ] Create `Loading` / Skeleton component (`src/components/ui/loading.tsx`)
- [ ] Create `ConfirmDialog` component

## Zustand Store

- [ ] Create `ui.store.ts` — sidebar open/closed, active modal, theme

## Tests

- [ ] Unit: `board.schema.test.ts`
- [ ] Unit: `board.service.test.ts`
- [ ] Unit: `column.service.test.ts`
- [ ] Component: `sidebar.test.tsx`
- [ ] Component: create board modal test
- [ ] E2E: `tests/e2e/board-crud.spec.ts` (create, edit, delete board)

**Exit criteria:** User sees dashboard with boards, can CRUD boards, each board auto-creates 3 columns, sidebar navigation works.

---

# Phase 3 — Task CRUD + Kanban Board View

**Goal:** Users can create, edit, and delete tasks within columns. The board page shows a Kanban view with columns and task cards.

**Sprint:** 3
**Status:** pending

## Backend

- [ ] Create `task.schema.ts` (createTaskSchema, updateTaskSchema)
- [ ] Create `task.repository.ts` (create, findByColumnId, findById, update, delete, countByColumn)
- [ ] Create `task.service.ts` (CRUD + auto-order + board ownership check)
- [ ] Create API routes:
  - [ ] `POST /api/tasks` (create task in column)
  - [ ] `GET/PUT/DELETE /api/tasks/[taskId]` (single task operations)

## Frontend

- [ ] Create `useTasks` hook (React Query — tasks by board, create, update, delete mutations)
- [ ] Create board page (`src/app/(dashboard)/board/[boardId]/page.tsx`)
- [ ] Create `BoardView` component (`src/components/board/board-view.tsx`) — horizontal columns layout
- [ ] Create `Column` component (`src/components/board/column.tsx`) — column header + task list
- [ ] Create `TaskCard` component (`src/components/board/task-card.tsx`) — title, priority indicator, actions
- [ ] Create `CreateTaskModal` component (`src/components/board/create-task-modal.tsx`)
- [ ] Create `EditTaskModal` component (`src/components/board/edit-task-modal.tsx`)
- [ ] Create "Delete Task" confirmation
- [ ] Implement empty state per column (no tasks)
- [ ] Implement loading skeletons for board view
- [ ] Priority indicator (color-coded: LOW blue, MEDIUM yellow, HIGH red)

## Tests

- [ ] Unit: `task.schema.test.ts`
- [ ] Unit: `task.service.test.ts`
- [ ] Component: `task-card.test.tsx`
- [ ] Component: `board-view.test.tsx`
- [ ] E2E: `tests/e2e/task-crud.spec.ts` (create, edit, delete task)

**Exit criteria:** Board page shows columns with tasks, user can CRUD tasks, tasks display priority, all CRUD operations persist to DB.

---

# Phase 4 — Drag & Drop

**Goal:** Users can reorder tasks within a column and move tasks between columns via drag & drop, with changes persisted to DB.

**Sprint:** 3-4
**Status:** pending

## Backend

- [ ] Create `reorder.schema.ts` (reorderTaskSchema — taskId, sourceColumnId, destinationColumnId, newOrder)
- [ ] Add reorder method to `task.repository.ts` (batch update order + columnId)
- [ ] Add reorder logic to `task.service.ts` (validate ownership, recalculate orders)
- [ ] Create API route: `PUT /api/tasks/reorder`

## Frontend

- [ ] Integrate `@hello-pangea/dnd` in `BoardView` (DragDropContext)
- [ ] Wrap columns with `Droppable`
- [ ] Wrap task cards with `Draggable`
- [ ] Implement `handleDragEnd` with optimistic update via React Query
- [ ] Add rollback on API error (revert cache to previous state)
- [ ] Visual feedback: drag preview, drop placeholder, cursor changes (grab/grabbing)
- [ ] Keyboard accessibility for drag & drop (already supported by @hello-pangea/dnd — verify not disabled)
- [ ] `aria-live` announcements for position changes

## Tests

- [ ] Unit: `reorder.schema.test.ts`
- [ ] Unit: reorder logic in `task.service.test.ts`
- [ ] Component: drag & drop integration test
- [ ] E2E: `tests/e2e/kanban-dnd.spec.ts` (move task between columns, reorder within column)

**Exit criteria:** Drag & drop works between columns and within columns, order persists after refresh, optimistic update with rollback works, keyboard accessible.

---

# Phase 5 — Polish & Error Handling

**Goal:** Production-quality UX with proper loading states, error handling, responsive design, and accessibility across the entire app.

**Sprint:** 4
**Status:** pending

## Responsive Design

- [ ] Mobile layout: columns in vertical stack or horizontal scroll
- [ ] Sidebar: collapsible on tablet, hamburger on mobile
- [ ] Touch targets: minimum 44x44px on all interactive elements
- [ ] Test on mobile breakpoints (< 640px, 640-1024px)

## Error Handling & Feedback

- [ ] Global error boundary component
- [ ] Toast notifications for all CRUD operations (success + error)
- [ ] API error responses: consistent `{ error, details? }` format across all routes
- [ ] Form validation: inline errors with descriptive messages
- [ ] Network error handling in React Query (retry config, error display)

## Loading States

- [ ] Skeleton loaders for dashboard (board cards)
- [ ] Skeleton loaders for board view (columns + tasks)
- [ ] Button loading states (spinner + disabled during submit)
- [ ] Page-level loading states (`loading.tsx` files)

## Accessibility Audit

- [ ] WCAG 4.5:1 contrast ratio check (both light theme)
- [ ] Full keyboard navigation test (Tab, Shift+Tab, Enter, Escape)
- [ ] Screen reader compatibility (semantic HTML, aria labels)
- [ ] Focus management: modals trap focus, return focus on close

## Security Hardening

- [ ] Security headers in `next.config.js` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] Verify session check on ALL API routes
- [ ] Verify user can only access their own boards/tasks (ownership check)
- [ ] Rate limiting consideration for auth routes

## Tests

- [ ] Coverage audit: ensure 70%+ across services, schemas, hooks
- [ ] Fix any failing tests from previous phases
- [ ] Add missing edge case tests identified during polish

**Exit criteria:** App is responsive on all breakpoints, all actions have loading/error/success feedback, accessibility basics pass, security headers configured.

---

# Phase 6 — Deploy & Documentation

**Goal:** App deployed to production, README complete with screenshots, CI/CD pipeline running.

**Sprint:** 5
**Status:** pending

## CI/CD

- [ ] Create `.github/workflows/test.yml` (unit tests + lint + typecheck)
- [ ] Create `.github/workflows/e2e.yml` (Playwright E2E on PR)
- [ ] Verify all tests pass in CI environment

## Deployment

- [ ] Set up PostgreSQL on Railway (or Supabase)
- [ ] Deploy to Vercel (connect GitHub repo)
- [ ] Configure environment variables on Vercel
- [ ] Run `prisma migrate deploy` on production DB
- [ ] Verify production build works end-to-end
- [ ] Set up Prisma seed for demo data (`prisma/seed.ts`)

## Documentation

- [ ] Write comprehensive `README.md` (description, screenshots, tech stack, setup instructions, architecture)
- [ ] Take screenshots for README (dashboard, board view, mobile, auth)
- [ ] Final review of all `docs/` files for accuracy
- [ ] Clean up any development artifacts

**Exit criteria:** App live on Vercel with working DB, CI passes on push, README is portfolio-ready with screenshots.

---

# Requirements Traceability Checklist

## MVP (v1) Requirements

- [ ] Authentication: register / login / logout (Phase 1)
- [ ] Kanban board with columns: To Do, In Progress, Done (Phase 2 + 3)
- [ ] CRUD for tasks: create, edit, delete (Phase 3)
- [ ] Drag & drop between columns with DB persistence (Phase 4)
- [ ] Responsive design (Phase 5)
- [ ] Production deploy (Phase 6)

## Architecture Requirements

- [ ] Service/Repository pattern enforced (Phase 0+)
- [ ] Zod schemas shared frontend <-> backend (Phase 1+)
- [ ] React Query for server state, Zustand for UI state (Phase 2+)
- [ ] Zero `any` in TypeScript (All phases)
- [ ] Session check on all API routes (Phase 1+)
- [ ] All UI states: loading, empty, error, success (Phase 5)
- [ ] Tests pass before merge (All phases)
- [ ] Conventional commits (All phases)

## Quality Standards

- [ ] 70%+ test coverage on services and schemas (Phase 5)
- [ ] WCAG 2.2 accessibility basics (Phase 5)
- [ ] Security headers configured (Phase 5)
- [ ] CI/CD pipeline (Phase 6)
