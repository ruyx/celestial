# 👼 Guardian Agents - Sistema de Protección

Los Guardian Agents son agentes protectores que monitorean y garantizan la completitud de los assets generados en el pipeline de producción de videos. Implementan loops de retry con estrategias adaptativas para manejar errores comunes.

## 📋 Resumen

- **Image Guardian** (`guardian-images.js`): Protege la generación de imágenes
- **Video Guardian** (`guardian-videos.js`): Protege la generación de videos

Ambos implementan el mismo patrón de protección:
1. Loop de verificación hasta completitud o max reintentos
2. Clasificación inteligente de errores
3. Estrategias de retry adaptativas según tipo de error
4. Backoff exponencial
5. Timeout global
6. Logging detallado

---

## 👼 Image Guardian

### Propósito

Garantizar que **todas las imágenes esperadas se generen correctamente** antes de proceder con la generación de videos.

### Problemas que Resuelve

- ❌ Prompts bloqueados por moderación
- ❌ Límites de API (rate limits, cuotas)
- ❌ Errores de descarga de imágenes
- ❌ URLs faltantes o identificadores vacíos
- ❌ Timeouts en la generación

### Uso

```bash
# Verificar imágenes de un versículo
node agents/guardian-images.js "Isaías 41:10"
```

### Funcionamiento

1. **Carga metadata** de imágenes desde `output/image-metadata/`
2. **Valida completitud**: verifica `status`, `url`, `identifier` de cada imagen
3. **Clasifica errores** en 7 tipos diferentes
4. **Ejecuta estrategia de retry** adaptativa
5. **Aplica backoff exponencial**: 2s → 4s → 8s → 16s → 32s → max 60s
6. **Timeout global**: 10 minutos máximo
7. **Max reintentos**: 5 intentos

### Estrategias de Retry

| Tipo de Error | Acción | Wait Multiplier |
|---------------|--------|-----------------|
| **Moderation block (100%)** | 🛑 DETENER | N/A |
| **API limits** | ⏳ Esperar más tiempo | 2x |
| **Download failed** | ↻ Reintentar rápido | 0.5x |
| **Otros** | ↻ Reintentar estándar | 1x |

### Estructura de Validación

```javascript
{
  "sceneId": 1,
  "type": "hook",
  "identifier": "jSrHGjWLD0",        // ✅ Debe existir
  "url": "https://...",             // ✅ Debe existir y no estar vacío
  "status": "completed",            // ✅ Debe ser "completed"
  "error": null                     // ✅ No debe tener errores
}
```

### Output

#### ✅ Éxito
```
╔══════════════════════════════════════════════════════════╗
║               ✅ GUARDIAN: ÉXITO                         ║
╚══════════════════════════════════════════════════════════╝

📊 Estadísticas:
   - Duración: 15.42s
   - Reintentos: 2
   - Imágenes completadas: 5

📁 Metadata guardada en:
   /home/suario/ruy-projects/project-yt/output/image-metadata
```

#### ❌ Fallo
```
╔══════════════════════════════════════════════════════════╗
║               ❌ GUARDIAN: FALLO                         ║
╚══════════════════════════════════════════════════════════╝

💥 Error: 🚫 DETENIDO: Todas las imágenes bloqueadas por moderación

📊 Log de errores:
   Intento 1:
   - Timestamp: 2026-07-24T13:20:00.000Z
   - Imágenes faltantes: 3
   - Errores críticos: 3
```

---

## 🎬 Video Guardian

### Propósito

Garantizar que **todos los clips de video se generen correctamente** antes de proceder con el ensamblaje final.

### Problemas que Resuelve (CRÍTICOS)

- 🚫 **Moderación**: Seedance y Google Veo bloquean contenido religioso
- ❌ Límites de API (más estrictos que imágenes)
- ❌ Errores de descarga de videos
- ❌ URLs/identifiers faltantes
- ❌ Duración incorrecta (mismatch)
- ❌ Parámetros de Magnific inválidos

### Uso

```bash
# Verificar videos de un versículo
node agents/guardian-videos.js "Salmos 23:1"
```

### Funcionamiento

1. **Carga metadata** de videos desde `output/video-metadata/`
2. **Valida completitud**: verifica `status`, `videoUrl`, `creationIdentifier`, `duration`
3. **Clasifica errores** en 9 tipos diferentes
4. **Ejecuta estrategia de retry** adaptativa
5. **Aplica backoff exponencial**: 2s → 4s → 8s → 16s → 32s → max 60s
6. **Timeout global**: 15 minutos máximo (más que imágenes)
7. **Max reintentos**: 5 intentos

### Estrategias de Retry

| Tipo de Error | Acción | Wait Multiplier |
|---------------|--------|-----------------|
| **Moderation block (100%)** | 🛑 DETENER | N/A |
| **Moderation block (>50%)** | ⚠️ Advertir + continuar | 1x |
| **API limits** | ⏳ Esperar mucho más | 3x |
| **Download failed** | ↻ Reintentar moderado | 1.5x |
| **Missing URL/identifier** | ⏳ Esperar generación | 2x |
| **Otros** | ↻ Reintentar estándar | 1x |

### Estructura de Validación

```javascript
{
  "clipId": 1,
  "sceneId": 1,
  "sceneType": "hook",
  "duration": 5,                           // ✅ Debe existir
  "actualDuration": 5.09,                  // ✅ Debe estar cerca de duration
  "creationIdentifier": "ubC7iGHQLD",      // ✅ Debe existir
  "videoUrl": "https://...",               // ✅ Debe existir
  "status": "completed",                   // ✅ Debe ser "completed"
  "magnificParams": {                      // ✅ Debe tener slug
    "slug": "bytedance-seedance-pro-2.0"
  },
  "error": null                            // ✅ No debe tener errores
}
```

### Output

#### ✅ Éxito
```
╔══════════════════════════════════════════════════════════╗
║               ✅ GUARDIAN: ÉXITO                         ║
╚══════════════════════════════════════════════════════════╝

📊 Estadísticas:
   - Duración: 245.12s
   - Reintentos: 3
   - Videos completados: 10
   - Duración total: 120s

📁 Metadata guardada en:
   /home/suario/ruy-projects/project-yt/output/video-metadata
```

#### ❌ Fallo con Moderación
```
╔══════════════════════════════════════════════════════════╗
║               ❌ GUARDIAN: FALLO                         ║
╚══════════════════════════════════════════════════════════╝

💥 Error: 🚫 DETENIDO: Todos los videos bloqueados por moderación.
Requiere intervención manual para ajustar prompts o cambiar modelo
(usar Pikaso API en lugar de Seedance/Veo).

📊 Log de errores:
   Intento 1:
   - Timestamp: 2026-07-24T13:45:00.000Z
   - Videos faltantes: 6
   - Errores críticos: 6
   ⚠️  Bloques por moderación: 6
```

---

## 🔧 Integración con n8n

Los Guardians están diseñados para integrarse en el workflow de n8n como pasos de verificación:

### Workflow Recomendado

```
┌─────────────────────────────────────────────────┐
│ Agent 0: Verse Researcher                      │
│ → Selecciona versículo                         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent 1: Scriptwriter                          │
│ → Genera guión                                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent 4: Magnific API (Imágenes)               │
│ → Genera 5 imágenes                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 👼 GUARDIAN: Images                             │
│ → Verifica completitud                         │
│ → Reintenta si faltan                          │
│ → ❌ STOP si 100% moderación                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent 5: Video Animator                        │
│ → Genera 10 clips de video                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 👼 GUARDIAN: Videos                             │
│ → Verifica completitud                         │
│ → Reintenta si faltan                          │
│ → ❌ STOP si 100% moderación                   │
│ → ⚠️ WARN si >50% moderación                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent 6: Audio/TTS                             │
│ → Genera voiceover                             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Agent 7: Video Editor                          │
│ → Ensambla video final                         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Upload to YouTube                               │
│ → Publica video                                 │
└─────────────────────────────────────────────────┘
```

### Comando n8n

```bash
# En n8n, usar Execute Command node
node /path/to/guardian-images.js "{{$json.verse}}"
```

### Manejo de Errores en n8n

```javascript
// Si Guardian falla (exit code 1)
// → Activar flujo de notificación
// → Loguear en base de datos
// → Intentar versículo alternativo

if (exitCode === 1) {
  // Leer error log
  const errorLog = JSON.parse(fs.readFileSync('...'));

  // Si 100% moderación → cambiar modelo o versículo
  if (errorLog.errors.byType.moderation_block === errorLog.errors.totalErrors) {
    // Opción 1: Cambiar a Pikaso API
    // Opción 2: Seleccionar otro versículo
  }
}
```

---

## 📊 Clasificación de Errores

### Image Guardian

| Error Type | Descripción | Ejemplo |
|------------|-------------|---------|
| `moderation_block` | Prompt bloqueado por filtros de contenido | "Safety filter triggered" |
| `api_limit` | Rate limit o cuota excedida | "Rate limit exceeded" |
| `download_failed` | Error descargando imagen generada | "Failed to fetch URL" |
| `timeout` | Generación excedió tiempo límite | "Request timeout" |
| `invalid_prompt` | Prompt inválido o mal formado | "Invalid prompt structure" |
| `missing_url` | URL de imagen faltante | `url === ""` |
| `unknown` | Error no clasificado | Otros errores |

### Video Guardian

| Error Type | Descripción | Ejemplo |
|------------|-------------|---------|
| `moderation_block` | Video bloqueado por filtros (MUY COMÚN) | "Moderation rules violation" |
| `api_limit` | Rate limit o cuota excedida | "Quota exceeded" |
| `download_failed` | Error descargando video generado | "Download failed" |
| `timeout` | Generación excedió tiempo límite | "Generation timeout" |
| `invalid_params` | Parámetros de Magnific inválidos | `magnificParams.slug` faltante |
| `missing_url` | URL de video faltante | `videoUrl === ""` |
| `missing_identifier` | Identifier faltante | `creationIdentifier === ""` |
| `duration_mismatch` | Duración no coincide con esperada | `abs(duration - actualDuration) > 2s` |
| `unknown` | Error no clasificado | Otros errores |

---

## ⚙️ Configuración

### Parámetros Ajustables

#### Image Guardian

```javascript
const MAX_RETRIES = 5;           // Máximo de reintentos
const BASE_DELAY_MS = 2000;      // Delay base en ms
const MAX_DELAY_MS = 60000;      // Delay máximo en ms
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos
```

#### Video Guardian

```javascript
const MAX_RETRIES = 5;           // Máximo de reintentos
const BASE_DELAY_MS = 2000;      // Delay base en ms
const MAX_DELAY_MS = 60000;      // Delay máximo en ms
const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos (videos tardan más)
```

### Backoff Exponencial

```
Intento 1: 2s  * 2^0 = 2s
Intento 2: 2s  * 2^1 = 4s
Intento 3: 2s  * 2^2 = 8s
Intento 4: 2s  * 2^3 = 16s
Intento 5: 2s  * 2^4 = 32s (max 60s)
```

Con wait multiplier:
- **API limits (images)**: 2x → 4s, 8s, 16s, 32s, 60s
- **API limits (videos)**: 3x → 6s, 12s, 24s, 48s, 60s
- **Download failed**: 0.5x → 1s, 2s, 4s, 8s, 16s

---

## 🚨 Caso Crítico: Moderación de Contenido Religioso

### Problema

Los modelos **Seedance Pro 2.0** y **Google Veo 3.1** bloquean contenido religioso:

```json
{
  "error": "Seedance blocked this request due to moderation rules",
  "clip": {
    "prompt": "Ancient leather-bound bible with worn edges...",
    "sceneType": "intro"
  }
}
```

### Detección

El Video Guardian detecta cuando **>50% de clips están bloqueados**:

```
⚠️  WARNING: Más del 50% de videos bloqueados por moderación.
   Considere cambiar a Pikaso API o ajustar prompts.
```

### Soluciones

1. **Cambiar modelo a Pikaso API** (no tiene restricciones religiosas)
2. **Ajustar prompts** para hacerlos menos explícitos
3. **Seleccionar otro versículo** con prompts diferentes

### Implementación

```javascript
// En agent-5-video-animator.js
if (moderationBlocksCount > totalClips / 2) {
  console.log('⚠️  Muchos bloques de moderación. Cambiando a Pikaso...');

  // Regenerar con Pikaso
  const pikasoClips = await regenerateWithPikaso(failedClips);
}
```

---

## 📝 Logs y Debugging

### Ubicación de Logs

```
output/
├── image-metadata/
│   └── images-metadata-{verse}-{timestamp}.json
└── video-metadata/
    └── video-batch-{verse}-{timestamp}.json
```

### Formato de Error Log

```json
{
  "attempt": 1,
  "timestamp": "2026-07-24T13:20:00.000Z",
  "missing": 3,
  "errors": {
    "byType": {
      "moderation_block": 2,
      "api_limit": 1,
      "download_failed": 0,
      "timeout": 0,
      "invalid_prompt": 0,
      "missing_url": 0,
      "unknown": 0
    },
    "totalErrors": 3,
    "criticalErrors": 3
  }
}
```

### Debug Mode

Para activar logs detallados:

```bash
# Agregar al código
const DEBUG = true;

if (DEBUG) {
  console.log('🐛 Debug: Metadata cargada:', metadata);
  console.log('🐛 Debug: Validación:', validation);
  console.log('🐛 Debug: Estrategia:', strategy);
}
```

---

## 🔮 Mejoras Futuras

### TODO: Integración con Agentes

Actualmente los Guardians solo **validan** y **reportan**. Falta integración para **regenerar automáticamente**:

```javascript
// En guardian-images.js, línea 320
async executeRetry(missing, strategy) {
  // TODO: Integrar con Agent 4 (Magnific API)
  const agent4 = require('./agent-4-magnific-api.js');
  await agent4.regenerateImages(this.verse, missing);
}
```

```javascript
// En guardian-videos.js, línea 360
async executeRetry(missing, strategy) {
  // TODO: Integrar con Agent 5 (Video Animator)
  const agent5 = require('./agent-5-video-animator.js');
  await agent5.regenerateVideos(this.verse, missing);
}
```

### TODO: Notificaciones

Agregar notificaciones cuando se requiere intervención manual:

```javascript
// Enviar email/Slack cuando:
// - 100% moderación (requiere cambio de modelo)
// - Max reintentos alcanzados
// - Timeout global excedido
```

### TODO: Métricas

Guardar métricas de éxito/fallo para análisis:

```javascript
{
  "verse": "Isaías 41:10",
  "guardian": "images",
  "success": false,
  "attempts": 5,
  "duration": 620000,
  "errorTypes": ["moderation_block"],
  "timestamp": "2026-07-24T13:20:00.000Z"
}
```

---

## 📚 Referencias

- Agentes relacionados:
  - `agent-4-magnific-api.js`: Generación de imágenes
  - `agent-5-video-animator.js`: Generación de videos
  - `agent-7-video-editor.js`: Ensamblaje final

- Metadata:
  - `output/image-metadata/`: Metadata de imágenes
  - `output/video-metadata/`: Metadata de videos

- Documentación:
  - Magnific MCP: Modelos y parámetros de generación
  - n8n Workflows: Integración en automatización

---

## 🎯 Conclusión

Los Guardian Agents proporcionan una capa de **protección robusta** para el pipeline de producción de videos, manejando automáticamente errores comunes y aplicando estrategias de retry inteligentes.

**Beneficios clave:**
- ✅ Recuperación automática de errores transitorios
- ✅ Detección temprana de problemas críticos (moderación)
- ✅ Logging detallado para debugging
- ✅ Reducción de intervención manual
- ✅ Pipeline más confiable y resiliente

**Próximos pasos:**
1. Integrar regeneración automática con Agent 4 y Agent 5
2. Implementar notificaciones para intervención manual
3. Agregar métricas de éxito/fallo
4. Testear con múltiples versículos
