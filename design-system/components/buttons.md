# Buttons - Retea Design System

Sistema de botones basado en las mejores prácticas de UI/UX y la identidad de marca teal.

## Variantes

### Primary Button
**Uso:** Acción principal de la pantalla (máximo 1 por vista)
**Ejemplos:** "Crear Campaña", "Enviar Propuesta", "Confirmar Instalación"

```css
.btn-primary {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);

  /* Spacing */
  padding: var(--padding-button-md); /* 12px 16px */

  /* Typography */
  font-family: var(--font-family-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);

  /* Visual */
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-primary);

  /* Interaction */
  cursor: pointer;
  transition: var(--transition-hover);
  user-select: none;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-lg);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.btn-primary:disabled {
  background: var(--color-neutral-300);
  color: var(--color-neutral-500);
  cursor: not-allowed;
  opacity: var(--opacity-disabled);
  box-shadow: none;
}
```

### Secondary Button
**Uso:** Acciones secundarias, alternativas
**Ejemplos:** "Cancelar", "Volver", "Ver Más"

```css
.btn-secondary {
  /* Igual que primary pero con outline */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--padding-button-md);

  /* Typography */
  font-family: var(--font-family-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);

  /* Visual */
  background: transparent;
  color: var(--color-primary);
  border: var(--border-width-2) solid var(--color-primary);
  border-radius: var(--radius-md);

  /* Interaction */
  cursor: pointer;
  transition: var(--transition-hover);
}

.btn-secondary:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary-hover);
  color: var(--color-primary-hover);
}

.btn-secondary:disabled {
  border-color: var(--color-neutral-300);
  color: var(--color-neutral-400);
  cursor: not-allowed;
  opacity: var(--opacity-disabled);
}
```

### Tertiary Button (Ghost)
**Uso:** Acciones terciarias, mínimo peso visual
**Ejemplos:** "Editar", "Eliminar", "Ver detalles"

```css
.btn-tertiary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--padding-button-md);

  /* Typography */
  font-family: var(--font-family-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);

  /* Visual */
  background: transparent;
  color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);

  /* Interaction */
  cursor: pointer;
  transition: var(--transition-colors);
}

.btn-tertiary:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-hover);
}
```

### Danger Button
**Uso:** Acciones destructivas
**Ejemplos:** "Eliminar Campaña", "Rechazar", "Cancelar Contrato"

```css
.btn-danger {
  /* Similar a primary pero con color error */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--padding-button-md);

  font-family: var(--font-family-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);

  background: var(--color-error);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);

  cursor: pointer;
  transition: var(--transition-hover);
}

.btn-danger:hover {
  background: var(--color-error-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

## Tamaños

```css
/* Small - Para espacios reducidos, tablas */
.btn-sm {
  padding: var(--padding-button-sm); /* 8px 12px */
  font-size: var(--font-size-sm);
  gap: var(--spacing-1);
}

/* Medium - Por defecto */
.btn-md {
  padding: var(--padding-button-md); /* 12px 16px */
  font-size: var(--font-size-base);
  gap: var(--spacing-2);
}

/* Large - Para CTAs importantes */
.btn-lg {
  padding: var(--padding-button-lg); /* 16px 24px */
  font-size: var(--font-size-md);
  gap: var(--spacing-3);
}
```

## Botones con Iconos

```css
/* Icon + Text */
.btn-icon {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.btn-icon svg,
.btn-icon img {
  width: 20px;
  height: 20px;
}

/* Icon only - Circular */
.btn-icon-only {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--radius-full);
}

.btn-icon-only.btn-sm {
  width: 32px;
  height: 32px;
}

.btn-icon-only.btn-lg {
  width: 48px;
  height: 48px;
}
```

## Loading State

```css
.btn-loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin-left: -8px;
  margin-top: -8px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: var(--animation-spin);
}
```

## Grupos de Botones

```css
.btn-group {
  display: inline-flex;
  gap: var(--spacing-2);
}

/* Segmented buttons (sin gap, bordes compartidos) */
.btn-group-segmented {
  display: inline-flex;
  gap: 0;
}

.btn-group-segmented .btn:not(:first-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.btn-group-segmented .btn:not(:last-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}
```

## Ejemplos de Uso en Retea

### Dashboard Admin - Crear Campaña
```html
<button class="btn-primary btn-lg">
  <svg>...</svg>
  Crear Nueva Campaña
</button>
```

### Tabla de Instalaciones - Acciones Rápidas
```html
<div class="btn-group">
  <button class="btn-tertiary btn-sm">
    <svg>...</svg>
    Ver
  </button>
  <button class="btn-tertiary btn-sm">
    <svg>...</svg>
    Editar
  </button>
  <button class="btn-danger btn-sm">
    <svg>...</svg>
    Rechazar
  </button>
</div>
```

### Modal de Confirmación
```html
<div class="btn-group">
  <button class="btn-secondary">Cancelar</button>
  <button class="btn-primary btn-loading">Confirmar</button>
</div>
```

## Accesibilidad

- **Keyboard navigation:** Todos los botones deben ser accesibles con Tab
- **Focus visible:** Outline claro en `:focus-visible`
- **ARIA labels:** Usar `aria-label` en botones icon-only
- **Disabled state:** Usar atributo `disabled`, no solo clase CSS
- **Loading state:** Usar `aria-busy="true"` cuando `.btn-loading`
- **Mínimo tamaño táctil:** 44x44px (cumplido con btn-md y btn-lg)

```html
<!-- Icon only button -->
<button class="btn-icon-only btn-primary" aria-label="Editar campaña">
  <svg>...</svg>
</button>

<!-- Loading button -->
<button class="btn-primary btn-loading" aria-busy="true" disabled>
  Guardando...
</button>
```

## Métricas de Diseño

- **Contrast ratio:** 4.5:1 mínimo (WCAG AA)
- **Touch target:** 44x44px mínimo (iOS guidelines)
- **Animation duration:** 150-250ms (hover), 350ms (loading)
- **Border radius:** 8px (md) para consistencia con cards
