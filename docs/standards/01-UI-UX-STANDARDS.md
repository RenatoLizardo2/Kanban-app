# 🎨 Estándar UI/UX — Kanban Task Manager

Este documento define los estándares de diseño e interfaz que el Coder debe seguir y el Reviewer debe validar.

---

## 1. Principios de Diseño

### Claridad sobre decoración
Cada elemento visual debe tener un propósito. Si no ayuda al usuario a completar una tarea, sobra. Evitar elementos decorativos que no comunican nada.

### Consistencia total
Los mismos patrones se repiten en toda la app. Un botón primario siempre se ve igual. Un modal siempre se comporta igual. Un toast siempre aparece en el mismo lugar.

### Feedback inmediato
Toda acción del usuario debe tener respuesta visual:
- Click en botón → estado loading visible
- Drag de tarea → preview visual de dónde caerá
- Error en form → mensaje inline junto al campo
- Acción exitosa → toast de confirmación
- Carga de datos → skeleton, nunca pantalla en blanco

### Mobile-first
Diseñar primero para pantallas pequeñas y escalar hacia arriba. Las media queries deben ir de menor a mayor (`min-width`), nunca al revés.

---

## 2. Sistema de Diseño (Design Tokens)

### Colores

Usar CSS variables para que el modo oscuro sea un cambio de variables, no de clases.

```css
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;

  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* Brand */
  --brand-primary: #6366f1;    /* Indigo 500 */
  --brand-hover: #4f46e5;      /* Indigo 600 */

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Borders */
  --border-default: #e2e8f0;
  --border-focus: #6366f1;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border-default: #334155;
}
```

### Tipografía

- **Font family:** Inter (Google Fonts) o la system font stack de Tailwind.
- **Tamaño base:** 16px mínimo para body text. Nunca menor a 14px en ningún elemento legible.
- **Jerarquía:**
  - h1: 2rem (32px), font-bold
  - h2: 1.5rem (24px), font-semibold
  - h3: 1.25rem (20px), font-semibold
  - body: 1rem (16px), font-normal
  - caption/muted: 0.875rem (14px), font-normal
- **Line height:** mínimo 1.5 para texto de párrafo.

### Espaciado

Usar la escala de Tailwind (4px base):
- Padding de componentes: `p-3` (12px) o `p-4` (16px)
- Gap entre elementos: `gap-2` (8px) a `gap-4` (16px)
- Secciones mayores: `py-8` (32px) o `py-12` (48px)
- Ser consistente: si las cards tienen `p-4`, TODAS las cards tienen `p-4`.

### Border Radius

Escala consistente:
- Botones: `rounded-lg` (8px)
- Cards / Modals: `rounded-xl` (12px)
- Avatares: `rounded-full`
- Inputs: `rounded-lg` (8px)

---

## 3. Componentes UI — Reglas

### Botones

- **Primario:** fondo sólido (brand), texto blanco. Usar para la acción principal de la vista.
- **Secundario:** fondo transparente, borde, texto brand. Acciones secundarias.
- **Destructivo:** fondo rojo para eliminar/cancelar.
- **Ghost:** sin fondo ni borde, solo texto. Para acciones terciarias.
- **Tamaño mínimo touch target:** 44x44px (estándar WCAG 2.2).
- **Estados obligatorios:** default, hover, focus (ring visible), active, disabled, loading.
- **Loading state:** mostrar spinner inline, deshabilitar el botón, no permitir doble click.

### Inputs / Forms

- Cada input DEBE tener un `<label>` asociado con `htmlFor`. Nunca usar placeholder como única etiqueta.
- Mostrar errores de validación inline debajo del campo, en rojo, con texto descriptivo (no solo "campo requerido" sino "El título es obligatorio").
- Focus ring visible: `ring-2 ring-brand-primary ring-offset-2`.
- Agrupar campos relacionados con spacing consistente.
- Formularios cortos: pedir solo la información estrictamente necesaria.

### Modals

- Siempre con overlay oscuro semitransparente detrás.
- Cerrar con click en overlay, botón X, y tecla Escape.
- Focus trap: el tab no debe salir del modal mientras está abierto.
- Al cerrar, devolver el focus al elemento que abrió el modal.
- Animar entrada/salida (fade + scale sutil).

### Toasts / Notificaciones

- Posición fija: esquina superior derecha (desktop) o inferior central (mobile).
- Auto-dismiss después de 4-5 segundos.
- Colores semánticos: verde=éxito, rojo=error, amarillo=warning, azul=info.
- Nunca usar alert() nativo del navegador.

### Cards (Task Cards)

- Sombra sutil en reposo, sombra elevada al hacer hover o drag.
- Indicador visual de prioridad (color o ícono).
- Acciones visibles on hover (editar, eliminar).
- Cursor `grab` en reposo, `grabbing` durante drag.

### Empty States

Toda lista/tabla/vista que pueda estar vacía DEBE tener un empty state diseñado:
- Ilustración o ícono relevante.
- Texto que explique qué debería haber aquí.
- CTA para crear el primer elemento.
- Ejemplo: "No tienes tareas aún. Crea tu primera tarea para empezar."

### Loading States

- Usar skeletons (no spinners genéricos) para contenido que va a cargar.
- Los skeletons deben reflejar la forma del contenido real.
- Mostrar loading en máximo 200ms. Si la respuesta tarda menos, no flashear el skeleton.

---

## 4. Responsive Design

### Breakpoints (Tailwind defaults)

- `sm`: 640px (teléfono landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (laptop)
- `xl`: 1280px (desktop)

### Reglas por breakpoint

**Mobile (< 640px):**
- Columnas del Kanban en stack vertical (scroll horizontal opcional).
- Sidebar colapsada por defecto (hamburger menu).
- Touch targets de 44px mínimo.
- Texto mínimo 16px (evita zoom automático en iOS).

**Tablet (640px - 1024px):**
- Kanban con 2-3 columnas visibles, scroll horizontal para el resto.
- Sidebar colapsable.

**Desktop (> 1024px):**
- Todas las columnas visibles.
- Sidebar abierta por defecto.
- Hover states activos.

---

## 5. Accesibilidad (WCAG 2.2)

### Obligatorio

- **Contraste mínimo:** 4.5:1 para texto normal, 3:1 para texto grande (18px+). Verificar con herramientas como el contrast checker de WebAIM.
- **Navegación por teclado:** toda la app debe ser navegable con Tab, Shift+Tab, Enter, Escape, y flechas.
- **Focus visible:** nunca hacer `outline: none` sin un reemplazo visible. Usar `focus-visible` para mostrar ring solo en navegación por teclado.
- **HTML semántico:** usar `<header>`, `<nav>`, `<main>`, `<section>`, `<button>`. No usar `<div onClick>` como botón.
- **Labels en formularios:** cada input tiene un label asociado.
- **Alt text en imágenes:** descriptivo, no "imagen" o "foto".
- **Roles ARIA:** solo cuando el HTML semántico no es suficiente. No abusar de aria-*.
- **Target size mínimo:** 24x24 CSS pixels para elementos clickeables (WCAG 2.2).

### Drag & Drop accesible

El Kanban con drag & drop DEBE tener una alternativa accesible por teclado:
- Seleccionar tarea con Enter/Space.
- Mover con flechas.
- Confirmar con Enter.
- `@hello-pangea/dnd` ya soporta esto — asegurarse de no desactivarlo.
- Incluir `aria-live` para anunciar cambios de posición a screen readers.

---

## 6. Animaciones y Transiciones

### Principios

- Las animaciones deben ser funcionales, no decorativas.
- Duración: 150ms-300ms para micro-interacciones. Nunca más de 500ms.
- Easing: `ease-out` para entradas, `ease-in` para salidas.
- Respetar `prefers-reduced-motion`: desactivar animaciones para usuarios que lo solicitan.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Dónde usar animaciones

- Entrada/salida de modals (fade + scale).
- Transición de drag & drop.
- Hover en cards (elevación de sombra).
- Feedback de botón (scale down sutil al click).
- Skeleton shimmer.

### Dónde NO usar animaciones

- Texto que aparece/desaparece sin motivo.
- Elementos decorativos que distraen.
- Bouncing, shaking, o efectos agresivos.

---

## 7. Modo Oscuro

- Implementar con `data-theme` attribute en `<html>`, no con clase.
- Persistir preferencia en cookie (no localStorage) para evitar flash.
- Respetar `prefers-color-scheme` del sistema como default.
- NO invertir colores — rediseñar con paleta oscura específica.
- Reducir sombras en dark mode (en fondos oscuros son menos visibles).
- Verificar contraste en AMBOS modos.
- Toggle accesible con label "Cambiar a modo oscuro/claro".

---

## 8. Checklist del Reviewer (UI/UX)

Para cada feature, el Reviewer debe verificar:

- [ ] ¿Los colores usan variables CSS, no valores hardcodeados?
- [ ] ¿La tipografía respeta la jerarquía definida?
- [ ] ¿Los botones tienen TODOS los estados (hover, focus, disabled, loading)?
- [ ] ¿Los formularios tienen labels, error messages inline, y focus ring?
- [ ] ¿Hay empty states para vistas vacías?
- [ ] ¿Hay loading states (skeletons) para datos async?
- [ ] ¿Es responsive en mobile, tablet y desktop?
- [ ] ¿El contraste de colores pasa WCAG 4.5:1?
- [ ] ¿Se puede navegar completamente con teclado?
- [ ] ¿El HTML usa elementos semánticos?
- [ ] ¿Las animaciones respetan prefers-reduced-motion?
- [ ] ¿Funciona correctamente en modo oscuro Y claro?
- [ ] ¿Los touch targets son mínimo 44x44px en mobile?
