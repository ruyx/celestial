# 🏗️ ARQUITECTURA MCP - PIPELINE YOUTUBE
## Documentación Técnica Completa para Prevenir Pérdida de Contexto

**Fecha:** 2026-07-31
**Proyecto:** project-yt
**Servidor:** 10.254.80.29 (desarrollo@10.254.80.29)

---

## ⚠️ REGLA DE ORO: NO ALTERAR ARQUITECTURA MCP

**El usuario reportó:**
> "mcp cp claude ya lo teniamos muy bien sincronizado ya la generacion de imagenes, animacion y generacion de audio estaba todo perfecto no entienndo por que lo necesitas alterar"

**Significado:**
- ✅ MCP YA está configurado y funcionando en servidor n8n
- ✅ Image generation (Agent-4) funcionando via MCP
- ✅ Video animation (Agent-5) funcionando via MCP
- ✅ Audio generation (Agent-6) funcionando via MCP
- ❌ **NO intentar hacer Agents 4, 5, 6 standalone**
- ❌ **NO modificar configuración MCP**

---

## 🎯 Arquitectura del Sistema

### Servidor n8n (10.254.80.29)
```
Características:
- Claude Code instalado y configurado
- MCP (Model Context Protocol) activo
- Este ordenador NO se apaga (funciona 24/7)
- PM2 ejecutando agent-server.js en puerto 3100
```

### MCP Tools Disponibles
```javascript
// Magnific API para imágenes (Agent-4)
mcp__magnific__images_generate({
  prompt: "...",
  aspectRatio: "16:9",
  resolution: "4k",
  mode: "recraft-v4-1",
  count: 1
})

// Video animation via MCP (Agent-5)
mcp__magnific__video_generate(...)

// Audio via ElevenLabs (Agent-6)
mcp__magnific__audio_tts({
  text: "...",
  voiceId: 863,
  model: "eleven_v3",
  speed: 1,
  stability: 0.5
})
```

---

## 📊 Flujo de Ejecución Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  n8n Workflow (HTTP Orchestration)                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  agent-server.js (Express, puerto 3100)                     │
│  - PM2 process manager                                      │
│  - Expone endpoints HTTP para n8n                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Spawns Node.js Agents                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 STANDALONE AGENTS (node agent-X.js)                    │
│  ├─ Agent-0: Verse Researcher                              │
│  ├─ Agent-1: Master Scriptwriter                           │
│  ├─ Agent-2: Image Designer (LLM prompts)                  │
│  ├─ Agent-3: Batch Generator ← FIXED 2026-07-31           │
│  ├─ Agent-7: Video Editor (ffmpeg)                         │
│  ├─ Agent-8: SEO Expert                                    │
│  └─ Agent-9: Thumbnail Generator                           │
│                                                             │
│  ⚡ MCP AGENTS (claude run agent-X.js)                     │
│  ├─ Agent-4: Magnific Images ← MCP REQUIRED               │
│  ├─ Agent-5: Video Animation ← MCP REQUIRED               │
│  └─ Agent-6: Audio TTS ← MCP REQUIRED                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Ejecución Pipeline Completo

### Opción 1: Vía n8n (Producción)
```bash
# n8n llama a agent-server.js endpoints
POST http://10.254.80.29:3100/agent-0
POST http://10.254.80.29:3100/agent-1
# ... etc
```

### Opción 2: CLI Standalone (Testing)
```bash
# Conectar a servidor n8n
ssh desarrollo@10.254.80.29
cd ~/project-yt

# Definir versículo
VERSE="Mateo 11:28"

# PASO 1-4: Standalone agents
node agents/agent-0-verse-researcher.js "$VERSE"
node agents/agent-1-master-scriptwriter.js "$VERSE"
node agents/agent-2-image-designer.js "$VERSE"
node agents/agent-3-batch-generator.js "$VERSE"

# PASO 5-7: MCP agents (REQUIEREN CLAUDE CODE)
claude run agents/agent-4-magnific-mcp.js "$VERSE"
claude run agents/agent-5-video-animator.js "$VERSE"
claude run agents/agent-6-audio-voice.js "$VERSE"

# PASO 8-10: Standalone agents
node agents/agent-7-video-editor.js "$VERSE"
node agents/agent-8-youtube-seo.js "$VERSE"
node agents/agent-9-thumbnail-generator.js "$VERSE"
```

---

## 📁 Estructura de Archivos Generados

```
output/
├── agent-0-decision.json
│   {
│     "reference": "Mateo 11:28",
│     "category": "descanso",
│     ...
│   }
│
├── scripts/
│   └── script-Mateo-11-28-1785493073627.json
│       {
│         "verse": "Mateo 11:28",
│         "scenes": [...]
│       }
│
├── image-prompts/
│   └── visual-design-PRO-Mateo-11-28-{timestamp}.json
│       {
│         "verse": "Mateo 11:28",
│         "cinematicStyle": {...},
│         "scenes": [...]
│       }
│
├── image-batches/
│   └── batch-Mateo-11-28-{timestamp}.json
│       {
│         "verse": "Mateo 11:28",
│         "scenes": [{
│           "magnificParams": {
│             "prompt": "...",
│             "aspectRatio": "16:9",
│             "mode": "recraft-v4-1"
│           }
│         }]
│       }
│
├── images-generated/  ← Agent-4 MCP
│   └── images-Mateo-11-28-{timestamp}.json
│       {
│         "verse": "Mateo 11:28",
│         "scenes": [{
│           "identifier": "creation-abc123",
│           "url": "https://..."
│         }]
│       }
│
├── video-clips/  ← Agent-5 MCP
│   └── videos-Mateo-11-28-{timestamp}.json
│       {
│         "verse": "Mateo 11:28",
│         "clips": [{
│           "identifier": "creation-def456",
│           "url": "https://..."
│         }]
│       }
│
├── audio-metadata/  ← Agent-6 MCP
│   └── audio-Mateo-11-28-{timestamp}.json
│       {
│         "verse": "Mateo 11:28",
│         "magnificParams": {
│           "text": "...",
│           "voiceId": 863,
│           "model": "eleven_v3"
│         }
│       }
│
├── final-videos/  ← Agent-7
│   └── final-Mateo-11-28-{timestamp}.mp4
│
└── youtube-metadata/  ← Agent-8
    └── youtube-metadata-Mateo-11-28-{timestamp}.json
```

---

## 🐛 Bugs Corregidos (2026-07-31)

### Bug #1: HTTP Endpoints Operator Precedence ✅ FIXED
**Archivo:** `agent-server.js` (líneas 577, 633, 692, 745, 798)

**Problema:**
```javascript
// ❌ ANTES - Priorizaba Supabase sobre parámetro explícito
verse = scripts?.[0]?.verse_reference || req.body?.verse;
```

**Solución:**
```javascript
// ✅ DESPUÉS - Prioriza parámetro explícito
verse = req.body?.verse || scripts?.[0]?.verse_reference;
```

**Impacto del bug:**
- Usuario solicitaba "Salmos 23:1"
- Endpoint devolvía "Proverbios 3:5-6"
- ❌ Crítico para consistencia del pipeline

**Fix aplicado:**
```bash
cd ~/project-yt
sed -i 's/scripts?.\[0\]?.verse_reference || req.body?.verse/req.body?.verse || scripts?.[0]?.verse_reference/g' agent-server.js
pm2 restart agent-server
```

**Endpoints corregidos:**
- `/guardian-audio` (Agent-6)
- `/guardian-final-video` (Agent-7)
- `/guardian-seo` (Agent-8)
- `/guardian-upload` (YouTube upload)
- `/guardian-thumbnail` (Agent-9)

---

### Bug #2: Agent-1 Hardcoded Array ⚠️ WORKAROUND
**Archivo:** `agents/agent-1-master-scriptwriter.js`

**Problema:**
```javascript
const MASTER_VERSES = [
  { reference: "Isaías 41:10", ... },
  { reference: "Juan 3:16", ... },
  // ... 8 more hardcoded verses
];

// ❌ NO lee agent-0-decision.json
selectVerse(preference = 'random') {
  if (preference === 'random') {
    return MASTER_VERSES[Math.floor(Math.random() * MASTER_VERSES.length)];
  }
  return MASTER_VERSES.find(v => v.reference === preference) || MASTER_VERSES[0];
}
```

**Workaround:**
```bash
# ✅ Pasar versículo como argumento CLI
node agents/agent-1-master-scriptwriter.js "Mateo 11:28"

# ❌ Sin argumento usa MASTER_VERSES random
node agents/agent-1-master-scriptwriter.js
```

**Estado:** Mitigado pero NO resuelto completamente

---

### Bug #3: Agent-3 File Discovery ✅ FIXED
**Archivo:** `agents/agent-3-batch-generator.js` (líneas 119-169)

**Problema:**
```javascript
// ❌ ANTES - Usaba archivo más reciente SIN verificar versículo
const files = fs.readdirSync(DESIGN_DIR)
  .filter(f => f.startsWith('visual-design-PRO-') && f.endsWith('.json'))
  .sort((a, b) => b.time - a.time);

const latestDesign = files[0];  // ← Podría ser versículo incorrecto!
```

**Resultado:**
```
📂 Diseño encontrado: visual-design-PRO-Romanos-8-28-1785410684416.json
📖 Video: Romanos 8:28  ❌ (esperaba "Mateo 11:28")
```

**Solución:**
```javascript
// ✅ DESPUÉS - Requiere CLI parameter y verifica consistencia

// 1. Requiere parámetro CLI
const verseArg = process.argv[2];
if (!verseArg) {
  throw new Error('Debes proporcionar el versículo como argumento.\nUso: node agent-3-batch-generator.js "Mateo 11:28"');
}

// 2. Normaliza versículo (ej: "Mateo 11:28" → "Mateo-11-28")
const verseNormalized = verseArg.replace(/[:\s]/g, '-');

// 3. Filtra archivos por versículo
const files = fs.readdirSync(DESIGN_DIR)
  .filter(f => f.startsWith('visual-design-PRO-') && f.endsWith('.json'))
  .filter(f => f.name.includes(verseNormalized))  // ← NUEVO: Filtro por versículo
  .sort((a, b) => b.time - a.time);

if (files.length === 0) {
  throw new Error(`No se encontró diseño visual para el versículo: ${verseArg}\n` +
                  `Asegúrate de que Agent-2 haya generado el archivo visual-design-PRO-${verseNormalized}-*.json`);
}

// 4. Verifica consistencia
const designData = JSON.parse(fs.readFileSync(latestDesign.path, 'utf-8'));
if (designData.verse !== verseArg) {
  throw new Error(`Inconsistencia detectada:\n` +
                  `  - Versículo solicitado: ${verseArg}\n` +
                  `  - Versículo en archivo: ${designData.verse}\n` +
                  `Esto es un bug crítico de consistencia.`);
}

console.log(`✅ Verificación de consistencia: ${designData.verse} ✓\n`);
```

**Estado:** ✅ Completamente resuelto

---

## 📋 Requisitos de Consistencia de Versículos

### REGLA DE ORO
> "Si se selecciona un versículo, este va de comienzo a fin - 0 decisiones hardcoded, 0 prompts hardcoded"

### Checklist para Todos los Agentes

Cada agente DEBE:

1. ✅ **Recibir versículo como parámetro CLI**
   ```javascript
   const verseArg = process.argv[2];
   if (!verseArg) {
     throw new Error('Requiere versículo como argumento CLI');
   }
   ```

2. ✅ **Normalizar para nombres de archivo**
   ```javascript
   const verseNormalized = verseArg.replace(/[:\s]/g, '-');
   // "Mateo 11:28" → "Mateo-11-28"
   ```

3. ✅ **Filtrar archivos por versículo**
   ```javascript
   .filter(f => f.name.includes(verseNormalized))
   ```

4. ✅ **Verificar consistencia antes de procesar**
   ```javascript
   const metadata = JSON.parse(fs.readFileSync(inputFile));
   if (metadata.verse !== verseArg) {
     throw new Error(`Inconsistencia detectada: esperaba ${verseArg}, encontró ${metadata.verse}`);
   }
   ```

5. ✅ **Propagar versículo a metadata de salida**
   ```javascript
   const output = {
     verse: verseArg,  // ← Mismo versículo de entrada
     // ... resto de metadata
   };
   ```

### Patrón de Verificación Estándar

```javascript
/**
 * PATRÓN DE VERIFICACIÓN DE CONSISTENCIA
 * Copiar y pegar en cualquier agente
 */
function verifyVerseConsistency(expectedVerse, inputFile) {
  const metadata = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

  if (metadata.verse !== expectedVerse) {
    throw new Error(
      `❌ INCONSISTENCIA DETECTADA:\n` +
      `   Versículo esperado: "${expectedVerse}"\n` +
      `   Versículo en archivo: "${metadata.verse}"\n` +
      `   Archivo: ${inputFile}\n` +
      `\n` +
      `Esto indica un bug crítico de consistencia en el pipeline.`
    );
  }

  console.log(`✅ Verificación de consistencia: ${metadata.verse} ✓`);
  return metadata;
}

// Uso en cada agente
const verseArg = process.argv[2];
const metadata = verifyVerseConsistency(verseArg, inputFilePath);
```

---

## 💡 Debugging MCP Issues

### Si Agents 4, 5, 6 fallan con "Este agente debe ser ejecutado a través de Claude Code"

**Checklist de diagnóstico:**

1. ✅ **Verificar ubicación**
   ```bash
   hostname
   # Debe mostrar: servidor n8n (10.254.80.29)
   # Si estás en local, conecta: ssh desarrollo@10.254.80.29
   ```

2. ✅ **Verificar Claude Code instalado**
   ```bash
   claude --version
   # Debe mostrar: claude X.Y.Z
   ```

3. ✅ **Verificar MCP disponible**
   ```bash
   claude mcp list
   # Debe mostrar: magnific, n8n, github, etc.
   ```

4. ✅ **Ejecutar con `claude run` NO con `node`**
   ```bash
   # ❌ INCORRECTO
   node agents/agent-4-magnific-mcp.js "Mateo 11:28"

   # ✅ CORRECTO
   claude run agents/agent-4-magnific-mcp.js "Mateo 11:28"
   ```

5. ✅ **NO intentar hacer standalone**
   - Agents 4, 5, 6 REQUIEREN MCP
   - Esta arquitectura YA está funcionando
   - NO modificar para hacerlos standalone

### Error Común: "⚠️ Este agente debe ser ejecutado a través de Claude Code"

**Causa:** Ejecutar con `node` en lugar de `claude run`

**Solución:**
```bash
# En servidor n8n (10.254.80.29)
cd ~/project-yt
claude run agents/agent-4-magnific-mcp.js "Mateo 11:28"
```

---

## 🎯 Estado Actual del Pipeline (2026-07-31)

### ✅ Componentes Funcionando
- [x] Agent-0: Verse Researcher
- [x] Agent-1: Master Scriptwriter (con parámetro CLI)
- [x] Agent-2: Image Designer
- [x] Agent-3: Batch Generator (FIXED - verificación de consistencia)
- [x] Agent-4: Magnific MCP (via Claude Code en servidor n8n)
- [x] Agent-5: Video Animator (via Claude Code en servidor n8n)
- [x] Agent-6: Audio Voice (via Claude Code en servidor n8n)
- [x] Agent-7: Video Editor
- [x] Agent-8: SEO Expert
- [x] Agent-9: Thumbnail Generator
- [x] HTTP Endpoints (FIXED - operator precedence)

### ⚠️ Limitaciones Conocidas
- Agent-1 usa MASTER_VERSES hardcoded (workaround: pasar CLI param)
- Agents 4, 5, 6 requieren Claude Code (NO standalone)

### 🚫 NO Hacer
- ❌ Intentar hacer Agents 4, 5, 6 standalone
- ❌ Modificar configuración MCP
- ❌ Ejecutar Agents 4, 5, 6 con `node` (usar `claude run`)
- ❌ Ignorar verificación de consistencia de versículos

### ✅ Hacer Siempre
- ✅ Pasar versículo como parámetro CLI a todos los agentes
- ✅ Verificar consistencia en cada agente
- ✅ Ejecutar Agents 4, 5, 6 con `claude run` en servidor n8n
- ✅ Consultar esta documentación antes de modificar arquitectura

---

## 📞 Contacto y Referencias

**Servidor n8n:**
- Host: 10.254.80.29
- Usuario: desarrollo
- SSH: `ssh desarrollo@10.254.80.29`
- Proyecto: `~/project-yt/`

**PM2 Process:**
```bash
# Ver estado
pm2 status

# Restart agent-server
pm2 restart agent-server

# Ver logs
pm2 logs agent-server
```

**Archivos Clave:**
- `agent-server.js` - HTTP server (puerto 3100)
- `agents/agent-{0-9}.js` - Pipeline agents
- `/tmp/consistency-verification-report-mateo-11-28.md` - Reporte de testing
- `ARQUITECTURA-MCP.md` - Este documento

---

## 📝 Changelog

### 2026-07-31
- ✅ Corregido Bug #1: HTTP endpoints operator precedence
- ✅ Corregido Bug #3: Agent-3 file discovery
- ✅ Documentada arquitectura MCP completa
- ⚠️ Identificado Bug #2: Agent-1 hardcoded array (workaround aplicado)

---

**Última actualización:** 2026-07-31
**Autor:** Claude Code
**Propósito:** Prevenir pérdida de contexto sobre arquitectura MCP funcionante
