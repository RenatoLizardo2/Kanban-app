# 🧪 Estándar de Testing — Kanban Task Manager

Este documento define dónde van los tests, cómo escribirlos, y qué reglas deben cumplir. La regla número uno: **los tests siempre deben pasar. Código con tests rotos no se mergea.**

---

## 1. Regla Fundamental

**CERO tests rotos en `main`.** Antes de cualquier merge o push a main:

```bash
npm run test        # Unit tests — todos deben pasar
npm run test:e2e    # E2E tests — todos deben pasar
npm run build       # Build — debe compilar sin errores
```

Si alguno falla, no se mergea. Sin excepciones. El CI (GitHub Actions) debe bloquear el merge automáticamente si algo falla.

---

## 2. Estructura de Archivos de Tests

### Unit Tests e Integration Tests — Colocados junto al código

Los tests unitarios y de integración viven **al lado del archivo que testean**, no en una carpeta separada. Esto facilita encontrarlos y mantenerlos.

```
src/
├── services/
│   ├── task.service.ts
│   └── task.service.test.ts          ← Unit test del service
│
├── repositories/
│   ├── task.repository.ts
│   └── task.repository.test.ts       ← Unit test del repository
│
├── schemas/
│   ├── task.schema.ts
│   └── task.schema.test.ts           ← Unit test del schema
│
├── hooks/
│   ├── useTasks.ts
│   └── useTasks.test.ts              ← Unit test del hook
│
├── components/
│   ├── board/
│   │   ├── task-card.tsx
│   │   └── task-card.test.tsx        ← Unit test del componente
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx
│
└── lib/
    ├── utils.ts
    └── utils.test.ts
```

**Convención de nombre:** `[nombre-archivo].test.ts` o `[nombre-archivo].test.tsx` (para componentes React).

### E2E Tests — En carpeta separada en la raíz

Los tests end-to-end viven en `tests/e2e/` porque no pertenecen a un archivo específico, sino que prueban flujos completos del usuario.

```
tests/
└── e2e/
    ├── auth.spec.ts                  ← Flujo: registro, login, logout
    ├── board-crud.spec.ts            ← Flujo: crear, editar, eliminar board
    ├── kanban-dnd.spec.ts            ← Flujo: drag & drop de tareas
    ├── task-crud.spec.ts             ← Flujo: crear, editar, eliminar tarea
    └── fixtures/
        ├── test-user.ts              ← Datos de prueba reutilizables
        └── test-board.ts
```

**Convención de nombre:** `[flujo].spec.ts` (usar `.spec` para E2E, `.test` para unit).

### Carpeta tests/ en la raíz — Solo para E2E y configuración compartida

```
tests/
├── e2e/                              ← Playwright E2E tests
│   ├── *.spec.ts
│   └── fixtures/
├── setup/                            ← Setup compartido
│   └── vitest.setup.ts              ← Setup global de Vitest
└── helpers/                          ← Utilidades de testing compartidas
    ├── render-with-providers.tsx     ← Wrapper con QueryClient, etc.
    ├── mock-session.ts              ← Mock de NextAuth session
    └── test-data.ts                 ← Factories de datos de prueba
```

---

## 3. Configuración de Vitest

```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup/vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/types/**',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```

### Setup file

```typescript
// tests/setup/vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Limpiar DOM después de cada test
afterEach(() => {
  cleanup();
});

// Mock de next/navigation (necesario para componentes con useRouter)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

---

## 4. Configuración de Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,       // No permitir .only en CI
  retries: process.env.CI ? 2 : 0,    // Reintentos solo en CI
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',          // Trace solo en reintentos
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 5. Qué Testear en Cada Capa

### Services (Unit Tests) — PRIORIDAD ALTA

Los services contienen la lógica de negocio. Son lo más importante de testear.

**Qué testear:**
- Lógica de negocio (reglas, cálculos, transformaciones).
- Validación de datos de entrada.
- Manejo de errores (qué pasa cuando el repo devuelve null, cuando falla la validación).
- Edge cases (lista vacía, datos al límite, duplicados).

**Qué NO testear:**
- La base de datos directamente — mockear el repository.
- Implementación interna — testear inputs/outputs.

```typescript
// src/services/task.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskService } from './task.service';
import { taskRepository } from '@/repositories/task.repository';
import { NotFoundError } from '@/lib/errors';

// Mock del repository
vi.mock('@/repositories/task.repository');

describe('taskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear una tarea con el orden correcto al final de la columna', async () => {
      vi.mocked(taskRepository.countByColumn).mockResolvedValue(3);
      vi.mocked(taskRepository.create).mockResolvedValue({
        id: 'task-1',
        title: 'Nueva tarea',
        order: 3,
        columnId: 'col-1',
        // ...
      });

      const result = await taskService.create({
        title: 'Nueva tarea',
        columnId: 'col-1',
        priority: 'MEDIUM',
      }, 'user-1');

      expect(taskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 3 })
      );
      expect(result.title).toBe('Nueva tarea');
    });

    it('debe lanzar NotFoundError si la columna no existe', async () => {
      vi.mocked(taskRepository.countByColumn).mockRejectedValue(
        new NotFoundError('Column', 'col-999')
      );

      await expect(
        taskService.create({
          title: 'Tarea',
          columnId: 'col-999',
          priority: 'LOW',
        }, 'user-1')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Schemas / Zod (Unit Tests) — PRIORIDAD ALTA

Son rápidos de testear y previenen muchos bugs.

```typescript
// src/schemas/task.schema.test.ts
import { describe, it, expect } from 'vitest';
import { createTaskSchema } from './task.schema';

describe('createTaskSchema', () => {
  it('debe aceptar datos válidos', () => {
    const result = createTaskSchema.safeParse({
      title: 'Mi tarea',
      columnId: 'clxyz123abc',
      priority: 'HIGH',
    });
    expect(result.success).toBe(true);
  });

  it('debe rechazar título vacío', () => {
    const result = createTaskSchema.safeParse({
      title: '',
      columnId: 'clxyz123abc',
      priority: 'MEDIUM',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El título es obligatorio');
    }
  });

  it('debe rechazar prioridad inválida', () => {
    const result = createTaskSchema.safeParse({
      title: 'Tarea',
      columnId: 'clxyz123abc',
      priority: 'URGENTE',
    });
    expect(result.success).toBe(false);
  });

  it('debe rechazar título mayor a 100 caracteres', () => {
    const result = createTaskSchema.safeParse({
      title: 'a'.repeat(101),
      columnId: 'clxyz123abc',
      priority: 'LOW',
    });
    expect(result.success).toBe(false);
  });
});
```

### Componentes (Unit Tests) — PRIORIDAD MEDIA

Testear comportamiento visible, no implementación interna.

**Qué testear:**
- Que renderiza el contenido correcto.
- Que los eventos del usuario disparan las acciones esperadas.
- Que los estados (loading, error, empty) se muestran correctamente.
- Accesibilidad: roles, labels, keyboard navigation.

**Qué NO testear:**
- State interno del componente (useState values).
- Estilos CSS o clases de Tailwind.
- Implementación de hooks internos.

```typescript
// src/components/board/task-card.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from './task-card';

const mockTask = {
  id: 'task-1',
  title: 'Implementar drag & drop',
  description: 'Agregar funcionalidad de arrastrar tareas',
  priority: 'HIGH' as const,
  order: 0,
  columnId: 'col-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TaskCard', () => {
  it('debe mostrar el título de la tarea', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />);
    expect(screen.getByText('Implementar drag & drop')).toBeInTheDocument();
  });

  it('debe mostrar indicador de prioridad alta', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />);
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('debe llamar onEdit al hacer click en editar', async () => {
    const handleEdit = vi.fn();
    const user = userEvent.setup();

    render(<TaskCard task={mockTask} onEdit={handleEdit} />);
    await user.click(screen.getByRole('button', { name: /editar/i }));

    expect(handleEdit).toHaveBeenCalledWith('task-1');
  });

  it('debe ser accesible con role article', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
```

### Hooks (Unit Tests) — PRIORIDAD MEDIA

```typescript
// src/hooks/useTasks.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks } from './useTasks';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useTasks', () => {
  it('debe retornar tareas de la columna', async () => {
    // Mock del fetch
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'task-1', title: 'Tarea 1' }],
    } as Response);

    const { result } = renderHook(
      () => useTasks('col-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
  });
});
```

### E2E Tests (Playwright) — PRIORIDAD ALTA para flujos críticos

Testean flujos completos del usuario real en el navegador.

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('debe permitir registro con email y password', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Nombre').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Contraseña').fill('SecurePass123!');
    await page.getByRole('button', { name: /registrarse/i }).click();

    // Debe redirigir al dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Test User')).toBeVisible();
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Contraseña').fill('wrongpass');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page.getByText(/credenciales inválidas/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

// tests/e2e/kanban-dnd.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Kanban Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    // Login y navegar al board
    // (usar helper o fixture)
  });

  test('debe mover tarea entre columnas', async ({ page }) => {
    const task = page.getByText('Mi tarea');
    const targetColumn = page.getByTestId('column-in-progress');

    await task.dragTo(targetColumn);

    // Verificar que la tarea está en la nueva columna
    await expect(targetColumn.getByText('Mi tarea')).toBeVisible();
  });
});
```

---

## 6. Scripts del package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

**Descripción de cada script:**
- `test` → Corre unit tests una vez (para CI).
- `test:watch` → Corre unit tests en modo watch (para desarrollo).
- `test:ui` → Abre la UI visual de Vitest en el navegador.
- `test:coverage` → Genera reporte de cobertura.
- `test:e2e` → Corre E2E tests con Playwright (headless).
- `test:e2e:ui` → Abre la UI de Playwright para debugging.
- `test:e2e:headed` → Corre E2E con navegador visible.
- `test:all` → Corre todo (unit + e2e).

---

## 7. CI/CD — GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests              # Solo corre si unit tests pasan
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run test:e2e

  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit       # Type check sin compilar
```

---

## 8. Reglas de Testing

### Lo que SIEMPRE debe cumplirse

- **Tests siempre pasan.** Si un test falla, se arregla antes de hacer push. No se skipea con `.skip`.
- **No `.only` en commits.** `describe.only()` y `it.only()` son para debugging local. Nunca deben llegar a un commit. Playwright tiene `forbidOnly` para esto en CI.
- **Tests son independientes.** Cada test puede correr solo, en cualquier orden. No depender de que otro test corra antes.
- **Tests son determinísticos.** El mismo test debe dar el mismo resultado siempre. No depender de timestamps, random, o datos externos.
- **Limpiar después de cada test.** `afterEach` con cleanup. No dejar estado residual.
- **Nombrar tests describiendo comportamiento del usuario.** No describir implementación.

```typescript
// ❌ MAL — describe implementación
it('should call setState with true', () => { ... });
it('should trigger useEffect', () => { ... });

// ✅ BIEN — describe comportamiento
it('debe mostrar el modal al hacer click en crear', () => { ... });
it('debe deshabilitar el botón mientras se envía el form', () => { ... });
```

### Lo que NUNCA debe hacerse

- **No testear implementación.** No verificar state interno, no verificar cuántas veces se renderizó, no verificar clases CSS.
- **No testear librerías de terceros.** No testear que React Query hace fetch, que Zod parsea, o que Prisma inserta. Testear TU lógica que usa esas librerías.
- **No hacer tests frágiles.** No buscar elementos por clase CSS o por estructura del DOM. Usar `getByRole`, `getByText`, `getByLabelText`.
- **No hacer snapshot tests** (excepto para componentes muy estables como íconos). Son frágiles y nadie los revisa cuando fallan.
- **No mockear todo.** Mockear solo las dependencias externas (API, DB, navegación). Dejar que la lógica interna corra real.

### Prioridad de queries (React Testing Library)

En este orden de preferencia:

1. `getByRole` — El más accesible. Simula cómo un screen reader encuentra elementos.
2. `getByLabelText` — Para inputs de formulario.
3. `getByPlaceholderText` — Alternativa para inputs.
4. `getByText` — Para texto visible.
5. `getByTestId` — Último recurso. Solo cuando no hay otra forma.

```typescript
// ❌ Evitar
screen.getByTestId('submit-btn');
document.querySelector('.btn-primary');

// ✅ Preferir
screen.getByRole('button', { name: /crear tarea/i });
screen.getByLabelText(/título/i);
```

---

## 9. Cobertura de Tests

### Umbrales mínimos

```
Statements:  70%
Branches:    70%
Functions:   70%
Lines:       70%
```

Estos son mínimos para el MVP. El objetivo a largo plazo es 80%+.

### Prioridad de cobertura (qué testear primero)

1. **Services** — Contienen la lógica de negocio. Cobertura objetivo: 90%+.
2. **Schemas (Zod)** — Validación de datos. Cobertura objetivo: 90%+.
3. **Hooks** — Lógica de fetching y mutaciones. Cobertura objetivo: 80%+.
4. **Componentes críticos** — Board, Column, TaskCard, formularios. Cobertura objetivo: 70%+.
5. **Utils/Lib** — Funciones helper. Cobertura objetivo: 80%+.
6. **Componentes UI simples** — Button, Input, Modal. Cobertura objetivo: 60%+ (son más estables).

### Archivos excluidos de cobertura

- Type definitions (`*.d.ts`).
- Layouts de Next.js (`layout.tsx`, `loading.tsx`).
- Archivos de configuración.
- Los propios archivos de test.

---

## 10. Checklist del Reviewer (Testing)

Para cada PR, el Reviewer debe verificar:

### Tests obligatorios
- [ ] ¿Todo service nuevo/modificado tiene unit test?
- [ ] ¿Todo schema Zod nuevo/modificado tiene unit test?
- [ ] ¿Los componentes principales de la feature tienen test?
- [ ] ¿Los flujos críticos tienen E2E test (auth, CRUD, drag & drop)?

### Calidad de tests
- [ ] ¿Los tests describen comportamiento, no implementación?
- [ ] ¿Se usan queries accesibles (getByRole, getByLabelText)?
- [ ] ¿No hay `.only` ni `.skip` en el código?
- [ ] ¿Cada test es independiente y determinístico?
- [ ] ¿Se mockea solo lo necesario (APIs, DB), no la lógica interna?

### CI/CD
- [ ] ¿`npm run test` pasa sin errores?
- [ ] ¿`npm run test:e2e` pasa sin errores?
- [ ] ¿`npm run build` compila sin errores?
- [ ] ¿La cobertura no baja del umbral mínimo (70%)?
