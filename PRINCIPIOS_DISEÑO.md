# 🎯 Principios de Diseño del Sistema Multi-Agente

## 🚫 Regla de Oro: NO HARDCODEAR INSTRUCCIONES

### ❌ Qué NO hacer (Anti-Patrones)

#### 1. Hardcodear Prompts de Imagen
```javascript
// ❌ MAL - Prompt hardcodeado
const prompt = "Ancient shepherd in biblical times walking with staff";
await magnific.images_generate({ prompt });
```

**Problema**: El prompt nunca cambia, todos los videos usan la misma imagen genérica.

#### 2. Hardcodear Descripciones Visuales
```javascript
// ❌ MAL - Descripción fija en código
const scenes = [
  { visual: "Dramatic sky with clouds" },
  { visual: "Person praying" },
  { visual: "Golden light" }
];
```

**Problema**: No hay variedad, cada versículo se ve igual.

#### 3. Ignorar Decisiones de Agent-0
```javascript
// ❌ MAL - Agent-2 inventa sus propias descripciones
const visualPrompt = generateRandomVisual(); // ← Ignora Agent-0
```

**Problema**: Rompe la cadena de comunicación entre agentes.

#### 4. Reemplazar en Lugar de Combinar
```javascript
// ❌ MAL - Reemplaza descripción en lugar de enriquecer
const finalPrompt = cinematicStyle; // ← Pierde la descripción de Agent-0
```

**Problema**: Se pierde la especificidad que Agent-0 generó.

---

### ✅ Qué SÍ hacer (Patrones Correctos)

#### 1. Leer Decisiones de Agentes Anteriores
```javascript
// ✅ BIEN - Lee decisión de Agent-0
const decision = JSON.parse(fs.readFileSync('output/agent-0-decision.json'));
const visualDesc = decision.visualDescriptions.hook;
```

#### 2. Combinar (No Reemplazar)
```javascript
// ✅ BIEN - Combina descripción específica + estilo cinematográfico
const finalPrompt = `${visualDesc}. ${cinematicPalette.colorGrade}.
LIGHTING: ${cinematicPalette.lighting}.
FILM: ${cinematicPalette.filmStock}.`;
```

**Resultado**: Imagen específica + calidad cinematográfica.

#### 3. Preservar Especificidad
```javascript
// ✅ BIEN - Preserva PERSONAJE, ESCENARIO, ACCIÓN, OBJETO
// Del Agent-0:
"Joven pastor David de 16 años, túnica marrón, colina rocosa Belén"

// Agent-2 agrega cinematografía SIN reemplazar:
"Joven pastor David de 16 años, túnica marrón, colina rocosa Belén.
Muted greens and soft blues. Soft golden hour window light.
35mm Kodak Portra 400, visible grain."
```

#### 4. Validar Cadena de Comunicación
```javascript
// ✅ BIEN - Verificar que existe decisión previa
if (!fs.existsSync('output/agent-0-decision.json')) {
  console.error('❌ Agent-0 debe ejecutarse primero');
  process.exit(1);
}
```

---

## 🔗 Integración con Magnific MCP

### Principio: Usar Tools, No APIs Directas

#### ❌ MAL: API HTTP Directa
```javascript
// ❌ NO HACER - API fetch directa a Magnific
const response = await fetch('https://api.magnific.com/v1/images', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: JSON.stringify({ prompt: "..." })
});
```

**Problemas**:
- Hardcodea URL del endpoint
- Hardcodea estructura de request
- No usa sistema MCP del servidor
- Difícil de mantener cuando API cambia

#### ✅ BIEN: Magnific MCP Tools
```javascript
// ✅ HACER - Usar MCP tools
const result = await mcp__magnific__images_generate({
  prompt: finalPrompt, // ← Viene de Agent-2
  aspectRatio: "9:16",
  count: 1,
  mode: "auto" // MCP decide mejor modelo
});

// Esperar resultado
const completed = await mcp__magnific__creations_wait({
  identifiers: [result.identifier],
  timeoutSeconds: 25
});
```

**Ventajas**:
- Abstracción sobre API (MCP maneja cambios)
- Configuración centralizada en servidor MCP
- Auto-retry y manejo de errores
- Logs y debugging mejorados

---

## 📊 Flujo de Datos Sin Hardcoding

### Ejemplo Completo: De Versículo a Video

```javascript
// ═══════════════════════════════════════════════
// AGENT-0: Genera metadata dinámica
// ═══════════════════════════════════════════════
const metadata = await openrouter.generate({
  prompt: `Genera visualDescriptions para ${verse} con:
  - PERSONAJE específico (no "persona", sino "anciano pastor")
  - ESCENARIO concreto (no "lugar", sino "colina rocosa Belén")
  - ACCIÓN visible (no "existe", sino "sostiene báculo")
  - OBJETO simbólico (cruz, biblia, báculo)`
});

fs.writeFileSync('output/agent-0-decision.json', JSON.stringify({
  verse: "Salmos 23:1",
  visualDescriptions: {
    hook: "Joven pastor David de 16 años, túnica marrón, colina rocosa Belén al atardecer, sostiene báculo nudoso",
    intro: "David rey, manto púrpura, trono cedro...",
    // ...
  }
}));

// ═══════════════════════════════════════════════
// AGENT-1: Lee y copia visualDescriptions
// ═══════════════════════════════════════════════
const decision = JSON.parse(fs.readFileSync('output/agent-0-decision.json'));

const script = {
  scenes: [
    {
      id: "hook",
      voiceover: "¿Sabías que el rey que cuidaba ovejas...",
      visualDescription: decision.visualDescriptions.hook // ← COPIA EXACTA
    }
  ]
};

fs.writeFileSync('output/scripts/script.json', JSON.stringify(script));

// ═══════════════════════════════════════════════
// AGENT-2: Lee y enriquece (no reemplaza)
// ═══════════════════════════════════════════════
const decision = JSON.parse(fs.readFileSync('output/agent-0-decision.json'));
const palette = CINEMATIC_PALETTES[decision.category]; // "consuelo"

const enrichedPrompts = decision.visualDescriptions.hook +
  `. ${palette.colorGrade}. LIGHTING: ${palette.lighting}. FILM: ${palette.filmStock}.`;

fs.writeFileSync('output/image-prompts/visual-design.json', JSON.stringify({
  scenes: [{
    id: "hook",
    finalPrompt: enrichedPrompts // ← COMBINADO
  }]
}));

// ═══════════════════════════════════════════════
// AGENT-4: Lee y genera con Magnific MCP
// ═══════════════════════════════════════════════
const design = JSON.parse(fs.readFileSync('output/image-prompts/visual-design.json'));

const image = await mcp__magnific__images_generate({
  prompt: design.scenes[0].finalPrompt, // ← PROMPT DINÁMICO
  aspectRatio: "9:16",
  mode: "auto"
});

fs.writeFileSync('output/image-metadata/images.json', JSON.stringify({
  images: [{
    sceneId: "hook",
    creationIdentifier: image.identifier, // ← IDENTIFIER MCP
    prompt: design.scenes[0].finalPrompt
  }]
}));

// ═══════════════════════════════════════════════
// AGENT-5: Lee identifier y genera video MCP
// ═══════════════════════════════════════════════
const images = JSON.parse(fs.readFileSync('output/image-metadata/images.json'));
const script = JSON.parse(fs.readFileSync('output/scripts/script.json'));

const video = await mcp__magnific__video_generate({
  video: {
    clips: [{
      keyframes: {
        start: {
          type: "image",
          url: images.images[0].creationIdentifier // ← IDENTIFIER MCP
        }
      },
      duration: script.scenes[0].duration,
      prompt: script.scenes[0].voiceover
    }]
  }
});
```

---

## 🎨 Paletas Cinematográficas: Combinación, No Reemplazo

### Concepto Clave
Las paletas cinematográficas **enriquecen** las descripciones visuales, no las reemplazan.

```javascript
// Descripción visual de Agent-0 (específica):
const visualDesc = "Joven pastor David de 16 años, túnica marrón desgastada,
de pie en colina rocosa de Belén al atardecer, sostiene báculo nudoso";

// Paleta cinematográfica (estilo):
const palette = {
  colorGrade: 'muted greens and soft blues, warm undertones',
  lighting: 'soft golden hour window light',
  filmStock: '35mm Kodak Portra 400, visible grain'
};

// ❌ MAL - Reemplaza:
const prompt = `${palette.colorGrade}. ${palette.lighting}.`;
// Resultado: Imagen bonita pero GENÉRICA

// ✅ BIEN - Combina:
const prompt = `${visualDesc}. ${palette.colorGrade}. LIGHTING: ${palette.lighting}. FILM: ${palette.filmStock}.`;
// Resultado: Imagen ESPECÍFICA con CALIDAD CINEMATOGRÁFICA
```

### Por Qué Importa
1. **Especificidad**: Agent-0 decide QUÉ mostrar (personaje, escenario, acción)
2. **Estilo**: Agent-2 decide CÓMO mostrarlo (iluminación, color, film stock)
3. **Unicidad**: Cada versículo tiene imágenes únicas porque visualDesc cambia
4. **Calidad**: Todas las imágenes se ven cinematográficas por las paletas

---

## 🔄 Comunicación entre Agentes: Contrato de Datos

### Formato de Archivos JSON

#### Agent-0 Output Contract
```typescript
interface Agent0Decision {
  reference: string;         // "Salmos 23:1"
  text: string;              // Texto completo del versículo
  category: string;          // "consuelo" | "fortaleza" | ...
  customHook: string;        // Hook viral
  historicalInsight: string; // Contexto histórico
  visualDescriptions: {      // ← LO MÁS IMPORTANTE
    hook: string;            // Con PERSONAJE + ESCENARIO + ACCIÓN + OBJETO
    intro: string;
    body: string;
    application: string;
    cta: string;
  };
  targetAudience: string[];
  keywords: string[];
  viralPotential: number;    // 1-10
}
```

#### Agent-1 Output Contract
```typescript
interface Agent1Script {
  metadata: {
    verse: string;
    category: string;
    totalDuration: number; // 120
  };
  scenes: Array<{
    id: string;                // "hook" | "intro" | ...
    duration: number;          // 5, 25, 45, 25, 20
    voiceover: string;         // Texto para TTS
    visualDescription: string; // ← COPIADO DE AGENT-0
  }>;
}
```

#### Agent-2 Output Contract
```typescript
interface Agent2Design {
  verse: string;
  category: string;
  scenes: Array<{
    id: string;
    originalDescription: string; // De Agent-0
    cinematicEnhancement: {
      colorGrade: string;
      lighting: string;
      filmStock: string;
      styleRef: string;
    };
    finalPrompt: string; // ← COMBINACIÓN
  }>;
}
```

#### Agent-4 Output Contract
```typescript
interface Agent4Images {
  verse: string;
  images: Array<{
    sceneId: string;
    creationIdentifier: string; // ← IDENTIFIER MCP
    url: string;                // URL temporal
    prompt: string;             // Prompt usado
  }>;
}
```

---

## 🧪 Testing de Comunicación

### Script de Validación
```bash
#!/bin/bash

# Verificar que Agent-1 lee de Agent-0
if ! grep -q "agent-0-decision.json" agents/agent-1-viral-scriptwriter.js; then
  echo "❌ Agent-1 NO lee decisión de Agent-0"
  exit 1
fi

# Verificar que Agent-2 lee de Agent-0
if ! grep -q "agent-0-decision.json" agents/agent-2-image-designer-pro.js; then
  echo "❌ Agent-2 NO lee decisión de Agent-0"
  exit 1
fi

# Verificar que Agent-2 NO reemplaza (debe tener "+" o concatenación)
if ! grep -q "visualDesc.*palette\|+\|concat" agents/agent-2-image-designer-pro.js; then
  echo "⚠️  Agent-2 podría estar reemplazando en lugar de combinar"
fi

# Verificar que Agent-4 usa MCP
if grep -q "fetch.*magnific" agents/agent-4-magnific-mcp.js; then
  echo "❌ Agent-4 usa fetch directa en lugar de MCP"
  exit 1
fi

echo "✅ Todos los agentes siguen principios de diseño"
```

---

## 📈 Métricas de Calidad

### Indicadores de Buen Diseño
- ✅ 0 prompts hardcodeados en código
- ✅ 100% de visualDescriptions vienen de Agent-0
- ✅ 100% de generación de media via MCP tools
- ✅ Cada archivo JSON es legible por el siguiente agente
- ✅ Versión del schema documentada en cada JSON

### Indicadores de Mal Diseño
- ❌ Prompts directamente en `images_generate()`
- ❌ Descripciones visuales hardcodeadas
- ❌ `fetch()` directo a APIs externas
- ❌ Agentes que no leen archivos de agentes anteriores
- ❌ Archivos JSON sin timestamp o version

---

## 🔐 Configuración de Seguridad

### Variables de Entorno (NO Hardcodear)
```bash
# ❌ MAL - API key en código
const API_KEY = "sk-or-abc123...";

# ✅ BIEN - API key en .env
const API_KEY = process.env.OPENROUTER_API_KEY;
```

### Archivo `.env` Template
```bash
# OpenRouter (Agent-0)
OPENROUTER_API_KEY=sk-or-...

# Supabase (Todos los agentes)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUz...

# YouTube (Upload final)
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
```

---

## 📚 Documentación de Cambios

### Log de Decisiones de Arquitectura

#### 2026-07-31: Migración a Modelo Gratuito
- **Decisión**: Cambiar de `anthropic/claude-sonnet-4.5:beta` a `nvidia/nemotron-3-ultra-550b-a55b:free`
- **Razón**: Conservar créditos de OpenRouter
- **Impacto**: $0.00 costo en metadata, calidad mantenida
- **Archivo**: `agents/agent-0-verse-researcher.js:443`

#### 2026-07-31: Especificidad en visualDescriptions
- **Decisión**: Requerir PERSONAJE, ESCENARIO, ACCIÓN, OBJETO en prompt de Agent-0
- **Razón**: Imágenes eran genéricas ("cielo con nubes")
- **Impacto**: Cada video tiene imágenes únicas y específicas
- **Archivo**: `agents/agent-0-verse-researcher.js:405-424`

#### 2026-07-31: Clarificación de Arquitectura MCP
- **Decisión**: Solo Agent-0 usa OpenRouter, resto usa Magnific MCP
- **Razón**: Confusión sobre qué agentes usan qué API
- **Impacto**: Arquitectura clarificada, documentación completa
- **Archivos**: Este documento + `ARQUITECTURA_AGENTES.md`

---

## ✅ Checklist Pre-Commit

Antes de hacer commit de cambios a agentes:

- [ ] ¿El agente lee decisiones del agente anterior?
- [ ] ¿Se usan MCP tools en lugar de fetch directo?
- [ ] ¿Las descripciones visuales se combinan (no reemplazan)?
- [ ] ¿No hay prompts hardcodeados en el código?
- [ ] ¿Las API keys vienen de `process.env`?
- [ ] ¿El output tiene timestamp y version?
- [ ] ¿Los logs indican qué archivo leyó y de dónde?
- [ ] ¿Hay manejo de errores si archivo previo no existe?

---

**Última actualización**: 2026-07-31
**Mantenedor**: Sistema Multi-Agente
**Versión**: 1.0
