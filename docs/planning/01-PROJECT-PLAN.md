# 🗂️ Task Manager Kanban — Project Plan

## 1. Visión del Proyecto

Gestor de tareas con tablero estilo Kanban (drag & drop), autenticación, base de datos PostgreSQL, diseño responsive y modo oscuro. Desplegado en producción con Vercel + Railway.

**Objetivo:** Demostrar dominio del stack fullstack moderno de forma ordenada, con buenas prácticas de arquitectura, testing y deployment.

---

## 2. Alcance por Versión

### MVP (v1) — Lo que se entrega primero

- Autenticación (registro / login / logout)
- Tablero Kanban con columnas: To Do, In Progress, Done
- CRUD completo de tareas (crear, editar, eliminar)
- Drag & drop entre columnas con persistencia en DB
- Diseño responsive
- Deploy funcional en producción

### v2 — Iteración posterior

- Modo oscuro
- Filtros por prioridad y fecha
- Etiquetas / tags en tareas
- Múltiples tableros por usuario
- Asignar tareas a usuarios (colaboración)
- Notificaciones por email

> **Regla:** Un proyecto desplegado e incompleto impresiona más que uno local y "perfecto". Hacer MVP → Deploy → Iterar.

---

## 3. Tech Stack Completo

### Frontend

| Librería | Versión | Propósito |
|---|---|---|
| Next.js 14+ | App Router | Framework fullstack |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Estilos utility-first |
| React Query (TanStack Query) | 5.x | Server state, cache, optimistic updates |
| Zustand | 4.x | Client/UI state (mínimo, solo lo necesario) |
| React Hook Form | 7.x | Manejo de formularios |
| Zod | 3.x | Validación de schemas (compartido front/back) |
| @hello-pangea/dnd | latest | Drag & drop (fork mantenido de react-beautiful-dnd) |

### Backend (dentro de Next.js)

| Librería | Propósito |
|---|---|
| Prisma | ORM y migraciones |
| NextAuth.js (Auth.js) | Autenticación (GitHub + Google OAuth, opcionalmente credentials) |
| Zod | Validación de inputs en API routes |
| bcryptjs | Hash de contraseñas (solo si se usa credentials) |
| next-safe-action | Server Actions tipadas (opcional, evaluar en Sprint 2) |

### Testing

| Librería | Propósito |
|---|---|
| Vitest | Pruebas unitarias (reemplazo moderno de Jest) |
| React Testing Library | Testing de componentes |
| Playwright | Pruebas end-to-end |

### Infraestructura

| Herramienta | Propósito |
|---|---|
| Docker Compose | PostgreSQL local en desarrollo |
| Vercel | Deploy del frontend/app |
| Railway (o Supabase) | Base de datos PostgreSQL en producción |
| GitHub Actions | CI/CD (lint, tests, deploy) |

---

## 4. Decisiones Arquitectónicas

### ¿Por qué NO un backend separado?

- Next.js App Router integra frontend y backend en un solo proyecto.
- Route Handlers (`app/api/`) funcionan como endpoints REST completos.
- Server Actions permiten mutaciones directas sin endpoint HTTP.
- El único consumidor de la API es nuestro propio frontend.
- Un backend separado añadiría: dos repos, dos deploys, CORS, más Docker config — sin beneficio real para este MVP.

**Cuándo sí separar:** Si la API va a ser consumida por múltiples clientes (app móvil, integraciones), si se necesita procesamiento pesado/colas/websockets, o si el equipo backend trabaja con otro lenguaje.

### ¿Por qué NextAuth en vez de Auth0?

- Integración nativa con Next.js App Router.
- Sin dependencia de servicio externo.
- Demuestra comprensión del flujo de auth sin abstracciones de terceros.
- Auth0 es válido en contextos enterprise, pero para portfolio NextAuth es más relevante.

### Separación de responsabilidades (Service/Repository Pattern)

No se separa en carpetas `frontend/` y `backend/` porque rompe las convenciones de Next.js. En su lugar, se separa la **lógica** por capas:

```
Route Handler / Server Action
        ↓
   Service (lógica de negocio + validación Zod)
        ↓
   Repository (queries a Prisma)
        ↓
   Base de datos
```

**Beneficio:** Si algún día se migra a un backend separado, `services/` y `repositories/` se llevan casi sin cambios.

### Estado: React Query + Zustand

- **React Query** → Server state (datos de la DB: tareas, boards, columnas).
- **Zustand** → UI state puro (estado del drag en progreso, modals abiertos, tema oscuro/claro).
- **Regla:** Si el dato viene del servidor, va en React Query. Si es estado de interfaz, va en Zustand. No duplicar.

### Security Headers (en vez de Helmet)

Helmet es middleware de Express. En Next.js, las security headers se configuran en `next.config.js`:

```js
// next.config.js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];
```

---

## 5. Arquitectura de Carpetas

```
kanban-task-manager/
│
├── docs/                             ← 📚 Documentación del proyecto
│   ├── planning/                     ← Documentos base del proyecto
│   │   ├── 01-PROJECT-PLAN.md        ← Visión, stack, arquitectura
│   │   ├── 02-AGENT-WORKFLOW.md      ← Definición de los 3 agentes
│   │   └── 03-STACK-REFERENCE.md     ← Referencia rápida de librerías
│   │
│   ├── roadmap/                      ← Roadmap y fases del proyecto
│   │   └── ROADMAP.md                ← Fases, milestones, timeline
│   │
│   ├── features/                     ← Planes del agente Planner (1 por feature)
│   │   ├── feat-auth.md              ← Plan: autenticación
│   │   ├── feat-board-crud.md        ← Plan: CRUD de boards
│   │   ├── feat-kanban-dnd.md        ← Plan: drag & drop
│   │   └── ...
│   │
│   ├── reviews/                      ← Reports del agente Reviewer
│   │   ├── review-sprint-1.md
│   │   ├── review-sprint-2.md
│   │   └── ...
│   │
│   ├── standards/                    ← 📏 Estándares del proyecto
│   │   ├── 01-UI-UX-STANDARDS.md    ← Diseño, accesibilidad, responsive
│   │   ├── 02-CODE-STANDARDS.md     ← TypeScript, naming, rutas, Zod, Git
│   │   └── 03-TESTING-STANDARDS.md  ← Tests, cobertura, CI/CD
│   │
│   └── decisions/                    ← ADRs (Architecture Decision Records)
│       ├── adr-001-nextjs-fullstack.md
│       ├── adr-002-nextauth-vs-auth0.md
│       └── ...
│
├── src/
│   ├── app/                          ← Next.js routing
│   │   ├── (auth)/                   ← Route Group: sin sidebar
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/              ← Route Group: con sidebar + navbar
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              ← Lista de boards
│   │   │   └── board/
│   │   │       └── [boardId]/
│   │   │           └── page.tsx      ← Vista Kanban
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.ts
│   │   │   ├── boards/
│   │   │   │   ├── route.ts          ← GET (list), POST (create)
│   │   │   │   └── [boardId]/
│   │   │   │       └── route.ts      ← GET, PUT, DELETE
│   │   │   ├── columns/
│   │   │   │   ├── route.ts
│   │   │   │   └── [columnId]/
│   │   │   │       └── route.ts
│   │   │   └── tasks/
│   │   │       ├── route.ts
│   │   │       ├── [taskId]/
│   │   │       │   └── route.ts
│   │   │       └── reorder/
│   │   │           └── route.ts      ← PUT (drag & drop reorder)
│   │   ├── layout.tsx                ← Root layout
│   │   └── page.tsx                  ← Landing / redirect a dashboard
│   │
│   ├── components/                   ← UI Components (Client)
│   │   ├── board/
│   │   │   ├── BoardView.tsx         ← Contenedor del Kanban
│   │   │   ├── Column.tsx            ← Columna individual
│   │   │   ├── TaskCard.tsx          ← Tarjeta de tarea
│   │   │   └── CreateTaskModal.tsx
│   │   ├── ui/                       ← Componentes base reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── RegisterForm.tsx
│   │
│   ├── hooks/                        ← Custom React Hooks
│   │   ├── useBoard.ts               ← React Query: fetch/mutate board
│   │   ├── useTasks.ts               ← React Query: fetch/mutate tasks
│   │   └── useAuth.ts                ← Wrapper de NextAuth session
│   │
│   ├── services/                     ← Lógica de negocio (server-side)
│   │   ├── board.service.ts
│   │   ├── task.service.ts
│   │   └── column.service.ts
│   │
│   ├── repositories/                 ← Queries a Prisma aisladas
│   │   ├── board.repository.ts
│   │   ├── task.repository.ts
│   │   └── column.repository.ts
│   │
│   ├── schemas/                      ← Zod schemas (compartidos front ↔ back)
│   │   ├── board.schema.ts
│   │   ├── task.schema.ts
│   │   └── auth.schema.ts
│   │
│   ├── store/                        ← Zustand stores
│   │   └── ui.store.ts               ← Modals, sidebar, theme
│   │
│   ├── lib/                          ← Configuración y utilidades
│   │   ├── prisma.ts                 ← Singleton del Prisma Client
│   │   ├── auth.ts                   ← Configuración NextAuth
│   │   ├── auth.config.ts            ← Providers de NextAuth
│   │   └── utils.ts                  ← Helpers genéricos (cn, formatDate, etc.)
│   │
│   ├── types/                        ← TypeScript types/interfaces
│   │   ├── board.types.ts
│   │   ├── task.types.ts
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css               ← Tailwind base + custom styles
│
├── prisma/
│   └── schema.prisma
│
├── tests/                            ← Solo E2E y configuración compartida
│   ├── e2e/                          ← Playwright E2E tests
│   │   ├── auth.spec.ts
│   │   ├── board-crud.spec.ts
│   │   ├── kanban-dnd.spec.ts
│   │   └── fixtures/
│   ├── setup/
│   │   └── vitest.setup.ts          ← Setup global de Vitest
│   └── helpers/
│       ├── render-with-providers.tsx ← Wrapper con QueryClient
│       └── mock-session.ts          ← Mock de NextAuth
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── vitest.config.mts                 ← Config de Vitest
├── playwright.config.ts              ← Config de Playwright
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

### Notas sobre la estructura

- **Unit tests colocados junto al código:** cada archivo `*.test.ts(x)` vive al lado del archivo que testea (ej: `task.service.ts` → `task.service.test.ts`). Esto facilita encontrarlos y mantenerlos.
- **E2E tests en `tests/e2e/`:** usan `.spec.ts` (no `.test.ts`) para diferenciarlos. Prueban flujos completos del usuario.

- **docs/** vive en la raíz del proyecto, fuera de `src/`. No es código — es documentación que viaja con el repo.
- **docs/planning/** contiene los documentos base que estamos generando ahora (este plan, el workflow de agentes, la referencia de stack).
- **docs/roadmap/** tendrá el roadmap con fases y milestones que generaremos como siguiente paso.
- **docs/features/** es donde el agente Planner deposita el plan de cada feature antes de que el Coder empiece. Un archivo por feature, nombrado con prefijo `feat-`.
- **docs/reviews/** es donde el agente Reviewer deposita sus reports después de revisar cada sprint o feature.
- **docs/decisions/** contiene ADRs (Architecture Decision Records). Cada decisión técnica importante queda documentada con contexto, opciones evaluadas y razón de la elección. Esto es oro en entrevistas.
- **tests/** también vive fuera de `src/` para separar código de producción de código de testing.
- **(auth)** y **(dashboard)** son Route Groups de Next.js. Permiten layouts distintos sin afectar la URL.
- **services/** contiene lógica de negocio pura — validaciones, reglas, transformaciones.
- **repositories/** es la única capa que habla con Prisma. Ningún otro archivo importa `prisma` directamente.
- **schemas/** se comparten entre frontend (React Hook Form resolver) y backend (validación en API).
- **hooks/** encapsulan React Query para que los componentes no tengan lógica de fetching.

---

## 6. Modelo de Datos (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth (NextAuth) ────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Domain Models ──────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Solo si se usa credentials auth

  accounts Account[]
  sessions Session[]
  boards   Board[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Board {
  id     String @id @default(cuid())
  title  String
  userId String

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  columns Column[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model Column {
  id      String @id @default(cuid())
  title   String
  order   Int    // Para ordenar columnas en el board
  boardId String

  board Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks Task[]

  @@index([boardId])
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  order       Int      // Para ordenar dentro de la columna
  priority    Priority @default(MEDIUM)
  columnId    String

  column Column @relation(fields: [columnId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([columnId])
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

### Notas sobre el schema

- **Column como entidad separada:** Permite agregar/reordenar columnas dinámicamente en v2.
- **Campo `order`:** Tanto en Column como en Task, permite persistir el orden del drag & drop.
- **`onDelete: Cascade`:** Si se borra un Board, se borran sus Columns y Tasks. Si se borra un User, se borran sus Boards.
- **Indexes en foreign keys:** Mejora el rendimiento de las queries más frecuentes.

---

## 7. Docker Setup (Desarrollo Local)

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: kanban-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: kanban_user
      POSTGRES_PASSWORD: kanban_pass
      POSTGRES_DB: kanban_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```env
# .env
DATABASE_URL="postgresql://kanban_user:kanban_pass@localhost:5432/kanban_db"
NEXTAUTH_SECRET="generar-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## 8. Sprint Plan (MVP)

| Sprint | Días | Entregable |
|---|---|---|
| **Sprint 1** | 1-2 | Setup: Next.js + Docker + Prisma + NextAuth funcionando |
| **Sprint 2** | 3-4 | API: CRUD de boards, columns y tasks (Route Handlers + Services + Repos) |
| **Sprint 3** | 5-7 | UI Kanban: drag & drop con persistencia, optimistic updates |
| **Sprint 4** | 8-9 | Polish: responsive, loading states, error handling, toasts |
| **Sprint 5** | 10 | Deploy: Vercel + Railway, README con screenshots |

> Cada sprint debe terminar con algo funcional y testeado. No avanzar sprint sin que el anterior esté estable.
