# 🛡️ Auditoría de Guardianes - Reporte de Problemas

## 📋 Resumen Ejecutivo

De **8 guardianes** analizados, **7 tienen problemas críticos** que violan el principio arquitectónico:
> **"ninguno de los procesos sean hardcoded, todos deben estar comunicados y funcionales"**

### Estado General

| Guardian | Stubbed Retry | No JSON | Sorting Alfabético | Lee Upstream | Estado |
|----------|--------------|---------|-------------------|--------------|--------|
| guardian-deduplication.js | ❓ | ❓ | ❓ | ❓ | ⏸️ Pendiente |
| guardian-images.js | ❌ Sí | ❌ Sí | ❌ Sí | ❌ No | 🔴 CRÍTICO |
| guardian-videos.js | ❌ Sí | ❌ Sí | ❌ Sí | ❌ No | 🔴 CRÍTICO |
| **guardian-videos-FIXED.js** | ✅ No | ✅ No | ✅ No | ✅ Sí | ✅ **CORRECTO** |
| guardian-audio.js | ❌ Sí | ❌ Sí | ❌ Sí | ❌ No | 🔴 CRÍTICO |
| guardian-final-video.js | ❌ Sí | ❌ Sí | ❓ | ❓ | 🔴 CRÍTICO |
| guardian-seo.js | ❓ | ❌ Sí | ❓ | ❓ | 🟡 MODERADO |
| guardian-thumbnail.js | ❓ | ❌ Sí | ❓ | ❓ | 🟡 MODERADO |
| guardian-upload.js | ❌ Sí | ❌ Sí | ❓ | ❓ | 🔴 CRÍTICO |

---

## 🔍 Problemas Detectados

### 1. ❌ Stubbed Retry (No Regeneración Real)

**Encontrado en**: 5 guardianes
- `guardian-images.js:311-323`
- `guardian-videos.js:365-385`
- `guardian-audio.js:283-292`
- `guardian-final-video.js` (por confirmar línea)
- `guardian-upload.js` (por confirmar línea)

**Patrón del problema**:
```javascript
async executeRetry(missing, strategy) {
  console.log(`\n🔧 Ejecutando retry para ${missing.length} items...`);

  // TODO: Integrar con Agent X para regenerar
  // const agentX = require('./agent-X.js');
  // await agentX.regenerate(this.verse, missing);  // ← COMENTADO!
}
```

**Impacto**:
- Guardian detecta problemas pero NO los soluciona
- Workflow n8n falla esperando que Guardian regenere
- Requiere intervención manual

**Solución**:
```javascript
async regenerateItems(missing) {
  const agentOutput = execSync(
    'bash run-agent-X.sh',
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 30 * 60 * 1000, cwd: path.join(__dirname, '..') }
  );

  // Recargar metadata
  this.loadMetadata();

  // Revalidar
  return this.validateItems();
}
```

---

### 2. ❌ No Retorna JSON Estructurado

**Encontrado en**: 7 guardianes (todos excepto guardian-videos-FIXED.js y posiblemente guardian-deduplication.js)

**Patrón del problema**:
```javascript
try {
  const result = await guardian.protect();
  console.log('\n✅ Guardian completado exitosamente\n');  // ← Solo texto
  process.exit(0);  // ← n8n no puede parsear esto
} catch (error) {
  console.error('\n❌ Guardian falló\n');  // ← Solo texto
  process.exit(1);  // ← n8n no recibe detalles del error
}
```

**Impacto**:
- n8n no puede parsear resultados
- No puede tomar decisiones basadas en estado
- Debugging difícil (no hay detalles estructurados)

**Solución**:
```javascript
const result = {
  success: true,
  verse: this.verse,
  guardianSuccess: true,
  totalExpected: this.totalExpected,
  totalValid: this.totalValid,
  totalMissing: this.totalMissing,
  retriesPerformed: this.retriesPerformed,
  metadata: {
    /* datos relevantes */
  }
};

console.log(JSON.stringify(result, null, 2));
return result;
```

---

### 3. ❌ Sorting Alfabético (No Timestamp)

**Encontrado en**: Al menos 3 guardianes
- `guardian-images.js:159`
- `guardian-audio.js:150`
- `guardian-videos.js:176`

**Patrón del problema**:
```javascript
const files = fs.readdirSync(DIR)
  .filter(f => f.includes(verseForFilename) && f.endsWith('.json'))
  .sort();  // ← Alfabético, no por timestamp!
```

**Impacto**:
- Puede leer archivos viejos en lugar de los más recientes
- Causa inconsistencias en pipeline

**Solución**:
```javascript
findLatestFile(directory, prefix, suffix = '.json') {
  const files = fs.readdirSync(directory)
    .filter(f => f.startsWith(prefix) && f.endsWith(suffix))
    .map(f => ({
      name: f,
      path: path.join(directory, f),
      timestamp: parseInt(f.match(/-(\d+)\.json$/)?.[1] || '0')
    }))
    .sort((a, b) => b.timestamp - a.timestamp);  // ← Más reciente primero

  return files[0];
}
```

---

### 4. ❌ No Lee Datos de Agentes Upstream

**Encontrado en**: 3 guardianes confirmados
- `guardian-images.js` - No lee Agent 2 (visual design), Agent 3 (batch)
- `guardian-videos.js` - No lee Agent 1 (script), Agent 2 (visual design), Agent 4 (images)
- `guardian-audio.js` - No lee Agent 1 (script) para saber escenas esperadas

**Patrón del problema**:
```javascript
loadMetadata() {
  // Solo lee su propio output directory
  const files = fs.readdirSync(VIDEO_METADATA_DIR)  // ← Solo un directorio
  // ...
}
```

**Impacto**:
- Guardian no tiene contexto completo
- No puede regenerar correctamente sin datos upstream
- Viola principio de comunicación entre agentes

**Solución** (ejemplo de guardian-videos-FIXED.js):
```javascript
// 1. Leer script (Agent 1)
loadScriptData() {
  const latestScript = this.findLatestFile(SCRIPTS_DIR, 'script-');
  this.scriptData = JSON.parse(fs.readFileSync(latestScript.path, 'utf-8'));
  this.totalVideosExpected = this.scriptData.scenes.length;
}

// 2. Leer visual design (Agent 2)
loadVisualDesignData() {
  const latestDesign = this.findLatestFile(VISUAL_DESIGN_DIR, 'visual-design-PRO-');
  this.visualDesignData = JSON.parse(fs.readFileSync(latestDesign.path, 'utf-8'));
}

// 3. Leer image metadata (Agent 4)
loadImageMetadata() {
  const latestImages = this.findLatestFile(IMAGE_METADATA_DIR, 'images-');
  this.imageMetadata = JSON.parse(fs.readFileSync(latestImages.path, 'utf-8'));
}
```

---

## 📊 Flujo de Datos Esperado

### Guardian Images (Agent 4 + Guardian)
```
Agent 2 (visual-design.json) → Prompts cinematográficos
    ↓
Agent 3 (batch.json) → Batches de imágenes
    ↓
Agent 4 (images.json) → Imágenes generadas
    ↓
Guardian Images:
  ✅ loadVisualDesignData() ← Lee Agent 2
  ✅ loadBatchData() ← Lee Agent 3
  ✅ loadImageMetadata() ← Lee Agent 4
  ✅ validateImages() ← Compara expected vs actual
  ✅ regenerateImages() ← Ejecuta Agent 4 si faltan
  ✅ Retorna JSON estructurado
```

### Guardian Videos (Agent 5 + Guardian) - YA CORREGIDO
```
Agent 1 (script.json) → Escenas + duraciones
    ↓
Agent 2 (visual-design.json) → Prompts cinematográficos
    ↓
Agent 4 (images.json) → Identifiers de imágenes
    ↓
Agent 5 (videos.json) → Videos generados
    ↓
Guardian Videos FIXED:
  ✅ loadScriptData() ← Lee Agent 1
  ✅ loadVisualDesignData() ← Lee Agent 2
  ✅ loadImageMetadata() ← Lee Agent 4
  ✅ loadVideoMetadata() ← Lee Agent 5
  ✅ validateVideos() ← Compara expected vs actual
  ✅ regenerateVideos() ← Ejecuta Agent 5 si faltan
  ✅ Retorna JSON estructurado
```

### Guardian Audio (Agent 6 + Guardian)
```
Agent 1 (script.json) → Voiceover de cada escena
    ↓
Agent 6 (audio.json) → Audio TTS generado
    ↓
Guardian Audio:
  ✅ loadScriptData() ← Lee Agent 1
  ✅ loadAudioMetadata() ← Lee Agent 6
  ✅ validateAudio() ← Verifica completitud
  ✅ regenerateAudio() ← Ejecuta Agent 6 si falta
  ✅ Retorna JSON estructurado
```

---

## 🎯 Plan de Corrección

### Prioridad CRÍTICA (bloquean pipeline)
1. ✅ **guardian-videos-FIXED.js** - YA COMPLETADO
2. 🔴 **guardian-images-FIXED.js** - Pendiente
3. 🔴 **guardian-audio-FIXED.js** - Pendiente
4. 🔴 **guardian-final-video-FIXED.js** - Pendiente

### Prioridad ALTA (afectan calidad)
5. 🟡 **guardian-upload-FIXED.js** - Pendiente

### Prioridad MEDIA (mejoras)
6. 🟢 **guardian-seo** - Revisar si necesita corrección
7. 🟢 **guardian-thumbnail** - Revisar si necesita corrección
8. 🟢 **guardian-deduplication** - Revisar si ya está correcto

---

## 📝 Template de Corrección

Para cada Guardian FIXED:

```javascript
#!/usr/bin/env node

/**
 * 👼 GUARDIAN {NAME} (FIXED)
 *
 * CAMBIOS vs VERSIÓN ANTERIOR:
 * ✅ Lee datos de Agent X, Y, Z (upstream)
 * ✅ Integra con Agent N para regeneración real
 * ✅ Retorna JSON estructurado para n8n
 * ✅ Usa timestamp-based sorting
 * ✅ NO hardcodea - todo fluye entre agentes
 */

class Guardian{Name}FIXED {
  constructor(verse) {
    this.verse = verse;
    this.verseSlug = verse.replace(/[:\s]/g, '-');

    // Datos upstream (NO HARDCODEADOS)
    this.upstreamData1 = null;
    this.upstreamData2 = null;
    // ...
  }

  findLatestFile(directory, prefix, suffix = '.json') {
    // ... timestamp-based sorting
  }

  loadUpstreamData1() {
    // Lee Agent X
  }

  loadUpstreamData2() {
    // Lee Agent Y
  }

  validateItems() {
    // Valida contra datos upstream
  }

  async regenerateItems(missing) {
    // Ejecuta Agent N via execSync('bash run-agent-N.sh')
    // Recarga metadata
    // Revalida
  }

  async protect() {
    // ...
    const result = {
      success: true,
      verse: this.verse,
      guardian{Name}Success: true,
      // ... campos relevantes
    };

    console.log(JSON.stringify(result, null, 2));
    return result;
  }
}
```

---

## 🔧 Actualizar agent-server.js

Para cada Guardian FIXED creado, actualizar endpoint en `agent-server.js`:

```javascript
// ANTES
node agents/guardian-{name}.js "${verse}"

// DESPUÉS
node agents/guardian-{name}-FIXED.js "${verse}"
```

---

**Última actualización**: 2026-08-03
**Guardianes auditados**: 8
**Guardianes con problemas**: 7
**Guardianes corregidos**: 1 (guardian-videos-FIXED.js)
**Guardianes pendientes**: 6
