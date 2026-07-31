# Guía de Integración n8n - YouTube Video Pipeline

## 🎯 Objetivo

Automatizar el pipeline completo de generación de videos para YouTube usando n8n como orquestador.

---

## 📋 Prerequisitos

1. **n8n instalado y corriendo**
2. **Agent-server en producción** (10.254.80.29:3100)
3. **Acceso a Supabase** con tabla `generated_scripts`
4. **Credenciales de YouTube** configuradas en `.env`

---

## 🚀 Instalación Rápida

### 1. Importar Workflow

1. Abrir n8n (`http://localhost:5678` o tu instancia)
2. Ir a **Workflows** → **Import from File**
3. Seleccionar `docs/N8N-WORKFLOW-EXAMPLE.json`
4. Click **Import**

### 2. Configurar Nodos

#### Nodo: "Start: Set Verse"
```
Tipo: Set
Acción: Set value
Campo: verse
Valor: "Proverbios 3:5-6"  // Cambia según necesites
```

#### Nodo: "1. Guardian SEO"
```
Tipo: HTTP Request
Método: POST
URL: http://10.254.80.29:3100/guardian-seo
Headers:
  Content-Type: application/json
Body:
  {
    "verse": "={{ $json.verse }}"
  }
Timeout: 30000 (30 segundos)
```

#### Nodo: "2. Guardian Upload"
```
Tipo: HTTP Request
Método: POST
URL: http://10.254.80.29:3100/guardian-upload
Headers:
  Content-Type: application/json
Body:
  {
    "verse": "={{ $node["1. Guardian SEO"].json.verse }}"
  }
Timeout: 2400000 (40 minutos)
```

#### Nodo: "3. Guardian Thumbnail"
```
Tipo: HTTP Request
Método: POST
URL: http://10.254.80.29:3100/guardian-thumbnail
Headers:
  Content-Type: application/json
Body:
  {
    "verse": "={{ $node["2. Guardian Upload"].json.verse }}",
    "videoId": "={{ $node["2. Guardian Upload"].json.videoId }}"
  }
Timeout: 900000 (15 minutos)
```

### 3. Configurar Notificaciones (Opcional)

#### Success Notification
```
Tipo: Slack / Email / Webhook
Mensaje:
  ✅ Video completo en YouTube!

  Versículo: {{ $node["2. Guardian Upload"].json.verse }}
  Video ID: {{ $node["2. Guardian Upload"].json.videoId }}
  URL: {{ $node["2. Guardian Upload"].json.videoUrl }}

  Título: {{ $node["1. Guardian SEO"].json.youtubeTitle }}
  Tags: {{ $node["1. Guardian SEO"].json.youtubeTags.length }} tags
  Thumbnail: {{ $json.thumbnailUpdated ? 'Subido ✅' : 'Pendiente ⏳' }}
```

#### Error Notification
```
Tipo: Slack / Email / Webhook
Mensaje:
  ❌ Error en pipeline

  Etapa: {{ $json.stage || 'Unknown' }}
  Versículo: {{ $json.verse || 'N/A' }}
  Error: {{ $json.error || 'Unknown error' }}
```

---

## 🔄 Flujos Alternativos

### Flujo 1: Trigger por Webhook

```json
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "youtube-pipeline",
        "responseMode": "lastNode",
        "httpMethod": "POST"
      }
    }
  ]
}
```

**Llamar con:**
```bash
curl -X POST http://localhost:5678/webhook/youtube-pipeline \
  -H "Content-Type: application/json" \
  -d '{"verse": "Salmos 23:1"}'
```

### Flujo 2: Trigger por Cron (Diario)

```json
{
  "nodes": [
    {
      "name": "Daily Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "hour": 9,
              "minute": 0
            }
          ]
        }
      }
    },
    {
      "name": "Get Random Verse from Supabase",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT verse_reference FROM generated_scripts WHERE created_at >= NOW() - INTERVAL '1 day' ORDER BY created_at DESC LIMIT 1"
      }
    }
  ]
}
```

### Flujo 3: Trigger por Supabase Realtime

```json
{
  "nodes": [
    {
      "name": "Supabase Realtime",
      "type": "n8n-nodes-base.supabaseTrigger",
      "parameters": {
        "table": "generated_scripts",
        "events": ["INSERT"]
      }
    },
    {
      "name": "Extract Verse",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "verse",
              "value": "={{ $json.record.verse_reference }}"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 📊 Monitoreo y Logs

### Ver Logs en PM2
```bash
# Logs completos
ssh desarrollo@10.254.80.29 'pm2 logs agent-server'

# Últimas 100 líneas
ssh desarrollo@10.254.80.29 'pm2 logs agent-server --lines 100'

# Solo errores
ssh desarrollo@10.254.80.29 'pm2 logs agent-server --err'
```

### Verificar Estado del Servidor
```bash
# PM2 status
ssh desarrollo@10.254.80.29 'pm2 status'

# Health check
curl http://10.254.80.29:3100/

# Test endpoint
curl -X POST http://10.254.80.29:3100/guardian-seo \
  -H "Content-Type: application/json" \
  -d '{"verse": "Proverbios 3:5-6"}'
```

---

## 🐛 Troubleshooting

### Error: "Timeout after 30000ms"

**Causa:** Guardian tarda más que el timeout configurado

**Solución:**
```javascript
// En n8n HTTP Request node
Options → Timeout: 2400000  // 40 minutos para upload
```

### Error: "Connection refused"

**Causa:** Agent-server no está corriendo

**Solución:**
```bash
ssh desarrollo@10.254.80.29
cd ~/project-yt
pm2 restart agent-server
```

### Error: "No verse found"

**Causa:** No hay scripts en Supabase y no se pasó `verse`

**Solución:**
1. Verificar que hay datos en Supabase:
   ```sql
   SELECT * FROM generated_scripts ORDER BY created_at DESC LIMIT 5;
   ```
2. O pasar `verse` explícitamente en el body

### Error: "Command failed: node agents/guardian-*.js"

**Causa:** Guardian falló después de 3 reintentos

**Solución:**
1. Revisar logs:
   ```bash
   ssh desarrollo@10.254.80.29 'pm2 logs agent-server --lines 200'
   ```
2. Verificar archivos necesarios:
   ```bash
   # Video metadata
   ls ~/project-yt/output/video-metadata/

   # Audio metadata
   ls ~/project-yt/output/audio-metadata/

   # Final video
   ls ~/project-yt/output/final-videos/
   ```

---

## 🎯 Mejores Prácticas

### 1. Manejo de Errores

```javascript
// En cada nodo HTTP Request, agregar:
{
  "continueOnFail": false,  // Detener workflow si falla
  "alwaysOutputData": true  // Enviar datos incluso si falla
}
```

### 2. Retry Logic

```javascript
// En cada nodo crítico:
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetween": 5000  // 5 segundos entre reintentos
}
```

### 3. Logs Estructurados

```javascript
// Agregar nodo "Function" antes de notificaciones:
{
  "name": "Format Log",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": `
      return items.map(item => ({
        json: {
          timestamp: new Date().toISOString(),
          workflow: 'youtube-pipeline',
          stage: item.json.stage || 'unknown',
          verse: item.json.verse,
          success: item.json.success,
          error: item.json.error,
          duration: item.json.duration
        }
      }));
    `
  }
}
```

### 4. Validación de Respuestas

```javascript
// Agregar nodo "IF" después de cada Guardian:
{
  "name": "Validate Response",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.success }}",
          "operation": "equal",
          "value2": true
        }
      ]
    }
  }
}
```

---

## 📈 Optimizaciones

### 1. Paralelización (Avanzado)

```
          ┌─→ Generate Thumbnail Base Image
          │
Start ────┼─→ Generate SEO Metadata
          │
          └─→ Generate Final Video
                    ↓
              Wait for All ────→ Upload to YouTube
```

### 2. Caching de Metadata

```javascript
// Nodo "Set" para cachear metadata SEO:
{
  "name": "Cache SEO",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "keepOnlySet": false,
    "values": {
      "string": [
        {
          "name": "cached_title",
          "value": "={{ $json.youtubeTitle }}"
        },
        {
          "name": "cached_tags",
          "value": "={{ JSON.stringify($json.youtubeTags) }}"
        }
      ]
    }
  }
}
```

---

## 📝 Checklist de Despliegue

- [ ] Agent-server corriendo en PM2
- [ ] Variables de entorno configuradas
- [ ] Conexión a Supabase verificada
- [ ] Credenciales de YouTube válidas
- [ ] n8n instalado y accesible
- [ ] Workflow importado
- [ ] Nodos configurados con URLs correctas
- [ ] Timeouts ajustados (30s SEO, 40min Upload, 15min Thumbnail)
- [ ] Notificaciones configuradas
- [ ] Test end-to-end completado

---

## 🎓 Recursos Adicionales

- **API Reference:** `docs/API-REFERENCE.md`
- **Workflow JSON:** `docs/N8N-WORKFLOW-EXAMPLE.json`
- **Agent Server:** `agent-server.js`
- **Guardians:** `agents/guardian-*.js`

---

## 📞 Soporte

**Logs del servidor:**
```bash
ssh desarrollo@10.254.80.29 'pm2 logs agent-server --lines 100'
```

**Estado del sistema:**
```bash
ssh desarrollo@10.254.80.29 'pm2 status && df -h && free -h'
```

**Reiniciar todo:**
```bash
ssh desarrollo@10.254.80.29 'cd ~/project-yt && pm2 restart agent-server'
```
