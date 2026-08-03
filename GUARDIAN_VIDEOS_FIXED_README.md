# Guardian Videos FIXED - Documentación

## ✅ Problemas Resueltos

El Guardian Videos original (`agents/guardian-videos.js`) tenía **4 problemas críticos** que violaban el principio arquitectónico "no hardcoding - todos los procesos comunicados y funcionales":

### 1. ❌ No leía datos de agentes upstream
**Problema**: Guardian no leía decisiones de Agent 1, 2, 4
- No conocía las escenas del script (Agent 1)
- No conocía el diseño visual (Agent 2)
- No conocía los identifiers de imágenes (Agent 4)

**Solución FIXED**:
```javascript
loadScriptData()        // Lee output/scripts/script-*.json
loadVisualDesignData()  // Lee output/image-prompts/visual-design-PRO-*.json
loadImageMetadata()     // Lee output/image-metadata/images-*.json
```

### 2. ❌ No regeneraba videos (código stubbed)
**Problema**: `executeRetry()` solo logueaba, no ejecutaba Agent 5

**Código original**:
```javascript
async executeRetry(missing, strategy) {
  console.log(`\n🔧 Ejecutando retry para ${missing.length} videos...`);

  missing.forEach(miss => {
    console.log(`   ↻ Reintentando Clip ${miss.clipId}`);
  });

  // TODO: Integrar con Agent 5 (Video Animator) para regenerar
  // const agent5 = require('./agent-5-video-animator.js');
  // await agent5.regenerateVideos(this.verse, missing);  // ← COMENTADO!
}
```

**Solución FIXED**:
```javascript
async regenerateVideos(missing) {
  const agent5Output = execSync(
    'bash run-agent-5.sh',
    {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30 * 60 * 1000,
      cwd: path.join(__dirname, '..')
    }
  );

  // Recargar metadata después de regeneración
  this.loadVideoMetadata();

  // Revalidar
  const stillMissing = this.validateVideos();
}
```

### 3. ❌ No retornaba JSON estructurado
**Problema**: Solo `console.log`, n8n no podía parsear resultado

**Código original**:
```javascript
console.log('\n✅ Guardian completado exitosamente\n');
process.exit(0); // ← n8n no puede parsear esto
```

**Solución FIXED**:
```javascript
const result = {
  success: true,
  verse: this.verse,
  guardianVideosSuccess: true,
  totalVideosExpected: this.totalVideosExpected,
  totalVideosValid: this.totalVideosValid,
  totalVideosMissing: this.totalVideosMissing,
  retriesPerformed: this.retriesPerformed,
  metadata: {
    scriptLoaded: !!this.scriptData,
    visualDesignLoaded: !!this.visualDesignData,
    imageMetadataLoaded: !!this.imageMetadata,
    videoMetadataLoaded: !!this.videoMetadata
  }
};

console.log(JSON.stringify(result, null, 2));
return result;
```

### 4. ❌ Ordenamiento alfabético (no timestamp)
**Problema**: `.sort()` alfabético en lugar de por timestamp

**Código original**:
```javascript
const files = fs.readdirSync(VIDEO_METADATA_DIR)
  .filter(f => f.includes(verseForFilename) && f.endsWith('.json'))
  .sort(); // ← Alfabético, no por tiempo
```

**Solución FIXED**:
```javascript
findLatestFile(directory, prefix, suffix = '.json') {
  const files = fs.readdirSync(directory)
    .filter(f => f.startsWith(prefix) && f.endsWith(suffix))
    .map(f => ({
      name: f,
      path: path.join(directory, f),
      timestamp: parseInt(f.match(/-(\d+)\.json$/)?.[1] || '0')
    }))
    .sort((a, b) => b.timestamp - a.timestamp); // ← Más reciente primero

  return files[0];
}
```

---

## 🔄 Flujo de Datos FIXED

```
Agent 1 (script.json)
    ↓
Agent 2 (visual-design.json)
    ↓
Agent 4 (images.json)
    ↓
Guardian Videos FIXED:
  1. loadScriptData() ← Lee Agent 1
  2. loadVisualDesignData() ← Lee Agent 2
  3. loadImageMetadata() ← Lee Agent 4
  4. loadVideoMetadata() ← Lee Agent 5 (si existe)
  5. validateVideos() ← Compara expected vs actual
  6. regenerateVideos() ← Ejecuta Agent 5 si faltan
  7. Retorna JSON estructurado
```

---

## 🧪 Cómo Probar

### Prueba Local

```bash
# 1. Asegurar que hay datos de agentes upstream
ls -lh output/scripts/script-*.json
ls -lh output/image-prompts/visual-design-PRO-*.json
ls -lh output/image-metadata/images-*.json

# 2. Ejecutar Guardian FIXED
node agents/guardian-videos-FIXED.js "Filipenses 4:13"

# 3. Verificar JSON output
# Debe imprimir JSON estructurado al final
```

### Prueba vía n8n

```bash
# 1. Iniciar agent-server (si no está corriendo)
node agent-server.js

# 2. Desde n8n, ejecutar el nodo "Guardian Videos + Agent 5"
# El endpoint ahora usa guardian-videos-FIXED.js
```

### Verificar cambios en agent-server.js

```bash
# Verificar que usa versión FIXED
grep "guardian-videos-FIXED" agent-server.js
```

Debería mostrar:
```javascript
node agents/guardian-videos-FIXED.js "${verse}"
```

---

## 📋 JSON Output Esperado

### Success Case
```json
{
  "success": true,
  "verse": "Filipenses 4:13",
  "guardianVideosSuccess": true,
  "totalVideosExpected": 5,
  "totalVideosValid": 5,
  "totalVideosMissing": 0,
  "retriesPerformed": 0,
  "metadata": {
    "scriptLoaded": true,
    "visualDesignLoaded": true,
    "imageMetadataLoaded": true,
    "videoMetadataLoaded": true
  }
}
```

### Error Case (con retry)
```json
{
  "success": false,
  "verse": "Filipenses 4:13",
  "guardianVideosSuccess": false,
  "error": "Max retries reached (3). Still missing 2 videos.",
  "errorLog": [
    "Regeneration failed: Agent 5 timeout"
  ],
  "retriesPerformed": 3
}
```

---

## 🔧 Configuración

### Variables de Entorno (heredadas)
No necesita configuración adicional - usa las mismas variables que agent-server.js:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
```

### Timeouts
```javascript
timeout: 30 * 60 * 1000  // 30 minutos para Agent 5 (video generation)
maxRetries: 3             // Máximo 3 intentos de regeneración
```

---

## 📊 Comparación Versión Antigua vs FIXED

| Característica | Versión Antigua | Versión FIXED |
|---------------|-----------------|---------------|
| Lee Agent 1 (script) | ❌ No | ✅ Sí |
| Lee Agent 2 (visual design) | ❌ No | ✅ Sí |
| Lee Agent 4 (images) | ❌ No | ✅ Sí |
| Regenera videos | ❌ Stubbed | ✅ Ejecuta Agent 5 |
| JSON estructurado | ❌ No | ✅ Sí |
| Timestamp sorting | ❌ Alfabético | ✅ Timestamp |
| Retry automático | ⚠️ Parcial | ✅ Completo |
| Validación completa | ⚠️ Parcial | ✅ Completa |

---

## 🎯 Próximos Pasos

1. **Probar localmente** con `Filipenses 4:13` (tiene imágenes generadas)
2. **Reiniciar agent-server** en `10.254.80.29:3100` para usar versión FIXED
3. **Re-ejecutar workflow n8n** desde nodo "Guardian Videos + Agent 5"
4. **Verificar que completa** sin errores y retorna JSON válido
5. **Continuar pipeline** hasta YouTube upload

---

## 🐛 Debugging

### Si Guardian falla con "No files found"

```bash
# Verificar que existen archivos upstream
ls -lh output/scripts/
ls -lh output/image-prompts/
ls -lh output/image-metadata/
```

### Si Agent 5 timeout

```bash
# Aumentar timeout en agent-server.js:
timeout: 45 * 60 * 1000  // 45 minutos en lugar de 30
```

### Si n8n no parsea JSON

Verificar que el output termina con JSON válido:
```bash
node agents/guardian-videos-FIXED.js "Test" 2>&1 | tail -20
```

---

**Última actualización**: 2026-08-03
**Versión**: 1.0-FIXED
**Autor**: Sistema Multi-Agente Autónomo
