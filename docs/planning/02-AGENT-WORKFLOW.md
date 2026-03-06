# 🤖 Agent Workflow — Sistema de 3 Agentes

## Concepto

El desarrollo se organiza con 3 agentes (roles) que interactúan en cada feature o sprint. Esto asegura que el código no solo funcione, sino que esté bien pensado y revisado.

---

## ⚠️ Regla de Documentación Obligatoria

**Ningún agente puede avanzar sin dejar documentación.** La documentación NO es opcional ni se hace "después". Es un deliverable obligatorio de cada paso del flujo.

### Mapa de docs/ y quién es responsable

```
docs/
├── planning/         ← Se crean al inicio del proyecto (ya hecho)
│   ├── 01-PROJECT-PLAN.md
│   ├── 02-AGENT-WORKFLOW.md
│   └── 03-STACK-REFERENCE.md
│
├── roadmap/          ← Planner crea y actualiza al inicio de cada sprint
│   └── ROADMAP.md
│
├── features/         ← 🧠 PLANNER crea uno ANTES de cada feature
│   ├── feat-auth.md
│   ├── feat-board-crud.md
│   └── feat-kanban-dnd.md
│
├── reviews/          ← 🔍 REVIEWER crea uno DESPUÉS de cada review
│   ├── review-sprint-1.md
│   └── review-sprint-2.md
│
├── standards/        ← Se consultan durante todo el desarrollo
│   ├── 01-UI-UX-STANDARDS.md
│   ├── 02-CODE-STANDARDS.md
│   └── 03-TESTING-STANDARDS.md
│
└── decisions/        ← 🧠 PLANNER crea uno por cada decisión técnica
    ├── adr-001-nextjs-fullstack.md
    └── adr-002-nextauth-vs-auth0.md
```

### Reglas inquebrantables

1. **El Planner NO puede pasar trabajo al Coder sin antes crear el archivo `docs/features/feat-[nombre].md`** con el plan completo de la feature.
2. **El Coder NO puede empezar a codear sin leer** el feature plan del Planner Y los estándares relevantes en `docs/standards/`.
3. **El Reviewer NO puede aprobar sin crear el archivo `docs/reviews/review-[sprint/feature].md`** con el resultado de la revisión.
4. **Si el Planner toma una decisión técnica significativa**, debe documentarla en `docs/decisions/adr-[número]-[tema].md`.
5. **El Roadmap (`docs/roadmap/ROADMAP.md`) se actualiza** al inicio de cada sprint con el estado real: qué se completó, qué se movió, qué cambió.
6. **Los docs de planning base** (`docs/planning/`) solo se actualizan si hay un cambio fundamental en la arquitectura o el stack. No se modifican por cada feature.

### Cuándo actualizar documentación existente

| Evento | Qué actualizar | Quién |
|---|---|---|
| Nueva feature empieza | Crear `docs/features/feat-*.md` + crear branch + push | Planner |
| Feature planificada | `ROADMAP.md` status → `claimed` | Planner |
| Coder empieza a implementar | `ROADMAP.md` status → `in_progress` | Coder |
| Decisión técnica nueva | Crear `docs/decisions/adr-*.md` | Planner |
| Sprint empieza | Actualizar `docs/roadmap/ROADMAP.md` con estado real | Planner |
| Review completado | Crear `docs/reviews/review-*.md` | Reviewer |
| Feature aprobada | `ROADMAP.md` status → `completed` + `feat-*.md` → Completado | Reviewer |
| Cambio de arquitectura | Actualizar `docs/planning/01-PROJECT-PLAN.md` | Planner |
| Nuevo estándar o regla | Actualizar `docs/standards/*.md` | Reviewer |

---

## Agente 1: 🧠 Planner (Planificador)

### Responsabilidad
Define **qué** se va a hacer y **cómo** antes de escribir código.

### Cuándo actúa
- Al inicio de cada sprint o feature.
- Cuando hay una decisión técnica que tomar.
- Cuando se detecta un cambio de alcance.

### Git Workflow (OBLIGATORIO — antes de planificar)

1. **Sync con main:**
   ```bash
   git checkout main
   git fetch origin
   git pull origin main
   ```
2. **Crear branch de feature:**
   ```bash
   git checkout -b feat/<nombre-feature>
   ```
3. **Después de crear el plan + actualizar ROADMAP — commit y push:**
   ```bash
   git add docs/features/feat-<nombre>.md docs/roadmap/ROADMAP.md
   git commit -m "docs(plan): add plan for feat-<nombre>"
   git push -u origin feat/<nombre-feature>
   ```

**IMPORTANTE:** El Planner solo commitea documentación (plan + roadmap + ADR). No código. El Coder continúa en la misma branch.

### Outputs que genera (OBLIGATORIOS)
- **`docs/features/feat-[nombre].md`** — Plan completo de la feature. El Coder NO empieza sin este archivo.
- **`docs/decisions/adr-[número]-[tema].md`** — Solo cuando hay una decisión técnica significativa.
- **Actualización de `docs/roadmap/ROADMAP.md`** — Marcar la fase como `claimed` al crear el plan. Al inicio de cada sprint, actualizar el estado real.

### Contenido del feature plan

```markdown
## Feature: [Nombre]
Archivo: docs/features/feat-[nombre].md
Fecha: [YYYY-MM-DD]
Sprint: [número]
Estado: 📋 Planificado | 🚧 En progreso | ✅ Completado

### Objetivo
[Qué resuelve esta feature para el usuario]

### Sub-tareas
- [ ] Tarea 1 — Criterio: [qué se considera "done"]
- [ ] Tarea 2 — Criterio: [qué se considera "done"]

### Data Flow
[Componente] → [Hook] → [API Route] → [Service] → [Repository] → [DB]

### Archivos a crear/modificar
- `src/schemas/task.schema.ts` — Crear
- `src/services/task.service.ts` — Crear
- `src/components/board/task-card.tsx` — Modificar

### Estándares a consultar
- `docs/standards/02-CODE-STANDARDS.md` → Sección Zod
- `docs/standards/01-UI-UX-STANDARDS.md` → Sección Forms

### Decisiones
- Usar X en vez de Y porque [razón]

### Edge Cases
- ¿Qué pasa si...?
- ¿Qué pasa si...?

### Tests requeridos
- [ ] Unit: task.service.test.ts
- [ ] Unit: task.schema.test.ts
- [ ] Component: task-card.test.tsx
- [ ] E2E: task-crud.spec.ts (happy path)
```

### Contenido de un ADR (Architecture Decision Record)

```markdown
## ADR-[número]: [Título de la decisión]
Archivo: docs/decisions/adr-[número]-[tema].md
Fecha: [YYYY-MM-DD]
Estado: ✅ Aceptado | ❌ Rechazado | 🔄 Reemplazado por ADR-[X]

### Contexto
[Qué problema o situación motivó esta decisión]

### Opciones evaluadas
1. **Opción A** — [Pros y contras]
2. **Opción B** — [Pros y contras]

### Decisión
[Qué se decidió y por qué]

### Consecuencias
[Qué implica esta decisión, qué trade-offs tiene]
```

---

## Agente 2: 💻 Coder (Desarrollador)

### Responsabilidad
Implementa **exactamente** lo que el Planner definió.

### Cuándo actúa
- Después de que el Planner entregó el feature plan en `docs/features/`.
- Sigue las sub-tareas en orden.

### Git Workflow (OBLIGATORIO — antes de codear)

1. **Checkout la branch que el Planner ya creó y pusheó:**
   ```bash
   git fetch origin
   git checkout feat/<nombre-feature>
   git pull origin feat/<nombre-feature>
   ```
   **NO crear branch nueva.** El Planner ya creó `feat/<nombre-feature>` con el plan commiteado. El Coder continúa en la misma branch.

2. **Actualizar ROADMAP:** Cambiar el status de la fase de `claimed` a `in_progress`.

### Pre-requisitos antes de codear (OBLIGATORIO)

1. **Leer `docs/features/feat-[nombre].md`** — El plan de la feature actual.
2. **Leer los estándares referenciados** — Los que el Planner indicó en "Estándares a consultar".
3. **Verificar que los tests del sprint anterior siguen pasando** — `npm run test` antes de empezar.

### Responsabilidades de documentación del Coder

- **Actualizar las sub-tareas en `docs/features/feat-[nombre].md`** — Marcar como completadas conforme avanza (`[x]`).
- **Si encuentra algo que el Planner no previó**, lo reporta y el Planner actualiza el feature plan antes de continuar.
- **NO crear documentación nueva** — Esa es responsabilidad del Planner y el Reviewer.

### Reglas de trabajo

1. **Seguir el plan.** No agregar features no planificadas. Si detecta algo necesario, lo reporta al Planner primero.
2. **Una sub-tarea a la vez.** Commit lógico por sub-tarea completada.
3. **Código limpio desde el inicio.** No dejar TODOs ni "después lo arreglo".
4. **Type safety.** Todo tipado con TypeScript. Cero `any`.
5. **Validación en ambos lados.** Zod schema compartido entre frontend (React Hook Form) y backend (API route).
6. **Nombres consistentes.** Seguir `docs/standards/02-CODE-STANDARDS.md`.
7. **Tests junto al código.** Cada service, schema y componente principal debe tener su `.test.ts(x)` al lado.

### Convenciones de código

```
Archivos:        kebab-case       → board-view.tsx, task.service.ts
Componentes:     PascalCase       → BoardView, TaskCard
Hooks:           camelCase        → useBoard, useTasks
Services:        camelCase        → boardService.createBoard()
Variables/Func:  camelCase        → const taskList, function getBoard()
Types/Interfaces: PascalCase      → interface Board, type TaskWithColumn
Enums:           PascalCase       → enum Priority { LOW, MEDIUM, HIGH }
DB Tables:       PascalCase       → model Board (Prisma convention)
API Routes:      kebab-case       → /api/boards/[boardId]
Env vars:        SCREAMING_SNAKE  → DATABASE_URL, NEXTAUTH_SECRET
```

### Estructura de un commit

```
feat(board): add drag and drop reorder
fix(auth): handle expired session redirect
refactor(task): extract validation to shared schema
test(board): add unit tests for board service
docs(features): update feat-kanban-dnd with completed tasks
```

---

## Agente 3: 🔍 Reviewer (Revisor)

### Responsabilidad
Revisa el código del Coder antes de dar por completada una sub-tarea o sprint.

### Cuándo actúa
- Después de cada sub-tarea completada por el Coder.
- Al final de cada sprint (revisión integral).

### Pre-requisitos antes de revisar (OBLIGATORIO)

1. **Leer `docs/features/feat-[nombre].md`** — Para saber qué se planificó y verificar contra eso.
2. **Consultar `docs/standards/`** — Los 3 documentos de estándares son la referencia del Reviewer.
3. **Verificar que los tests pasan** — `npm run test && npm run test:e2e && npm run build`.

### Outputs que genera (OBLIGATORIOS)

- **`docs/reviews/review-[sprint/feature].md`** — Resultado de la revisión. Se crea SIEMPRE, incluso si todo está perfecto.
- **Actualización de `docs/standards/*.md`** — Si durante la review detecta una regla faltante o un patrón que debería estandarizarse.

### Checklist de revisión

#### Documentación (NUEVO — verificar primero)
- [ ] ¿Existe `docs/features/feat-[nombre].md` para esta feature?
- [ ] ¿Las sub-tareas están marcadas como completadas?
- [ ] ¿Los archivos creados coinciden con lo planificado?
- [ ] ¿Si hubo decisión técnica nueva, existe el ADR?

#### Funcionalidad
- [ ] ¿Cumple con los criterios de aceptación del Planner?
- [ ] ¿Maneja los edge cases listados?
- [ ] ¿Funciona en mobile y desktop?

#### Código (referencia: `docs/standards/02-CODE-STANDARDS.md`)
- [ ] ¿TypeScript estricto? (sin `any`, sin `@ts-ignore`)
- [ ] ¿Sigue las convenciones de naming del proyecto?
- [ ] ¿Los componentes tienen responsabilidad única?
- [ ] ¿La lógica de negocio está en services, no en componentes?
- [ ] ¿Las queries de Prisma están en repositories, no en services?

#### UI/UX (referencia: `docs/standards/01-UI-UX-STANDARDS.md`)
- [ ] ¿Hay loading states?
- [ ] ¿Hay estados vacíos (empty states)?
- [ ] ¿Los errores muestran feedback al usuario (toast/alert)?
- [ ] ¿El formulario muestra errores de validación inline?
- [ ] ¿Contraste WCAG 4.5:1?
- [ ] ¿Navegable por teclado?

#### Seguridad
- [ ] ¿Se valida el input con Zod en el API route?
- [ ] ¿Se verifica la sesión del usuario antes de operar?
- [ ] ¿No se expone data de otros usuarios?
- [ ] ¿Se usa `onDelete: Cascade` correctamente?

#### Performance
- [ ] ¿Se evitan queries N+1? (usar `include` de Prisma)
- [ ] ¿Los componentes pesados son lazy loaded?
- [ ] ¿React Query tiene las keys correctas para invalidación?
- [ ] ¿El optimistic update del drag tiene rollback en caso de error?

#### Testing (referencia: `docs/standards/03-TESTING-STANDARDS.md`)
- [ ] ¿Hay test unitario para el service?
- [ ] ¿Hay test del componente principal de la feature?
- [ ] ¿El e2e cubre el happy path?
- [ ] ¿`npm run test` pasa? ¿`npm run build` compila?
- [ ] ¿La cobertura no baja del 70%?

### Formato de output del Reviewer

```markdown
## Review: [Feature/Sub-tarea]
Archivo: docs/reviews/review-[nombre].md
Fecha: [YYYY-MM-DD]
Sprint: [número]
Feature Plan: docs/features/feat-[nombre].md

### ✅ Aprobado / ⚠️ Con observaciones / ❌ Requiere cambios

### Checklist summary
- Documentación: ✅
- Código: ✅
- UI/UX: ⚠️ (detalles abajo)
- Testing: ✅
- Seguridad: ✅

### Observaciones
1. [Archivo]: [Descripción del issue o sugerencia]
2. [Archivo]: [Descripción del issue o sugerencia]

### Sugerencias (no bloquean)
- [Mejora opcional que puede ir en siguiente sprint]

### Estándares actualizados
- Se agregó regla X a `docs/standards/02-CODE-STANDARDS.md` (si aplica)
```

---

## Flujo Completo por Feature

```
┌──────────────────────────────────────────────────────┐
│                   PLANNER 🧠                          │
│                                                        │
│  1. git checkout main && git fetch && git pull         │
│  2. git checkout -b feat/<nombre>                      │
│  3. Lee docs/standards/ y docs/roadmap/                │
│  4. Crea docs/features/feat-[nombre].md                │
│  5. Define sub-tareas, data flow, edge cases           │
│  6. Indica qué estándares consultar                    │
│  7. Si hay decisión técnica → crea ADR                 │
│  8. Actualiza ROADMAP.md → status: claimed             │
│  9. git commit + git push -u origin feat/<nombre>      │
│                                                        │
│  ✅ Output: Feature Plan + branch pusheada + ROADMAP   │
│  ❌ SIN ESTE ARCHIVO, EL CODER NO EMPIEZA             │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                    CODER 💻                            │
│                                                        │
│  10. git fetch && git checkout feat/<nombre>           │
│  11. Lee docs/features/feat-[nombre].md                │
│  12. Lee docs/standards/ referenciados                 │
│  13. Actualiza ROADMAP.md → status: in_progress        │
│  14. Verifica que tests existentes pasan               │
│  15. Implementa sub-tareas en orden                    │
│  16. Escribe tests junto al código                     │
│  17. Marca sub-tareas como completadas en feat-*.md    │
│                                                        │
│  ✅ Output: Código + Tests + feat-*.md actualizado     │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                   REVIEWER 🔍                          │
│                                                        │
│  18. Lee docs/features/feat-[nombre].md                │
│  19. Consulta docs/standards/ (los 3)                  │
│  20. Corre npm run test && npm run build               │
│  21. Revisa código contra checklist completo           │
│  22. Crea docs/reviews/review-[nombre].md              │
│  23. Si detecta regla faltante → actualiza standards   │
│                                                        │
│  Si ❌ → Vuelve al Coder (paso 15)                    │
│  Si ✅ → Feature completada                            │
│     → Actualiza ROADMAP.md → status: completed         │
│     → Actualiza feat-*.md → Estado: Completado         │
│                                                        │
│  ✅ Output: Review Report + ROADMAP + Standards        │
└──────────────────────────────────────────────────────┘
```

### Ciclo de vida del ROADMAP por feature

```
pending → claimed (Planner) → in_progress (Coder) → completed (Reviewer)
```

| Status | Quién lo cambia | Significado |
|---|---|---|
| `pending` | — | Nadie ha empezado |
| `claimed` | Planner | Plan creado, branch pusheada, esperando Coder |
| `in_progress` | Coder | Implementación en progreso |
| `completed` | Reviewer | Aprobado, feature lista |

---

## Ejemplo Práctico: Feature "Crear Tarea"

### Planner crea `docs/features/feat-task-crud.md`:

**Sub-tareas:**
1. Crear Zod schema para Task (title requerido, description opcional, priority enum).
2. Crear `task.repository.ts` con método `create()`.
3. Crear `task.service.ts` con validación y lógica de orden (nueva tarea va al final).
4. Crear Route Handler `POST /api/tasks`.
5. Crear `CreateTaskModal` component con React Hook Form + Zod resolver.
6. Crear mutación en `useTasks` hook con optimistic update.
7. Integrar modal en `Column.tsx`.

**Estándares a consultar:** `02-CODE-STANDARDS.md` (sección Zod), `01-UI-UX-STANDARDS.md` (sección Forms y Modals), `03-TESTING-STANDARDS.md` (sección Services y Schemas).

**Edge cases:** título vacío, columna inexistente, usuario sin acceso al board, orden duplicado.

**Tests requeridos:** `task.schema.test.ts`, `task.service.test.ts`, `task-card.test.tsx`, `task-crud.spec.ts`.

### Coder lee el plan, lee los estándares, implementa cada sub-tarea, y marca como completadas en el feature plan.

### Reviewer crea `docs/reviews/review-feat-task-crud.md`:
- ¿Existe el feature plan? ✅
- ¿El schema de Zod se comparte entre frontend y backend? ✅
- ¿Se valida la sesión en el Route Handler? ✅
- ¿El optimistic update tiene rollback? ⚠️ Falta — pide corrección.
- ¿Hay test del service? ✅
- ¿Tests pasan? ✅
