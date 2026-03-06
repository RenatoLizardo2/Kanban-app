# 📦 Stack & Libraries — Quick Reference

## Dependencias de Producción

```bash
# Framework & Core
next                    # Framework fullstack (App Router)
react                   # UI library
react-dom               # React DOM renderer
typescript              # Type safety

# Auth
next-auth               # Autenticación (GitHub, Google, Credentials)

# Database
prisma                  # ORM CLI (también en devDependencies)
@prisma/client          # Prisma Client para queries

# State & Data Fetching
@tanstack/react-query   # Server state, cache, optimistic updates
zustand                 # Client/UI state (modals, sidebar, theme)

# Forms & Validation
react-hook-form         # Manejo de formularios performante
@hookform/resolvers     # Conecta React Hook Form con Zod
zod                     # Validación de schemas (compartido front/back)

# Drag & Drop
@hello-pangea/dnd       # Fork mantenido de react-beautiful-dnd

# UI & Styling
tailwindcss             # Utility-first CSS
clsx                    # Conditional classnames
tailwind-merge          # Merge conflicting Tailwind classes

# Auth Helpers
bcryptjs                # Hash de passwords (solo si se usa credentials)

# Utilities
date-fns                # Formateo de fechas (ligero, tree-shakeable)
```

## Dependencias de Desarrollo

```bash
# Testing
vitest                          # Unit testing (reemplazo de Jest)
@testing-library/react          # Testing de componentes React
@testing-library/jest-dom       # Matchers para DOM assertions
@vitejs/plugin-react            # Plugin de Vitest para React
playwright                      # E2E testing
@playwright/test                # Test runner de Playwright

# Code Quality
eslint                          # Linter
eslint-config-next              # Config de ESLint para Next.js
prettier                        # Formatter
prettier-plugin-tailwindcss     # Ordena clases de Tailwind
husky                           # Git hooks
lint-staged                     # Lint solo archivos staged

# Prisma
prisma                          # CLI para migraciones y generación
```

## Comando de instalación rápida

```bash
# Producción
npm install next-auth @prisma/client @tanstack/react-query zustand \
  react-hook-form @hookform/resolvers zod @hello-pangea/dnd \
  clsx tailwind-merge bcryptjs date-fns

# Desarrollo
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @vitejs/plugin-react playwright @playwright/test \
  prisma prettier prettier-plugin-tailwindcss \
  husky lint-staged

# Types
npm install -D @types/bcryptjs
```

## Mapa de uso por capa

```
┌─────────────────────────────────────────────────┐
│  COMPONENTES (Client)                            │
│  React Hook Form + Zod + @hello-pangea/dnd       │
│  Zustand (UI state) + TanStack Query (server)    │
├─────────────────────────────────────────────────┤
│  HOOKS                                           │
│  TanStack React Query (useQuery, useMutation)    │
├─────────────────────────────────────────────────┤
│  API ROUTES / SERVER ACTIONS                     │
│  Zod (validación) + NextAuth (sesión)            │
├─────────────────────────────────────────────────┤
│  SERVICES                                        │
│  Lógica de negocio pura (TypeScript)             │
├─────────────────────────────────────────────────┤
│  REPOSITORIES                                    │
│  Prisma Client (queries a PostgreSQL)            │
├─────────────────────────────────────────────────┤
│  BASE DE DATOS                                   │
│  PostgreSQL (Docker local / Railway prod)        │
└─────────────────────────────────────────────────┘
```
