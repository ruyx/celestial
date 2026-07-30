# 🎬 YouTube Video Production Pipeline - n8n Deployment

Este directorio contiene workflows de n8n para automatizar completamente la producción de videos de YouTube.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Prerrequisitos](#prerrequisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Monitoreo](#monitoreo)
- [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General

### Pipeline Completo

El workflow `youtube-video-production-pipeline.json` orquesta **9 agentes especializados** + **7 guardianes de calidad**:

```
HTTP Trigger
    ↓
┌───────────────────────────────────────────────────────┐
│ FASE 1: INVESTIGACIÓN Y GUIÓN                         │
├───────────────────────────────────────────────────────┤
│ 1. Agent 0: Verse Researcher                          │
│    → Investiga versículo, determina categoría viral   │
│ 2. Agent 1: Viral Scriptwriter                        │
│    → Genera guión optimizado para retención           │
└───────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────┐
│ FASE 2: GENERACIÓN DE IMÁGENES                        │
├───────────────────────────────────────────────────────┤
│ 3. Agent 2: Image Designer PRO                        │
│    → Diseña prompts visuales cinematográficos         │
│ 4. Agent 3: Batch Generator                           │
│    → Organiza escenas en batches                      │
│ 5. Agent 4: Generate Images (Flux Pro 1.1)            │
│    → Genera imágenes de alta calidad                  │
│ 6. Guardian Images ✓                                  │
│    → Valida calidad de imágenes                       │
└───────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────┐
│ FASE 3: ANIMACIÓN Y AUDIO                             │
├───────────────────────────────────────────────────────┤
│ 7. Agent 5: Video Animator                            │
│    → Genera clips de video desde imágenes             │
│ 8. Guardian Videos ✓                                  │
│    → Valida duración y calidad                        │
│ 9. Agent 6: Audio Voice-Over (ElevenLabs)             │
│    → Genera narración profesional                     │
│10. Guardian Audio ✓                                   │
│    → Valida sincronización y calidad                  │
└───────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────┐
│ FASE 4: EDICIÓN Y OPTIMIZACIÓN                        │
├───────────────────────────────────────────────────────┤
│11. Agent 7: Video Editor (FFmpeg)                     │
│    → Ensambla video final con música                  │
│12. Guardian Final Video ✓                             │
│    → Valida video completo antes de upload            │
│13. Agent 8: YouTube SEO Expert                        │
│    → Optimiza título, descripción, tags               │
└───────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────┐
│ FASE 5: THUMBNAIL Y PUBLICACIÓN                       │
├───────────────────────────────────────────────────────┤
│14. Agent 9: Thumbnail Generator HARDENED              │
│    → Genera thumbnail con retry y validaciones        │
│15. Magnific API: Base Image (Recraft V4.1)            │
│    → Imagen base sin texto                            │
│16. Sharp: Text Overlay                                │
│    → Composición de texto programático                 │
│17. Guardian Thumbnail ✓                               │
│    → Valida thumbnail final                           │
│18. Upload to YouTube                                  │
│    → Publica video + thumbnail                        │
│19. Guardian Upload ✓                                  │
│    → Verifica publicación exitosa                     │
└───────────────────────────────────────────────────────┘
    ↓
Success Notification ✅
```

### Características del Sistema

#### 🛡️ **Production-Hardened**
- **Retry automático** con exponential backoff (3 intentos por defecto)
- **Validación de inputs** antes de cada paso
- **Error recovery** automático
- **Timeouts configurables** para evitar bloqueos
- **Health checks** integrados

#### 📊 **Logging Completo**
- Logs estructurados en JSON
- Logs en consola con emojis
- Métricas de performance por paso
- Session tracking con IDs únicos

#### 🔒 **Guardianes de Calidad**
- **7 guardianes** validan cada fase crítica
- Validación de calidad de imágenes
- Validación de duración de videos/audio
- Validación de thumbnail final
- Verificación de upload exitoso

---

## 🔧 Prerrequisitos

### 1. n8n Instalado

**Opción A: Docker (recomendado)**
```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:latest
```

**Opción B: npm**
```bash
npm install -g n8n
```

### 2. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Magnific API
MAGNIFIC_API_URL=https://api.magnific.ai
MAGNIFIC_API_KEY=your_magnific_api_key_here

# OpenRouter (para Flux Pro 1.1)
OPENROUTER_API_KEY=your_openrouter_key_here

# ElevenLabs (para TTS)
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# YouTube API
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Agent 9 Configuration (opcional)
AGENT9_MAX_RETRIES=3
AGENT9_RETRY_DELAY=2000
AGENT9_BACKOFF_FACTOR=2
AGENT9_DOWNLOAD_TIMEOUT=120000
AGENT9_COMPOSE_TIMEOUT=30000
AGENT9_METRICS=true
AGENT9_JSON_LOGS=true
```

### 3. Dependencias Node.js

```bash
cd /home/suario/ruy-projects/project-yt
npm install
```

---

## 📥 Instalación

### Paso 1: Importar Workflow a n8n

1. **Abrir n8n** en tu navegador: `http://localhost:5678`

2. **Ir a Workflows** → Click en "+" → **Import from File**

3. **Seleccionar** el archivo:
   ```
   /home/suario/ruy-projects/project-yt/n8n-workflows/youtube-video-production-pipeline.json
   ```

4. **Activar** el workflow (toggle en la esquina superior derecha)

### Paso 2: Configurar Variables de Entorno en n8n

**Opción A: Via UI**
1. Settings → Variables
2. Agregar cada variable del `.env`

**Opción B: Via archivo (Docker)**
```bash
# Editar docker-compose.yml
environment:
  - MAGNIFIC_API_URL=https://api.magnific.ai
  - MAGNIFIC_API_KEY=sk_...
  # ... resto de variables
```

### Paso 3: Verificar Permisos

```bash
# Hacer ejecutables todos los agentes
chmod +x /home/suario/ruy-projects/project-yt/agents/*.js
chmod +x /home/suario/ruy-projects/project-yt/*.sh
```

---

## ⚙️ Configuración

### Health Check del Sistema

Verificar que Agent 9 está correctamente configurado:

```bash
cd /home/suario/ruy-projects/project-yt
node agents/agent-9-thumbnail-generator-production.js --health
```

**Output esperado:**
```
🏥 HEALTH CHECK

✅ Directories: OK
✅ compose-thumbnail.js: OK
✅ sharp module: OK
```

### Test Manual de Agent 9

```bash
# Generar thumbnail de prueba
node agents/agent-9-thumbnail-generator-production.js "Salmos 23:1"
```

**Debe generar:**
- `output/thumbnails/prompt-base-Salmos-23-1.txt`
- Logs en `logs/agent-9/session-*.json`

---

## 🚀 Uso

### Método 1: Trigger HTTP (Recomendado)

Enviar POST request al webhook de n8n:

```bash
curl -X POST http://localhost:5678/webhook/youtube-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "verse": "Isaías 41:10",
    "maxRetries": 3
  }'
```

**Response exitoso:**
```json
{
  "success": true,
  "verse": "Isaías 41:10",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "title": "Isaías 41:10 | No Temas Porque Yo Estoy Contigo",
  "uploadedAt": "2026-07-30T12:00:00.000Z"
}
```

### Método 2: Trigger desde n8n UI

1. Abrir el workflow en n8n
2. Click en "Execute Workflow"
3. Modificar el JSON de entrada:
   ```json
   {
     "verse": "Filipenses 4:13"
   }
   ```
4. Click "Execute"

### Método 3: Schedule Automático

Agregar nodo **Schedule Trigger** al inicio del workflow:

```
Schedule Trigger
  ↓
Random Verse Selector (Function)
  ↓
[resto del pipeline]
```

**Configuración del Schedule:**
- **Frequency:** Daily
- **Time:** 06:00 AM (para publicar a las 12:00 PM)
- **Timezone:** America/Mexico_City

---

## 📊 Monitoreo

### Logs en Tiempo Real

**Desde n8n UI:**
1. Workflows → YouTube Production Pipeline
2. Tab "Executions"
3. Click en cualquier ejecución para ver logs detallados

**Desde filesystem:**
```bash
# Logs de Agent 9
tail -f /home/suario/ruy-projects/project-yt/logs/agent-9/session-*.json

# Logs de todos los agentes
tail -f /home/suario/ruy-projects/project-yt/logs/agent-*/session-*.json
```

### Métricas de Performance

Los logs JSON incluyen métricas por paso:

```json
{
  "sessionId": "agent9-1722355200000",
  "verse": "Salmos 23:1",
  "durationMs": 15342,
  "totalLogs": 24,
  "errorCount": 0,
  "warningCount": 1,
  "logs": [...]
}
```

### Dashboard de n8n

n8n provee métricas automáticas:
- **Success rate** por workflow
- **Average execution time**
- **Failed executions** con stack traces

---

## 🐛 Troubleshooting

### Problema 1: Agent 9 falla con "Metadata no encontrada"

**Causa:** Agent 8 (YouTube SEO Expert) no se ejecutó primero.

**Solución:**
```bash
# Ejecutar Agent 8 manualmente
node agents/agent-8-youtube-seo-expert.js "Salmos 23:1"

# Verificar que generó el archivo
ls -la output/youtube-metadata/youtube-metadata-Salmos-23-1.json
```

### Problema 2: Timeout descargando imagen de Magnific

**Causa:** Red lenta o imagen muy grande.

**Solución:** Aumentar timeout en variables de entorno:
```bash
export AGENT9_DOWNLOAD_TIMEOUT=300000  # 5 minutos
```

### Problema 3: "Categoría inválida" warning

**Causa:** Metadata tiene categoría no reconocida.

**Comportamiento:** Agent 9 hace **fallback automático** a "consuelo".

**Para desactivar fallback:**
```bash
# Editar agent-9-thumbnail-generator-production.js
FALLBACK_TO_DEFAULT_CATEGORY: false
```

### Problema 4: Thumbnail composition falla

**Causa:** `compose-thumbnail.js` no encuentra la imagen base.

**Solución:**
```bash
# Verificar que la imagen base existe
ls -la output/thumbnails/base-*.png

# Ejecutar compose manualmente para debugging
node compose-thumbnail.js "Salmos 23:1"
```

### Problema 5: n8n no puede ejecutar comandos

**Causa:** Permisos o PATH incorrectos.

**Solución:**
```bash
# Verificar permisos
chmod +x agents/*.js

# Verificar PATH en n8n
# Settings → Variables → PATH=/usr/local/bin:/usr/bin:/bin
```

---

## 📈 Optimizaciones de Producción

### 1. Paralelización

Modificar el workflow para ejecutar pasos independientes en paralelo:

```
┌─ Agent 4: Images ─┐
│                    ├─→ Agent 5: Videos
└─ Agent 6: Audio ──┘
```

### 2. Caching

Agregar nodo **Cache** para evitar regenerar componentes:

```javascript
// Cache de prompts de Agent 2
const cacheKey = `prompts-${verse}`;
const cached = await $cache.get(cacheKey);

if (cached) {
  return cached;
} else {
  const result = generatePrompts(verse);
  await $cache.set(cacheKey, result, 3600); // 1 hora
  return result;
}
```

### 3. Queue System

Para procesamiento masivo, usar **Bull Queue**:

```bash
# Instalar Bull
npm install bull

# Agregar al workflow
Queue Trigger → [pipeline] → Queue Complete
```

---

## 🔐 Seguridad

### Secrets Management

**NUNCA** hardcodear API keys en el workflow JSON.

**Usar:**
- n8n Environment Variables
- AWS Secrets Manager
- HashiCorp Vault

### Webhook Authentication

Agregar token de seguridad al HTTP Trigger:

```javascript
// En el nodo "Prepare Input"
const authToken = $input.item.json.headers['x-auth-token'];

if (authToken !== process.env.WEBHOOK_AUTH_TOKEN) {
  throw new Error('Unauthorized');
}
```

---

## 📚 Referencias

- [n8n Documentation](https://docs.n8n.io/)
- [Magnific API](https://docs.magnific.com/)
- [Agent 9 Production Code](../agents/agent-9-thumbnail-generator-production.js)
- [Compose Thumbnail Script](../compose-thumbnail.js)

---

## 🆘 Soporte

Para reportar issues con el pipeline:

1. Revisar logs en `logs/agent-9/`
2. Ejecutar health check: `--health`
3. Probar agent individualmente
4. Abrir issue con logs completos

---

**Versión:** 1.0.0
**Última actualización:** 2026-07-30
**Autor:** Sistema Autónomo de Producción de Videos
