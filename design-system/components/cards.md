# Cards - Retea Design System

Contenedores versátiles para agrupar información relacionada. Usados extensivamente en dashboards, listas de campañas, puntos de instalación, etc.

## Card Base

```css
.card {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);

  /* Spacing */
  padding: var(--padding-card-md); /* 24px */

  /* Visual */
  background: var(--color-surface-primary);
  border: var(--border-width-1) solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  /* Interaction - Cards interactivos */
  transition: var(--transition-hover);

  /* IMPORTANTE: min-height permite crecimiento dinámico */
  width: 100%;
  min-height: 120px; /* Base mínima, crece según contenido */
}

.card:hover {
  box-shadow: var(--shadow-md);
}

/* Card clickable - Toda el área es clicable */
.card-clickable {
  cursor: pointer;
  user-select: none;
}

.card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
}

.card-clickable:active {
  transform: translateY(0);
}
```

## Variantes de Tamaño

```css
/* Small - Para listas densas, sidebars */
.card-sm {
  padding: var(--padding-card-sm); /* 16px */
  gap: var(--gap-sm);
  min-height: 80px; /* IMPORTANTE: min-height */
}

/* Medium - Por defecto */
.card-md {
  padding: var(--padding-card-md); /* 24px */
  gap: var(--gap-md);
  min-height: 120px; /* IMPORTANTE: min-height */
}

/* Large - Para contenido extenso */
.card-lg {
  padding: var(--padding-card-lg); /* 32px */
  gap: var(--gap-lg);
  min-height: 160px; /* IMPORTANTE: min-height */
}
```

## Variantes Semánticas

### Card de Campaña (Primary)
```css
.card-campaign {
  border-left: 4px solid var(--color-primary);
  background: linear-gradient(
    135deg,
    rgba(58, 167, 163, 0.02) 0%,
    var(--color-surface-primary) 100%
  );
}

.card-campaign:hover {
  border-left-color: var(--color-primary-hover);
}
```

### Card de Instalación Completada (Success)
```css
.card-success {
  border-left: 4px solid var(--color-success);
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.02) 0%,
    var(--color-surface-primary) 100%
  );
}
```

### Card de Advertencia (Warning)
```css
.card-warning {
  border-left: 4px solid var(--color-warning);
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.02) 0%,
    var(--color-surface-primary) 100%
  );
}
```

### Card de Error (Danger)
```css
.card-danger {
  border-left: 4px solid var(--color-error);
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.02) 0%,
    var(--color-surface-primary) 100%
  );
}
```

## Estructura Interna del Card

### Header
```css
.card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--gap-sm);
  min-height: 24px; /* IMPORTANTE: min-height permite crecimiento */
}

.card__title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  min-height: 28px; /* IMPORTANTE: min-height permite crecimiento */
}

.card__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-1);
  min-height: 20px; /* IMPORTANTE: min-height permite crecimiento */
}

.card__actions {
  display: flex;
  gap: var(--gap-xs);
  flex-shrink: 0;
}
```

### Body
```css
.card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-height: 40px; /* IMPORTANTE: min-height permite crecimiento */
}
```

### Footer
```css
.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-4);
  border-top: var(--border-width-1) solid var(--color-border);
  gap: var(--gap-sm);
  min-height: 40px; /* IMPORTANTE: min-height permite crecimiento */
}
```

### Divider
```css
.card__divider {
  width: 100%;
  height: var(--border-width-1);
  background: var(--color-divider);
  margin: var(--spacing-2) 0;

  /* Tamaño fijo OK para dividers */
  flex: none;
}

/* Divider con color de marca */
.card__divider--primary {
  background: var(--color-primary);
  height: 4px;
  border-radius: var(--radius-sm);
}
```

## Casos de Uso en Retea

### 1. Card de Campaña (Dashboard Admin)

```html
<article class="card card-md card-campaign card-clickable">
  <header class="card__header">
    <div>
      <h3 class="card__title">Sesderma - Farmacias España</h3>
      <p class="card__subtitle">400 puntos de instalación</p>
    </div>
    <div class="card__actions">
      <button class="btn-icon-only btn-tertiary btn-sm" aria-label="Más opciones">
        <svg>...</svg>
      </button>
    </div>
  </header>

  <div class="card__body">
    <div class="card__stats">
      <div class="stat">
        <span class="stat__label">Completadas</span>
        <span class="stat__value">245</span>
      </div>
      <div class="stat">
        <span class="stat__label">Pendientes</span>
        <span class="stat__value">155</span>
      </div>
      <div class="stat">
        <span class="stat__label">Presupuesto</span>
        <span class="stat__value">€50,000</span>
      </div>
    </div>
  </div>

  <footer class="card__footer">
    <span class="badge badge-success">Activa</span>
    <span class="text-caption">Actualizado hace 5 min</span>
  </footer>
</article>
```

### 2. Card de Punto de Instalación

```html
<article class="card card-sm card-success">
  <header class="card__header">
    <div>
      <h4 class="card__title">Farmacia Central</h4>
      <p class="card__subtitle">Calle Mayor 45, Madrid</p>
    </div>
    <span class="badge badge-success">Completada</span>
  </header>

  <div class="card__body">
    <div class="card__info">
      <p class="text-body-small">
        <strong>Instalador:</strong> Juan Pérez
      </p>
      <p class="text-body-small">
        <strong>Fecha:</strong> 15/03/2024
      </p>
    </div>
  </div>

  <footer class="card__footer">
    <button class="btn-tertiary btn-sm">Ver Evidencia</button>
    <span class="text-caption">
      <svg class="inline-icon">...</svg>
      4 fotos
    </span>
  </footer>
</article>
```

### 3. Card de Propuesta (Instalador)

```html
<article class="card card-md card-clickable">
  <header class="card__header">
    <div>
      <h3 class="card__title">Nueva Oportunidad</h3>
      <p class="card__subtitle">Campaña L'Oréal - Farmacias Madrid</p>
    </div>
    <span class="badge badge-warning">Pendiente</span>
  </header>

  <div class="card__divider card__divider--primary"></div>

  <div class="card__body">
    <div class="card__details">
      <div class="detail-row">
        <span class="detail-label">Puntos disponibles:</span>
        <span class="detail-value font-semibold">25</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Precio por instalación:</span>
        <span class="detail-value text-brand font-semibold">€125</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Provincias:</span>
        <span class="detail-value">Madrid, Toledo</span>
      </div>
    </div>
  </div>

  <footer class="card__footer">
    <button class="btn-secondary btn-sm">Rechazar</button>
    <button class="btn-primary btn-sm">Enviar Propuesta</button>
  </footer>
</article>
```

### 4. Card Estadística (KPI)

```html
<article class="card card-sm">
  <div class="card__body">
    <span class="text-label">Total Instalaciones</span>
    <p class="heading-3 text-brand">1,247</p>
    <div class="stat-trend stat-trend--up">
      <svg>...</svg>
      <span class="text-caption text-success">+12% vs mes anterior</span>
    </div>
  </div>
</article>
```

## Card con Imagen

```css
.card-image {
  padding: 0;
  overflow: hidden;
}

.card-image__img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.card-image__content {
  padding: var(--padding-card-md);
}
```

```html
<article class="card card-image">
  <img src="..." alt="..." class="card-image__img" />
  <div class="card-image__content">
    <h3 class="card__title">Título</h3>
    <p class="text-body-small">Descripción...</p>
  </div>
</article>
```

## Loading State (Skeleton)

```css
.card-skeleton {
  position: relative;
  overflow: hidden;
}

.card-skeleton::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: var(--animation-shimmer);
}

.skeleton-line {
  height: 16px;
  background: var(--color-neutral-200);
  border-radius: var(--radius-sm);
  animation: var(--animation-pulse);
}

.skeleton-line--title {
  height: 24px;
  width: 60%;
}

.skeleton-line--subtitle {
  height: 14px;
  width: 80%;
}
```

## Accesibilidad

- Usar `<article>` o `<section>` para semántica correcta
- Cards clicables deben tener `role="button"` o `<button>` wrapper
- Títulos con jerarquía semántica (`h3`, `h4`)
- Contrast ratio mínimo 4.5:1
- Focus visible en cards interactivos
- Loading states con `aria-busy="true"`

## Responsive

```css
@media (max-width: 640px) {
  .card {
    padding: var(--padding-card-sm);
    gap: var(--gap-sm);
  }

  .card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .card__footer .btn {
    width: 100%;
  }
}
```

## Grid de Cards

```css
.cards-grid {
  display: grid;
  gap: var(--gap-lg);
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

@media (max-width: 640px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
```
