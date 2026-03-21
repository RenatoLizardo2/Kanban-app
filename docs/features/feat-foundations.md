## Feature: Project Foundations (Phase 0)
Archivo: docs/features/feat-foundations.md
Fecha: 2026-03-06
Sprint: 1
Estado: Planificado

### Objetivo
Establecer la infraestructura base del proyecto: base de datos, ORM, tooling, testing, design tokens, y estructura de carpetas. Al finalizar, el entorno de desarrollo debe estar completamente funcional para que las features de Phase 1+ se construyan sobre una base solida.

### Notas sobre el estado actual
El proyecto fue creado con `create-next-app` (Next.js 16). Ya existen:
- `package.json` con dependencias base: next 16.1.6, react 19, tailwindcss 4, eslint 9, typescript 5
- `tsconfig.json` con `strict: true` (falta agregar opciones adicionales)
- `src/app/` con `page.tsx`, `layout.tsx`, `globals.css`, `favicon.ico` (archivos default de Next.js)
- `next.config.ts` (vacio)
- `.gitignore` (ya excluye `.env*`, `node_modules`, `.next`)
- Tailwind CSS 4 configurado via `@tailwindcss/postcss` + `postcss.config.mjs`
- `globals.css` con `@import "tailwindcss"` y variables basicas (necesita design tokens completos)
- `eslint.config.mjs` (ESLint 9 flat config)
- `docs/` con planning, standards, roadmap (ya creados)

---

### Sub-tareas

#### T1. Instalar dependencias de produccion
Criterio: Todas las dependencias del stack reference estan en `package.json`

```bash
# Produccion (Phase 0 solo necesita las que no dependen de features)
npm install @prisma/client clsx tailwind-merge zod

# Desarrollo
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitejs/plugin-react vite-tsconfig-paths \
  @playwright/test prisma prettier prettier-plugin-tailwindcss \
  husky lint-staged
```

**Nota:** Las siguientes dependencias se instalan en sus respectivas phases para evitar dependencias inutilizadas:
- Phase 1: `next-auth`, `bcryptjs`, `@types/bcryptjs`
- Phase 2: `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `date-fns`
- Phase 4: `@hello-pangea/dnd`

#### T2. Crear `docker-compose.yml` con PostgreSQL 16
Criterio: `docker compose up -d` levanta PostgreSQL y el contenedor responde en puerto 5432

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: planboard-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: planboard_user
      POSTGRES_PASSWORD: planboard_pass
      POSTGRES_DB: planboard_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Nota:** No incluir `version: '3.8'` — esta deprecado en Docker Compose v2+.

#### T3. Crear `.env` y `.env.example`
Criterio: `.env` tiene valores de desarrollo funcionales, `.env.example` tiene placeholders sin secretos

`.env`:
```env
# Database
DATABASE_URL="postgresql://planboard_user:planboard_pass@localhost:5432/planboard_db"

# NextAuth (configurar en Phase 1)
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (configurar en Phase 1)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

`.env.example`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/planboard_db"
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Verificar que `.gitignore` ya excluye `.env*` (confirmado que si).

#### T4. Inicializar Prisma y escribir schema completo
Criterio: `npx prisma migrate dev --name init` corre exitosamente y crea las tablas

1. Ejecutar `npx prisma init` (crea `prisma/schema.prisma` y modifica `.env`)
2. Reemplazar el schema con el completo definido en `docs/planning/01-PROJECT-PLAN.md` seccion 6
3. Ejecutar `npx prisma migrate dev --name init`
4. Verificar que las tablas existen en PostgreSQL

El schema incluye: User, Account, Session, VerificationToken, Board, Column, Task, Priority enum. Ver `docs/planning/01-PROJECT-PLAN.md` seccion 6 para el schema completo.

#### T5. Crear Prisma Client singleton (`src/lib/prisma.ts`)
Criterio: El archivo exporta una instancia singleton de PrismaClient que no crea conexiones duplicadas en dev

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### T6. Crear utility helpers (`src/lib/utils.ts`)
Criterio: Exporta funcion `cn()` que combina clsx + tailwind-merge

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

#### T7. Crear custom error classes (`src/lib/errors.ts`)
Criterio: Exporta NotFoundError, UnauthorizedError, ValidationError como clases que extienden Error

```typescript
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### T8. Configurar Tailwind CSS 4 con design tokens en `globals.css`
Criterio: `globals.css` tiene todos los CSS variables del UI standards (light + dark), integrados con Tailwind 4 `@theme`

Reemplazar el `globals.css` actual con:
- `@import "tailwindcss"`
- `:root` con todas las variables de `docs/standards/01-UI-UX-STANDARDS.md` seccion 2 (backgrounds, text, brand, semantic, borders, shadows)
- `[data-theme="dark"]` con variables de dark mode
- `@theme inline` para registrar las variables como Tailwind utilities
- `@media (prefers-reduced-motion: reduce)` block
- Base body styles

**Fuente de verdad para los tokens:** `docs/standards/01-UI-UX-STANDARDS.md` seccion 2 "Sistema de Diseno (Design Tokens)".

#### T9. Configurar Prettier (`.prettierrc` + `.prettierignore`)
Criterio: `npx prettier --check .` corre sin errores de configuracion

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.prettierignore`:
```
node_modules
.next
dist
coverage
```

#### T10. Configurar Husky + lint-staged
Criterio: Al hacer `git commit`, el pre-commit hook ejecuta lint-staged automaticamente

1. `npx husky init`
2. Escribir `.husky/pre-commit` con `npx lint-staged`
3. Agregar config de lint-staged en `package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

#### T11. Actualizar `tsconfig.json` con opciones strict adicionales
Criterio: tsconfig tiene las opciones de `docs/standards/02-CODE-STANDARDS.md` y `npx tsc --noEmit` pasa

Agregar al `compilerOptions` existente:
```json
"noUncheckedIndexedAccess": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true,
"forceConsistentCasingInFileNames": true
```

`strict: true` ya existe (cubre `noImplicitAny`).

#### T12. Actualizar `package.json` scripts
Criterio: Todos los scripts del proyecto estan definidos y funcionales

Reemplazar seccion `scripts` con:
```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "format": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:all": "npm run test && npm run test:e2e",
  "db:migrate": "prisma migrate dev",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:seed": "prisma db seed",
  "db:reset": "prisma migrate reset",
  "prepare": "husky"
}
```

**Nota:** `"prepare": "husky"` es necesario para que Husky se inicialice automaticamente en `npm install`.

#### T13. Configurar Vitest (`vitest.config.mts` + `tests/setup/vitest.setup.ts`)
Criterio: `npm run test` ejecuta Vitest sin errores (puede reportar 0 tests si no hay tests aun)

`vitest.config.mts` — usar la configuracion exacta de `docs/standards/03-TESTING-STANDARDS.md` seccion 3.

`tests/setup/vitest.setup.ts` — usar la configuracion exacta de `docs/standards/03-TESTING-STANDARDS.md` seccion 3 (setup file).

**Dependencia critica:** `vite-tsconfig-paths` es necesario para que Vitest resuelva los aliases `@/*`.

#### T14. Configurar Playwright (`playwright.config.ts`)
Criterio: `npx playwright install` instala browsers y la config es valida

`playwright.config.ts` — usar la configuracion de `docs/standards/03-TESTING-STANDARDS.md` seccion 4.

Ejecutar `npx playwright install chromium` para instalar solo el browser necesario (no instalar todos).

#### T15. Crear test helpers
Criterio: Los archivos existen y exportan las utilidades correctamente

`tests/helpers/render-with-providers.tsx`:
```typescript
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient };
}
```

**Nota:** Este helper usa `@tanstack/react-query` que se instalara en Phase 2. Crear el archivo como placeholder — el Coder puede crear un version simplificada sin QueryClient y actualizarlo en Phase 2, o instalar `@tanstack/react-query` en Phase 0 como devDependency para el helper. Decisión del Coder.

`tests/helpers/mock-session.ts`:
```typescript
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUnauthenticated = null;
```

#### T16. Crear estructura de carpetas en `src/`
Criterio: Todas las carpetas de la arquitectura existen bajo `src/`

Crear:
```
src/components/board/
src/components/ui/
src/components/layout/
src/components/auth/
src/hooks/
src/services/
src/repositories/
src/schemas/
src/store/
src/lib/          # ya existe (tiene layout.tsx, etc. bajo app/)
src/types/
```

`src/lib/` ya existe implicitamente al crear `prisma.ts`, `utils.ts`, `errors.ts`.

Agregar un archivo `.gitkeep` en cada carpeta vacia para que Git las trackee.

#### T17. Actualizar `.gitignore`
Criterio: `.gitignore` incluye entradas para IDE, database volumes, test results

Agregar las siguientes entradas que faltan:
```
# IDE
.vscode/
.idea/

# Database
postgres_data/

# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
```

**Nota:** `.env*` ya esta excluido. No agregar duplicados.

#### T18. Verificar que todo funciona
Criterio: Los 4 checks pasan sin errores

1. `docker compose up -d` — PostgreSQL levanta
2. `npx prisma migrate dev --name init` — Migracion corre
3. `npm run dev` — App inicia en localhost:3000
4. `npm run build` — Build compila sin errores
5. `npm run test` — Vitest ejecuta (0 tests o tests basicos pasan)
6. `npx tsc --noEmit` — Type check pasa

---

### Archivos a crear
| Archivo | Accion |
|---|---|
| `docker-compose.yml` | Crear |
| `.env` | Crear |
| `.env.example` | Crear |
| `prisma/schema.prisma` | Crear (via `npx prisma init` + reemplazar) |
| `src/lib/prisma.ts` | Crear |
| `src/lib/utils.ts` | Crear |
| `src/lib/errors.ts` | Crear |
| `src/app/globals.css` | Modificar (agregar design tokens) |
| `.prettierrc` | Crear |
| `.prettierignore` | Crear |
| `.husky/pre-commit` | Crear (via `npx husky init`) |
| `tsconfig.json` | Modificar (agregar strict options) |
| `package.json` | Modificar (scripts + lint-staged + dependencias) |
| `vitest.config.mts` | Crear |
| `tests/setup/vitest.setup.ts` | Crear |
| `tests/helpers/render-with-providers.tsx` | Crear |
| `tests/helpers/mock-session.ts` | Crear |
| `playwright.config.ts` | Crear |
| `.gitignore` | Modificar |

### Archivos que NO se tocan
| Archivo | Razon |
|---|---|
| `src/app/page.tsx` | Default de Next.js, se reemplazara en Phase 2 |
| `src/app/layout.tsx` | Default de Next.js, se modificara en Phase 1+ |
| `next.config.ts` | Se configurara en Phase 5 (security headers) |
| `eslint.config.mjs` | ESLint 9 flat config de Next.js, funcional como esta |
| `postcss.config.mjs` | Ya configurado por create-next-app para Tailwind 4 |

### Estandares a consultar
- `docs/standards/02-CODE-STANDARDS.md` — seccion 1 (TypeScript strict), seccion 8 (Git commits)
- `docs/standards/01-UI-UX-STANDARDS.md` — seccion 2 (Design Tokens / CSS variables)
- `docs/standards/03-TESTING-STANDARDS.md` — secciones 3 y 4 (Vitest y Playwright config)

### Decisiones

1. **Instalar solo dependencias necesarias por phase** — No instalar `next-auth`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `@hello-pangea/dnd`, `bcryptjs`, `date-fns` en Phase 0. Se instalaran cuando se necesiten. Esto evita dependencias muertas y mantiene el `package.json` limpio.

2. **Container name `planboard-db`** en vez de `kanban-db` — El proyecto se llama PlanBoard, no Kanban. Alinear nombres.

3. **No incluir `version` en `docker-compose.yml`** — El campo `version` esta deprecado desde Docker Compose v2. Eliminarlo es la practica actual.

4. **`@playwright/test` en vez de `playwright` separado** — `@playwright/test` incluye todo lo necesario. No es necesario instalar el paquete `playwright` por separado.

5. **Test helpers como placeholder** — `render-with-providers.tsx` depende de `@tanstack/react-query` que se instala en Phase 2. Se puede crear como archivo placeholder o instalar react-query solo en Phase 0 como devDependency. Decision del Coder.

### Edge cases
- Puerto 5432 ocupado por otra instancia de PostgreSQL — Verificar con `docker ps` antes de `docker compose up`
- `npx prisma init` sobreescribe `.env` — Crear `.env` despues de `npx prisma init`, o editar el que genera Prisma
- Husky no se inicializa en CI — El script `"prepare": "husky"` falla silenciosamente si `.git` no existe (comportamiento correcto en CI)
- Tailwind CSS 4 usa `@theme inline` — No usar la sintaxis de Tailwind 3 (`tailwind.config.js`). Todo se configura en CSS.

### Tests requeridos
No aplica para Phase 0 (es setup de infraestructura). La verificacion es que los test runners funcionen:
- `npm run test` — Vitest ejecuta sin errores de configuracion
- `npx playwright test` — Playwright reporta 0 tests (no hay specs aun)
- `npm run build` — Build compila

### Orden de ejecucion sugerido
1. T1 — Instalar dependencias
2. T2 — Docker Compose
3. T3 — Variables de entorno
4. T4 — Prisma init + schema + migracion
5. T5 — Prisma singleton
6. T6 — Utils
7. T7 — Error classes
8. T16 — Estructura de carpetas
9. T8 — Design tokens en globals.css
10. T11 — tsconfig strict
11. T12 — Package.json scripts
12. T9 — Prettier
13. T10 — Husky + lint-staged
14. T13 — Vitest config
15. T14 — Playwright config
16. T15 — Test helpers
17. T17 — Gitignore
18. T18 — Verificacion final
