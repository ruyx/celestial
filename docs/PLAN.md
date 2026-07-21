# Plan Estratégico de Retea - Marketplace de Instalaciones

**Fecha:** 21 de julio de 2026
**Versión:** 1.0 (Plan inicial post-office hours manual)

---

## 🎯 OFFICE HOURS: Interrogatorio de Producto

### 1. ¿Qué "trabajo" está contratando el usuario?

**Cliente corporativo (Sesderma, Mapfre, etc.):**
- "Necesito ejecutar una campaña visual en 300-500 puntos de venta dispersos por España"
- "Quiero garantía de que se instalan correctamente y a tiempo"
- "Necesito visibilidad en tiempo real del progreso"

**Instalador/Rotulista:**
- "Quiero llenar huecos entre proyectos grandes"
- "Necesito trabajos simples con precio claro"
- "No quiero compromiso permanente, solo aceptar cuando me conviene"

### 2. ¿Qué comportamiento actual están cambiando?

**Antes (sin Retea):**
- Cliente llama a empresa intermediaria (sin control)
- Intermediaria subcontrata sin criterio → calidad impredecible
- Margen mínimo para todos
- Sin visibilidad del proceso
- Instaladores no saben qué campañas hay disponibles

**Después (con Retea):**
- Cliente sube campaña directamente a plataforma
- Sistema asigna instaladores cercanos automáticamente
- Instalador ve precio/plazo/ubicación → decide libremente
- Cliente ve progreso en tiempo real
- Evidencia fotográfica obligatoria
- Pago garantizado a 60 días

### 3. ¿Qué mide el progreso/éxito?

**Para el Cliente:**
- % de puntos completados a tiempo
- Calidad de instalaciones (fotos aprobadas)
- Coste final vs presupuesto inicial
- NPS: ¿Recomendaría Retea?

**Para el Instalador:**
- € facturados por mes
- Días entre aceptación y pago
- Tasa de aprobación de trabajos (% sin rechazos)
- Facilidad de uso de la app

**Para Retea (negocio):**
- Margen por campaña (€25-30/punto objetivo)
- Tasa de completitud de campañas (>80%)
- Tasa de retención de clientes
- Tasa de crecimiento de red de instaladores

### 4. ¿Qué fricción elimina?

- ❌ Llamadas telefónicas para coordinar
- ❌ Negociación precio por precio
- ❌ Falta de transparencia en costes
- ❌ Sin seguimiento del progreso
- ❌ Disputas por calidad sin evidencia
- ❌ Pagos inciertos/retrasados
- ❌ Instaladores sin acceso a oportunidades

### 5. ¿Cuál es el "aha moment"?

**Cliente:**
> "Subí el CSV de 400 farmacias a las 10am. A las 3pm ya tengo 280 instaladores confirmados con fecha de instalación. Puedo ver el mapa en tiempo real."

**Instalador:**
> "Recibí notificación de 8 puntos en mi zona a 70€ cada uno. Los acepto con un click. En 2 días los hago y subo las fotos. A los 60 días cobro sin negociar."

### 6. ¿Qué hace Retea diferente?

- **Tecnología**: Plataforma digital vs intermediarios manuales
- **Control**: Cliente ve todo en tiempo real vs caja negra
- **Red propia**: Instaladores registrados vs subcontratas ad-hoc
- **Evidencia**: Fotos obligatorias antes/después vs confianza ciega
- **Precio transparente**: €70-90/punto conocido vs presupuestos opacos
- **Escalable**: 50 o 500 puntos sin cambiar proceso

---

## 📊 CEO REVIEW: Scope y Estrategia

### Modo: HOLD SCOPE (validar que el MVP sea suficiente)

#### MVP Scope (12 semanas):

**IN SCOPE:**
✅ Panel admin (crear campañas, subir CSV, asignar instaladores)
✅ Geocodificación automática de direcciones
✅ Asignación manual de instaladores por provincia
✅ Notificaciones email (aceptación de trabajos)
✅ Contratos digitales simples (checkbox + timestamp)
✅ App móvil básica (React Native + Expo)
✅ Upload de fotos (3 fotos mínimas: antes/durante/después)
✅ Estados: pending → assigned → accepted → in_progress → completed → approved
✅ Dashboard cliente (readonly, progreso en tiempo real)
✅ Exportación informes CSV/PDF

**OUT OF SCOPE (v2, v3):**
❌ IA para asignación automática de instaladores
❌ Sistema de subastas/marketplace público
❌ Firma electrónica certificada (solo checkbox MVP)
❌ Rating de instaladores con reviews
❌ Tracking de PDFs con apertura
❌ Pagos integrados (Stripe/PayPal)
❌ Gestión de fulfillment/logística
❌ App nativa iOS/Android (PWA web responsive primero)
❌ Notificaciones push
❌ Integración ERP/contabilidad

#### Métricas de Éxito MVP:

**Criterio de validación (piloto Sesderma 400 puntos):**
- ✅ >80% de puntos completados en plazo
- ✅ >90% de evidencias aprobadas al primer intento
- ✅ NPS cliente ≥8
- ✅ Margen real ≥15% (mínimo €20/punto)
- ✅ Tiempo promedio instalación <5 días desde asignación

**Si se cumple:** Continuar con v2 (IA, ratings, marketplace público)
**Si NO se cumple:** Pivotar o cancelar antes de invertir más

---

## 🏗️ ENGINEERING REVIEW: Arquitectura Técnica

### Stack Técnico

```
Frontend Web:
├── React 18 + TypeScript
├── Vite (build tool)
├── TailwindCSS
├── React Router v6
└── React Query (state management server)

Backend:
├── Supabase
│   ├── PostgreSQL (base de datos)
│   ├── Row Level Security (permisos granulares)
│   ├── Storage (fotos de instalaciones)
│   ├── Edge Functions (lógica serverless)
│   └── Realtime (updates en vivo)

App Móvil:
├── React Native + Expo
├── Expo Camera (fotos)
├── Expo Location (geolocalización)
└── Compartir lógica con web (hooks reutilizables)

Infraestructura:
├── Vercel (hosting frontend)
├── Supabase Cloud (backend completo)
├── Resend (emails transaccionales)
└── Google Maps API (geocoding)
```

### Modelo de Datos

```sql
-- Usuarios (Supabase Auth + profiles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'installer', 'client')),
  company_name VARCHAR,
  cif VARCHAR,
  phone VARCHAR,
  provinces JSONB, -- ["Madrid", "Toledo"] (solo instaladores)
  nda_signed_at TIMESTAMP,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campañas
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  client_id UUID REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_install DECIMAL NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Puntos de instalación
CREATE TABLE installation_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  address VARCHAR NOT NULL,
  lat DECIMAL,
  lng DECIMAL,
  contact_name VARCHAR,
  contact_phone VARCHAR,
  province VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'accepted', 'rejected',
                      'in_progress', 'completed', 'approved', 'rejected_evidence')),
  assigned_to UUID REFERENCES profiles(id),
  tracking_number VARCHAR,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Evidencias de instalación
CREATE TABLE installation_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id UUID REFERENCES installation_points(id) ON DELETE CASCADE,
  photo_before_url VARCHAR NOT NULL,
  photo_during_url VARCHAR,
  photo_after_url VARCHAR NOT NULL,
  signature_url VARCHAR,
  notes TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Contratos digitales
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID REFERENCES profiles(id),
  campaign_id UUID REFERENCES campaigns(id),
  accepted_points JSONB NOT NULL, -- [point_id1, point_id2, ...]
  accepted_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR,
  user_agent TEXT,
  contract_version VARCHAR DEFAULT 'v1.0'
);

-- Índices para performance
CREATE INDEX idx_points_campaign ON installation_points(campaign_id);
CREATE INDEX idx_points_status ON installation_points(status);
CREATE INDEX idx_points_assigned ON installation_points(assigned_to);
CREATE INDEX idx_evidences_point ON installation_evidences(point_id);
CREATE INDEX idx_contracts_installer ON contracts(installer_id);
CREATE INDEX idx_contracts_campaign ON contracts(campaign_id);
```

### Diagramas de Flujo

#### Flujo 1: Admin crea campaña

```
Admin → Sube CSV de puntos
  ↓
Sistema geocodifica direcciones (Google Maps API)
  ↓
Admin asigna puntos a instaladores (manual por provincia)
  ↓
Sistema genera paquetes por instalador
  ↓
Envía email con link de aceptación
  ↓
[Espera respuesta instalador]
```

#### Flujo 2: Instalador acepta/rechaza

```
Instalador recibe email
  ↓
Abre link → ve listado de puntos asignados
  ↓
Revisa: mapa + precio + plazo
  ↓
OPCIÓN A: Acepta todos → Firma contrato digital
  ↓
Recibe PDF con detalles + tracking de envío

OPCIÓN B: Acepta selectivos → Firma contrato parcial

OPCIÓN C: Rechaza todos → Puntos vuelven a pool
```

#### Flujo 3: Instalación y evidencia

```
Instalador marca punto como "En camino"
  ↓
Al llegar → marca "Instalando"
  ↓
Toma 3 fotos: antes + durante + después
  ↓
Sube fotos + notas desde app móvil
  ↓
Marca como "Completado"
  ↓
Admin recibe notificación
  ↓
Revisa evidencias:
  - Aprueba → Estado "Approved" → Genera albarán
  - Rechaza → Estado "Rejected" + comentario → Instalador debe reinstalar
```

### Rutas de Error

| Error | Causa | Mitigación |
|-------|-------|------------|
| Geocoding falla | Dirección inválida | Marcar punto como "review_required", admin corrige manualmente |
| Instalador no responde | Email no llega / ignora | Timeout 48h → puntos vuelven a pool |
| Fotos de mala calidad | Oscuras, borrosas | Rechazar evidencia + instrucciones claras en app |
| Ningún instalador acepta zona | Zona remota / precio bajo | Alertar admin + sugerir incrementar precio |
| Retraso en instalación | Instalador incumple plazo | Penalización contractual + marcar instalador |

### Consideraciones de Seguridad

**Autenticación:**
- Supabase Auth (email/password + magic links)
- Row Level Security (RLS) para permisos granulares
- JWTs con expiración corta (1h)

**Autorización:**
```sql
-- Solo admins pueden crear campañas
CREATE POLICY admin_create_campaigns ON campaigns
  FOR INSERT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Instaladores solo ven sus puntos asignados
CREATE POLICY installer_view_points ON installation_points
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

-- Clientes solo ven sus campañas
CREATE POLICY client_view_campaigns ON campaigns
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());
```

**Datos sensibles:**
- Fotos almacenadas en Supabase Storage (privado, solo URLs firmadas)
- Contratos con hash SHA-256 para verificación
- Logs de IP + user agent para auditoría
- GDPR compliance: derecho al olvido (soft delete)

**Prevención XSS/Injection:**
- Sanitizar inputs con DOMPurify
- Usar prepared statements (Supabase hace esto automáticamente)
- Content Security Policy headers
- HTTPS obligatorio

---

## 🎨 DESIGN REVIEW: UI/UX

### Principios de Diseño

1. **Claridad sobre ornamento** — Datos críticos grandes y claros
2. **Mobile-first** — App de instaladores es crítica
3. **Estado visible** — Siempre claro en qué paso estás
4. **Feedback inmediato** — Upload de fotos muestra progreso
5. **Accesible** — WCAG AA mínimo

### Dimensiones de Calidad (0-10)

| Dimensión | Nivel Objetivo | Cómo Lograrlo |
|-----------|----------------|---------------|
| **Visual Hierarchy** | 8/10 | Headers claros, tamaños tipográficos consistentes |
| **Color System** | 7/10 | Paleta simple: Primary (verde), Warning (naranja), Error (rojo), Neutral |
| **Typography** | 7/10 | Sans-serif (Inter/System), 2-3 tamaños, line-height 1.5 |
| **Spacing** | 8/10 | Sistema 4px grid (4, 8, 12, 16, 24, 32, 48, 64) |
| **Interactividad** | 7/10 | Hovers claros, estados disabled visibles |
| **Accesibilidad** | 7/10 | Alt text en imágenes, contraste WCAG AA, keyboard navigation |
| **Performance** | 8/10 | Lazy load imágenes, virtual scrolling en listas largas |
| **Responsiveness** | 9/10 | Mobile-first, breakpoints 640/768/1024/1280 |

### Screens Principales

**1. Admin - Dashboard de Campaña**
```
┌─────────────────────────────────────────────────┐
│ Campaña: Sesderma Navidad 2026                 │
│ 400 puntos | €50,000 | 01-15 Dic               │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Mapa interactivo con pins coloreados]       │
│   🟢 Completado (120)                           │
│   🟡 En progreso (50)                           │
│   🔵 Aceptado (180)                             │
│   ⚪ Pendiente (50)                              │
│                                                 │
├─────────────────────────────────────────────────┤
│ Provincia    | Total | Completado | %          │
│ Madrid       | 80    | 30         | 37%        │
│ Barcelona    | 60    | 45         | 75%        │
│ Valencia     | 40    | 20         | 50%        │
│                                                 │
│ [Exportar CSV] [Ver Evidencias] [Notificar]    │
└─────────────────────────────────────────────────┘
```

**2. App Móvil Instalador - Detalle de Punto**
```
┌─────────────────────────────────────────────────┐
│  ← Farmacia San Martín                          │
├─────────────────────────────────────────────────┤
│  📍 Calle Mayor 23, 28013 Madrid                │
│  👤 María López                                 │
│  📞 666 777 888                                 │
│                                                 │
│  [📞 Llamar] [🗺️ Navegar] [💬 WhatsApp]         │
│                                                 │
│  Estado: 🟡 En progreso                         │
│                                                 │
│  Fotos requeridas:                              │
│  ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ Antes  │ │Durante │ │Después │              │
│  │   📷   │ │   ✅   │ │   📷   │              │
│  └────────┘ └────────┘ └────────┘              │
│                                                 │
│  Notas adicionales:                             │
│  [_____________________________________]        │
│                                                 │
│  [✅ Marcar como Completado]                    │
└─────────────────────────────────────────────────┘
```

**3. Dashboard Cliente (Sesderma)**
```
┌─────────────────────────────────────────────────┐
│  👋 Bienvenido, Sesderma                        │
│  Campaña: Navidad 2026                          │
├─────────────────────────────────────────────────┤
│  Progreso General                               │
│  ████████████████░░░░ 320/400 (80%)            │
│                                                 │
│  Por Provincia                                  │
│  Madrid:    █████████░ 72/80 (90%)             │
│  Barcelona: ██████████ 60/60 (100%)            │
│  Valencia:  ███████░░░ 28/40 (70%)             │
│                                                 │
│  [📥 Descargar Informe PDF]                     │
│  [🖼️ Ver Galería de Fotos]                      │
└─────────────────────────────────────────────────┘
```

### Paleta de Colores

```css
/* Colores de estado */
--color-pending: #94A3B8;     /* Gris */
--color-accepted: #3B82F6;    /* Azul */
--color-in-progress: #F59E0B; /* Naranja */
--color-completed: #10B981;   /* Verde */
--color-rejected: #EF4444;    /* Rojo */

/* Marca */
--color-primary: #059669;     /* Verde Retea */
--color-secondary: #0EA5E9;   /* Azul info */

/* Neutros */
--color-bg: #FFFFFF;
--color-surface: #F8FAFC;
--color-border: #E2E8F0;
--color-text: #1E293B;
--color-text-muted: #64748B;
```

---

## 📅 ROADMAP DE 12 SEMANAS

### Sprint 1-2: Fundación (2 semanas)
**Objetivos:**
- Supabase configurado (DB + Auth + Storage)
- Modelo de datos implementado + RLS policies
- Frontend base (React + routing + layout)
- Auth flows (login/register/logout)

**Entregables:**
- ✅ DB schema migrado
- ✅ Roles funcionando (admin/installer/client)
- ✅ Layout responsive con sidebar
- ✅ Login/register pages

### Sprint 3-4: Gestión de Campañas (2 semanas)
**Objetivos:**
- CRUD de campañas
- Upload CSV de puntos
- Geocodificación automática
- Vista de mapa con pins

**Entregables:**
- ✅ Crear/editar/eliminar campañas
- ✅ Parser de CSV robusto
- ✅ Google Maps API integrada
- ✅ Mapa interactivo con filtros

### Sprint 5-6: Asignación de Instaladores (2 semanas)
**Objetivos:**
- Asignación manual por provincia
- Generación de PDFs por instalador
- Sistema de notificaciones email
- Página de aceptación de trabajos

**Entregables:**
- ✅ UI de asignación con drag-and-drop
- ✅ PDFs con detalles de puntos
- ✅ Emails con Resend
- ✅ Contrato digital simple

### Sprint 7-8: App Móvil (2 semanas)
**Objetivos:**
- React Native + Expo setup
- Home con campañas activas
- Detalle de punto
- Upload de fotos (cámara)

**Entregables:**
- ✅ App corriendo en Android/iOS
- ✅ Listado de puntos asignados
- ✅ Cámara integrada
- ✅ Upload a Supabase Storage

### Sprint 9-10: Validación y Evidencias (2 semanas)
**Objetivos:**
- Panel de revisión de evidencias
- Galería de fotos
- Aprobación/rechazo
- Generación de albaranes

**Entregables:**
- ✅ Vista de evidencias con zoom
- ✅ Workflow de aprobación
- ✅ PDF de albarán automático
- ✅ Notificaciones de estado

### Sprint 11: Dashboard Cliente + Pulido (1 semana)
**Objetivos:**
- Dashboard cliente (readonly)
- Exportación de informes
- Pulido UI/UX
- Bug fixes

**Entregables:**
- ✅ Dashboard responsive
- ✅ Exportar CSV/PDF
- ✅ Tooltips y ayudas
- ✅ Error handling mejorado

### Sprint 12: Testing + Deploy (1 semana)
**Objetivos:**
- Testing E2E con Playwright
- Security audit
- Performance optimization
- Deploy a producción

**Entregables:**
- ✅ Test suite E2E
- ✅ Auditoría de seguridad pasada
- ✅ Lighthouse score >90
- ✅ App en producción (staging + prod)

---

## 🚀 SIGUIENTE PASO

**ACCIÓN INMEDIATA:** Crear estructura de proyecto base

```bash
# 1. Inicializar proyecto React + TypeScript
npm create vite@latest retea-web -- --template react-ts

# 2. Instalar dependencias base
cd retea-web
npm install react-router-dom @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npm install @supabase/supabase-js

# 3. Configurar Supabase
# - Crear proyecto en supabase.com
# - Obtener SUPABASE_URL y SUPABASE_ANON_KEY
# - Crear archivo .env.local

# 4. Configurar TailwindCSS
npx tailwindcss init -p

# 5. Git commit inicial
git add .
git commit -m "feat: initialize Retea web app with Vite + React + TypeScript"
```

---

**Estado:** ✅ Plan completo aprobado
**Próximo:** Inicializar estructura de proyecto (Sprint 1)
