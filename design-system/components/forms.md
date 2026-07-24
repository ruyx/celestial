# Forms - Retea Design System

Sistema completo de elementos de formulario con estados, validación y accesibilidad.

## Input Base

```css
.input {
  /* Layout */
  display: block;
  width: 100%;

  /* Spacing */
  padding: var(--padding-input-md); /* 12px 16px */

  /* Typography */
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);

  /* Visual */
  background: var(--color-surface-primary);
  border: var(--border-width-1) solid var(--color-border);
  border-radius: var(--radius-md);

  /* Interaction */
  transition: var(--transition-input);
  outline: none;

  /* IMPORTANTE: min-height permite crecimiento */
  min-height: 44px; /* Cumple touch target 44px */
}

.input::placeholder {
  color: var(--color-text-disabled);
  opacity: 1;
}

.input:hover {
  border-color: var(--color-border-strong);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(58, 167, 163, 0.1);
}

.input:disabled {
  background: var(--color-neutral-100);
  color: var(--color-text-disabled);
  cursor: not-allowed;
  opacity: var(--opacity-disabled);
}

/* Error state */
.input.input-error {
  border-color: var(--color-error);
}

.input.input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Success state */
.input.input-success {
  border-color: var(--color-success);
}

.input.input-success:focus {
  border-color: var(--color-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
```

## Tamaños de Input

```css
.input-sm {
  padding: var(--padding-input-sm); /* 8px 12px */
  font-size: var(--font-size-sm);
  min-height: 36px;
}

.input-md {
  padding: var(--padding-input-md); /* 12px 16px */
  font-size: var(--font-size-base);
  min-height: 44px;
}

.input-lg {
  padding: var(--padding-input-lg); /* 16px 20px */
  font-size: var(--font-size-md);
  min-height: 52px;
}
```

## Textarea

```css
.textarea {
  /* Hereda de .input */
  min-height: 120px; /* IMPORTANTE: min-height permite crecimiento */
  resize: vertical;
  line-height: var(--line-height-relaxed);
}

.textarea-fixed {
  resize: none;
}
```

## Select

```css
.select {
  /* Hereda de .input */
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--spacing-3) center;
  background-repeat: no-repeat;
  background-size: 20px;
  padding-right: var(--spacing-10); /* Espacio para el icono */
  cursor: pointer;
}

.select:disabled {
  cursor: not-allowed;
}
```

## Checkbox

```css
.checkbox-wrapper {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  cursor: pointer;
  user-select: none;
}

.checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin: 0;

  background: var(--color-surface-primary);
  border: var(--border-width-2) solid var(--color-border-strong);
  border-radius: var(--radius-sm);

  cursor: pointer;
  transition: var(--transition-input);

  /* Custom checkmark */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.checkbox:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox:checked::after {
  content: '';
  width: 10px;
  height: 6px;
  border: 2px solid white;
  border-top: none;
  border-right: none;
  transform: rotate(-45deg) translateY(-1px);
}

.checkbox:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.checkbox:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.checkbox-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
}
```

## Radio Button

```css
.radio-wrapper {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  cursor: pointer;
  user-select: none;
}

.radio {
  appearance: none;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin: 0;

  background: var(--color-surface-primary);
  border: var(--border-width-2) solid var(--color-border-strong);
  border-radius: var(--radius-full);

  cursor: pointer;
  transition: var(--transition-input);

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.radio:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.radio:checked::after {
  content: '';
  width: 8px;
  height: 8px;
  background: white;
  border-radius: var(--radius-full);
}

.radio:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.radio-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}
```

## Toggle Switch

```css
.switch-wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  user-select: none;
}

.switch {
  appearance: none;
  width: 44px;
  height: 24px;
  margin: 0;

  background: var(--color-neutral-300);
  border: none;
  border-radius: var(--radius-full);

  cursor: pointer;
  transition: background-color var(--duration-normal) var(--ease-out);

  position: relative;
}

.switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: var(--radius-full);
  transition: transform var(--duration-normal) var(--ease-spring);
  box-shadow: var(--shadow-sm);
}

.switch:checked {
  background: var(--color-primary);
}

.switch:checked::after {
  transform: translateX(20px);
}

.switch:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.switch:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}
```

## Form Group

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.form-label {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  min-height: 20px; /* IMPORTANTE: min-height permite crecimiento */
}

.form-label-required::after {
  content: '*';
  color: var(--color-error);
  margin-left: var(--spacing-1);
}

.form-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-height: 20px; /* IMPORTANTE: min-height permite crecimiento */
}

.form-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  min-height: 20px; /* IMPORTANTE: min-height permite crecimiento */
}

.form-error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.form-success {
  font-size: var(--font-size-sm);
  color: var(--color-success);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  min-height: 20px; /* IMPORTANTE: min-height permite crecimiento */
}
```

## Input con Icono

```css
.input-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon-wrapper .input {
  padding-left: var(--spacing-10); /* Espacio para icono izquierdo */
}

.input-icon-wrapper .input-icon-left {
  position: absolute;
  left: var(--spacing-3);
  width: 20px;
  height: 20px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.input-icon-wrapper .input-icon-right {
  position: absolute;
  right: var(--spacing-3);
  width: 20px;
  height: 20px;
  color: var(--color-text-tertiary);
}

/* Input con botón de acción (ej: password toggle) */
.input-icon-wrapper .input-action {
  position: absolute;
  right: var(--spacing-1);
  padding: var(--spacing-2);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color var(--duration-fast) var(--ease-out);
}

.input-icon-wrapper .input-action:hover {
  color: var(--color-primary);
}
```

## Ejemplos de Uso en Retea

### 1. Formulario de Creación de Campaña

```html
<form class="form">
  <div class="form-group">
    <label for="campaign-name" class="form-label form-label-required">
      Nombre de la Campaña
    </label>
    <input
      type="text"
      id="campaign-name"
      class="input input-md"
      placeholder="Ej: Sesderma - Farmacias España"
      required
    />
    <span class="form-hint">
      Usa un nombre descriptivo que identifique fácilmente la campaña
    </span>
  </div>

  <div class="form-group">
    <label for="budget" class="form-label form-label-required">
      Presupuesto Total
    </label>
    <div class="input-icon-wrapper">
      <span class="input-icon-left">€</span>
      <input
        type="number"
        id="budget"
        class="input input-md"
        placeholder="50000"
        min="0"
        step="100"
        required
      />
    </div>
  </div>

  <div class="form-group">
    <label for="description" class="form-label">
      Descripción
    </label>
    <textarea
      id="description"
      class="textarea"
      rows="5"
      placeholder="Describe los detalles de la campaña..."
    ></textarea>
  </div>

  <div class="form-group">
    <label for="provinces" class="form-label form-label-required">
      Provincias
    </label>
    <select id="provinces" class="select select-md" multiple required>
      <option value="madrid">Madrid</option>
      <option value="barcelona">Barcelona</option>
      <option value="valencia">Valencia</option>
    </select>
    <span class="form-hint">
      Mantén Ctrl/Cmd para seleccionar múltiples provincias
    </span>
  </div>

  <div class="checkbox-wrapper">
    <input type="checkbox" id="nda" class="checkbox" required />
    <label for="nda" class="checkbox-label">
      Acepto los términos del NDA y condiciones de confidencialidad
    </label>
  </div>

  <div class="form-actions">
    <button type="button" class="btn-secondary">Cancelar</button>
    <button type="submit" class="btn-primary">Crear Campaña</button>
  </div>
</form>
```

### 2. Búsqueda con Filtros

```html
<div class="search-filters">
  <div class="form-group">
    <label for="search" class="sr-only">Buscar campañas</label>
    <div class="input-icon-wrapper">
      <svg class="input-icon-left"><!-- Search icon --></svg>
      <input
        type="search"
        id="search"
        class="input input-md"
        placeholder="Buscar por nombre, provincia..."
      />
    </div>
  </div>

  <div class="form-group">
    <label for="status-filter" class="form-label">Estado</label>
    <select id="status-filter" class="select select-sm">
      <option value="">Todos</option>
      <option value="active">Activas</option>
      <option value="completed">Completadas</option>
      <option value="cancelled">Canceladas</option>
    </select>
  </div>

  <div class="switch-wrapper">
    <input type="checkbox" id="my-campaigns" class="switch" />
    <label for="my-campaigns" class="form-label">
      Solo mis campañas
    </label>
  </div>
</div>
```

### 3. Validación de Formulario

```html
<div class="form-group">
  <label for="email" class="form-label form-label-required">
    Email
  </label>
  <input
    type="email"
    id="email"
    class="input input-md input-error"
    value="usuario@ejemplo"
    required
  />
  <span class="form-error">
    <svg><!-- Error icon --></svg>
    Por favor, introduce un email válido
  </span>
</div>

<div class="form-group">
  <label for="phone" class="form-label">
    Teléfono
  </label>
  <input
    type="tel"
    id="phone"
    class="input input-md input-success"
    value="+34 600 123 456"
  />
  <span class="form-success">
    <svg><!-- Check icon --></svg>
    Teléfono verificado
  </span>
</div>
```

## Accesibilidad

- **Labels:** Siempre usar `<label>` con `for` o wrapper
- **Required fields:** Usar atributo `required` + indicador visual
- **Error messages:** Asociar con `aria-describedby`
- **Focus visible:** Outline claro en todos los inputs
- **Placeholder:** No reemplaza al label, solo como hint
- **Touch targets:** Mínimo 44x44px (cumplido con input-md)
- **Keyboard navigation:** Tab order lógico

```html
<div class="form-group">
  <label for="username" class="form-label form-label-required">
    Usuario
  </label>
  <input
    type="text"
    id="username"
    class="input input-md input-error"
    aria-invalid="true"
    aria-describedby="username-error"
    required
  />
  <span id="username-error" class="form-error" role="alert">
    Este nombre de usuario ya está en uso
  </span>
</div>
```

## Responsive

```css
@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }

  .input,
  .textarea,
  .select {
    font-size: 16px; /* Prevenir zoom en iOS */
  }
}
```
