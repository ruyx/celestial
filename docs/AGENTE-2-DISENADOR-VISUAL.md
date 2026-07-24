# 🎨 AGENTE 2: DISEÑADOR VISUAL PROFESIONAL

## 📋 Descripción

El Agente 2 transforma los guiones del Agente 1 en prompts cinematográficos profesionales para generar imágenes de calidad épica usando Magnific AI.

Utiliza el **Framework de 5 Capas** para crear prompts que siguen estándares de cinematografía profesional.

---

## 🎬 Framework de 5 Capas

Cada prompt sigue esta estructura:

### 1. **Subject** - Sujeto Específico
- No vago, específico
- Ejemplo: "Massive storm clouds swirling with raw power, lightning illuminating edges"

### 2. **Action/Emotion/Pose** - Acción y Momento Humano
- Dale un momento humano
- Ejemplo: "Powerful divine light exploding through storm, fierce penetrating beams"

### 3. **Setting** - Escenario Detallado
- Tiempo + lugar + 2-3 detalles sensoriales
- Ejemplo: "Apocalyptic biblical atmosphere at storm peak, raw power and scale, dramatic intensity"

### 4. **Lighting** - Iluminación (LA MÁS IMPORTANTE)
- Fuente, dirección, calidad
- Ejemplo: "hard neon backlight with rim glow, dramatic side-light, deep shadows, cinematic volumetric lighting with god rays"

### 5. **Style/Aesthetic** - Estilo Cinematográfico
- Film stock, fotógrafo, películas de referencia
- Ejemplo: "Shot on 35mm Kodak Vision3 500T, cinematic grain, deep oranges and crimson reds, high contrast. Blade Runner 2049 meets Mad Max Fury Road intensity"

---

## 📁 Archivos del Sistema

### **1. agent-2-image-designer-pro.js**
Genera los prompts cinematográficos profesionales.

**Input:** `output/scripts/script-*.json` (del Agente 1)

**Output:** `output/image-prompts/visual-design-PRO-*.json`

**Ejecución:**
```bash
node agents/agent-2-image-designer-pro.js
```

**Características:**
- Paletas cinematográficas por categoría bíblica
- Prompts de 700-1100 caracteres (vs 400 básicos)
- 5 escenas por video (Hook, Intro, Body, Application, CTA)
- Framework de 5 capas en cada prompt
- Especificaciones técnicas de cámara y lentes
- Referencias de directores y películas

---

### **2. agent-3-batch-generator.js**
Prepara los prompts en formato batch para generación masiva.

**Input:** `output/image-prompts/visual-design-PRO-*.json`

**Output:** `output/image-batches/batch-*.json`

**Ejecución:**
```bash
node agents/agent-3-batch-generator.js
```

**Características:**
- Parámetros listos para Magnific MCP
- Cálculo automático de costos (60 créditos x imagen)
- Metadata completa para n8n

---

## 🎭 Paletas Cinematográficas por Categoría

### **Fortaleza** (Strength)
```json
{
  "filmStock": "35mm Kodak Vision3 500T, cinematic grain",
  "colorGrade": "deep oranges and crimson reds, high contrast",
  "styleRef": "Blade Runner 2049 meets Mad Max Fury Road intensity",
  "lighting": "hard neon backlight with rim glow, dramatic side-light, deep shadows"
}
```

### **Consuelo** (Comfort)
```json
{
  "filmStock": "35mm Kodak Portra 400, soft warm grain",
  "colorGrade": "soft blues and golden amber, gentle gradients",
  "styleRef": "Terrence Malick meets Days of Heaven aesthetic",
  "lighting": "soft golden hour glow, gentle side-light, peaceful ambiance"
}
```

### **Salvación** (Salvation)
```json
{
  "filmStock": "35mm Kodak Vision3 200T, clean and sharp",
  "colorGrade": "ethereal whites and radiant gold, high-key lighting",
  "styleRef": "Tree of Life meets The Fountain transcendence",
  "lighting": "radiant heavenly light, soft rim illumination, divine glow"
}
```

### **Esperanza** (Hope)
```json
{
  "filmStock": "35mm Fuji Superia 400, saturated colors",
  "colorGrade": "soft pastels with warm sunrise tones",
  "styleRef": "Amélie meets Her optimistic palette",
  "lighting": "warm morning light, gentle golden glow, hopeful ambiance"
}
```

---

## 💡 Tipos de Iluminación por Emoción

| Lighting | Emoción |
|----------|---------|
| Soft golden hour window light | Nostalgia, paz |
| Hard neon backlight, rim glow | Cyberpunk, peligro |
| Overcast diffused daylight | Editorial, moderno |
| Single candlelight, deep shadows | Noir, intimidad |
| Blue moonlight through window | Soledad, embrujado |
| Celestial divine beam overhead | Épico, celestial |
| Dramatic storm light, contrasts | Poder, urgencia |

---

## 🎥 Movimientos de Cámara por Escena

| Movimiento | Efecto Narrativo |
|------------|------------------|
| Slow dolly in | Intimidad, tensión |
| Wide crane rising | Escala épica, revelación |
| Low-angle tracking | Poder, urgencia |
| Handheld follow | Crudo, documental |
| Static locked-off | Aislamiento, quietud |
| Slow orbit | Contemplación, complejidad |
| Push-in medium to close-up | Emoción intensificándose |

---

## 📊 Estructura de Output

### visual-design-PRO-*.json
```json
{
  "videoId": "script-Isaías-41-10-*.json",
  "verse": "Isaías 41:10",
  "category": "fortaleza",
  "emotionalBenefit": "Valentía sobrenatural en medio del miedo",
  "cinematicStyle": {
    "filmStock": "35mm Kodak Vision3 500T, cinematic grain",
    "colorGrade": "deep oranges and crimson reds, high contrast",
    "styleReference": "Blade Runner 2049 meets Mad Max Fury Road intensity",
    "lighting": "hard neon backlight with rim glow, dramatic side-light, deep shadows",
    "framework": "5-layer cinematographic prompting (Subject, Action, Setting, Lighting, Style)"
  },
  "scenes": [
    {
      "id": 1,
      "type": "hook",
      "prompt": "...",
      "aspectRatio": "16:9",
      "resolution": "4k",
      "model": "recraft-v4-1",
      "duration": 5,
      "originalText": "..."
    }
  ]
}
```

### batch-*.json
```json
{
  "videoId": "script-Isaías-41-10-*.json",
  "verse": "Isaías 41:10",
  "totalCost": 300,
  "scenes": [
    {
      "sceneId": 1,
      "magnificParams": {
        "prompt": "...",
        "aspectRatio": "16:9",
        "resolution": "4k",
        "mode": "recraft-v4-1",
        "count": 1
      },
      "estimatedCost": 60
    }
  ]
}
```

---

## 🔌 Integración con n8n

### Workflow Completo

```
1. Trigger (Webhook/Schedule)
   ↓
2. HTTP Request: Ejecutar Agente 1 (Redactor)
   ↓
3. HTTP Request: Ejecutar Agente 2 (Diseñador)
   ↓
4. HTTP Request: Ejecutar Agente 3 (Batch Generator)
   ↓
5. Loop: Para cada escena en batch
   ├─ MCP Magnific: images_generate(magnificParams)
   ├─ MCP Magnific: creations_wait(identifier, 25s)
   └─ Guardar URL + identifier
   ↓
6. Compilar metadata de imágenes
   ↓
7. Pasar a Agente 4 (Animador de videos)
```

### Nodos n8n Necesarios

#### **Nodo 1: Ejecutar Agente 2**
```javascript
// HTTP Request
const scriptFile = $input.item.json.scriptPath;

return {
  method: 'POST',
  url: 'http://localhost:3000/exec',
  body: {
    command: `node agents/agent-2-image-designer-pro.js`,
    cwd: '/home/suario/ruy-projects/project-yt'
  }
};
```

#### **Nodo 2: Ejecutar Batch Generator**
```javascript
// HTTP Request
return {
  method: 'POST',
  url: 'http://localhost:3000/exec',
  body: {
    command: `node agents/agent-3-batch-generator.js`,
    cwd: '/home/suario/ruy-projects/project-yt'
  }
};
```

#### **Nodo 3: Loop - Generar Imágenes**
```javascript
// Loop Over Items
const batch = $input.item.json.batch;

// Para cada escena
for (const scene of batch.scenes) {
  // Llamar a Magnific MCP
  const result = await $http.post('http://localhost:3000/mcp/magnific/images_generate', {
    ...scene.magnificParams
  });

  // Esperar resultado
  const completed = await $http.post('http://localhost:3000/mcp/magnific/creations_wait', {
    identifiers: [result.creations[0].identifier],
    timeoutSeconds: 25
  });

  // Guardar URLs
  scene.imageUrl = completed.results[0].results.url;
  scene.identifier = completed.results[0].identifier;
}

return { batch };
```

---

## 💰 Costos de Generación

| Escena | Modelo | Resolución | Costo |
|--------|--------|------------|-------|
| Hook | Recraft V4.1 | 4K (16:9) | 60 créditos |
| Intro | Recraft V4.1 | 4K (16:9) | 60 créditos |
| Body | Recraft V4.1 | 4K (16:9) | 60 créditos |
| Application | Recraft V4.1 | 4K (16:9) | 60 créditos |
| CTA | Recraft V4.1 | 4K (16:9) | 60 créditos |

**Total por video:** 300 créditos (5 imágenes)

---

## ⚙️ Configuración de Magnific

### Modelo Recomendado: **Recraft V4.1**
- **Velocidad:** 17s por imagen
- **Calidad:** Photorealistic, SOTA tier rank 1
- **Uso ideal:** Pure text-to-image sin referencias
- **Fortalezas:** Cinematografía, detalles épicos, iluminación dramática

### Parámetros por Imagen
```javascript
{
  "prompt": "...", // Prompt de 700-1100 caracteres
  "aspectRatio": "16:9", // YouTube standard
  "resolution": "4k", // Ultra HD
  "mode": "recraft-v4-1",
  "count": 1
}
```

---

## 📝 Notas Importantes

### ✅ SIN TEXTO EN IMÁGENES
**CRÍTICO:** Todas las imágenes de Biblia DEBEN incluir:
- `"pages completely blurred in shallow focus"`
- `"NO TEXT VISIBLE, NO TYPOGRAPHY, pure visual aesthetic"`
- `"extremely shallow depth of field (f/1.4)"`

El texto del versículo se agregará en la edición de video, NO en las imágenes.

### ✅ Coherencia Visual
Todas las 5 escenas de un video usan:
- Mismo `filmStock` (e.g., "35mm Kodak Vision3 500T")
- Mismo `colorGrade` (e.g., "deep oranges and crimson reds")
- Mismo `styleReference` (e.g., "Blade Runner 2049 meets Mad Max")

Esto garantiza que las 5 imágenes se sientan como parte de la misma producción.

---

## 🎯 Flujo Completo del Agente 2

```
Input: output/scripts/script-*.json (Agente 1)
  ↓
agent-2-image-designer-pro.js
  ↓
Output: output/image-prompts/visual-design-PRO-*.json
  ↓
agent-3-batch-generator.js
  ↓
Output: output/image-batches/batch-*.json
  ↓
n8n: Loop + Magnific MCP
  ↓
Output: 5 imágenes URL + identifiers
  ↓
Agente 4: Animador de videos
```

---

## 🚀 Próximos Pasos

1. ✅ **Agente 2 completado** - Genera prompts cinematográficos PRO
2. ✅ **Agente 3 completado** - Prepara batch para Magnific
3. ⏳ **Integración n8n** - Conectar con workflow automatizado
4. ⏳ **Agente 4** - Animación de imágenes → video final

---

## 📊 Resultados Esperados

Con este sistema, cada video tendrá:
- ✅ 5 imágenes de calidad cinematográfica profesional
- ✅ Coherencia visual perfecta entre escenas
- ✅ Prompts de 700-1100 caracteres con especificaciones técnicas
- ✅ Generación automatizada vía n8n
- ✅ Metadata completa para tracking y edición
- ✅ Sin texto visible en las imágenes (se agrega en post-producción)

---

**Creado:** 2026-07-22
**Versión:** 2.0 PRO
**Framework:** 5-Layer Cinematographic Prompting
