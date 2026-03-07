## Feature: Authentication (Phase 1)

Archivo: docs/features/feat-auth.md
Fecha: 2026-03-06
Sprint: 1-2
Estado: Planificado

### Objetivo

Los usuarios pueden registrarse con email/password, iniciar sesion con credenciales o OAuth (GitHub, Google), y cerrar sesion. Las rutas protegidas redirigen a `/login` si el usuario no esta autenticado. La sesion persiste entre recargas.

---

### Investigacion previa: Decisiones tecnicas

#### NextAuth v5 (Auth.js) en vez de v4

**Contexto:** NextAuth tiene dos versiones activas:

- `next-auth@latest` (v4.24.13) — estable, soporta Next.js 16
- `next-auth@beta` (v5.0.0-beta.30) — beta madura, soporta Next.js 16

**Decision:** Usar `next-auth@beta` (v5) porque:

1. **Mejor soporte App Router** — v5 fue reescrito para App Router nativo. v4 fue adaptado retroactivamente.
2. **API mas limpia** — `auth()` unificado en vez de `getServerSession()` + `getSession()` + `useSession()`.
3. **Edge Runtime compatible** — Middleware funciona sin restricciones.
4. **Auth.js es el futuro** — v4 esta en mantenimiento. v5 es donde van las mejoras.
5. **Peer deps verificados** — `next-auth@beta` declara `"next": "^14.0.0-0 || ^15.0.0 || ^16.0.0"` y `"react": "^18.2.0 || ^19.0.0"`.
6. **Portfolio relevance** — Demuestra familiaridad con la version moderna.

**Paquete a instalar:** `next-auth@beta`
**Adapter:** `@auth/prisma-adapter@^2.11.1`

**Referencia:** Si el Coder encuentra incompatibilidades criticas con Prisma 7 driver adapters, puede evaluar fallback a v4. Documentar en ADR si ocurre.

#### Zod 4 — Diferencias con Zod 3

El proyecto ya tiene `zod@^4.3.6` instalado. Zod 4 tiene cambios relevantes:

1. **Import** — Mismo: `import { z } from 'zod'` (Zod 4 tambien exporta `import { z } from 'zod/v4'` para importacion explicita).
2. **API compatible** — `.object()`, `.string()`, `.min()`, `.max()`, `.email()`, `.enum()`, `.safeParse()`, `.omit()`, `.pick()`, `.partial()`, `.extend()` funcionan igual.
3. **`z.infer<>`** — Mismo: `type LoginInput = z.infer<typeof loginSchema>`.
4. **Error handling** — `.error.issues` sigue existiendo. `.error.flatten()` sigue existiendo. Puede haber diferencias menores en la estructura.
5. **Standard Schema** — Zod 4 implementa `@standard-schema/spec`, lo cual permite que `@hookform/resolvers@^5.2.2` lo use directamente via `@standard-schema/utils` en vez de necesitar un resolver especifico de Zod.
6. **`z.string().cuid()`** — En Zod 4, `.cuid()` puede haber cambiado. Verificar en runtime. Si no existe, usar `.regex()` o `z.cuid()` como top-level.

**Impacto:** Minimo. Los schemas de auth son simples (email, password, name). El Coder debe verificar que `safeParse`, `flatten`, y el resolver de hookform funcionan correctamente con Zod 4 en los primeros tests.

#### @hookform/resolvers con Zod 4

`@hookform/resolvers@^5.2.2` usa `@standard-schema/utils` internamente. Zod 4 implementa Standard Schema. Esto significa que el resolver deberia funcionar sin configuracion especial:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/schemas/auth.schema';

const form = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
});
```

**Riesgo:** Si `zodResolver` de `@hookform/resolvers/zod` no funciona con Zod 4, usar el resolver generico de Standard Schema: `import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'`. Documentar la decision.

#### Prisma Adapter con Prisma 7

`@auth/prisma-adapter` espera recibir una instancia de PrismaClient. En nuestro proyecto, PrismaClient se importa de `@/generated/prisma/client` (no de `@prisma/client`). El adapter deberia funcionar igual ya que solo necesita la instancia, no importar el tipo.

**Posible issue:** Si el adapter importa tipos de `@prisma/client` internamente y falla, el Coder debera:

1. Verificar si `@auth/prisma-adapter` soporta Prisma 7 driver adapters
2. Si no, crear un adapter custom (wrapper simple sobre las queries de usuario)
3. Documentar en ADR

---

### Sub-tareas

#### T1. Instalar dependencias de autenticacion

Criterio: Todas las dependencias estan en `package.json` y `npm install` pasa sin errores

```bash
# Produccion
npm install next-auth@beta @auth/prisma-adapter bcryptjs react-hook-form @hookform/resolvers

# Desarrollo
npm install -D @types/bcryptjs
```

**Paquetes y versiones esperadas:**
| Paquete | Version | Proposito |
|---|---|---|
| `next-auth` | 5.0.0-beta.30 | Auth framework (Auth.js v5) |
| `@auth/prisma-adapter` | ^2.11.1 | Conecta NextAuth con Prisma |
| `bcryptjs` | ^3.x | Hash de passwords |
| `@types/bcryptjs` | ^3.x | Types para bcryptjs |
| `react-hook-form` | ^7.71.2 | Manejo de formularios |
| `@hookform/resolvers` | ^5.2.2 | Conecta React Hook Form con Zod |

**Nota:** `zod` ya esta instalado (`^4.3.6`).

---

#### T2. Crear Zod schemas de autenticacion (`src/schemas/auth.schema.ts`)

Criterio: Los schemas validan correctamente datos de login y registro. Tests unitarios pasan.

```typescript
// src/schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be at most 100 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

**Notas:**

- `loginSchema` es simple — email + password sin validaciones estrictas (solo presencia). La validacion real de credenciales ocurre en el service.
- `registerSchema` usa `.refine()` para validar que password y confirmPassword coincidan.
- Los mensajes de error estan en ingles (la app es en ingles para portfolio).
- Verificar que `z.string().email()` funciona en Zod 4. Si la API cambio, adaptar.

---

#### T3. Crear user repository (`src/repositories/user.repository.ts`)

Criterio: Exporta funciones para crear y buscar usuarios. Solo esta capa importa Prisma.

```typescript
// src/repositories/user.repository.ts
import { prisma } from '@/lib/prisma';
import type { User } from '@/generated/prisma/client';

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  },
};
```

**Notas:**

- El tipo `User` se importa de `@/generated/prisma/client` (Prisma 7).
- Solo queries necesarias para auth. No agregar queries de boards/tasks aqui.

---

#### T4. Crear auth service (`src/services/auth.service.ts`)

Criterio: Exporta funcion `register` que hashea password y crea usuario. Tests unitarios pasan.

```typescript
// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/user.repository';
import { registerSchema } from '@/schemas/auth.schema';
import { ValidationError } from '@/lib/errors';
import type { User } from '@/generated/prisma/client';

const SALT_ROUNDS = 12;

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<Omit<User, 'password'>> {
    // 1. Validate input
    const validation = registerSchema.safeParse(data);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues[0]?.message ?? 'Invalid data',
      );
    }

    // 2. Check if email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ValidationError('Email already in use');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 4. Create user
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    // 5. Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await userRepository.findByEmail(email);
    if (!user?.password) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};
```

**Notas:**

- `SALT_ROUNDS = 12` — buen balance entre seguridad y velocidad.
- `verifyCredentials` retorna null si el usuario no existe o la password es incorrecta (no revela cual fallo).
- Nunca retorna el campo `password` al caller.

---

#### T5. Configurar NextAuth v5 (`src/lib/auth.ts` + `src/lib/auth.config.ts`)

Criterio: NextAuth esta configurado con los 3 providers (GitHub, Google, Credentials). La funcion `auth()` retorna la sesion del usuario.

**Archivo 1: `src/lib/auth.config.ts`** — Providers (Edge-compatible, sin Prisma)

```typescript
// src/lib/auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { loginSchema } from '@/schemas/auth.schema';

export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Dynamic import to avoid Edge Runtime issues
        const { authService } = await import('@/services/auth.service');
        const user = await authService.verifyCredentials(
          parsed.data.email,
          parsed.data.password,
        );

        return user;
      },
    }),
  ],
  pages: {
    signIn: '/login',
    // signOut, error, etc. se usan defaults de NextAuth
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register');

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      if (!isLoggedIn) return false; // Redirects to pages.signIn
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
```

**Archivo 2: `src/lib/auth.ts`** — Auth handler con Prisma adapter

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
});
```

**Notas:**

- **Separacion `auth.config.ts` / `auth.ts`:** `auth.config.ts` no importa Prisma y es Edge-compatible (para middleware). `auth.ts` importa Prisma y se usa en Route Handlers y Server Components.
- **JWT strategy obligatoria con Credentials provider.** NextAuth v5 requiere JWT para Credentials porque las sesiones de DB no funcionan bien con credenciales customizadas.
- **`callbacks.authorized`** es la funcion que usa el middleware para decidir si una ruta esta protegida.
- **`callbacks.jwt` + `callbacks.session`** agregan el `user.id` al token y a la sesion, para que este disponible en `auth()`.
- **Dynamic import** en `authorize` para evitar importar Prisma en Edge Runtime.
- **PrismaAdapter(prisma)** — Pasar la instancia singleton. Si falla con Prisma 7 driver adapters, ver seccion "Decisiones tecnicas" arriba.

---

#### T6. Crear NextAuth API route (`src/app/api/auth/[...nextauth]/route.ts`)

Criterio: Las rutas `/api/auth/*` responden correctamente (signin, callback, signout, etc.)

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

---

#### T7. Crear API route de registro (`src/app/api/auth/register/route.ts`)

Criterio: `POST /api/auth/register` crea un usuario con password hasheado y retorna 201. Errores de validacion retornan 400.

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const user = await authService.register(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
```

**Nota:** Esta ruta NO requiere autenticacion (es para registro publico). La validacion con Zod ocurre dentro del service.

---

#### T8. Crear utility de session check (`src/lib/session.ts`)

Criterio: Exporta funcion `getRequiredSession` que retorna la sesion o lanza UnauthorizedError.

```typescript
// src/lib/session.ts
import { auth } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session;
}
```

**Uso en Route Handlers futuros (Phase 2+):**

```typescript
export async function GET() {
  const session = await getRequiredSession();
  const boards = await boardService.getByUserId(session.user.id);
  return NextResponse.json(boards);
}
```

---

#### T9. Extender tipos de NextAuth (`src/types/next-auth.d.ts`)

Criterio: `session.user.id` tiene tipo `string` en TypeScript (no `undefined`).

```typescript
// src/types/next-auth.d.ts
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
```

**Nota:** NextAuth v5 puede tener un metodo diferente de extender tipos. El Coder debe verificar la documentacion de Auth.js v5 y adaptar si es necesario.

---

#### T10. Crear componentes UI base — Button (`src/components/ui/button.tsx`)

Criterio: Componente Button con variantes (primary, secondary, destructive, ghost, outline), tamanos (sm, md, lg), estados (default, hover, focus, disabled, loading). Accesible con teclado.

**Variantes:**

- `primary` — Fondo brand (`--brand-primary`), texto blanco
- `secondary` — Fondo transparente, borde, texto brand
- `destructive` — Fondo rojo (`--color-error`), texto blanco
- `ghost` — Sin fondo ni borde, solo texto
- `outline` — Borde, fondo transparente

**Tamanos:**

- `sm` — `h-9 px-3 text-sm`
- `md` (default) — `h-10 px-4 text-sm`
- `lg` — `h-11 px-6 text-base`

**Estados obligatorios:**

- `disabled` — opacity reducida, `cursor-not-allowed`, `pointer-events-none`
- `loading` — spinner inline (SVG animado), deshabilitar click, mostrar texto "Loading..." o prop customizable

**Props:**

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
```

**Accesibilidad:**

- Touch target minimo 44x44px
- Focus ring visible (`ring-2 ring-offset-2`)
- `aria-disabled` cuando loading
- No usar `<div onClick>` — usar `<button>` nativo

---

#### T11. Crear componente UI base — Input (`src/components/ui/input.tsx`)

Criterio: Componente Input con label asociado, display de errores inline, focus ring. Accesible.

**Props:**

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
```

**Requisitos:**

- `<label>` con `htmlFor` siempre presente (nunca usar placeholder como unica etiqueta)
- Error message debajo del input, en rojo, con texto descriptivo
- Focus ring: `ring-2 ring-[--border-focus] ring-offset-2`
- Borde rojo cuando hay error
- Usa `cn()` de `@/lib/utils` para clases condicionales
- Input minimo 16px de font-size (evita zoom en iOS)
- Soporta `type="password"` (no necesita toggle de visibilidad en MVP)

---

#### T12. Crear componente Toast / sistema de notificaciones (`src/components/ui/toast.tsx`)

Criterio: Sistema de toasts que muestra mensajes de exito, error, warning, info. Auto-dismiss. Posicion fija.

**Opciones de implementacion:**

1. **React Context + state** — Simple, sin dependencia externa
2. **Libreria externa** — `sonner` o `react-hot-toast`

**Decision:** Usar implementacion propia con React Context. Razones:

- Demuestra capacidad de construir UI patterns complejos (portfolio)
- Sin dependencia externa
- Control total sobre estilos (CSS variables del design system)

**Alternativa aceptable:** Si la implementacion propia toma demasiado tiempo, usar `sonner` (ligero, buena DX, soporta Tailwind). El Coder decide.

**Requisitos:**

- 4 variantes: `success` (verde), `error` (rojo), `warning` (amarillo), `info` (azul) — usar CSS variables semanticas
- Auto-dismiss despues de 5 segundos
- Posicion: esquina superior derecha en desktop, inferior central en mobile
- Animacion de entrada/salida (fade + slide)
- Respetar `prefers-reduced-motion`
- API: `toast.success('Message')`, `toast.error('Message')`, etc.
- Provider en root layout

---

#### T13. Crear `LoginForm` component (`src/components/auth/login-form.tsx`)

Criterio: Formulario de login funcional con React Hook Form + Zod. Muestra errores de validacion inline. Envia credenciales via `signIn('credentials')`.

**Campos:**

- Email (tipo email)
- Password (tipo password)

**Funcionalidad:**

1. React Hook Form con `zodResolver(loginSchema)`
2. Al submit: `signIn('credentials', { email, password, redirect: false })`
3. Si error: mostrar toast de error ("Invalid credentials")
4. Si exito: redirect a `/` (dashboard)
5. Boton de submit con loading state durante la peticion
6. Link a `/register` ("Don't have an account? Sign up")

**Accesibilidad:**

- Todos los inputs con `<label>`
- Errores con `aria-describedby` vinculado al input
- Submit con Enter (comportamiento nativo de form)

---

#### T14. Crear `RegisterForm` component (`src/components/auth/register-form.tsx`)

Criterio: Formulario de registro funcional. Crea usuario via API y luego hace login automatico.

**Campos:**

- Name
- Email (tipo email)
- Password (tipo password)
- Confirm Password (tipo password)

**Funcionalidad:**

1. React Hook Form con `zodResolver(registerSchema)`
2. Al submit:
   a. `POST /api/auth/register` con los datos
   b. Si exito: `signIn('credentials', { email, password })` para login automatico
   c. Redirect a `/`
3. Si error 400 (email duplicado, etc.): mostrar toast de error
4. Si error 500: mostrar toast generico
5. Boton de submit con loading state
6. Link a `/login` ("Already have an account? Sign in")

---

#### T15. Crear OAuth buttons component (`src/components/auth/oauth-buttons.tsx`)

Criterio: Botones de "Sign in with GitHub" y "Sign in with Google" que disparan el flujo OAuth.

**Funcionalidad:**

- Boton GitHub: `signIn('github', { callbackUrl: '/' })`
- Boton Google: `signIn('google', { callbackUrl: '/' })`
- Loading state individual por boton
- Iconos de GitHub y Google (SVG inline, no libreria de iconos)
- Separador visual "or" entre OAuth y formulario de credenciales

---

#### T16. Crear auth layout (`src/app/(auth)/layout.tsx`)

Criterio: Layout centrado sin sidebar. Muestra contenido de login/register centrado en la pantalla.

**Requisitos:**

- Centrado vertical y horizontal (flexbox)
- Ancho maximo del form container: `max-w-md` (448px)
- Padding responsive
- Logo/nombre de la app arriba del form
- Fondo: `--bg-secondary` o `--bg-primary`
- Sin sidebar, sin navbar (auth pages son independientes)

---

#### T17. Crear pagina de login (`src/app/(auth)/login/page.tsx`)

Criterio: Pagina que renderiza LoginForm + OAuthButtons. Server component con metadata.

```typescript
// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

export const metadata: Metadata = {
  title: 'Sign In - PlanBoard',
};

export default function LoginPage() {
  return (
    <div>
      <h1>Sign in to PlanBoard</h1>
      <OAuthButtons />
      {/* Separador "or" */}
      <LoginForm />
    </div>
  );
}
```

---

#### T18. Crear pagina de registro (`src/app/(auth)/register/page.tsx`)

Criterio: Pagina que renderiza RegisterForm + OAuthButtons. Server component con metadata.

Misma estructura que login page pero con RegisterForm y titulo "Create your account".

---

#### T19. Crear middleware para rutas protegidas (`src/middleware.ts`)

Criterio: Rutas protegidas redirigen a `/login`. Rutas de auth redirigen a `/` si ya esta logueado.

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth';

export default auth;

export const config = {
  matcher: [
    // Proteger todas las rutas excepto:
    // - api/auth (NextAuth routes)
    // - _next (Next.js internals)
    // - archivos estaticos (favicon, images)
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Notas:**

- NextAuth v5 exporta `auth` como middleware directamente.
- La logica de autorizacion esta en `callbacks.authorized` de `auth.config.ts` (T5).
- El matcher excluye las rutas de NextAuth (`/api/auth/*`), archivos estaticos, y Next.js internals.
- Las rutas `/login` y `/register` son publicas (manejadas por `callbacks.authorized`).

---

#### T20. Crear `useAuth` hook (`src/hooks/useAuth.ts`)

Criterio: Hook que expone la sesion del usuario, estado de carga, y funciones de signOut.

```typescript
// src/hooks/useAuth.ts
'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    signOut: () => nextAuthSignOut({ callbackUrl: '/login' }),
  };
}
```

**Nota:** Requiere `<SessionProvider>` en el root layout.

---

#### T21. Agregar SessionProvider al root layout (`src/app/layout.tsx`)

Criterio: `<SessionProvider>` envuelve la app para que `useSession()` funcione en client components.

**Crear `src/components/auth/session-provider.tsx`:**

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Modificar `src/app/layout.tsx`** para envolver `{children}` con `<AuthSessionProvider>`.

Tambien agregar el `<ToastProvider>` aqui si el sistema de toasts usa Context.

---

#### T22. Actualizar metadata del root layout

Criterio: El titulo y descripcion reflejan PlanBoard, no "Create Next App".

```typescript
export const metadata: Metadata = {
  title: {
    default: 'PlanBoard',
    template: '%s - PlanBoard',
  },
  description: 'Kanban task manager with drag & drop',
};
```

---

### Data Flow

#### Login con credenciales

```
LoginForm (client)
  -> signIn('credentials', { email, password })
    -> NextAuth API route (/api/auth/[...nextauth])
      -> Credentials provider authorize()
        -> authService.verifyCredentials(email, password)
          -> userRepository.findByEmail(email)
            -> Prisma -> PostgreSQL
          <- User | null
        <- bcrypt.compare(password, hash)
      <- User | null (JWT token created)
    <- Session cookie set
  -> redirect to '/'
```

#### Registro

```
RegisterForm (client)
  -> fetch POST /api/auth/register
    -> authService.register({ name, email, password, confirmPassword })
      -> registerSchema.safeParse(data)
      -> userRepository.findByEmail(email) // check duplicate
      -> bcrypt.hash(password, 12)
      -> userRepository.create({ name, email, hashedPassword })
        -> Prisma -> PostgreSQL
      <- User (without password)
    <- 201 { user }
  -> signIn('credentials', { email, password }) // auto-login
  -> redirect to '/'
```

#### Login con OAuth (GitHub/Google)

```
OAuthButton (client)
  -> signIn('github', { callbackUrl: '/' })
    -> Redirect to GitHub OAuth page
    -> User authorizes
    -> GitHub redirects to /api/auth/callback/github
      -> NextAuth creates/updates User + Account via PrismaAdapter
        -> Prisma -> PostgreSQL
      <- JWT token created, session cookie set
    -> redirect to '/'
```

#### Session check en rutas protegidas

```
Browser request to any route
  -> middleware.ts (Edge Runtime)
    -> auth() (from auth.config.ts — no Prisma)
      -> Verify JWT token from cookie
      -> callbacks.authorized({ auth, request })
        -> isLoggedIn? -> allow
        -> !isLoggedIn && !authPage? -> redirect /login
        -> isLoggedIn && authPage? -> redirect /
```

---

### Archivos a crear

| Archivo                                      | Accion | Descripcion                                    |
| -------------------------------------------- | ------ | ---------------------------------------------- |
| `src/schemas/auth.schema.ts`                 | Crear  | Zod schemas: loginSchema, registerSchema       |
| `src/schemas/auth.schema.test.ts`            | Crear  | Unit tests para schemas                        |
| `src/repositories/user.repository.ts`        | Crear  | Queries de usuario (findByEmail, create)       |
| `src/services/auth.service.ts`               | Crear  | Logica de negocio: register, verifyCredentials |
| `src/services/auth.service.test.ts`          | Crear  | Unit tests para auth service                   |
| `src/lib/auth.config.ts`                     | Crear  | Providers y callbacks (Edge-compatible)        |
| `src/lib/auth.ts`                            | Crear  | NextAuth handler con PrismaAdapter             |
| `src/lib/session.ts`                         | Crear  | Utility getRequiredSession                     |
| `src/app/api/auth/[...nextauth]/route.ts`    | Crear  | NextAuth catch-all API route                   |
| `src/app/api/auth/register/route.ts`         | Crear  | Registration endpoint                          |
| `src/types/next-auth.d.ts`                   | Crear  | Type augmentation para Session                 |
| `src/components/ui/button.tsx`               | Crear  | Button con variantes y estados                 |
| `src/components/ui/input.tsx`                | Crear  | Input con label y error display                |
| `src/components/ui/toast.tsx`                | Crear  | Sistema de toasts                              |
| `src/components/auth/login-form.tsx`         | Crear  | Formulario de login                            |
| `src/components/auth/login-form.test.tsx`    | Crear  | Test del componente                            |
| `src/components/auth/register-form.tsx`      | Crear  | Formulario de registro                         |
| `src/components/auth/register-form.test.tsx` | Crear  | Test del componente                            |
| `src/components/auth/oauth-buttons.tsx`      | Crear  | Botones de OAuth                               |
| `src/components/auth/session-provider.tsx`   | Crear  | Client wrapper de SessionProvider              |
| `src/app/(auth)/layout.tsx`                  | Crear  | Auth layout centrado                           |
| `src/app/(auth)/login/page.tsx`              | Crear  | Pagina de login                                |
| `src/app/(auth)/register/page.tsx`           | Crear  | Pagina de registro                             |
| `src/middleware.ts`                          | Crear  | Middleware de rutas protegidas                 |
| `src/hooks/useAuth.ts`                       | Crear  | Hook de sesion                                 |
| `tests/e2e/auth.spec.ts`                     | Crear  | E2E tests de autenticacion                     |

### Archivos a modificar

| Archivo              | Accion                                 | Descripcion                                                 |
| -------------------- | -------------------------------------- | ----------------------------------------------------------- |
| `src/app/layout.tsx` | Modificar                              | Agregar SessionProvider, ToastProvider, actualizar metadata |
| `package.json`       | Modificar (automatico via npm install) | Nuevas dependencias                                         |

### Archivos que NO se tocan

| Archivo                | Razon                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| `prisma/schema.prisma` | Ya tiene los modelos de auth (User, Account, Session, VerificationToken) |
| `src/lib/prisma.ts`    | Singleton ya configurado                                                 |
| `src/lib/errors.ts`    | Error classes ya existen                                                 |
| `src/lib/utils.ts`     | `cn()` ya existe                                                         |
| `docs/planning/*`      | No se modifican per feature                                              |
| `docs/standards/*`     | No se modifican per feature                                              |

---

### Estandares a consultar

- `docs/standards/02-CODE-STANDARDS.md` — Seccion 1 (TypeScript strict), Seccion 7 (Zod), Seccion 3 (rutas API), Seccion 4 (componentes)
- `docs/standards/01-UI-UX-STANDARDS.md` — Seccion 3 (Forms, Buttons, Toasts), Seccion 5 (Accesibilidad)
- `docs/standards/03-TESTING-STANDARDS.md` — Seccion 5 (que testear por capa), Seccion 8 (reglas)

---

### Decisiones

1. **NextAuth v5 (beta) en vez de v4** — Explicado en seccion "Investigacion previa". Mejor soporte App Router, API mas limpia, compatible con Next.js 16.

2. **JWT strategy en vez de database sessions** — Obligatorio con Credentials provider en NextAuth v5. JWT almacena el token en cookie, no en la tabla Session de la DB. Las sesiones de DB siguen usandose para OAuth si el adapter esta configurado, pero el session strategy es JWT para unificar.

3. **Separar `auth.config.ts` de `auth.ts`** — `auth.config.ts` es Edge-compatible (no importa Prisma). Se usa en middleware. `auth.ts` importa Prisma y se usa en Route Handlers y Server Components.

4. **Route de registro separada (`/api/auth/register`)** — NextAuth no maneja registro de usuarios con Credentials. Necesitamos un endpoint custom para crear usuarios con password hasheado.

5. **`confirmPassword` en registerSchema** — Se valida solo en frontend (no se envia al backend despues de validar). Proporciona mejor UX al evitar errores de typo en password.

6. **Toast propio vs libreria** — Implementacion propia para portfolio. Si toma demasiado tiempo, el Coder puede usar `sonner` como fallback.

7. **No instalar React Query ni Zustand** — No son necesarios en Phase 1. Auth usa `useSession()` de NextAuth para estado de sesion. React Query se instala en Phase 2 para boards/tasks.

---

### Edge Cases

#### Registro

- **Email ya registrado** — `authService.register` lanza `ValidationError('Email already in use')`. La API retorna 400. El form muestra toast de error.
- **Password y confirmPassword no coinciden** — `registerSchema.refine()` falla. Error inline en el campo confirmPassword.
- **Email con formato invalido** — `z.string().email()` falla. Error inline en el campo email.
- **Name demasiado corto** — `z.string().min(2)` falla. Error inline.
- **Password demasiado corta** — `z.string().min(8)` falla. Error inline.
- **Request body invalido o vacio** — `request.json()` puede fallar. Catch generico retorna 500.
- **Usuario registrado con OAuth intenta registrarse con credenciales usando el mismo email** — `findByEmail` encontrara el usuario existente (creado por OAuth). Retorna "Email already in use". Esto es correcto — el usuario debe usar OAuth para ese email.

#### Login con credenciales

- **Email no registrado** — `verifyCredentials` retorna null. NextAuth retorna error generico. Form muestra "Invalid credentials" (no revelar si el email existe o no).
- **Password incorrecta** — Mismo comportamiento que email no registrado.
- **Usuario registrado con OAuth intenta login con credenciales** — El usuario no tiene password (`user.password === null`). `verifyCredentials` retorna null. Se muestra "Invalid credentials". Podria mejorarse con un mensaje mas especifico ("This account uses GitHub/Google sign-in") pero eso revela informacion. Decision: mensaje generico por seguridad.
- **Campos vacios** — `loginSchema` los rechaza. Error inline en el form.

#### Login con OAuth

- **Usuario cancela el flujo OAuth** — NextAuth maneja el redirect. Vuelve a `/login` sin error visible (o con query param de error que se puede mostrar).
- **OAuth provider no configurado (CLIENT_ID vacio)** — El boton deberia funcionar pero el redirect fallara. No hay validacion en el frontend — la proteccion es que el `.env` debe tener los valores. Documentar en `.env.example`.
- **Email del OAuth ya existe como credentials user** — NextAuth con PrismaAdapter vincula la cuenta OAuth al usuario existente (si el email coincide). Comportamiento esperado.
- **Usuario revoca acceso en GitHub/Google** — NextAuth maneja el token refresh. Si falla, el usuario tendra que re-autorizar.

#### Sesion

- **Token JWT expirado** — NextAuth maneja la expiracion. El middleware detecta sesion invalida y redirige a `/login`.
- **Cookie eliminada manualmente** — El middleware detecta sin sesion y redirige a `/login`.
- **Multiples pestanas** — JWT en cookie funciona en todas las pestanas del mismo navegador.

#### Middleware

- **Ruta no cubierta por matcher** — Archivos estaticos, `_next/`, y `/api/auth/` no pasan por el middleware. Esto es correcto.
- **Request a `/api/auth/register` sin body** — El route handler captura el error con try/catch.

---

### Tests requeridos

#### Unit tests (Vitest)

**`src/schemas/auth.schema.test.ts`**

- loginSchema: acepta datos validos
- loginSchema: rechaza email vacio
- loginSchema: rechaza email invalido
- loginSchema: rechaza password vacio
- registerSchema: acepta datos validos
- registerSchema: rechaza name menor a 2 caracteres
- registerSchema: rechaza name mayor a 50 caracteres
- registerSchema: rechaza email invalido
- registerSchema: rechaza password menor a 8 caracteres
- registerSchema: rechaza password mayor a 100 caracteres
- registerSchema: rechaza cuando passwords no coinciden
- registerSchema: acepta cuando passwords coinciden

**`src/services/auth.service.test.ts`**

- register: crea usuario con password hasheado
- register: lanza ValidationError si email ya existe
- register: lanza ValidationError si datos invalidos
- register: retorna usuario sin campo password
- register: hashea el password (no lo almacena en texto plano)
- verifyCredentials: retorna usuario si credenciales validas
- verifyCredentials: retorna null si email no existe
- verifyCredentials: retorna null si password incorrecta
- verifyCredentials: retorna null si usuario no tiene password (OAuth user)
- verifyCredentials: retorna usuario sin campo password

**Mocking:** Mock `userRepository` y `bcryptjs` en tests del service.

#### Component tests (Vitest + RTL)

**`src/components/auth/login-form.test.tsx`**

- Renderiza campos de email y password
- Renderiza boton de submit
- Muestra errores de validacion al submit con campos vacios
- Muestra error de email invalido
- Llama signIn con credenciales al submit exitoso
- Muestra loading state en el boton durante submit
- Tiene link a pagina de registro

**`src/components/auth/register-form.test.tsx`**

- Renderiza campos de name, email, password, confirmPassword
- Renderiza boton de submit
- Muestra errores de validacion al submit con campos vacios
- Muestra error cuando passwords no coinciden
- Llama fetch POST /api/auth/register al submit exitoso
- Muestra loading state en el boton durante submit
- Tiene link a pagina de login

#### E2E tests (Playwright)

**`tests/e2e/auth.spec.ts`**

**Nota para E2E:** Los tests de OAuth (GitHub, Google) no se pueden testear en E2E facilmente (requieren cuentas reales). Testear solo el flujo de credenciales.

- Registro exitoso: fill form -> submit -> redirect a dashboard
- Registro con email duplicado: muestra error
- Login exitoso: fill form -> submit -> redirect a dashboard
- Login con credenciales invalidas: muestra error
- Login con campos vacios: muestra errores de validacion
- Ruta protegida sin sesion: redirect a /login
- Logout: click logout -> redirect a /login
- Pagina de login con sesion activa: redirect a dashboard

**Prerequisito E2E:** Docker + PostgreSQL corriendo. El Coder puede crear un script `test:e2e:setup` o usar `webServer` de Playwright config para levantar el entorno.

---

### Orden de ejecucion sugerido

1. **T1** — Instalar dependencias
2. **T2** — Schemas de auth (+ tests)
3. **T3** — User repository
4. **T4** — Auth service (+ tests)
5. **T5** — NextAuth config (auth.config.ts + auth.ts)
6. **T6** — NextAuth API route
7. **T7** — Register API route
8. **T8** — Session check utility
9. **T9** — Type augmentation next-auth.d.ts
10. **T19** — Middleware (probar que protege rutas)
11. **T10** — Button component
12. **T11** — Input component
13. **T12** — Toast system
14. **T16** — Auth layout
15. **T21** — SessionProvider + root layout update
16. **T22** — Update root layout metadata
17. **T13** — LoginForm (+ tests)
18. **T14** — RegisterForm (+ tests)
19. **T15** — OAuth buttons
20. **T17** — Login page
21. **T18** — Register page
22. **T20** — useAuth hook
23. **E2E** — auth.spec.ts

**Logica:** Backend primero (schemas -> repo -> service -> auth config -> routes -> middleware), luego UI (components base -> forms -> pages -> hook). Tests junto a cada pieza.

---

### Commits sugeridos (granulares)

El Coder debe hacer commits granulares, uno por sub-tarea o grupo logico:

```
feat(auth): add auth schemas with Zod validation
test(auth): add unit tests for auth schemas
feat(auth): add user repository
feat(auth): add auth service with register and verify
test(auth): add unit tests for auth service
feat(auth): configure NextAuth v5 with providers
feat(auth): add NextAuth API route handler
feat(auth): add registration API endpoint
feat(auth): add session check utility
feat(auth): add NextAuth type augmentation
feat(auth): add middleware for protected routes
feat(ui): add Button component with variants
feat(ui): add Input component with label and error
feat(ui): add Toast notification system
feat(auth): add auth layout
feat(auth): add SessionProvider to root layout
feat(auth): add LoginForm component
test(auth): add LoginForm component tests
feat(auth): add RegisterForm component
test(auth): add RegisterForm component tests
feat(auth): add OAuth buttons component
feat(auth): add login page
feat(auth): add register page
feat(auth): add useAuth hook
test(auth): add E2E auth tests
```
