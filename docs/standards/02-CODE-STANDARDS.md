# 🧹 Estándar de Código — Kanban Task Manager

Este documento define las reglas de código que el Coder debe seguir y el Reviewer debe validar. Cero tolerancia a `any`, errores silenciados, o código sin tipar.

---

## 1. TypeScript — Reglas Estrictas

### Configuración base (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": false
  }
}
```

### Reglas inquebrantables

**CERO `any`.** Si no sabes el tipo, usa `unknown` y haz narrowing. Si realmente necesitas flexibilidad, usa un genérico. `any` no tiene excusa.

```typescript
// ❌ PROHIBIDO
function parseData(data: any) { ... }
const result: any = await fetch(...)

// ✅ CORRECTO
function parseData(data: unknown) {
  if (isTaskData(data)) { ... }
}
const result: Response = await fetch(...)
```

**CERO `@ts-ignore` o `@ts-expect-error`.** Si TypeScript se queja, el código está mal — arréglalo, no lo silencies.

**CERO assertions innecesarias.** No usar `as` para forzar tipos a menos que sea absolutamente necesario y esté comentado con la razón.

```typescript
// ❌ Evitar
const user = data as User;

// ✅ Preferir
const user = parseUser(data); // Función que valida y retorna User | null
```

**Tipos explícitos en funciones públicas.** Las funciones exportadas deben tener tipo de retorno explícito.

```typescript
// ❌ Sin retorno explícito
export function getBoard(id: string) {
  return prisma.board.findUnique({ where: { id } });
}

// ✅ Con retorno explícito
export async function getBoard(id: string): Promise<Board | null> {
  return prisma.board.findUnique({ where: { id } });
}
```

**Usar `satisfies` cuando sea posible** en vez de type assertion.

```typescript
const config = {
  theme: 'dark',
  lang: 'es',
} satisfies AppConfig;
```

---

## 2. Convenciones de Naming

### Archivos y carpetas

| Elemento | Convención | Ejemplo |
|---|---|---|
| Carpetas | kebab-case | `board-view/`, `task-card/` |
| Componentes React | kebab-case (archivo) | `board-view.tsx`, `task-card.tsx` |
| Hooks | camelCase | `useBoard.ts`, `useTasks.ts` |
| Services | kebab-case | `board.service.ts`, `task.service.ts` |
| Repositories | kebab-case | `board.repository.ts` |
| Schemas (Zod) | kebab-case | `board.schema.ts` |
| Types | kebab-case | `board.types.ts` |
| Utils/Lib | kebab-case | `prisma.ts`, `utils.ts` |
| Tests | mismo nombre + `.test` | `board.service.test.ts` |

### Variables y funciones

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables | camelCase | `taskList`, `boardId`, `isLoading` |
| Funciones | camelCase | `getBoard()`, `createTask()`, `handleSubmit()` |
| Constantes | SCREAMING_SNAKE | `MAX_COLUMNS`, `DEFAULT_PRIORITY` |
| Booleanos | prefijo is/has/can/should | `isLoading`, `hasError`, `canEdit` |
| Handlers | prefijo handle | `handleClick`, `handleDragEnd` |
| Callbacks (props) | prefijo on | `onClick`, `onDragEnd`, `onSubmit` |

### Componentes y tipos

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase | `BoardView`, `TaskCard` |
| Interfaces | PascalCase | `Board`, `TaskWithColumn` |
| Types | PascalCase | `Priority`, `BoardFormData` |
| Enums | PascalCase (members UPPER) | `Priority.HIGH`, `Status.DONE` |
| Generics | letra mayúscula descriptiva | `T`, `TData`, `TError` |

### Reglas adicionales de naming

- Evitar abreviaciones crípticas: `btn` → `button`, `msg` → `message`, `usr` → `user`.
- Nombres de variables deben revelar intención: `d` → `dueDate`, `t` → `task`.
- Nombres de funciones deben describir lo que hacen: `process()` → `reorderTasksInColumn()`.
- No usar números en nombres: `task2` → `updatedTask` o `clonedTask`.

---

## 3. Rutas y API — Convenciones

### Rutas de página (App Router)

```
src/app/
├── page.tsx                        → /
├── (auth)/
│   ├── login/page.tsx              → /login
│   └── register/page.tsx           → /register
├── (dashboard)/
│   ├── page.tsx                    → / (dashboard home)
│   └── board/
│       └── [boardId]/page.tsx      → /board/abc123
```

**Reglas:**
- Carpetas siempre en **kebab-case** y plural cuando representan colecciones.
- Route Groups `(nombre)` para organizar sin afectar URL.
- Dynamic segments con `[param]` en camelCase: `[boardId]`, `[taskId]`.
- Nunca anidar más de 3 niveles de profundidad en rutas.

### Rutas de API (Route Handlers)

```
src/app/api/
├── boards/
│   ├── route.ts                    → GET /api/boards (listar)
│   │                               → POST /api/boards (crear)
│   └── [boardId]/
│       ├── route.ts                → GET /api/boards/:id (detalle)
│       │                           → PUT /api/boards/:id (actualizar)
│       │                           → DELETE /api/boards/:id (eliminar)
│       └── columns/
│           └── route.ts            → GET /api/boards/:id/columns
│
├── columns/
│   └── [columnId]/
│       └── route.ts                → PUT, DELETE
│
├── tasks/
│   ├── route.ts                    → POST /api/tasks (crear)
│   ├── [taskId]/
│   │   └── route.ts               → GET, PUT, DELETE
│   └── reorder/
│       └── route.ts               → PUT /api/tasks/reorder (drag & drop)
```

**Reglas:**
- Nombres de recursos en **plural** y **kebab-case**: `/boards`, `/tasks`.
- Verbos HTTP, NO verbos en la URL: `POST /api/tasks` en vez de `/api/create-task`.
- IDs en la URL para operaciones sobre un recurso específico.
- Acciones especiales como `reorder` se permiten como sub-ruta cuando no encajan en CRUD estándar.
- Siempre responder con status codes correctos:
  - `200` → OK (GET, PUT exitoso)
  - `201` → Created (POST exitoso)
  - `204` → No Content (DELETE exitoso)
  - `400` → Bad Request (validación fallida)
  - `401` → Unauthorized (sin sesión)
  - `403` → Forbidden (sin permisos)
  - `404` → Not Found
  - `500` → Internal Server Error

### Estructura de un Route Handler

```typescript
// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTaskSchema } from '@/schemas/task.schema';
import { taskService } from '@/services/task.service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verificar autenticación
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  // 2. Parsear y validar body con Zod
  const body = await request.json();
  const validation = createTaskSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // 3. Delegar al service
  try {
    const task = await taskService.create(validation.data, session.user.id);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    // 4. Manejo de errores tipado
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

---

## 4. Estructura de Componentes

### Orden dentro de un componente

```typescript
// 1. Imports (agrupados: externos → internos → types)
import { useState, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types';

// 2. Tipos/Interfaces del componente
interface TaskCardProps {
  task: Task;
  onEdit: (taskId: string) => void;
}

// 3. Componente
export default function TaskCard({ task, onEdit }: TaskCardProps) {
  // 3a. Hooks (siempre al inicio, en este orden)
  const [isOpen, setIsOpen] = useState(false);
  const { deleteTask } = useTasks();

  // 3b. Derived state / memos
  const priorityColor = getPriorityColor(task.priority);

  // 3c. Handlers
  const handleDelete = useCallback(() => {
    deleteTask.mutate(task.id);
  }, [task.id, deleteTask]);

  // 3d. Early returns
  if (!task) return null;

  // 3e. JSX
  return (
    <div>...</div>
  );
}

// 4. Helper functions (fuera del componente)
function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    LOW: 'text-blue-500',
    MEDIUM: 'text-yellow-500',
    HIGH: 'text-red-500',
  };
  return colors[priority];
}
```

### Reglas de componentes

- **Un componente por archivo.** No exportar múltiples componentes del mismo archivo.
- **Props tipadas con interface,** nunca inline.
- **Default export** para componentes de página, **named export** para componentes reutilizables.
- **No business logic en componentes.** Si tiene más de 5 líneas de lógica, extraer a un hook o util.
- **Evitar props drilling** más de 2 niveles. Usar context o Zustand.

---

## 5. Imports — Orden y Agrupación

```typescript
// 1. Externos (React, Next, librerías)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

// 2. Internos (alias @/)
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';

// 3. Types (siempre con `import type`)
import type { Task, Board } from '@/types';

// 4. Estilos (si los hay)
import './styles.css';
```

**Reglas:**
- Usar `import type` para importaciones que solo son tipos.
- Nunca importar con rutas relativas profundas (`../../../`). Usar siempre el alias `@/`.
- No hacer barrel exports (`index.ts` que re-exporta todo) excepto en `types/index.ts`.

---

## 6. Manejo de Errores

### En el frontend

```typescript
// ❌ PROHIBIDO — catch vacío
try {
  await createTask(data);
} catch (e) {}

// ❌ PROHIBIDO — console.log en producción
try {
  await createTask(data);
} catch (e) {
  console.log(e);
}

// ✅ CORRECTO — manejo explícito con feedback al usuario
try {
  await createTask(data);
  toast.success('Tarea creada');
} catch (error) {
  const message = error instanceof Error
    ? error.message
    : 'Error al crear la tarea';
  toast.error(message);
}
```

### En el backend (services)

```typescript
// Crear errores custom tipados
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} con id ${id} no encontrado`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'No autorizado') {
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

### Reglas generales

- Nunca silenciar errores con catch vacío.
- Nunca usar `console.log` para debugging en código commiteado. Usar un logger o eliminarlo.
- Los errores de API siempre deben retornar un JSON con estructura consistente: `{ error: string, details?: unknown }`.
- Todo error del usuario debe mostrar un toast o mensaje inline — nunca fallar silenciosamente.

---

## 7. Zod — Estándar de Validación

### Ubicación

Todos los schemas viven en `src/schemas/`. Se comparten entre frontend (React Hook Form) y backend (API routes).

### Convención de nombres

```typescript
// src/schemas/task.schema.ts

import { z } from 'zod';

// Schema base del modelo
export const taskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'El título es obligatorio').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  order: z.number().int().min(0),
  columnId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema para CREAR (omitir campos auto-generados)
export const createTaskSchema = taskSchema.omit({
  id: true,
  order: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para ACTUALIZAR (todo parcial excepto id)
export const updateTaskSchema = taskSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

// Schema para reordenar (drag & drop)
export const reorderTaskSchema = z.object({
  taskId: z.string().cuid(),
  sourceColumnId: z.string().cuid(),
  destinationColumnId: z.string().cuid(),
  newOrder: z.number().int().min(0),
});

// Tipos inferidos (NUNCA definir tipos manualmente si hay schema)
export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;
```

### Reglas de Zod

- **Mensajes de error en español** (o en el idioma de la app). Nunca dejar los mensajes default de Zod en inglés si la UI es en español.
- **Inferir tipos desde el schema:** usar `z.infer<>` en vez de definir interfaces separadas.
- **Validar en ambos lados:** el mismo schema se usa en React Hook Form (frontend) y en el Route Handler (backend).
- **Schemas derivados:** usar `.omit()`, `.pick()`, `.partial()`, `.extend()` para crear variantes del schema base.
- **No duplicar validaciones:** si Zod ya valida, no validar manualmente con if/else.

### Integración con React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, type CreateTaskInput } from '@/schemas/task.schema';

const form = useForm<CreateTaskInput>({
  resolver: zodResolver(createTaskSchema),
  defaultValues: {
    title: '',
    description: '',
    priority: 'MEDIUM',
    columnId: columnId,
  },
});
```

---

## 8. Git — Convenciones de Commits

### Formato

```
type(scope): description

[optional body]
```

### Types permitidos

| Type | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin cambiar funcionalidad |
| `style` | Cambios de formato (no CSS, sino code style) |
| `test` | Agregar o modificar tests |
| `docs` | Documentación |
| `chore` | Config, deps, tooling |
| `perf` | Mejora de rendimiento |

### Scopes del proyecto

`auth`, `board`, `task`, `column`, `ui`, `api`, `db`, `config`, `test`

### Ejemplos

```
feat(board): add drag and drop between columns
fix(auth): redirect to login on expired session
refactor(task): extract priority logic to util function
test(board): add unit tests for reorder service
docs(planning): update roadmap with sprint 3 details
chore(deps): upgrade @tanstack/react-query to v5.20
```

### Reglas

- Descripción en imperativo y minúsculas: "add feature" no "Added feature" ni "Adding feature".
- Máximo 72 caracteres en la primera línea.
- Un commit = un cambio lógico. No commitear 5 cosas distintas juntas.
- No commitear código comentado, console.logs, o archivos temporales.

---

## 9. Checklist del Reviewer (Código)

Para cada PR o feature, el Reviewer debe verificar:

### TypeScript
- [ ] ¿Cero `any` en todo el código?
- [ ] ¿Cero `@ts-ignore` o `@ts-expect-error`?
- [ ] ¿Funciones exportadas tienen tipo de retorno explícito?
- [ ] ¿Se usa `import type` para importaciones de solo tipo?

### Naming
- [ ] ¿Archivos en kebab-case?
- [ ] ¿Componentes en PascalCase?
- [ ] ¿Variables/funciones en camelCase con nombres descriptivos?
- [ ] ¿Booleanos con prefijo is/has/can/should?
- [ ] ¿Handlers con prefijo handle, callbacks con prefijo on?

### Rutas
- [ ] ¿Recursos en plural y kebab-case?
- [ ] ¿Status codes correctos en respuestas?
- [ ] ¿Se valida con Zod antes de procesar?
- [ ] ¿Se verifica sesión antes de operar?

### Errores
- [ ] ¿Cero catch vacíos?
- [ ] ¿Cero console.log en código a commitear?
- [ ] ¿Errores muestran feedback al usuario?
- [ ] ¿Errores de API retornan JSON consistente?

### Zod
- [ ] ¿Tipos inferidos desde schemas (no duplicados)?
- [ ] ¿Mismo schema usado en frontend y backend?
- [ ] ¿Mensajes de error descriptivos?

### General
- [ ] ¿No hay código comentado?
- [ ] ¿No hay TODO sin issue/ticket asociado?
- [ ] ¿Imports ordenados y sin rutas relativas profundas?
- [ ] ¿Componentes con responsabilidad única?
- [ ] ¿Lógica de negocio en services, no en componentes?
