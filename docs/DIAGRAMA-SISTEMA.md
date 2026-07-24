# 🎬 SISTEMA DE PRODUCCIÓN YOUTUBE AUTOMÁTICO

## Estado Actual: 60% COMPLETADO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW n8n AUTOMATIZADO                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Daily Trigger      │  ⏰ 12:00 PM diario
│   (12:00 PM)         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ✅ AGENTE 1: AI VIRAL MASTER SCRIPTWRITER                              │
│  ─────────────────────────────────────────────────────────────────────   │
│  • Selección de versículo del día                                       │
│  • Generación de guión VIRAL (5 escenas)                                │
│  • Output: script-[Verso]-[timestamp].json                              │
│  • Status: ✅ 100% OPERATIVO                                            │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
      ┌─────────┐
      │ Success?│  ✅ Script generado
      └────┬────┘
           │ Yes
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ✅ AGENTE 2: VISUAL DESIGNER PRO                                       │
│  ─────────────────────────────────────────────────────────────────────   │
│  • Lee guión del Agente 1                                                │
│  • Framework de 5 Capas (Subject, Action, Setting, Lighting, Style)     │
│  • Paletas cinematográficas por categoría                               │
│  • Prompts de 700-1100 caracteres                                       │
│  • Output: visual-design-PRO-*.json                                     │
│  • Status: ✅ 100% OPERATIVO                                            │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ✅ AGENTE 3: BATCH GENERATOR                                           │
│  ─────────────────────────────────────────────────────────────────────   │
│  • Prepara batch para Magnific MCP                                      │
│  • Calcula costos (300 créditos/video)                                  │
│  • Output: batch-*.json                                                 │
│  • Status: ✅ 100% OPERATIVO                                            │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ⏳ AGENTE 4: IMAGE GENERATOR (MAGNIFIC MCP)                            │
│  ─────────────────────────────────────────────────────────────────────   │
│  • Loop sobre 5 escenas del batch                                       │
│  • images_generate(magnificParams) vía MCP                              │
│  • creations_wait(identifier, 25s)                                      │
│  • Output: 5 URLs de imágenes + identifiers                             │
│  • Status: ⏳ PENDIENTE                                                  │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ⏳ AGENTE 5: VIDEO ANIMATOR                                            │
│  ─────────────────────────────────────────────────────────────────────   │
│  • Animar imágenes con motion (Ken Burns, parallax)                     │
│  • Sincronizar con audio TTS                                            │
│  • Agregar texto overlay con versículos                                 │
│  • Output: video-final.mp4 (16:9, 1080p/4K)                             │
│  • Status: ⏳ PENDIENTE                                                  │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ⏳ AGENTE 6: YOUTUBE UPLOADER                                          │
│  ─────────────────────────────────────────────────────────────────────   │
│  • Upload a YouTube con metadata optimizada                             │
│  • Título, descripción, tags SEO                                        │
│  • Thumbnail personalizado                                              │
│  • Status: ⏳ PENDIENTE                                                  │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
      ┌─────────────────┐
      │ Wait 24h        │  ⏰ Esperar analíticas
      └────────┬────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ⏳ AGENTE 7: ANALYTICS COLLECTOR                                       │
│  ─────────────────────────────────────────────────────────────────────   │
│  • Recolectar métricas de YouTube                                       │
│  • Análisis de performance                                              │
│  • Feedback loop para mejorar                                           │
│  • Status: ⏳ PENDIENTE                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Estado de Implementación

| Agente | Status | Completado |
|--------|--------|-----------|
| 1. AI VIRAL Scriptwriter | ✅ Operativo | 100% |
| 2. Visual Designer PRO | ✅ Operativo | 100% |
| 3. Batch Generator | ✅ Operativo | 100% |
| 4. Image Generator | ⏳ Pendiente | 0% |
| 5. Video Animator | ⏳ Pendiente | 0% |
| 6. YouTube Uploader | ⏳ Pendiente | 0% |
| 7. Analytics Collector | ⏳ Pendiente | 0% |

**Progreso Total:** 42% (3/7 agentes completados)

---

## 🎨 Ejemplo de Flujo Completo

### Input Inicial
```
Trigger: 2026-07-22 12:00 PM
```

### Agente 1: Scriptwriter
```json
{
  "verse": "Isaías 41:10",
  "category": "fortaleza",
  "emotionalBenefit": "Valentía sobrenatural en medio del miedo",
  "scenes": [
    { "id": 1, "type": "hook", "text": "Si te falta valentía...", "duration": 5 },
    { "id": 2, "type": "intro", "text": "Isaías 41:10 dice...", "duration": 25 },
    { "id": 3, "type": "body", "text": "Este versículo no es solo teoría...", "duration": 45 },
    { "id": 4, "type": "application", "text": "Entonces, ¿qué haces con esto...", "duration": 25 },
    { "id": 5, "type": "cta", "text": "Si esto tocó tu corazón...", "duration": 20 }
  ]
}
```

### Agente 2: Visual Designer PRO
```json
{
  "cinematicStyle": {
    "filmStock": "35mm Kodak Vision3 500T, cinematic grain",
    "colorGrade": "deep oranges and crimson reds, high contrast",
    "styleReference": "Blade Runner 2049 meets Mad Max Fury Road intensity"
  },
  "scenes": [
    {
      "id": 1,
      "prompt": "Massive storm clouds swirling with raw power... [732 chars]",
      "model": "recraft-v4-1"
    }
    // ... 4 más
  ]
}
```

### Agente 3: Batch Generator
```json
{
  "totalCost": 300,
  "scenes": [
    {
      "sceneId": 1,
      "magnificParams": {
        "prompt": "[Prompt completo]",
        "aspectRatio": "16:9",
        "resolution": "4k",
        "mode": "recraft-v4-1"
      }
    }
    // ... 4 más
  ]
}
```

### Agente 4: Image Generator (Pendiente)
```json
{
  "images": [
    {
      "sceneId": 1,
      "identifier": "LUrxRZEswO",
      "url": "https://pikaso.cdnpk.net/private/production/4955134096/render.png",
      "status": "completed"
    }
    // ... 4 más
  ]
}
```

### Output Final (Agentes 5-7 pendientes)
```
video-Isaías-41-10-final.mp4
  - Duración: 2:00 minutos
  - Resolución: 1080p / 4K
  - 5 escenas animadas
  - Audio TTS sincronizado
  - Texto overlay con versículos
  - Subido a YouTube
```

---

## 💰 Costos por Video

| Componente | Costo |
|------------|-------|
| Agente 1 (Scriptwriter) | Gratis (GPT-4 via API) |
| Agente 2 (Visual Designer) | Gratis (local) |
| Agente 3 (Batch Generator) | Gratis (local) |
| Agente 4 (5 imágenes Magnific) | **300 créditos** |
| Agente 5 (Animación) | TBD |
| Agente 6 (Upload YouTube) | Gratis |
| **TOTAL** | **300 créditos + TBD** |

**Créditos disponibles:** 3,090,842 (~10,302 videos)

---

## 🚀 Capacidad de Producción

| Métrica | Valor |
|---------|-------|
| Videos por día | 1 (automático a las 12:00 PM) |
| Videos por mes | ~30 |
| Videos por año | ~365 |
| Tiempo de generación | ~2-3 minutos (cuando esté completo) |
| Intervención manual | 0% (100% automatizado) |

---

## 📁 Estructura de Archivos

```
project-yt/
├── agents/
│   ├── agent-1-scriptwriter.js ✅
│   ├── agent-2-image-designer-pro.js ✅
│   ├── agent-3-batch-generator.js ✅
│   ├── agent-4-image-generator.js ⏳
│   ├── agent-5-video-animator.js ⏳
│   └── agent-6-youtube-uploader.js ⏳
├── prompts/
│   ├── agente-1-scriptwriter.md ✅
│   └── agente-2-image-designer.md ✅
├── docs/
│   ├── AGENTE-1-SCRIPTWRITER.md ✅
│   ├── AGENTE-2-DISENADOR-VISUAL.md ✅
│   ├── RESUMEN-AGENTE-2.md ✅
│   └── DIAGRAMA-SISTEMA.md ✅ (este archivo)
└── output/
    ├── scripts/ ✅
    ├── image-prompts/ ✅
    ├── image-batches/ ✅
    ├── images/ ⏳
    ├── videos/ ⏳
    └── analytics/ ⏳
```

---

**Última actualización:** 2026-07-22
**Versión del sistema:** 0.6 (60% completo)
**Próximo milestone:** Agente 4 (Image Generator)
