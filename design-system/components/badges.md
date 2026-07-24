# Badges - Retea Design System

Indicadores visuales compactos para estados, categorías y contadores. Esenciales para mostrar estados de campañas, instalaciones y notificaciones.

## Badge Base

```css
.badge {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1);

  /* Spacing */
  padding: var(--padding-badge); /* 4px 8px */

  /* Typography */
  font-family: var(--font-family-body);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);

  /* Visual */
  border-radius: var(--radius-sm);
  white-space: nowrap;

  /* IMPORTANTE: min-height permite crecimiento */
  min-height: 20px;

  /* Interaction - Solo para badges interactivos */
  user-select: none;
}

/* Badge con icono */
.badge svg,
.badge img {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
```

## Variantes Semánticas (Estados de Retea)

### Success - Instalación Completada
```css
.badge-success {
  background: var(--color-success-light);
  color: var(--color-success-dark);
  border: var(--border-width-1) solid var(--color-success);
}
```

### Warning - Pendiente / En Progreso
```css
.badge-warning {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
  border: var(--border-width-1) solid var(--color-warning);
}
```

### Error - Rechazada / Cancelada
```css
.badge-error {
  background: var(--color-error-light);
  color: var(--color-error-dark);
  border: var(--border-width-1) solid var(--color-error);
}
```

### Info - En Revisión / Información
```css
.badge-info {
  background: var(--color-info-light);
  color: var(--color-info-dark);
  border: var(--border-width-1) solid var(--color-info);
}
```

### Primary - Activa / Destacada
```css
.badge-primary {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  border: var(--border-width-1) solid var(--color-primary);
}
```

### Neutral - Estados genéricos
```css
.badge-neutral {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
  border: var(--border-width-1) solid var(--color-neutral-300);
}
```

## Variantes de Estilo

### Solid (Relleno completo)
```css
.badge-solid-success {
  background: var(--color-success);
  color: white;
  border: none;
}

.badge-solid-warning {
  background: var(--color-warning);
  color: white;
  border: none;
}

.badge-solid-error {
  background: var(--color-error);
  color: white;
  border: none;
}

.badge-solid-primary {
  background: var(--color-primary);
  color: white;
  border: none;
}
```

### Outline (Solo borde)
```css
.badge-outline-success {
  background: transparent;
  color: var(--color-success);
  border: var(--border-width-1) solid var(--color-success);
}

.badge-outline-warning {
  background: transparent;
  color: var(--color-warning);
  border: var(--border-width-1) solid var(--color-warning);
}

.badge-outline-primary {
  background: transparent;
  color: var(--color-primary);
  border: var(--border-width-1) solid var(--color-primary);
}
```

### Dot (Con indicador punteado)
```css
.badge-dot::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.badge-dot.badge-success::before {
  background: var(--color-success);
}

.badge-dot.badge-warning::before {
  background: var(--color-warning);
}

.badge-dot.badge-error::before {
  background: var(--color-error);
}

.badge-dot.badge-primary::before {
  background: var(--color-primary);
}
```

## Tamaños

```css
/* Small - Para tablas densas */
.badge-sm {
  padding: var(--spacing-1) var(--spacing-1-5); /* 4px 6px */
  font-size: 10px;
  min-height: 16px;
}

/* Medium - Por defecto */
.badge-md {
  padding: var(--padding-badge); /* 4px 8px */
  font-size: var(--font-size-xs); /* 12px */
  min-height: 20px;
}

/* Large - Para destacar */
.badge-lg {
  padding: var(--padding-chip); /* 6px 12px */
  font-size: var(--font-size-sm); /* 14px */
  min-height: 24px;
}
```

## Badge de Contador

```css
.badge-counter {
  min-width: 20px;
  height: 20px;
  padding: 0 var(--spacing-1-5);
  border-radius: var(--radius-full);
  background: var(--color-error);
  color: white;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Contador pequeño (para iconos) */
.badge-counter-sm {
  min-width: 16px;
  height: 16px;
  padding: 0 var(--spacing-1);
  font-size: 10px;
}

/* Posición absoluta para iconos */
.icon-with-badge {
  position: relative;
  display: inline-block;
}

.icon-with-badge .badge-counter {
  position: absolute;
  top: -6px;
  right: -6px;
}
```

## Badge Interactivo (Removible)

```css
.badge-removable {
  padding-right: var(--spacing-1);
  cursor: pointer;
  transition: var(--transition-hover);
}

.badge-removable:hover {
  opacity: var(--opacity-hover);
}

.badge-remove-btn {
  width: 16px;
  height: 16px;
  padding: 0;
  margin-left: var(--spacing-1);
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.badge-remove-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.badge-remove-btn svg {
  width: 12px;
  height: 12px;
}
```

## Casos de Uso en Retea

### 1. Estados de Campaña

```html
<!-- Campaña activa -->
<span class="badge badge-primary">Activa</span>

<!-- Campaña completada -->
<span class="badge badge-success">Completada</span>

<!-- Campaña en borrador -->
<span class="badge badge-neutral">Borrador</span>

<!-- Campaña cancelada -->
<span class="badge badge-error">Cancelada</span>
```

### 2. Estados de Instalación

```html
<!-- Instalación completada -->
<span class="badge badge-solid-success">
  <svg><!-- Check icon --></svg>
  Completada
</span>

<!-- Instalación pendiente -->
<span class="badge badge-dot badge-warning">Pendiente</span>

<!-- Instalación en progreso -->
<span class="badge badge-dot badge-info">En Progreso</span>

<!-- Instalación rechazada -->
<span class="badge badge-dot badge-error">Rechazada</span>
```

### 3. Estados de Propuesta (Instalador)

```html
<!-- Propuesta enviada -->
<span class="badge badge-info">Enviada</span>

<!-- Propuesta aceptada -->
<span class="badge badge-success">
  <svg><!-- Check icon --></svg>
  Aceptada
</span>

<!-- Propuesta rechazada -->
<span class="badge badge-error">Rechazada</span>

<!-- Esperando respuesta -->
<span class="badge badge-warning">Esperando</span>
```

### 4. Contador de Notificaciones

```html
<!-- Icono con badge de contador -->
<button class="btn-icon-only icon-with-badge" aria-label="Notificaciones">
  <svg><!-- Bell icon --></svg>
  <span class="badge-counter">5</span>
</button>

<!-- Badge de contador grande (0-99+) -->
<span class="badge-counter">99+</span>
```

### 5. Tags de Provincias (Filtros)

```html
<!-- Provincia seleccionada - removible -->
<span class="badge badge-primary badge-removable badge-lg">
  Madrid
  <button class="badge-remove-btn" aria-label="Quitar Madrid">
    <svg><!-- X icon --></svg>
  </button>
</span>

<span class="badge badge-primary badge-removable badge-lg">
  Barcelona
  <button class="badge-remove-btn" aria-label="Quitar Barcelona">
    <svg><!-- X icon --></svg>
  </button>
</span>
```

### 6. Indicador de NDA

```html
<!-- NDA firmado -->
<span class="badge badge-success">
  <svg><!-- Lock icon --></svg>
  NDA Firmado
</span>

<!-- NDA pendiente -->
<span class="badge badge-warning">
  <svg><!-- Clock icon --></svg>
  NDA Pendiente
</span>
```

### 7. Contadores de Instalación

```html
<div class="installation-stats">
  <!-- Completadas -->
  <span class="badge badge-solid-success badge-lg">
    245 Completadas
  </span>

  <!-- Pendientes -->
  <span class="badge badge-solid-warning badge-lg">
    155 Pendientes
  </span>

  <!-- Total -->
  <span class="badge badge-solid-primary badge-lg">
    400 Total
  </span>
</div>
```

### 8. Grupo de Badges (Card header)

```html
<div class="badge-group">
  <span class="badge badge-primary">Activa</span>
  <span class="badge badge-outline-success">
    <svg><!-- Check icon --></svg>
    Verificada
  </span>
  <span class="badge badge-neutral">Premium</span>
</div>

<style>
.badge-group {
  display: inline-flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}
</style>
```

## Tooltips en Badges

Para badges con información adicional:

```html
<span
  class="badge badge-warning"
  title="Esperando confirmación del instalador"
  aria-label="Estado: Pendiente - Esperando confirmación del instalador"
>
  Pendiente
</span>
```

## Accesibilidad

- **Semántica:** Usar `<span>` para badges estáticos
- **Interactivos:** Usar `<button>` para badges clicables
- **ARIA labels:** Añadir contexto en badges con solo iconos
- **Contrast ratio:** Mínimo 4.5:1 (cumplido en todas las variantes)
- **Focus visible:** Solo para badges interactivos
- **Screen readers:** Incluir contexto completo

```html
<!-- Badge con solo icono - necesita aria-label -->
<span class="badge badge-success" aria-label="Estado: Completada">
  <svg aria-hidden="true"><!-- Check icon --></svg>
</span>

<!-- Badge removible - botón accesible -->
<span class="badge badge-primary badge-removable">
  Madrid
  <button
    class="badge-remove-btn"
    aria-label="Quitar filtro de Madrid"
  >
    <svg aria-hidden="true"><!-- X icon --></svg>
  </button>
</span>

<!-- Badge contador - contexto para screen readers -->
<button class="icon-with-badge" aria-label="5 notificaciones sin leer">
  <svg aria-hidden="true"><!-- Bell icon --></svg>
  <span class="badge-counter" aria-hidden="true">5</span>
</button>
```

## Responsive

```css
@media (max-width: 640px) {
  /* Reducir tamaño en móvil si es necesario */
  .badge-lg {
    padding: var(--padding-badge);
    font-size: var(--font-size-xs);
  }

  /* Stack badges en grupos */
  .badge-group {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

## Animación de Entrada

```css
.badge-animated {
  animation: var(--animation-scale-in);
}

/* Pulse para badges de notificación */
.badge-pulse {
  animation: var(--animation-pulse);
}

/* Aplicar a contadores nuevos */
.badge-counter-new {
  animation: scaleIn 0.3s var(--ease-spring);
}
```

## Estados Específicos de Retea

```html
<!-- Estados completos según PLAN.md -->
<span class="badge badge-neutral">Borrador</span>
<span class="badge badge-primary">Activa</span>
<span class="badge badge-success">Completada</span>
<span class="badge badge-error">Cancelada</span>

<span class="badge badge-warning">Pendiente</span>
<span class="badge badge-info">En Progreso</span>
<span class="badge badge-success">Instalada</span>
<span class="badge badge-error">Rechazada</span>

<span class="badge badge-warning">Enviada</span>
<span class="badge badge-success">Aceptada</span>
<span class="badge badge-error">Declinada</span>
```
