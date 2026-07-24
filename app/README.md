# Retea - Marketplace de Campañas de Instalación

Aplicación SvelteKit + TypeScript + Supabase + TailwindCSS para gestión de campañas de instalación.

## 🔐 Configuración de Credenciales (AISLADAS - Solo este proyecto)

**IMPORTANTE:** Este proyecto tiene sus propias credenciales de Supabase. **NO SON GLOBALES**.

### Supabase Project
- **Project ID:** `boffacmghclyirjcopzq`
- **Project URL:** `https://boffacmghclyirjcopzq.supabase.co`
- **Database Host:** `db.boffacmghclyirjcopzq.supabase.co`

### Variables de Entorno

Las credenciales están en `.env.local` (gitignored). Para configurar un nuevo ambiente:

1. Copiar `.env.example` a `.env.local`
2. Rellenar con las credenciales reales (ver archivo `.env.local` existente como referencia)

```bash
cp .env.example .env.local
# Editar .env.local con las credenciales reales
```

### Clientes Supabase

El proyecto tiene **DOS clientes** configurados en `src/lib/supabase.ts`:

1. **Cliente Público** (`supabase`) - Para uso en browser
   - Usa Anon Key
   - Protegido por Row Level Security (RLS)
   - Para operaciones de usuario autenticado

2. **Cliente Admin** (`supabaseAdmin`) - Solo server-side
   - Usa Service Role Key
   - **Bypasa RLS** - solo usar en server
   - Para operaciones administrativas

```typescript
import { supabase, supabaseAdmin } from '$lib/supabase';

// En componentes Svelte (cliente)
const { data } = await supabase.from('campaigns').select('*');

// En +page.server.ts (servidor)
const { data } = await supabaseAdmin.from('campaigns').select('*');
```

## 🏗️ Estructura del Proyecto

```
app/
├── src/
│   ├── lib/
│   │   ├── assets/          # Logo, favicon, palette
│   │   ├── components/
│   │   │   ├── ui/          # Botones, cards, badges, inputs
│   │   │   ├── campaigns/   # Componentes de campañas
│   │   │   ├── dashboard/   # Widgets de dashboard
│   │   │   └── layout/      # Header, sidebar, nav
│   │   └── supabase.ts      # Clientes Supabase (público + admin)
│   ├── routes/
│   │   ├── auth/            # Login, signup
│   │   ├── dashboard/       # Dashboard principal
│   │   ├── campaigns/       # Gestión de campañas
│   │   │   └── [id]/        # Detalle de campaña
│   │   └── +layout.svelte   # Layout global (importa app.css)
│   └── app.css              # Estilos globales + TailwindCSS
├── supabase/
│   └── config.toml          # Configuración local de Supabase
├── .env.local               # CREDENCIALES REALES (gitignored)
├── .env.example             # Template de variables
├── .supabaserc              # Link al proyecto remoto
└── vercel.json              # Configuración de deployment
```

## 🎨 Design System

El proyecto usa **TailwindCSS** integrado con el **Design System de Retea**:

- **Colores:** `primary`, `neutral`, `success`, `warning`, `error`, `info`
- **Tipografía:** Sistema de fuentes modular (xs → 6xl)
- **Spacing:** Escala base 4px
- **Componentes:** Clases reutilizables (`.btn-primary`, `.card`, `.badge-success`, etc.)

Ver `tailwind.config.js` para tokens completos y `app.css` para componentes.

### Ejemplos de Uso

```svelte
<!-- Botón primario -->
<button class="btn-primary">Crear Campaña</button>

<!-- Card de campaña -->
<div class="card card-campaign">
  <h3>Título</h3>
  <p>Contenido</p>
</div>

<!-- Badge de éxito -->
<span class="badge-success">Activa</span>

<!-- Input con validación -->
<input class="input" type="text" placeholder="Nombre" />
<input class="input input-error" type="email" />
```

## 🚀 Desarrollo

### Instalación

```bash
npm install
```

### Desarrollo Local

```bash
# Iniciar SvelteKit dev server
npm run dev

# Opcional: Iniciar Supabase local (si necesitas DB local)
supabase start
```

### Supabase CLI

El proyecto está linkeado a Supabase remoto:

```bash
# Ver status del proyecto
supabase status

# Generar tipos TypeScript desde schema
supabase gen types typescript --linked > src/lib/database.types.ts

# Crear migración
supabase migration new nombre_de_migracion

# Aplicar migraciones
supabase db push
```

## 📦 Deployment en Vercel

### Primera vez

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Variables de Entorno en Vercel

Agregar en el dashboard de Vercel:

1. **Production Environment:**
   - `PUBLIC_SUPABASE_URL` → `https://boffacmghclyirjcopzq.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` → (tu anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` → (tu service role key)

2. **Preview/Development** (opcional) → Mismas variables

### Deploy Automático

Una vez configurado, cada `git push` a la rama principal desplegará automáticamente.

## 📋 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run check        # Type-checking
npm run lint         # Linting
npm run format       # Formatear código
```

## 🔒 Seguridad

- **Anon Key** (público): Seguro exponer en cliente - protegido por RLS
- **Service Role Key** (privado): **NUNCA** exponer en cliente - solo server-side
- `.env.local` está en `.gitignore` - nunca commitear credenciales
- Row Level Security (RLS) debe estar activo en todas las tablas de producción

## 📚 Recursos

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Design System - Retea](/home/suario/projects/retea/design-system/)
