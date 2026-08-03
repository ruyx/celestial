# Integración de Deduplicación en n8n

## 📋 Objetivo

Modificar el workflow de n8n para que **ANTES** de ejecutar Agent 0, consulte el Guardian de Deduplicación y bloquee la ejecución si el versículo ya fue publicado.

## 🎯 Flujo Deseado

```
n8n Webhook Trigger
    ↓
🛡️ NUEVO: Guardian Deduplicación (HTTP Request)
    ↓
    ├─ HTTP 200 (No duplicado) → Continuar con Agent 0 ✅
    └─ HTTP 409 (Duplicado) → DETENER workflow ❌ + notificar
```

## 🔧 Configuración del Nodo Guardian

### Paso 1: Agregar nodo HTTP Request

**Posición:** Inmediatamente después del trigger, ANTES de Agent 0

**Configuración:**

| Campo | Valor |
|-------|-------|
| **Name** | `Guardian: Check Duplicate` |
| **Method** | `POST` |
| **URL** | `http://localhost:3100/guardian/deduplication` |
| **Authentication** | `None` |
| **Send Body** | `Yes` |
| **Body Content Type** | `JSON` |

**Body JSON:**
```json
{
  "verse": "{{$json.verse}}"
}
```

**Options → Ignore SSL Issues:** `No`

**Options → Response → Response Format:** `JSON`

### Paso 2: Configurar manejo de errores

En el nodo **Guardian: Check Duplicate**, ir a:
- **Settings (engranaje)** → **Continue On Fail:** `No`
- **Error Workflow:** (ninguno por ahora)

Esto asegura que si el guardian retorna HTTP 409, n8n detecta el error automáticamente.

### Paso 3: Agregar bifurcación (IF)

Después del nodo Guardian, agregar nodo **IF** con esta configuración:

| Campo | Valor |
|-------|-------|
| **Name** | `Is Duplicate?` |
| **Conditions** | |
| **Condition 1** | |
| - Value 1 | `{{$node["Guardian: Check Duplicate"].json.isDuplicate}}` |
| - Operation | `Equal` |
| - Value 2 | `true` |

**Salidas:**
- **true** → Ir a nodo "Stop + Notify Duplicate"
- **false** → Continuar con Agent 0

### Paso 4: Agregar nodo de detención para duplicados

**Configuración del nodo "Stop + Notify Duplicate":**

| Campo | Valor |
|-------|-------|
| **Name** | `Stop + Notify Duplicate` |
| **Type** | `Stop and Error` |
| **Error Message** | `Video duplicado: "{{$node["Guardian: Check Duplicate"].json.verse}}" ya fue publicado el {{$node["Guardian: Check Duplicate"].json.existingVideo.publishedAt}}` |

O alternativamente, usar un nodo **Send Email** o **Slack** para notificar:

```
Subject: ⚠️ Video Duplicado Bloqueado
Body:
El versículo "{{$node["Guardian: Check Duplicate"].json.verse}}"
ya fue publicado anteriormente.

YouTube URL: {{$node["Guardian: Check Duplicate"].json.existingVideo.youtubeUrl}}
Fecha de publicación: {{$node["Guardian: Check Duplicate"].json.existingVideo.publishedAt}}

El workflow fue detenido para evitar desperdiciar 300 créditos.
```

## 📊 Respuestas del Guardian

### HTTP 200 - Video NO duplicado (continuar)

```json
{
  "success": true,
  "isDuplicate": false,
  "verse": "Juan 3:16",
  "message": "Versículo \"Juan 3:16\" no está publicado - puede continuar"
}
```

**Acción:** Continuar con Agent 0

### HTTP 409 - Video duplicado (DETENER)

```json
{
  "success": false,
  "isDuplicate": true,
  "verse": "Romanos 8:28",
  "reason": "El versículo \"Romanos 8:28\" ya fue publicado",
  "existingVideo": {
    "verse": "Romanos 8:28",
    "youtubeId": "abc123xyz",
    "youtubeUrl": "https://youtube.com/watch?v=abc123xyz",
    "publishedAt": "2026-07-28T10:30:00.000Z"
  },
  "message": "El versículo \"Romanos 8:28\" ya fue publicado anteriormente"
}
```

**Acción:** DETENER workflow + notificar

### HTTP 500 - Error de base de datos (fail-open)

```json
{
  "success": false,
  "isDuplicate": null,
  "error": "Connection timeout"
}
```

**Acción esperada:** Continuar con Agent 0 (fail-open strategy)

**IMPORTANTE:** El guardian tiene estrategia fail-open. Si Supabase no responde o hay error de conexión, devuelve HTTP 200 para NO bloquear el pipeline por problemas temporales de infraestructura.

## 🧪 Pruebas Recomendadas

### Test 1: Versículo nuevo (flujo normal)

**Input:**
```json
{
  "verse": "Salmos 91:1"
}
```

**Resultado esperado:**
- Guardian retorna HTTP 200
- Workflow continúa con Agent 0
- Video se genera completamente
- Al finalizar, upload-to-youtube-v2.js registra el video en `published_videos`

### Test 2: Versículo ya publicado (Romanos 8:28)

**Input:**
```json
{
  "verse": "Romanos 8:28"
}
```

**Resultado esperado:**
- Guardian retorna HTTP 409
- IF detecta `isDuplicate: true`
- Workflow se detiene con mensaje de error
- NO se ejecuta Agent 0
- NO se desperdician 300 créditos

### Test 3: Base de datos no disponible (fail-open)

**Setup:** Detener Supabase temporalmente o configurar clave incorrecta

**Input:**
```json
{
  "verse": "Juan 3:16"
}
```

**Resultado esperado:**
- Guardian retorna HTTP 200 con `isDuplicate: false` (fail-open)
- Workflow continúa normalmente
- Se genera el video (el sistema asume que no hay duplicado si no puede verificar)

## 🎨 Diagrama Visual del Workflow

```
┌────────────────────────────────────────────────────────┐
│  Webhook Trigger: youtube-viral-manual                 │
│  (recibe: { "verse": "Salmos 23:1" })                 │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  🛡️ Guardian: Check Duplicate                          │
│  POST http://localhost:3100/guardian/deduplication     │
│  Body: { "verse": "{{$json.verse}}" }                 │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  IF: Is Duplicate?                                     │
│  Condition: isDuplicate == true                        │
└─────────┬──────────────────────┬───────────────────────┘
          │                      │
          │ true                 │ false
          ▼                      ▼
┌──────────────────────┐  ┌────────────────────────────┐
│ Stop + Notify        │  │ Agent 0: Verse Researcher  │
│ Duplicate            │  │ (flujo existente continúa) │
│                      │  └────────────┬───────────────┘
│ Error: "Video ya     │               │
│ publicado..."        │               ▼
└──────────────────────┘  ┌────────────────────────────┐
                          │ Agent 1-7: Pipeline normal │
                          └────────────────────────────┘
```

## 📁 Orden de Ejecución del Workflow Modificado

1. **Webhook Trigger** → Recibe `{ "verse": "..." }`
2. **🆕 Guardian: Check Duplicate** → Valida con Supabase
3. **🆕 IF: Is Duplicate?** → Bifurca según resultado
   - Si duplicado (409): → **Stop + Notify**
   - Si no duplicado (200): → **Agent 0**
4. **Agent 0** → Genera ideas (filtra publicados también)
5. **Agent 1** → Crea prompts
6. **Agent 2** → Genera imágenes
7. **Agent 3** → Crea metadata YouTube
8. **Agent 4** → Genera clips de video
9. **Agent 5** → Descarga clips
10. **Agent 6** → Ensambla video final
11. **Agent 7** → Sube a YouTube + **🆕 Registra en Supabase**

## 🔍 Debugging y Logs

### Ver logs del Guardian en el servidor

```bash
ssh xprinta
tail -f ~/project-yt/server.log | grep -E "(Guardian|deduplication)"
```

### Verificar si un versículo está en published_videos

```bash
# Desde el servidor
cd ~/project-yt
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://qhlqrflccdgpslozzfyh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase.from('published_videos').select('*').eq('verse', 'Romanos 8:28').then(r => console.log(JSON.stringify(r, null, 2)));
"
```

### Probar endpoint manualmente

```bash
# Desde tu máquina local
curl -X POST http://YOUR_SERVER_IP:3100/guardian/deduplication \
  -H "Content-Type: application/json" \
  -d '{"verse": "Romanos 8:28"}'
```

**Respuesta esperada si está publicado:**
```json
{
  "success": false,
  "isDuplicate": true,
  "verse": "Romanos 8:28",
  "reason": "El versículo \"Romanos 8:28\" ya fue publicado",
  "existingVideo": {
    "verse": "Romanos 8:28",
    "youtubeId": "...",
    "youtubeUrl": "...",
    "publishedAt": "..."
  }
}
```

## ⚠️ Consideraciones Importantes

### 1. Tabla published_videos debe existir

Antes de que el sistema funcione al 100%, la tabla `published_videos` debe estar creada en Supabase.

**Opciones para aplicar la migración:**

**OPCIÓN A - Supabase UI (más simple):**
1. Ir a: https://supabase.com/dashboard/project/qhlqrflccdgpslozzfyh/editor
2. Abrir SQL Editor
3. Copiar contenido de `supabase/migrations/20260729000001_create_published_videos_table.sql`
4. Pegar y ejecutar

**OPCIÓN B - n8n con nodo PostgreSQL:**
1. Crear workflow temporal en n8n
2. Agregar nodo PostgreSQL
3. Conectar a: `postgresql://postgres:[PASSWORD]@db.qhlqrflccdgpslozzfyh.supabase.co:5432/postgres`
4. Ejecutar SQL desde archivo de migración

**OPCIÓN C - Desde el servidor:**
```bash
ssh xprinta
cd ~/project-yt
node apply-migration.js
# Seguir instrucciones que imprime el script
```

### 2. Variables de entorno en n8n

El servidor agent-server.js necesita acceso a:
- `SUPABASE_URL` (ya configurada)
- `SUPABASE_SERVICE_ROLE_KEY` (ya configurada)

Verificar con:
```bash
ssh xprinta 'echo "SUPABASE_URL: $SUPABASE_URL"'
ssh xprinta 'echo "SUPABASE_SERVICE_KEY length: ${#SUPABASE_SERVICE_ROLE_KEY}"'
```

### 3. Estrategia Fail-Open

El sistema está diseñado para **NO bloquearse** si hay problemas de infraestructura:

- Si Supabase no responde → Guardian retorna HTTP 200 (asume que no hay duplicado)
- Si tabla no existe → upload-to-youtube-v2.js continúa sin registrar
- Si registro falla → video se sube igual a YouTube

**Rationale:** Preferimos generar un video duplicado ocasionalmente (si hay error de BD) que bloquear el pipeline completamente por problemas de infraestructura.

## 📊 Métricas de Éxito

Después de implementar, monitorear:

1. **Tasa de bloqueo:** ¿Cuántos workflows se detienen por duplicados?
2. **Ahorro de créditos:** 300 créditos x cada duplicado bloqueado
3. **Falsos negativos:** ¿Algún duplicado pasó porque el guardian falló?
4. **Tiempo de respuesta:** Latencia del endpoint /guardian/deduplication

## 🎯 Checklist de Implementación

- [ ] Agregar nodo "Guardian: Check Duplicate" después del trigger
- [ ] Configurar HTTP Request a localhost:3100/guardian/deduplication
- [ ] Agregar nodo IF para detectar duplicados
- [ ] Agregar nodo "Stop + Notify Duplicate" en rama true
- [ ] Conectar rama false a Agent 0 existente
- [ ] Aplicar migración SQL para crear tabla published_videos
- [ ] Probar con versículo nuevo (debe generar video completo)
- [ ] Probar con Romanos 8:28 (debe bloquearse)
- [ ] Verificar logs del servidor durante pruebas
- [ ] Calcular score de autonomía del sistema

## 📝 Notas Finales

Esta integración es el último paso para completar el sistema de deduplicación. Una vez implementada:

- ✅ El sistema **nunca** volverá a desperdiciar 300 créditos en duplicados
- ✅ La validación ocurre en **dos puntos**: Guardian (pre-ejecución) + Agent 0 (filtrado)
- ✅ El registro ocurre **automáticamente** después de cada upload exitoso
- ✅ El sistema es **robusto** con estrategia fail-open ante errores de BD
- ✅ El workflow es **100% autónomo** una vez configurado

**Próximo paso:** Probar end-to-end con un versículo ya publicado para validar el bloqueo.
