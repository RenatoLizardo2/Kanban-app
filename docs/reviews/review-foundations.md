## Review: Project Foundations (Phase 0)

Archivo: docs/reviews/review-foundations.md
Fecha: 2026-03-06
Sprint: 1
Feature Plan: docs/features/feat-foundations.md

### Aprobado con observaciones

### Checklist summary

- Documentacion: OK
- Codigo: OK
- Tooling: OK
- Testing setup: OK (con observacion menor)
- Seguridad: OK

---

### ROADMAP Phase 0 — Verificacion tarea por tarea

#### Backend / Infra

- [x] `docker-compose.yml` con PostgreSQL 16 — Correcto. Usa `postgres:16-alpine`, sin `version` deprecado, nombre `planboard-db`.
- [x] `.env` y `.env.example` — Existen con variables correctas. **VER ISSUE #1 ABAJO.**
- [x] Prisma instalado e inicializado — Usa Prisma 7 con `prisma.config.ts` (nuevo patron). Schema en `prisma/schema.prisma`.
- [x] Schema completo — Contiene User, Account, Session, VerificationToken, Board, Column, Task, Priority enum. Todos los campos, relaciones, indexes y cascades coinciden con `01-PROJECT-PLAN.md` seccion 6.
- [ ] Migracion inicial — **No hay carpeta `prisma/migrations/`.** La migracion no fue ejecutada (requiere Docker + PostgreSQL corriendo). **VER ISSUE #2.**
- [x] Prisma Client singleton `src/lib/prisma.ts` — Correcto. Usa `@prisma/adapter-pg` (patron Prisma 7 con driver adapters). Singleton pattern funcional.
- [x] `src/lib/utils.ts` con `cn()` — Correcto. Tipo de retorno explicito `string`. Usa clsx + tailwind-merge.
- [x] `src/lib/errors.ts` — Correcto. Exporta NotFoundError, UnauthorizedError, ValidationError. Todas extienden Error con `this.name` asignado.

#### Frontend / Tooling

- [x] Tailwind CSS 4 con design tokens — `globals.css` tiene todos los tokens de `01-UI-UX-STANDARDS.md` seccion 2: backgrounds (3), text (3), brand (2), semantic (4), borders (2), shadows (3). `@theme inline` registra como Tailwind utilities.
- [x] `globals.css` con light + dark mode — `:root` (light) y `[data-theme='dark']` presentes. `prefers-reduced-motion` media query incluida.
- [x] Prettier — `.prettierrc` con semi, singleQuote, trailingComma all, plugin tailwindcss. `.prettierignore` excluye node_modules, .next, dist, coverage.
- [x] Husky + lint-staged — `.husky/pre-commit` ejecuta `npx lint-staged`. `lint-staged` config en `package.json`. **Verificado funcionando** (commit previo paso por lint-staged exitosamente).
- [x] `package.json` scripts — Todos presentes: dev (turbopack), build, start, lint, format, test, test:watch, test:coverage, test:e2e, test:all, db:migrate, db:push, db:studio, db:seed, db:reset, prepare.
- [x] `tsconfig.json` strict — `strict: true` + `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`. Coincide con `02-CODE-STANDARDS.md` seccion 1.

#### Testing Setup

- [x] Vitest configurado — `vitest.config.mts` con react plugin, tsconfigPaths, jsdom, globals, setupFiles, coverage thresholds (70%), `passWithNoTests: true`.
- [x] Playwright configurado — `playwright.config.ts` con chromium + mobile-chrome, forbidOnly en CI, retries, webServer config.
- [x] Test helpers — `render-with-providers.tsx` (simplificado para Phase 0, placeholder para QueryClient en Phase 2), `mock-session.ts` con mockSession y mockUnauthenticated.
- [x] Vitest setup — `tests/setup/vitest.setup.ts` con `@testing-library/jest-dom/vitest`, cleanup afterEach, mock de `next/navigation`.

#### Shared

- [x] Estructura de carpetas — 10 carpetas con `.gitkeep`: components/{board,ui,layout,auth}, hooks, services, repositories, schemas, store, types. **VER ISSUE #3.**
- [x] `npm run build` — Compila sin errores (verificado).
- [x] `npx tsc --noEmit` — Pasa sin errores (verificado).
- [x] `npm run test` — Vitest ejecuta, 0 tests, exit code 0 (verificado).
- [x] `npm run lint` — ESLint pasa sin errores (verificado).

#### Code Standards (02-CODE-STANDARDS.md)

- [x] Cero `any` — Verificado con grep, ninguno encontrado.
- [x] Cero `@ts-ignore` / `@ts-expect-error` — Verificado.
- [x] Cero `console.log` — Verificado.
- [x] Funciones exportadas con tipo de retorno explicito — `cn()` tiene `: string`. Singleton usa inferencia (aceptable para patron factory).
- [x] Archivos en kebab-case — prisma.ts, utils.ts, errors.ts, mock-session.ts, render-with-providers.tsx.
- [x] Imports con alias `@/*` — `src/lib/prisma.ts` usa `@/generated/prisma/client`.

---

### Issues (requieren accion)

#### Issue #1 (BLOQUEANTE): `.env.example` no esta trackeado en Git

`.gitignore` tiene el patron `.env*` que excluye TODOS los archivos que empiezan con `.env`, incluyendo `.env.example`. Esto significa que `.env.example` no llega al repositorio y otros desarrolladores no podran ver las variables requeridas.

**Fix:** Agregar una excepcion en `.gitignore`:

```
.env*
!.env.example
```

#### Issue #2 (NO BLOQUEANTE): Migracion inicial no ejecutada

No existe `prisma/migrations/`. Esto es esperado porque requiere Docker + PostgreSQL corriendo, lo cual es un paso manual post-clone. Sin embargo, el ROADMAP lista "Run initial migration" como tarea de Phase 0.

**Recomendacion:** Documentar en el feature plan que la migracion se ejecuta como primer paso despues de `docker compose up -d`. No bloquea el merge, pero la tarea T4 del plan queda parcialmente incompleta. El Coder deberia ejecutar `npx prisma migrate dev --name init` con Docker corriendo y commitear la carpeta `prisma/migrations/`.

#### Issue #3 (NO BLOQUEANTE): `tests/e2e/` y `tests/e2e/fixtures/` no trackeados

Estas carpetas existen localmente pero no tienen `.gitkeep`, asi que no estan en el repositorio. Playwright espera `testDir: './tests/e2e'`.

**Fix:** Agregar `.gitkeep` en `tests/e2e/fixtures/`.

---

### Observaciones (no bloquean)

1. **Prisma 7 adaptaciones** — El Coder adapto correctamente al patron de Prisma 7:
   - `prisma-client` provider en vez de `prisma-client-js`
   - Output a `src/generated/prisma` (agregado a `.gitignore`)
   - `prisma.config.ts` con `dotenv/config` para resolver `DATABASE_URL`
   - `@prisma/adapter-pg` + `pg` como driver adapter
   - Estas son desviaciones del plan original (que asumia Prisma 5/6) pero son correctas para Prisma 7.

2. **Dependencias extra no planificadas** — `@prisma/adapter-pg`, `pg`, `@types/pg`, `dotenv`, `jsdom` no estaban en el plan pero son necesarias:
   - `@prisma/adapter-pg` + `pg` + `@types/pg`: requeridos por Prisma 7 driver adapters
   - `dotenv`: requerido por `prisma.config.ts`
   - `jsdom`: requerido por Vitest `environment: 'jsdom'`

3. **Zod v4** — Se instalo `zod@^4.3.6` en vez de Zod 3.x del plan original. Zod 4 tiene API diferente (ej: `z.cuid()` en vez de `z.string().cuid()`). El Coder de Phase 1+ debe tener esto en cuenta al escribir schemas.

4. **`datasource db` sin `url`** — En `schema.prisma`, el datasource no tiene `url = env("DATABASE_URL")`. Esto es correcto para Prisma 7 cuando la URL se define en `prisma.config.ts`, pero difiere del plan original.

5. **Turbopack warning en build** — Next.js detecta multiples lockfiles y muestra warning sobre `turbopack.root`. No es un error, pero podria configurarse en `next.config.ts` para silenciarlo.

### Sugerencias (para futuras phases)

- Considerar agregar `"test:e2e:headed": "playwright test --headed"` y `"test:e2e:ui": "playwright test --ui"` a los scripts del `package.json` (presentes en `03-TESTING-STANDARDS.md` seccion 6 pero omitidos).
- Actualizar `docs/planning/01-PROJECT-PLAN.md` seccion 3 para reflejar las versiones reales instaladas (Next.js 16, Prisma 7, Zod 4, React 19) ya que el plan listaba versiones anteriores.

---

### Verificaciones ejecutadas

| Comando                    | Resultado                  |
| -------------------------- | -------------------------- |
| `npx tsc --noEmit`         | OK (sin errores)           |
| `npm run test`             | OK (0 tests, exit 0)       |
| `npm run build`            | OK (compiled successfully) |
| `npm run lint`             | OK (sin errores)           |
| grep `any` en src/         | 0 matches                  |
| grep `@ts-ignore` en src/  | 0 matches                  |
| grep `console.log` en src/ | 0 matches                  |
