# Aplicar Migraciones de Base de Datos

Las migraciones SQL están creadas en `supabase/migrations/`. Hay 3 formas de aplicarlas:

## Opción 1: Dashboard de Supabase (MÁS RÁPIDO) ✅

1. Ir a https://supabase.com/dashboard/project/boffacmghclyirjcopzq
2. Ir a **SQL Editor**
3. Abrir cada archivo de migración y ejecutarlo en orden:
   - `20260721000001_initial_schema.sql`
   - `20260721000002_rls_policies.sql`
4. Click en **Run** para cada archivo

## Opción 2: Supabase CLI

```bash
# Desde dentro de la carpeta app/
supabase db push
```

**Nota:** Requiere tener Supabase CLI instalado y configurado con `supabase login`.

## Opción 3: psql directo (desde Windows/Mac, NO WSL)

```bash
# Copiar las migraciones a tu sistema Windows/Mac y ejecutar:

psql "postgresql://postgres:YHpoKLCXxGAzj7QI@db.boffacmghclyirjcopzq.supabase.co:5432/postgres" -f migrations/20260721000001_initial_schema.sql

psql "postgresql://postgres:YHpoKLCXxGAzj7QI@db.boffacmghclyirjcopzq.supabase.co:5432/postgres" -f migrations/20260721000002_rls_policies.sql
```

---

## Después de Aplicar las Migraciones

Una vez aplicadas, genera los tipos TypeScript:

```bash
# Esto creará src/lib/database.types.ts con todos los tipos
supabase gen types typescript --project-id boffacmghclyirjcopzq > src/lib/database.types.ts
```

O desde el dashboard:
1. Settings → API
2. Copiar el contenido de "TypeScript Types"
3. Pegar en `src/lib/database.types.ts`

---

## Verificar que se aplicaron correctamente

```sql
-- En SQL Editor de Supabase Dashboard, ejecutar:

-- Ver todas las tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Debería mostrar:
-- campaigns
-- contracts
-- installation_evidences
-- installation_points
-- notifications
-- profiles
```

---

## Estado Actual

- ✅ Migraciones creadas
- ⏳ **PENDIENTE:** Aplicar migraciones (usar una de las opciones arriba)
- ⏳ Generar tipos TypeScript una vez aplicadas
