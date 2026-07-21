# Retea - Plataforma de Gestión de Campañas de Instalación

## Proyecto

Retea es un marketplace/plataforma tipo "Uber para instalaciones de campaña" que conecta empresas (clientes) con rotulistas profesionales para ejecutar campañas de instalación de vinilos a escala nacional.

### Contexto del Negocio

- **Cliente inicial**: Sesderma (laboratorio de productos para la piel)
- **Caso de uso**: 300-500 farmacias en España necesitan vinilos promocionales de Navidad
- **Problema que resolvemos**: No existe solución estructurada para coordinar instalaciones dispersas a nivel nacional
- **Modelo de negocio**: Marketplace bidireccional (rotulistas + clientes corporativos)

### Stack Tecnológico (Propuesto)

```
Frontend:
- React + TypeScript
- Vite
- TailwindCSS
- React Router

Backend:
- Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)

App Móvil:
- React Native + Expo (para instaladores)

Infraestructura:
- Vercel/Netlify (frontend)
- Supabase (backend completo)
- Resend (emails)
```

### Objetivos del MVP (12 semanas)

1. **Panel Admin**: Crear campañas, subir CSV de puntos, asignar instaladores
2. **Dashboard Instalador**: Ver trabajos, aceptar/rechazar, subir evidencias (fotos)
3. **Dashboard Cliente**: Ver progreso en tiempo real, descargar informes
4. **App Móvil básica**: Instaladores pueden marcar estados y subir fotos desde el móvil

### Métricas de Éxito

- Piloto con Sesderma: 400 puntos
- Tasa de aceptación >80%
- Tasa de completitud >80%
- Evidencias aprobadas >90% al primer intento
- NPS cliente ≥8

---

## gstack Skills

Este proyecto utiliza [gstack](https://github.com/garrytan/gstack) para acelerar el desarrollo.

### Skills Disponibles

**Planificación:**
- `/gstack-office-hours` — Product interrogation con 6 preguntas forzadas
- `/gstack-plan-ceo-review` — Revisión estratégica del scope
- `/gstack-plan-eng-review` — Especificación arquitectónica y diagramas
- `/gstack-plan-design-review` — Auditoría de diseño interactiva
- `/gstack-autoplan` — Plan completo automático (CEO + Design + Eng + DX reviews)

**Diseño:**
- `/gstack-design-consultation` — Sistema de diseño completo desde cero
- `/gstack-design-shotgun` — Generador de variantes visuales (4-6 mockups)
- `/gstack-design-html` — Conversión a HTML/CSS productivo
- `/gstack-design-review` — Auditoría de diseño post-ship con auto-fixes

**Construcción:**
- `/gstack-spec` — Convertir idea vaga en especificación ejecutable

**Revisión y Calidad:**
- `/gstack-review` — Staff engineer review (detecta bugs pre-producción)
- `/gstack-qa` — QA con navegador real, encuentra bugs, arregla, escribe tests
- `/gstack-qa-only` — Solo reporte de bugs (sin fixes)
- `/gstack-cso` — Security audit (OWASP Top 10 + STRIDE)
- `/gstack-codex` — Segunda opinión de OpenAI Codex

**Deployment:**
- `/gstack-ship` — Release engineering: sync, tests, coverage, PR
- `/gstack-land-and-deploy` — Merge PR + deploy + verify production
- `/gstack-canary` — Monitoreo post-deployment
- `/gstack-benchmark` — Performance baseline (Core Web Vitals)

**Documentación:**
- `/gstack-document-release` — Actualiza docs automáticamente
- `/gstack-document-generate` — Genera docs faltantes (Diataxis framework)

**Utilidades:**
- `/gstack-diagram` — English-to-diagram (Mermaid, Excalidraw)
- `/gstack-investigate` — Debugging sistemático
- `/gstack-browse` — Navegador Chromium real para testing
- `/gstack-learn` — Gestionar patrones aprendidos
- `/gstack-retro` — Retrospectiva semanal
- `/gstack-careful` — Warn antes de comandos destructivos
- `/gstack-freeze` — Restringir edits a un directorio
- `/gstack-guard` — `/careful` + `/freeze` combinados

### Routing de Skills

**IMPORTANTE:** Para búsquedas web y scraping, usa `/gstack-browse` en lugar de herramientas por defecto.

---

## Instrucciones de Desarrollo

### Workflow Recomendado (gstack)

```bash
# 1. Planificación (antes de programar)
/gstack-office-hours          # Interrogatorio de producto
/gstack-plan-ceo-review       # Scope review
/gstack-plan-eng-review       # Arquitectura
/gstack-plan-design-review    # Diseño

# O todo en uno:
/gstack-autoplan

# 2. Diseño
/gstack-design-consultation   # Sistema de diseño
/gstack-design-shotgun        # Mockups
/gstack-design-html           # HTML/CSS productivo

# 3. Build
[Programar features]

# 4. Review & QA
/gstack-review                # Code review
/gstack-qa http://localhost:5173  # QA automático
/gstack-cso                   # Security audit

# 5. Ship
/gstack-ship                  # Tests + PR
/gstack-land-and-deploy       # Merge + deploy
/gstack-canary                # Monitoreo
```

### Reglas de Código

- Seguir patrones de Xprinta (React + TypeScript + Supabase)
- Usar TailwindCSS para estilos
- Tests obligatorios (>80% coverage)
- Security-first (validar inputs, sanitizar queries)
- Documentar decisiones arquitectónicas

---

## Referencias

- [Documento de reunión inicial](./reunion-granola.md)
- [gstack GitHub](https://github.com/garrytan/gstack)
