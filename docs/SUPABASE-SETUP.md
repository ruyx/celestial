# 🚀 Supabase Setup Guide - Rey Celestial

Guía completa para configurar Supabase como base de datos cloud del proyecto.

---

## 📋 Tabla de Contenidos

1. [Crear Proyecto en Supabase](#1-crear-proyecto-en-supabase)
2. [Obtener Credenciales](#2-obtener-credenciales)
3. [Ejecutar Migraciones](#3-ejecutar-migraciones)
4. [Verificar Setup](#4-verificar-setup)
5. [Subir Data](#5-subir-data)

---

## 1. Crear Proyecto en Supabase

### Paso 1.1: Ir a Supabase

```bash
# Abrir en el navegador
https://supabase.com/dashboard
```

### Paso 1.2: Crear Nuevo Proyecto

1. Click en "New Project"
2. **Organization**: Seleccionar o crear una nueva
3. **Name**: `rey-celestial` o `bible-youtube-automation`
4. **Database Password**: Guardar en un lugar seguro (ej: 1Password)
5. **Region**: `West Europe (Frankfurt)` (más cercano a España)
6. **Pricing Plan**: `Free` (hasta 500MB DB + 1GB bandwidth/mes)
7. Click "Create new project"

⏳ **Esperar ~2 minutos** mientras se aprovisiona el proyecto.

---

## 2. Obtener Credenciales

### Paso 2.1: URL del Proyecto

En el dashboard del proyecto, ir a **Settings** → **API**:

```
Project URL: https://tu-proyecto.supabase.co
```

### Paso 2.2: API Keys

En la misma página (**Settings** → **API**):

```
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: Usar `service_role` key para operaciones de backend (tiene permisos completos).

### Paso 2.3: Agregar a `.env`

```bash
# Agregar estas líneas a .env
echo "SUPABASE_URL=https://tu-proyecto.supabase.co" >> .env
echo "SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." >> .env
```

---

## 3. Ejecutar Migraciones

Hay **3 formas** de ejecutar las migraciones:

### Opción A: Supabase SQL Editor (Recomendado para primera vez)

1. Ir a **SQL Editor** en el dashboard
2. Click "New Query"
3. Copiar el contenido de `supabase/migrations/001_create_bible_verses_table.sql`
4. Pegar en el editor
5. Click "Run" (botón verde)
6. ✅ Debería mostrar "Success. No rows returned"
7. Repetir con `002_create_video_analytics_table.sql`

### Opción B: Supabase CLI (Recomendado para desarrollo)

```bash
# 1. Instalar Supabase CLI (si no está instalado)
npm install -g supabase

# 2. Linkear con el proyecto
supabase link --project-ref tu-project-ref

# 3. Ejecutar migraciones
supabase db push

# Las migraciones se aplican automáticamente desde supabase/migrations/
```

### Opción C: `psql` Directo (Avanzado)

```bash
# 1. Ir a Settings → Database → Connection string
# 2. Copiar la URI de PostgreSQL

# 3. Ejecutar migraciones manualmente
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/001_create_bible_verses_table.sql

psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/002_create_video_analytics_table.sql
```

---

## 4. Verificar Setup

### Paso 4.1: Verificar Tablas Creadas

En el dashboard, ir a **Table Editor**. Deberías ver:

- ✅ `bible_verses` (0 rows)
- ✅ `video_analytics` (0 rows)

### Paso 4.2: Verificar Vistas

En **SQL Editor**, ejecutar:

```sql
SELECT * FROM top_performing_videos LIMIT 10;
SELECT * FROM recent_analytics LIMIT 10;
```

Ambas deberían devolver 0 rows (aún no hay data).

### Paso 4.3: Verificar Función de Performance Score

```sql
SELECT calculate_performance_score(5000, 200, 50, 8.5);
```

Debería devolver un número entre 1-10 (ej: `7`).

---

## 5. Subir Data

Cuando el script `prepare-cloud-database-openrouter.js` termine de generar metadata (~26 horas), ejecutar:

```bash
node scripts/prepare-cloud-database-openrouter.js --mode=upload
```

Este comando:

1. Lee `data/processed-verses.json` (30,987 versículos)
2. Convierte a formato Supabase
3. Sube en batches de 100 versículos
4. Muestra progreso en tiempo real
5. Maneja errores y reintentos automáticamente

### Progreso Esperado

```
📤 SUBIENDO A SUPABASE...
Total versículos: 30,987
Batch size: 100

📦 Batch 1/310 (1-100)
✅ Batch completado. Total subidos: 100/30,987

📦 Batch 2/310 (101-200)
✅ Batch completado. Total subidos: 200/30,987

...

🎉 ¡Upload completado!
Total subidos: 30,987 versículos
Tiempo total: ~15 minutos
```

---

## 📊 Queries Útiles

### Ver Estadísticas Generales

```sql
-- Total versículos por libro
SELECT book, COUNT(*) as total
FROM bible_verses
GROUP BY book
ORDER BY total DESC;

-- Distribución por categoría
SELECT category, COUNT(*) as total
FROM bible_verses
GROUP BY category
ORDER BY total DESC;

-- Promedio de viral potential por libro
SELECT book, ROUND(AVG(viral_potential), 2) as avg_viral_potential
FROM bible_verses
GROUP BY book
ORDER BY avg_viral_potential DESC;
```

### Buscar Versículos para Próximo Video

```sql
-- Top 10 versículos no publicados con mayor potencial viral
SELECT
  reference,
  text,
  viral_potential,
  custom_hook,
  category
FROM bible_verses
WHERE published = FALSE
ORDER BY viral_potential DESC
LIMIT 10;
```

### Búsqueda por Texto Completo

```sql
-- Buscar versículos que hablen de "amor"
SELECT reference, text, category
FROM bible_verses
WHERE to_tsvector('spanish', text) @@ to_tsquery('spanish', 'amor')
LIMIT 20;
```

---

## 🔒 Seguridad

### Row Level Security (RLS)

Por defecto, Supabase aplica RLS. Para este proyecto (backend-only), podemos deshabilitarlo temporalmente:

```sql
-- Deshabilitar RLS en ambas tablas (solo para backend)
ALTER TABLE bible_verses DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics DISABLE ROW LEVEL SECURITY;
```

⚠️ Si planeas exponer la API públicamente, **habilitar RLS** y crear políticas apropiadas.

---

## 🆘 Troubleshooting

### Error: "permission denied for table bible_verses"

**Causa**: Estás usando la `anon` key en lugar de `service_role` key.

**Solución**: Actualizar `.env` con la `service_role` key.

---

### Error: "relation bible_verses does not exist"

**Causa**: Las migraciones no se ejecutaron.

**Solución**: Ejecutar las migraciones según [Paso 3](#3-ejecutar-migraciones).

---

### Upload muy lento

**Causa**: Batch size demasiado pequeño o conexión lenta.

**Solución**:
1. Aumentar `supabaseBatchSize` en `prepare-cloud-database-openrouter.js` de 100 a 500.
2. Verificar conexión a internet.

---

## 📚 Recursos

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Supabase SQL Editor**: https://supabase.com/docs/guides/database/overview#the-sql-editor

---

## ✅ Checklist Final

Antes de continuar con el siguiente paso:

- [ ] Proyecto creado en Supabase
- [ ] Credenciales agregadas a `.env`
- [ ] Migraciones ejecutadas (2 tablas + 2 vistas)
- [ ] Verificación exitosa (queries funcionan)
- [ ] Data subida (30,987 versículos)

**Siguiente paso**: Implementar Agent 9 (Analytics Collector) 📊
