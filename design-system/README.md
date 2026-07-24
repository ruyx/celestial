# Retea Design System

Sistema de diseño completo para la plataforma de instalación de campañas Retea, basado en la identidad de marca teal y las mejores prácticas de UI/UX.

## 🎨 Filosofía de Diseño

### Principios Clave

1. **Consistencia Visual:** Todos los componentes siguen el mismo lenguaje visual
2. **Accesibilidad:** WCAG 2.1 AA como mínimo en todos los componentes
3. **Responsive:** Mobile-first, adaptable a todos los dispositivos
4. **Reutilización:** DRY - No duplicar estilos, usar composición
5. **Performance:** Optimizado para carga rápida y animaciones fluidas
6. **Escalabilidad:** Sistema de tokens que facilita mantenimiento

### Identidad de Marca

**Colores Principales:**
- **Primary Teal:** #3aa7a3 (color de marca principal)
- **Teal Scale:** #9dd9d2, #79bcb8, #5ec2b7, #2ca6a4, #3aa7a3
- **Neutral Gray:** #333333 (del logo) + escala extendida

**Tipografía:**
- **Font Stack:** System fonts (Inter, Roboto, SF Pro)
- **Escala:** Modular 1.25 (Major Third)
- **Pesos:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

**Espaciado:**
- **Base:** 4px (0.25rem)
- **Escala:** 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

## 📁 Estructura del Proyecto

```
design-system/
├── tokens/                    # Design tokens (variables CSS)
│   ├── colors.css            # Paleta completa de colores
│   ├── typography.css        # Tipografía y escalas
│   ├── spacing.css           # Espaciado y layout
│   ├── animations.css        # Animaciones y transiciones
│   └── index.css             # Importa todos los tokens + reset global
│
├── components/               # Especificaciones de componentes
│   ├── buttons.md           # Sistema completo de botones
│   ├── cards.md             # Cards y contenedores
│   ├── forms.md             # Inputs, selects, checkboxes
│   ├── badges.md            # Indicadores de estado
│   └── ...
│
├── accessibility/           # Guidelines de accesibilidad
│   └── wcag-checklist.md
│
├── animations/              # Especificaciones de animación
│   └── motion-guidelines.md
│
└── README.md               # Este archivo
```

## 🚀 Inicio Rápido

### 1. Importar los Tokens

En tu archivo CSS principal:

```css
/* Importa TODOS los design tokens */
@import '../design-system/tokens/index.css';
```

O importar selectivamente:

```css
@import '../design-system/tokens/colors.css';
@import '../design-system/tokens/typography.css';
@import '../design-system/tokens/spacing.css';
@import '../design-system/tokens/animations.css';
```

### 2. Usar las Variables

```css
.my-component {
  /* Colores */
  background: var(--color-primary);
  color: var(--color-text-inverse);

  /* Tipografía */
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);

  /* Espaciado */
  padding: var(--spacing-4);
  gap: var(--gap-md);
  border-radius: var(--radius-md);

  /* Animaciones */
  transition: var(--transition-hover);
}
```

### 3. Usar las Utility Classes

```html
<!-- Tipografía -->
<h1 class="heading-1">Dashboard de Campañas</h1>
<p class="text-body text-secondary">Subtítulo</p>

<!-- Espaciado -->
<div class="p-6 gap-4">...</div>

<!-- Colores -->
<span class="text-brand font-semibold">Destacado</span>

<!-- Animaciones -->
<div class="animate-fade-in transition-hover">...</div>
```

## 📦 Componentes Principales

### Botones

5 variantes principales:
- **Primary:** Acción principal (máx. 1 por vista)
- **Secondary:** Acciones alternativas
- **Tertiary:** Acciones de bajo peso
- **Danger:** Acciones destructivas
- **Icon:** Botones con/sin iconos

[Ver especificación completa →](./components/buttons.md)

```html
<button class="btn-primary btn-md">Crear Campaña</button>
<button class="btn-secondary btn-sm">Cancelar</button>
<button class="btn-tertiary">Ver Más</button>
```

### Cards

Contenedores versátiles para dashboards y listas:
- **Tamaños:** sm, md (default), lg
- **Variantes:** campaign, success, warning, danger
- **Estructura:** header, body, footer, divider

[Ver especificación completa →](./components/cards.md)

```html
<article class="card card-md card-campaign">
  <header class="card__header">
    <h3 class="card__title">Sesderma - Farmacias</h3>
  </header>
  <div class="card__body">
    <!-- Contenido -->
  </div>
  <footer class="card__footer">
    <span class="badge badge-success">Activa</span>
  </footer>
</article>
```

### Forms

Sistema completo de formularios:
- **Inputs:** text, email, password, number, search
- **Textareas:** Con/sin resize
- **Selects:** Single y multiple
- **Checkboxes & Radios:** Custom styled
- **Switches:** Toggle modernos
- **Estados:** default, hover, focus, error, success, disabled

[Ver especificación completa →](./components/forms.md)

```html
<div class="form-group">
  <label for="email" class="form-label form-label-required">
    Email
  </label>
  <input
    type="email"
    id="email"
    class="input input-md"
    placeholder="tu@email.com"
    required
  />
  <span class="form-hint">Te enviaremos confirmación</span>
</div>
```

### Badges

Indicadores de estado y contadores:
- **Semánticas:** success, warning, error, info, primary, neutral
- **Estilos:** default, solid, outline, dot
- **Tamaños:** sm, md (default), lg
- **Especiales:** counter, removable

[Ver especificación completa →](./components/badges.md)

```html
<!-- Estados de campaña -->
<span class="badge badge-success">Completada</span>
<span class="badge badge-warning">Pendiente</span>
<span class="badge badge-primary">Activa</span>

<!-- Contador de notificaciones -->
<span class="badge-counter">5</span>
```

## 🎯 Design Tokens

### Colores

```css
/* Primary (Brand Teal) */
--color-primary-50: #9dd9d2;   /* Lightest */
--color-primary-500: #3aa7a3;  /* Main brand */
--color-primary-900: #0f3231;  /* Darkest */

/* Neutral (Grays) */
--color-neutral-0: #ffffff;
--color-neutral-800: #333333;  /* Logo color */
--color-neutral-950: #0f1419;

/* Semantic */
--color-success: #10b981;      /* Green */
--color-warning: #f59e0b;      /* Amber */
--color-error: #ef4444;        /* Red */
--color-info: #3b82f6;         /* Blue */
```

[Ver paleta completa →](./tokens/colors.css)

### Tipografía

```css
/* Sizes - Escala modular 1.25 */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.25rem;    /* 20px */
--font-size-xl: 1.5rem;     /* 24px */
--font-size-2xl: 1.875rem;  /* 30px */

/* Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

[Ver sistema completo →](./tokens/typography.css)

### Espaciado

```css
/* Base 4px scale */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */

/* Semantic aliases */
--padding-button-md: var(--spacing-3) var(--spacing-4);
--padding-card-md: var(--spacing-6);
--gap-md: var(--spacing-4);
```

[Ver sistema completo →](./tokens/spacing.css)

### Animaciones

```css
/* Durations */
--duration-fast: 150ms;      /* Hover, ripple */
--duration-normal: 250ms;    /* Dropdown, tooltip */
--duration-moderate: 350ms;  /* Modal, drawer */

/* Easings */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Semantic aliases */
--transition-hover: background-color 150ms ease-out,
                    transform 150ms ease-out;
--animation-fade-in: fadeIn 250ms ease-out forwards;
```

[Ver sistema completo →](./tokens/animations.css)

## ♿ Accesibilidad

### Requisitos Mínimos (WCAG 2.1 AA)

- ✅ **Contrast ratio:** 4.5:1 para texto normal, 3:1 para texto grande
- ✅ **Touch targets:** Mínimo 44x44px
- ✅ **Keyboard navigation:** Todo accesible con Tab/Enter/Space
- ✅ **Focus visible:** Outline claro en `:focus-visible`
- ✅ **ARIA labels:** En componentes icon-only
- ✅ **Form validation:** Mensajes asociados con `aria-describedby`
- ✅ **Skip links:** Para navegación rápida
- ✅ **Reduced motion:** Respeta `prefers-reduced-motion`

### Ejemplos

```html
<!-- Button icon-only necesita aria-label -->
<button class="btn-icon-only" aria-label="Editar campaña">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Input con error -->
<input
  type="email"
  class="input input-error"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">Email inválido</span>

<!-- Link de salto -->
<a href="#main-content" class="skip-to-main">
  Saltar al contenido principal
</a>
```

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile first approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Mobile Optimizations

```css
/* Prevenir zoom en iOS */
input, textarea, select {
  font-size: 16px; /* En móvil */
}

/* Touch-friendly spacing */
.btn-md {
  min-height: 44px; /* Touch target */
}

/* Reducir headings en móvil */
@media (max-width: 640px) {
  .heading-1 { font-size: var(--font-size-4xl); }
}
```

## 🎬 Animaciones

### Principios de Motion Design (Emil Kowalski)

1. **Purpose:** Toda animación debe tener un propósito (feedback, jerarquía, transición)
2. **Natural:** Usar easings que imiten física real (spring, emphasized)
3. **Fast:** Duraciones cortas (150-350ms)
4. **Respectful:** Respetar `prefers-reduced-motion`

### Ejemplos

```css
/* Hover lift */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-hover);
}

/* Modal entrance */
.modal {
  animation: var(--animation-scale-in);
}

/* Loading skeleton */
.skeleton {
  animation: var(--animation-pulse);
}
```

## 🔧 Layout System

### Container

```css
.container {
  width: 100%;
  max-width: var(--container-xl); /* 1280px */
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}
```

### Grid

```css
.cards-grid {
  display: grid;
  gap: var(--gap-lg);
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
```

### Stack (Flexbox Column)

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}
```

## 📚 Recursos

### Documentación de Componentes
- [Buttons →](./components/buttons.md)
- [Cards →](./components/cards.md)
- [Forms →](./components/forms.md)
- [Badges →](./components/badges.md)

### Design Tokens
- [Colors →](./tokens/colors.css)
- [Typography →](./tokens/typography.css)
- [Spacing →](./tokens/spacing.css)
- [Animations →](./tokens/animations.css)

### Skills de Diseño Instaladas
- **frontend-design** (Anthropic) - Skill base de diseño
- **ui-ux-pro-max** (nextlevelbuilder) - 67 estilos, 161 paletas, 57 font pairings
- **animation-vocabulary** (Emil Kowalski) - Vocabulario de animaciones
- **apple-design** (Emil Kowalski) - Principios de diseño Apple
- **huashu-design** (alchaincyf) - Prototipos y presentaciones
- **web-design-guidelines** (Vercel) - Auditoría y mejores prácticas

## 🚦 Estados de Retea

### Estados de Campaña
- **Borrador** → `badge-neutral`
- **Activa** → `badge-primary`
- **Completada** → `badge-success`
- **Cancelada** → `badge-error`

### Estados de Instalación
- **Pendiente** → `badge-warning`
- **En Progreso** → `badge-info`
- **Completada** → `badge-success`
- **Rechazada** → `badge-error`

### Estados de Propuesta
- **Enviada** → `badge-info`
- **Aceptada** → `badge-success`
- **Declinada** → `badge-error`
- **Esperando** → `badge-warning`

## 🎨 Ejemplos de Uso

### Dashboard Card de Campaña

```html
<article class="card card-md card-campaign card-clickable">
  <header class="card__header">
    <div>
      <h3 class="card__title">Sesderma - Farmacias España</h3>
      <p class="card__subtitle">400 puntos de instalación</p>
    </div>
    <span class="badge badge-primary">Activa</span>
  </header>

  <div class="card__divider card__divider--primary"></div>

  <div class="card__body">
    <div class="stats-row">
      <div class="stat">
        <span class="text-label">Completadas</span>
        <span class="heading-4 text-success">245</span>
      </div>
      <div class="stat">
        <span class="text-label">Pendientes</span>
        <span class="heading-4 text-warning">155</span>
      </div>
    </div>
  </div>

  <footer class="card__footer">
    <button class="btn-tertiary btn-sm">Ver Detalles</button>
    <span class="text-caption">Actualizado hace 5 min</span>
  </footer>
</article>
```

### Formulario de Instalación

```html
<form class="form">
  <div class="form-group">
    <label for="farmacia" class="form-label form-label-required">
      Nombre de la Farmacia
    </label>
    <input
      type="text"
      id="farmacia"
      class="input input-md"
      placeholder="Ej: Farmacia Central"
      required
    />
  </div>

  <div class="form-group">
    <label for="evidencia" class="form-label form-label-required">
      Subir Evidencia Fotográfica
    </label>
    <input
      type="file"
      id="evidencia"
      class="input input-md"
      accept="image/*"
      multiple
      required
    />
    <span class="form-hint">Mínimo 2 fotos, máximo 5</span>
  </div>

  <div class="form-actions">
    <button type="button" class="btn-secondary">Cancelar</button>
    <button type="submit" class="btn-primary">Completar Instalación</button>
  </div>
</form>
```

## 📝 Reglas de Diseño Críticas

### ⚠️ REGLA #1: NUNCA usar `height` fijo

```css
/* ❌ MAL - No crece dinámicamente */
.card { height: 185px; }

/* ✅ BIEN - Crece según contenido */
.card { min-height: 185px; }
```

### ⚠️ REGLA #2: SIEMPRE reutilizar clases

```css
/* ❌ MAL - Duplicación */
.card-orange { background: #FA8029; }
.card-green { background: #34B257; }

/* ✅ BIEN - Modificadores */
.card--primary { background: var(--color-primary); }
.card--success { background: var(--color-success); }
```

### ⚠️ REGLA #3: NUNCA hardcodear valores

```css
/* ❌ MAL - Hardcoded */
.btn { padding: 12px 16px; color: #3aa7a3; }

/* ✅ BIEN - Variables */
.btn {
  padding: var(--padding-button-md);
  color: var(--color-primary);
}
```

## 🤝 Contribución

Al añadir nuevos componentes:

1. ✅ Usar design tokens existentes
2. ✅ Seguir convención BEM para clases
3. ✅ Incluir todos los estados (hover, focus, disabled, error)
4. ✅ Cumplir WCAG 2.1 AA
5. ✅ Probar con contenido variable
6. ✅ Documentar con ejemplos
7. ✅ Responsive mobile-first

---

**Retea Design System v1.0**
Creado con [Claude Code](https://claude.com/claude-code) + Design Skills
