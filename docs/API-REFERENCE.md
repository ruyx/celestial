# API Reference - Agent Server para n8n

## 🚀 Información General

**Base URL (Producción):** `http://10.254.80.29:3100`
**Servidor:** PM2 proceso `agent-server`
**Timeout máximo:** 40 minutos (endpoints de upload)
**Formato:** JSON

---

## 📋 Endpoints Disponibles

### 1. Guardian SEO + Agent 8
**Genera metadata SEO completa para YouTube**

```http
POST /guardian-seo
Content-Type: application/json

{
  "verse": "Proverbios 3:5-6"  // Opcional - usa último script de Supabase si se omite
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "verse": "Proverbios 3:5-6",
  "guardianSeoSuccess": true,
  "youtubeTitle": "Proverbios 3:5-6 | NECESITAS ESTO HOY",
  "youtubeDescription": "Proverbios 3:5-6 es una promesa...",
  "youtubeTags": [
    "versículos bíblicos",
    "biblia",
    "palabra de dios",
    // ... 22 tags más (25 total, <500 chars)
  ]
}
```

**Respuesta Error (500):**
```json
{
  "success": false,
  "verse": "Error message",
  "guardianSeoSuccess": false,
  "error": "Error details"
}
```

**Duración:** ~2-5 segundos
**Reintentos:** Hasta 3 intentos automáticos
**Output:** `output/youtube-metadata/youtube-metadata-{verse}.json`

---

### 2. Guardian Thumbnail + Agent 9
**Genera thumbnail y sube a YouTube**

```http
POST /guardian-thumbnail
Content-Type: application/json

{
  "verse": "Proverbios 3:5-6",    // Opcional - usa último script
  "videoId": "pbhSzjVxbHo"        // Opcional - para subir a YouTube
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "verse": "Proverbios 3:5-6",
  "guardianThumbnailSuccess": true,
  "thumbnailUpdated": true,
  "productionVersion": true
}
```

**Respuesta Sin videoId (200):**
```json
{
  "success": false,
  "verse": "Proverbios 3:5-6",
  "guardianThumbnailSuccess": false,
  "thumbnailSkipped": true
}
```

**Respuesta Error (500):**
```json
{
  "success": false,
  "verse": "Proverbios 3:5-6",
  "guardianThumbnailSuccess": false,
  "thumbnailError": "Error details"
}
```

**Duración:** ~3-15 segundos (generación) + upload a YouTube
**Reintentos:** Hasta 3 intentos automáticos
**Output:** `output/thumbnails/thumbnail-{verse}.jpg` (1344x768, ~300KB)

---

### 3. Guardian Upload + YouTube Upload
**Sube video completo a YouTube**

```http
POST /guardian-upload
Content-Type: application/json

{
  "verse": "Proverbios 3:5-6"  // Opcional - usa último script
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "verse": "Proverbios 3:5-6",
  "guardianUploadSuccess": true,
  "videoId": "pbhSzjVxbHo",
  "videoUrl": "https://youtube.com/watch?v=pbhSzjVxbHo"
}
```

**Respuesta Error (500):**
```json
{
  "success": false,
  "verse": "Error message",
  "guardianUploadSuccess": false,
  "error": "Command failed: node agents/guardian-upload.js..."
}
```

**Duración:** ~5-40 minutos (depende del tamaño del video)
**Reintentos:** Hasta 3 intentos automáticos
**Requisitos:**
- Video final debe existir en `output/final-videos/final-{verse}.mp4`
- Metadata SEO debe existir (ejecutar `/guardian-seo` primero)
- Credenciales de YouTube válidas

**Output:** `output/youtube-metadata/upload-result-{verse}.json`

---

## 🔄 Flujo Completo End-to-End

### Opción 1: Workflow Secuencial (Recomendado para n8n)

```
1. POST /guardian-seo
   ↓ (esperar success: true)
2. POST /guardian-upload
   ↓ (esperar success: true, obtener videoId)
3. POST /guardian-thumbnail
   ↓ (pasar videoId)
   ✅ Video completo en YouTube con thumbnail
```

### Opción 2: Workflow Paralelo (Más rápido)

```
1. POST /guardian-seo ─────┐
                           ├─→ 3. POST /guardian-upload
                           │        ↓ (obtener videoId)
2. Generar video final ────┘        ↓
                                    4. POST /guardian-thumbnail
                                       ↓ (pasar videoId)
                                       ✅ Completo
```

---

## 🛡️ Sistema de Guardians

Todos los endpoints usan **Guardians** que:
- ✅ Validan salida antes de responder
- ✅ Reintentan automáticamente hasta 3 veces
- ✅ Aplican backoff exponencial (2s, 4s, 8s)
- ✅ Reportan errores detallados
- ✅ Guardan logs estructurados

---

## 📊 Variables de Entorno Requeridas

```bash
SUPABASE_URL=https://qhlqrflccdgpslozzfyh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...
```

**Ubicación:** `/home/desarrollo/project-yt/.env`
**Carga:** Automática via `dotenv.config()` en agent-server.js

---

## 🧪 Testing con cURL

### Probar Guardian SEO:
```bash
curl -X POST http://10.254.80.29:3100/guardian-seo \
  -H "Content-Type: application/json" \
  -d '{"verse": "Proverbios 3:5-6"}'
```

### Probar Guardian Thumbnail (sin videoId):
```bash
curl -X POST http://10.254.80.29:3100/guardian-thumbnail \
  -H "Content-Type: application/json" \
  -d '{"verse": "Filipenses 4:13"}'
```

### Probar Guardian Thumbnail (con videoId):
```bash
curl -X POST http://10.254.80.29:3100/guardian-thumbnail \
  -H "Content-Type: application/json" \
  -d '{"verse": "Proverbios 3:5-6", "videoId": "pbhSzjVxbHo"}'
```

---

## 📝 Estructura de Datos Supabase

### Tabla: `generated_scripts`

```sql
CREATE TABLE generated_scripts (
  id UUID PRIMARY KEY,
  verse_reference TEXT NOT NULL,
  category TEXT,
  metadata JSONB,
  scenes JSONB[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Índice recomendado:**
```sql
CREATE INDEX idx_scripts_created
ON generated_scripts(created_at DESC);
```

---

## 🔍 Troubleshooting

### Error: "supabaseUrl is required"
**Causa:** Variables de entorno no cargadas
**Solución:**
```bash
cd ~/project-yt
pm2 delete agent-server
pm2 start agent-server.js --name agent-server
```

### Error: "No verse found"
**Causa:** No hay scripts en Supabase y no se pasó `verse` en el body
**Solución:** Pasar `"verse": "Salmos 23:1"` en el JSON

### Error: "Command failed: node agents/guardian-*.js"
**Causa:** Guardian falló después de 3 reintentos
**Solución:** Revisar logs:
```bash
pm2 logs agent-server --lines 100
```

### Error: "EADDRINUSE: address already in use"
**Causa:** Puerto 3100 ocupado
**Solución:**
```bash
lsof -i :3100 -t | xargs kill -9
pm2 restart agent-server
```

---

## 📦 Archivos de Salida

### YouTube Metadata
```
output/youtube-metadata/
├── youtube-metadata-Proverbios-3-5-6.json  (6KB)
└── upload-result-Proverbios-3-5-6.json     (500B)
```

### Thumbnails
```
output/thumbnails/
└── thumbnail-Proverbios-3-5-6.jpg          (300KB, 1344x768)
```

### Videos Finales
```
output/final-videos/
├── final-Proverbios-3-5-6.mp4              (65-140MB)
└── final-Proverbios-3-5-6.json             (metadata)
```

---

## ⚡ Optimizaciones Aplicadas

### Agent-8 (YouTube SEO)
- ✅ Tags limitados a <500 caracteres totales
- ✅ 25 tags promedio (antes: 30 tags, 603 chars)
- ✅ Prioridad: broad > medium > long-tail > branded
- ✅ Duración: ~2 segundos

### Guardian Thumbnail
- ✅ Compositor Python V2 standalone
- ✅ Word wrapping automático (3 líneas)
- ✅ Área segura para texto
- ✅ Duración: ~3 segundos

---

## 🚦 Estado del Sistema

**Versión:** 1.0.0
**Última actualización:** 2026-07-31
**PM2 Status:**
```bash
pm2 status
# agent-server | online | 0% CPU | 54.6MB
```

**Health Check:**
```bash
curl http://10.254.80.29:3100/
# {"status":"ok","version":"1.0.0"}
```

---

## 📚 Referencias

- **agent-server.js**: `/home/desarrollo/project-yt/agent-server.js`
- **Guardians**: `/home/desarrollo/project-yt/agents/guardian-*.js`
- **Agent-8**: `/home/desarrollo/project-yt/agents/agent-8-youtube-seo-expert.js`
- **Agent-9**: `/home/desarrollo/project-yt/agents/agent-9-thumbnail-generator-production.js`
