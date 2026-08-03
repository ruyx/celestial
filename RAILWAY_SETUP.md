# 🚂 Configuración de Variables de Entorno en Railway

Este documento describe cómo configurar las variables de entorno necesarias para que n8n en Railway pueda acceder a Supabase Database.

## 📋 Variables Requeridas

El workflow n8n necesita estas dos variables de entorno para conectarse a Supabase:

```bash
SUPABASE_URL=https://qhlqrflccdgpslozzfyh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobHFyZmxjY2RncHNsb3p6ZnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgwOTQ1NywiZXhwIjoyMTAwMzg1NDU3fQ.lzRV3LtTkTouqYkd6vT1ypUd-c84xXKGIJc5XrZvYO4
```

## 🔧 Pasos para Configurar en Railway

### 1. Acceder al Dashboard de Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto donde está desplegado n8n

### 2. Agregar Variables de Entorno

1. En el dashboard del proyecto, haz clic en el servicio de **n8n**
2. Ve a la pestaña **Variables**
3. Haz clic en **New Variable** o **+ Add Variable**

### 3. Agregar las Credenciales de Supabase

Agrega cada una de las siguientes variables:

#### Variable 1: SUPABASE_URL
- **Key**: `SUPABASE_URL`
- **Value**: `https://qhlqrflccdgpslozzfyh.supabase.co`

#### Variable 2: SUPABASE_SERVICE_ROLE_KEY
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobHFyZmxjY2RncHNsb3p6ZnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgwOTQ1NywiZXhwIjoyMTAwMzg1NDU3fQ.lzRV3LtTkTouqYkd6vT1ypUd-c84xXKGIJc5XrZvYO4`

### 4. Reiniciar el Servicio

Después de agregar las variables:

1. Guarda los cambios
2. Railway automáticamente reiniciará el servicio n8n
3. Espera 1-2 minutos para que el servicio se reinicie completamente

## ✅ Verificar que Funciona

Para verificar que las variables están correctamente configuradas:

1. Abre n8n en Railway
2. Abre el workflow **"YouTube VIRAL Production - Master Scriptwriter V2"**
3. Haz clic en el nodo **"AI VIRAL Master Scriptwriter"**
4. Ejecuta una prueba manual (botón de "play" en el nodo)
5. Si todo está bien, deberías ver:
   ```
   📊 Consultando Supabase para obtener script más reciente...
   ✅ Script obtenido: [nombre del versículo]
   ```

## ⚠️ Solución de Problemas

### Error: "Faltan credenciales de Supabase"

Si ves este error:
```
❌ ERROR: Faltan credenciales de Supabase en variables de entorno
Configura en Railway:
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**Solución:**
1. Verifica que las variables estén exactamente como se especifica arriba
2. Asegúrate de que no haya espacios antes/después de los valores
3. Reinicia el servicio n8n en Railway

### Error: "No hay scripts disponibles"

Si ves este error:
```
⚠️ No hay scripts generados en Supabase
```

**Solución:**
1. Ejecuta Agent 1 localmente para generar un script:
   ```bash
   node agents/agent-1-viral-scriptwriter.js
   ```
2. Verifica que el script se guardó en Supabase:
   ```bash
   node scripts/verify-supabase-data.js
   ```

### Error: "permission denied for table"

Si ves este error de permisos:

**Solución:**
1. Verifica que la migración `004_grant_permissions_to_service_role.sql` se aplicó correctamente
2. Ejecuta manualmente:
   ```bash
   supabase db push
   ```

## 📊 Tablas de Supabase Utilizadas

El workflow n8n lee de estas tablas:

| Tabla | Descripción | Usado por |
|-------|-------------|-----------|
| `agent_decisions` | Decisiones de Agent 0 (Verse Researcher) | No usado directamente por n8n |
| `analytics_feedback` | Feedback de YouTube Analytics | Agent 9 (Analytics Monitor) |
| `generated_scripts` | Scripts generados por Agent 1 | **n8n workflow** (nodo AI VIRAL Master Scriptwriter) |

## 🔐 Seguridad

**IMPORTANTE:** El `SUPABASE_SERVICE_ROLE_KEY` es una credencial con permisos completos en la base de datos.

⚠️ **NUNCA** compartas esta clave públicamente
⚠️ **NUNCA** la subas a GitHub
⚠️ Úsala solo en entornos seguros (Railway, backend)

## 📝 Próximos Pasos

Después de configurar Railway:

1. ✅ Verificar que n8n puede leer scripts desde Supabase
2. ✅ Probar el flujo completo end-to-end
3. ✅ Configurar el trigger diario (Daily Trigger)
4. ✅ Monitorear logs en Railway para detectar errores

---

**Última actualización:** 2026-07-24
**Proyecto:** YouTube VIRAL Production - Rey Celestial
**Supabase Project:** qhlqrflccdgpslozzfyh
