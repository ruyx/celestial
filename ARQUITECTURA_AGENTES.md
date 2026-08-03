# 🤖 Arquitectura Multi-Agente - Sistema de Producción de Videos Bíblicos

## 📋 Principios de Diseño

### 1. **No Hardcodear Instrucciones**
- ✅ Las instrucciones fluyen entre agentes vía archivos JSON
- ✅ Cada agente lee decisiones del agente anterior
- ✅ Prompts dinámicos basados en metadata, no valores fijos
- ❌ NUNCA hardcodear prompts de imagen/video directamente en código

### 2. **Separación de Responsabilidades**
- **Agent-0**: Metadata y decisiones estratégicas (OpenRouter - Modelo Gratuito)
- **Agent-1**: Generación de guion viral
- **Agent-2**: Diseño visual cinematográfico
- **Agent-3**: Batch de prompts para generación
- **Agent-4**: Generación de imágenes (Magnific MCP)
- **Agent-5**: Generación de videos (Magnific MCP)
- **Agent-6**: Generación de audio TTS (Magnific MCP)
- **Guardians**: Validación de calidad post-generación

### 3. **Comunicación entre Agentes**
```
Agent-0 (decision.json)
    ↓
Agent-1 (script.json) → Lee: decision.json
    ↓
Agent-2 (visual-design.json) → Lee: decision.json + script.json
    ↓
Agent-3 (batch.json) → Lee: visual-design.json
    ↓
Agent-4 (images.json) → Lee: batch.json → Magnific MCP
    ↓
Agent-5 (videos.json) → Lee: images.json → Magnific MCP
    ↓
Agent-6 (audio.json) → Lee: script.json → Magnific MCP
```

---

## 🔄 Flujo de Datos Detallado

### Agent-0: Verse Researcher (Cerebro Estratégico)
**Archivo de salida**: `output/agent-0-decision.json`

**Responsabilidades**:
1. Selecciona versículo de base de datos Supabase
2. Genera metadata personalizada con IA (OpenRouter)
3. Crea **visualDescriptions** específicas con:
   - **PERSONAJE**: Quién está en la escena (pastor, madre, anciano, niño)
   - **ESCENARIO**: Dónde sucede (templo, casa, mercado, desierto)
   - **ACCIÓN**: Qué está haciendo (orando, caminando, leyendo)
   - **OBJETO SIMBÓLICO**: Qué representa el mensaje (cruz, biblia, báculo)

**Modelo IA**: `nvidia/nemotron-3-ultra-550b-a55b:free` (OpenRouter - 100% gratuito)

**Formato de visualDescriptions**:
```json
{
  "visualDescriptions": {
    "hook": "Joven pastor David de 16 años, túnica marrón, colina rocosa Belén al atardecer, sostiene báculo nudoso, mira a cámara con ojos serenos",
    "intro": "David rey, manto púrpura, trono cedro en palacio Jerusalén, escribiendo en rollo, lámpara aceite parpadea",
    "body": "Madre soltera moderna, cocina humilde madrugada, manos sosteniendo taza café, Biblia abierta en Salmo 23, oración silenciosa",
    "application": "Anciano 82 años, banco parque otoñal, alimenta palomas, niño comparte galleta, bendice con mano temblorosa",
    "cta": "Pastor beduino desierto Judea, keffiyeh roja, guía rebaño, levanta báculo señala horizonte dorado"
  }
}
```

**Prevención de Duplicados**: Consulta tabla `published_videos` en Supabase antes de generar.

---

### Agent-1: Viral Scriptwriter
**Archivo entrada**: `output/agent-0-decision.json`
**Archivo salida**: `output/scripts/script-{verse}-{timestamp}.json`

**Responsabilidades**:
1. Lee `customHook`, `historicalInsight`, `visualDescriptions` de Agent-0
2. Genera guion viral optimizado para YouTube Shorts (120s total)
3. Distribuye duración: hook (5s) → intro (25s) → body (45s) → application (25s) → cta (20s)
4. **NO inventa descripciones visuales nuevas**, usa las de Agent-0

**Estructura del guion**:
```json
{
  "metadata": {
    "verse": "Salmos 23:1",
    "category": "consuelo",
    "totalDuration": 120
  },
  "scenes": [
    {
      "id": "hook",
      "duration": 5,
      "voiceover": "¿Sabías que el rey que cuidaba ovejas declaró que Dios es SU pastor?",
      "visualDescription": "[Copiado EXACTO de Agent-0.visualDescriptions.hook]"
    }
  ]
}
```

---

### Agent-2: Image Designer PRO
**Archivo entrada**: `output/agent-0-decision.json`
**Archivo salida**: `output/image-prompts/visual-design-PRO-{verse}-{timestamp}.json`

**Responsabilidades**:
1. Lee `visualDescriptions` de Agent-0
2. Lee `category` (consuelo, fortaleza, sabiduría, etc.)
3. **Combina** visualDescription + CINEMATIC_PALETTES
4. Genera prompts cinematográficos finales

**Paletas Cinematográficas** (NO MODIFICAR - Son parte del diseño):
```javascript
const CINEMATIC_PALETTES = {
  'consuelo': {
    colorGrade: 'muted greens and soft blues, warm undertones',
    filmStock: '35mm Kodak Portra 400, visible grain',
    styleRef: 'Terrence Malick meets Days of Heaven',
    lighting: 'soft golden hour window light'
  },
  'fortaleza': {
    colorGrade: 'deep oranges and crimson reds, high contrast',
    filmStock: '35mm Kodak Vision3 500T',
    styleRef: 'Blade Runner 2049 meets Mad Max Fury Road',
    lighting: 'hard neon backlight with rim glow'
  }
  // ... más categorías
};
```

**Proceso de Composición**:
```javascript
const visualDesc = agent0Decision.visualDescriptions.hook;
const palette = CINEMATIC_PALETTES[category];

const finalPrompt = `${visualDesc}. ${palette.colorGrade}.
LIGHTING: ${palette.lighting}, cinematic volumetric lighting with god rays.
FILM: ${palette.filmStock}, cinematic grain texture.
STYLE: ${palette.styleRef}.
CAMERA: 35mm anamorphic lens, shallow depth of field f/2.8`;
```

---

### Agent-3: Batch Generator
**Archivo entrada**: `output/image-prompts/visual-design-PRO-*.json`
**Archivo salida**: `output/image-batches/batch-{verse}-{timestamp}.json`

**Responsabilidades**:
1. Agrupa prompts de imagen en batches de máximo 12 imágenes
2. Prepara estructura para generación paralela en Magnific MCP
3. Mantiene referencias a escenas y duración

---

### Agent-4: Magnific MCP - Image Generator
**Archivo entrada**: `output/image-batches/batch-*.json`
**Archivo salida**: `output/image-metadata/images-{verse}-{timestamp}.json`

**Tecnología**: Magnific MCP Tools
**Modelo de generación**: Se configura vía Magnific MCP (Flux, Ideogram, etc.)

**Proceso**:
1. Lee prompts finales del batch
2. Llama a `mcp__magnific__images_generate` con:
   ```javascript
   {
     prompt: finalPrompt,
     aspectRatio: "9:16", // YouTube Shorts
     count: 1,
     mode: "auto" // O modelo específico
   }
   ```
3. Espera con `mcp__magnific__creations_wait`
4. Guarda metadata con `creationIdentifier` de cada imagen

**Salida**:
```json
{
  "verse": "Salmos 23:1",
  "images": [
    {
      "sceneId": "hook",
      "creationIdentifier": "creation_abc123",
      "url": "https://pikaso.cdnpk.net/...",
      "prompt": "[prompt completo usado]"
    }
  ]
}
```

---

### Agent-5: Video Animator
**Archivo entrada**: `output/image-metadata/images-*.json`
**Archivo salida**: `output/video-metadata/videos-{verse}-{timestamp}.json`

**Tecnología**: Magnific MCP Tools
**Modelo**: Se configura vía Magnific MCP (Kling, Seedance, etc.)

**Proceso**:
1. Lee `creationIdentifier` de cada imagen generada
2. Llama a `mcp__magnific__video_generate` con:
   ```javascript
   {
     video: {
       clips: [{
         keyframes: {
           start: {
             type: "image",
             url: creationIdentifier // ← Identifier de Agent-4
           }
         },
         duration: 5, // De Agent-1 script
         prompt: voiceoverText
       }]
     }
   }
   ```
3. Espera generación con `mcp__magnific__creations_wait`
4. Concatena clips con `mcp__magnific__video_concatenate`

**Salida**:
```json
{
  "verse": "Salmos 23:1",
  "clips": [
    {
      "sceneId": "hook",
      "videoIdentifier": "creation_video_xyz",
      "duration": 5,
      "sourceImage": "creation_abc123"
    }
  ],
  "finalVideo": {
    "identifier": "creation_final_123",
    "url": "https://pikaso.cdnpk.net/final.mp4",
    "totalDuration": 120
  }
}
```

---

### Agent-6: Audio TTS Generator
**Archivo entrada**: `output/scripts/script-*.json`
**Archivo salida**: `output/audio-metadata/audio-{verse}-{timestamp}.json`

**Tecnología**: Magnific MCP Tools
**Voces**: ElevenLabs o Google via Magnific MCP

**Proceso**:
1. Lee `voiceover` de cada escena del script
2. Selecciona voz apropiada (de catálogo Magnific)
3. Llama a `mcp__magnific__audio_tts` con:
   ```javascript
   {
     text: voiceoverText,
     voiceId: selectedVoiceId, // De catálogo
     model: "eleven_v3" // O gemini_v2_5_pro
   }
   ```
4. Guarda `creationIdentifier` del audio generado

**Salida**:
```json
{
  "verse": "Salmos 23:1",
  "audioClips": [
    {
      "sceneId": "hook",
      "audioIdentifier": "creation_audio_abc",
      "url": "https://pikaso.cdnpk.net/audio.mp3",
      "text": "¿Sabías que el rey que cuidaba ovejas..."
    }
  ]
}
```

---

## 🛡️ Guardians (Validación de Calidad)

### Guardian-Images
- Verifica que todas las imágenes se generaron correctamente
- Valida que los `creationIdentifier` existen
- Reintenta generación si hay fallos

### Guardian-Videos
- Verifica concatenación exitosa
- Valida duración total (debe ser ~120s)
- Reintenta si hay corrupción

---

## 🔧 Configuración de Modelos

### OpenRouter (Solo Agent-0)
```javascript
// agents/agent-0-verse-researcher.js
{
  model: 'nvidia/nemotron-3-ultra-550b-a55b:free', // 100% gratuito
  apiKey: process.env.OPENROUTER_API_KEY
}
```

### Magnific MCP (Agents 4, 5, 6)
```javascript
// No se configura en código - se usa via MCP Tools
// La configuración está en el servidor MCP de Magnific
// Los agentes solo llaman a:
// - mcp__magnific__images_generate
// - mcp__magnific__video_generate
// - mcp__magnific__audio_tts
```

---

## 📁 Estructura de Archivos

```
output/
├── agent-0-decision.json              ← Decisión estratégica
├── scripts/
│   └── script-Salmos-23-1-*.json      ← Guion viral
├── image-prompts/
│   └── visual-design-PRO-*.json       ← Prompts cinematográficos
├── image-batches/
│   └── batch-*.json                   ← Batches para generación
├── image-metadata/
│   └── images-*.json                  ← IDs de imágenes generadas
├── video-metadata/
│   └── videos-*.json                  ← IDs de videos generados
└── audio-metadata/
    └── audio-*.json                   ← IDs de audio generado
```

---

## ⚙️ Variables de Entorno Requeridas

```bash
# OpenRouter (Agent-0 únicamente)
OPENROUTER_API_KEY=sk-or-...

# Supabase (Deduplicación y almacenamiento)
SUPABASE_URL=https://qhlqrflccdgpslozzfyh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# YouTube (Subida final)
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...

# Magnific MCP
# (Configurado en MCP server - no se necesita en .env)
```

---

## 🚀 Ejecución del Pipeline

```bash
# Pipeline completo con versículo específico
./run-full-pipeline.sh "Salmos 23:1"

# Pipeline completo con versículo aleatorio del repositorio
./run-full-pipeline.sh

# Solo Agent-0 (testing)
node agents/agent-0-verse-researcher.js "Juan 3:16"

# Solo Agent-1 (requiere Agent-0 previo)
node agents/agent-1-viral-scriptwriter.js "Juan 3:16"
```

---

## 📊 Scorecard de Autonomía

El sistema genera un scorecard JSON que mide:
- **Autonomía**: ¿Se ejecuta sin intervención manual?
- **Confiabilidad**: ¿Genera outputs válidos?
- **Recuperación**: ¿Reintenta en caso de fallos?
- **Logging**: ¿Genera logs detallados?

Archivo: `output/pipeline-scorecard-{timestamp}.json`

---

## 🔍 Debugging

### Ver estado de Agent-0:
```bash
cat output/agent-0-decision.json | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')), null, 2))"
```

### Ver visualDescriptions generadas:
```bash
node -e "const d = require('./output/agent-0-decision.json'); console.log(JSON.stringify(d.visualDescriptions, null, 2))"
```

### Verificar comunicación entre agentes:
```bash
# Verificar que Agent-1 lee de Agent-0
grep -A5 "agent-0-decision.json" agents/agent-1-viral-scriptwriter.js

# Verificar que Agent-2 lee de Agent-0
grep -A5 "agent-0-decision.json" agents/agent-2-image-designer-pro.js
```

---

## 📝 Checklist de Calidad

Antes de cada video generado, verificar:

- [ ] Agent-0 generó visualDescriptions con PERSONAJE + ESCENARIO + ACCIÓN + OBJETO
- [ ] Agent-1 copió visualDescriptions EXACTAS (no inventó nuevas)
- [ ] Agent-2 combinó visualDescriptions + CINEMATIC_PALETTES (no reemplazó)
- [ ] Agent-4 usó Magnific MCP (no API directa)
- [ ] Agent-5 usó Magnific MCP (no API directa)
- [ ] Agent-6 usó Magnific MCP (no API directa)
- [ ] Versículo no está en `published_videos` (no duplicado)

---

## 🎯 Mejoras Implementadas (2026-07-31)

### 1. Migración a Modelo Gratuito
- **Antes**: `anthropic/claude-sonnet-4.5:beta` (de pago)
- **Después**: `nvidia/nemotron-3-ultra-550b-a55b:free` (100% gratuito)
- **Ahorro**: 100% del costo de metadata

### 2. Descripciones Visuales Específicas
- **Antes**: "Cielo dramático con nubes y luz dorada" (genérico)
- **Después**: "Joven pastor David de 16 años, túnica marrón, colina rocosa Belén al atardecer, sostiene báculo nudoso" (específico)

### 3. Comunicación entre Agentes Documentada
- Flujo de datos clarificado
- Responsabilidades separadas
- NO hardcodear instrucciones

---

## 📚 Referencias

- Magnific MCP Docs: https://mcp.magnific.com
- OpenRouter Models: https://openrouter.ai/docs/models
- Supabase Migrations: `supabase/migrations/`
- Pipeline Testing: `run-full-pipeline.sh`

---

**Última actualización**: 2026-07-31
**Versión del sistema**: 1.0-mvp
**Autor**: Sistema Multi-Agente Autónomo
