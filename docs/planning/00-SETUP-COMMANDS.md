# 🚀 Setup Commands — Kanban Task Manager

Corre estos comandos en orden desde tu terminal en VS Code.

---

## Paso 1: Crear el proyecto Next.js

```bash
npx create-next-app@latest kanban-task-manager
```

Cuando te pregunte, selecciona:

```
✔ Would you like to use TypeScript?                 → Yes
✔ Would you like to use ESLint?                     → Yes
✔ Would you like to use Tailwind CSS?               → Yes
✔ Would you like your code inside a `src/` directory? → Yes
✔ Would you like to use App Router? (recommended)   → Yes
✔ Would you like to use Turbopack for next dev?     → Yes
✔ Would you like to customize the import alias?     → No (dejar @/*)
```

```bash
cd kanban-task-manager
```

---

## Paso 2: Crear la estructura de docs/

```bash
mkdir -p docs/planning docs/roadmap docs/features docs/reviews docs/decisions docs/standards
```

---

## Paso 3: Crear la estructura de carpetas en src/

```bash
# Componentes
mkdir -p src/components/board
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/auth

# Lógica y capas
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/repositories
mkdir -p src/schemas
mkdir -p src/store
mkdir -p src/lib
mkdir -p src/types

# Tests (unit tests van junto al código, aquí solo e2e y setup)
mkdir -p tests/e2e/fixtures
mkdir -p tests/setup
mkdir -p tests/helpers
```

---

## Paso 4: Inicializar Git y hacer primer commit

```bash
git init
git add .
git commit -m "chore: initial Next.js project setup"
```

---

## Paso 5: Docker Compose para PostgreSQL

Crear el archivo en la raíz del proyecto:

```bash
cat > docker-compose.yml << 'EOF'
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
EOF
```

Levantar la base de datos:

```bash
docker compose up -d
```

Verificar que corre:

```bash
docker ps
```

---

## Paso 6: Instalar Prisma y configurar

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

Esto crea `prisma/schema.prisma` y un `.env`.

Edita el `.env` que se creó:

```bash
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://kanban_user:kanban_pass@localhost:5432/kanban_db"

# NextAuth
NEXTAUTH_SECRET="CAMBIAR-ESTO-generar-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (configurar después)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
EOF
```

Crea el `.env.example` (sin secretos, para el repo):

```bash
cat > .env.example << 'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/kanban_db"
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
EOF
```

---

## Paso 7: Instalar dependencias de producción

```bash
# Auth
npm install next-auth

# Database (ya instalado @prisma/client arriba)

# State & Data Fetching
npm install @tanstack/react-query zustand

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Drag & Drop
npm install @hello-pangea/dnd

# UI Utilities
npm install clsx tailwind-merge

# Auth helpers (para credentials)
npm install bcryptjs

# Date utilities
npm install date-fns
```

---

## Paso 8: Instalar dependencias de desarrollo

```bash
# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
npm install -D playwright @playwright/test

# Formatting
npm install -D prettier prettier-plugin-tailwindcss

# Git hooks
npm install -D husky lint-staged

# Types
npm install -D @types/bcryptjs
```

---

## Paso 9: Configurar Prettier

```bash
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOF
```

```bash
cat > .prettierignore << 'EOF'
node_modules
.next
dist
coverage
EOF
```

---

## Paso 10: Configurar Husky + Lint-Staged

```bash
npx husky init
```

```bash
cat > .husky/pre-commit << 'EOF'
npx lint-staged
EOF
```

Agrega lint-staged al `package.json` (manualmente o con este comando):

```bash
npm pkg set lint-staged='{"*.{ts,tsx}": ["eslint --fix", "prettier --write"], "*.{json,md,css}": ["prettier --write"]}'
```

---

## Paso 11: Actualizar .gitignore

Agrega estas líneas al `.gitignore` existente:

```bash
cat >> .gitignore << 'EOF'

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# Database
postgres_data/
EOF
```

---

## Paso 12: Crear archivo base del Prisma Client singleton

```bash
cat > src/lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOF
```

---

## Paso 13: Crear archivo de utils base

```bash
cat > src/lib/utils.ts << 'EOF'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF
```

---

## Paso 14: Commit del setup completo

```bash
git add .
git commit -m "chore: complete project setup with dependencies and tooling"
```

---

## Paso 15: Verificar que todo funciona

```bash
# Terminal 1 — Base de datos
docker compose up -d

# Terminal 2 — App
npm run dev
```

Abre `http://localhost:3000` y deberías ver la página default de Next.js.

---

## Resumen de scripts útiles

Agrega estos al `package.json` en la sección `scripts`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset"
  }
}
```

---

## ¿Qué sigue?

1. Copiar los docs de planificación a `docs/planning/`
2. Escribir el `prisma/schema.prisma` completo
3. Correr `npx prisma migrate dev --name init`
4. Configurar NextAuth
5. Empezar con el Sprint 1
