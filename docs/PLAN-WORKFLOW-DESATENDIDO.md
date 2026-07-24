# 🤖 Plan: Workflow 100% Desatendido

## 🎯 Objetivo
Ejecutar todo el pipeline (Agents 1-9) automáticamente vía n8n sin intervención humana.

## ❌ Problemas Encontrados Hoy

### 1. Moderación de Seedance
**Problema:** Clip bloqueado por `moderation rules`
```
Prompt original: "hands in prayer, celestial beam, divine illumination"
Error: "Seedance blocked this request due to moderation rules"
```

**Solución Implementada:**
```
Prompt modificado: "hands clasped in contemplation, warm golden light"
✅ Aprobado - Eliminando palabras trigger: prayer, celestial, divine, God
```

**Solución Definitiva: Aprendizaje + Validación**

### A. Pre-sanitización en Agent 2 (Visual Designer)
```javascript
// agents/agent-2-image-designer-pro.js
// NUEVO: Sanitizar prompts ANTES de generar batch

const MODERATION_PATTERNS = {
  // Palabras religiosas directas
  religious: {
    pattern: /\b(prayer|pray|praying|celestial|divine|God|Jesus|holy|sacred|Lord|Christ)\b/gi,
    replacements: {
      'prayer': 'contemplation',
      'praying': 'contemplating',
      'celestial beam': 'warm golden light',
      'celestial': 'ethereal',
      'divine': 'powerful',
      'God': 'nature',
      'Jesus': 'figure',
      'holy': 'meaningful',
      'sacred': 'meaningful',
      'Lord': 'presence',
      'Christ': 'figure'
    }
  },

  // Combinaciones que también disparan
  religiousCombos: {
    pattern: /(hands\s+in\s+prayer|hands\s+praying|divine\s+light|holy\s+spirit|sacred\s+moment)/gi,
    replacements: {
      'hands in prayer': 'hands clasped in contemplation',
      'hands praying': 'hands together in reflection',
      'divine light': 'powerful light',
      'holy spirit': 'powerful presence',
      'sacred moment': 'meaningful moment'
    }
  }
};

function sanitizePrompt(prompt) {
  let sanitized = prompt;

  // Aplicar cada patrón
  Object.values(MODERATION_PATTERNS).forEach(({ pattern, replacements }) => {
    Object.entries(replacements).forEach(([blocked, safe]) => {
      sanitized = sanitized.replace(new RegExp(blocked, 'gi'), safe);
    });
  });

  return sanitized;
}

// Aplicar a TODOS los prompts antes de guardar batch
scenes.forEach(scene => {
  scene.prompt = sanitizePrompt(scene.prompt);
  scene.originalPrompt = originalPrompt; // Guardar original para debugging
});
```

### B. Sistema de Validación Obligatoria en Agent 5
```javascript
// agents/agent-5-video-animator-retry.js
// CRÍTICO: NO AVANZAR si hay failures

async function processVideoGeneration(batch) {
  const results = [];
  let allSuccess = true;

  for (const scene of batch.scenes) {
    const result = await generateVideoWithRetry(scene);
    results.push(result);

    // Marcar si hubo fallo
    if (result.status === 'failed') {
      allSuccess = false;
      console.error(`❌ CRÍTICO: Clip ${scene.sceneId} falló después de 3 reintentos`);
    }
  }

  // 🚨 VALIDACIÓN OBLIGATORIA - NO CONTINUAR SI HAY FALLOS
  if (!allSuccess) {
    const failedIds = results.filter(r => r.status === 'failed').map(r => r.sceneId);

    console.error('\n❌❌❌ ERROR CRÍTICO ❌❌❌');
    console.error(`Clips fallidos: ${failedIds.join(', ')}`);
    console.error('El pipeline SE DETIENE AQUÍ.');
    console.error('NO se ejecutarán los agentes restantes (6-9).');
    console.error('\nRevisión manual requerida en:');
    console.error(`  output/video-metadata/videos-${batch.verse}.json`);

    // Guardar estado de error
    fs.writeFileSync(
      path.join(__dirname, `../output/video-metadata/videos-${batch.verse.replace(/[:\s]/g, '-')}.json`),
      JSON.stringify({
        ...batch,
        videos: results,
        status: 'FAILED',
        failedAt: new Date().toISOString(),
        failedClips: failedIds,
        error: 'Some clips failed after retries - manual intervention required'
      }, null, 2)
    );

    // 🛑 DETENER PIPELINE COMPLETO
    process.exit(1); // Exit code 1 = error (n8n lo detecta)
  }

  console.log('✅ TODOS los clips generados exitosamente');
  return results;
}

async function generateVideoWithRetry(scene, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateVideo(scene);

      if (result.status === 'failed') {
        if (result.failureReason.includes('moderation')) {
          console.log(`⚠️ Moderación en intento ${attempt}/${maxRetries}`);
          console.log(`   Esto NO debería pasar (ya sanitizamos en Agent 2)`);
          console.log(`   Aplicando sanitización adicional...`);

          // Sanitizar más agresivamente
          scene.prompt = scene.prompt
            .replace(/\b(hand|prayer|divine|celestial|holy)\b/gi, 'contemplative')
            .replace(/beam/gi, 'light');

          continue;
        }

        // Otro tipo de error
        if (attempt === maxRetries) {
          console.error(`❌ Fallo permanente: ${result.failureReason}`);
          return result; // Retornar fallo para que processVideoGeneration lo detecte
        }
      }

      return result; // Éxito

    } catch (error) {
      if (attempt === maxRetries) {
        return {
          sceneId: scene.sceneId,
          status: 'failed',
          failureReason: error.message,
          error: error.stack
        };
      }

      await sleep(5000);
    }
  }
}
```

### 2. Agent 4 usa API REST (menos robusto)
**Problema:** Polling simple sin verificación real de estado
**Solución:** Usar Magnific MCP (ya implementado manualmente)

**Para automatizar:**
```javascript
// agents/agent-4-magnific-mcp.js (nuevo)
const { execSync } = require('child_process');

function generateImagesViaMCP(batch) {
  const results = [];

  for (const scene of batch.scenes) {
    // Llamar a Magnific MCP vía Claude CLI
    const mcpCommand = `claude mcp call magnific images_generate --prompt "${scene.prompt}" --aspectRatio "${scene.aspectRatio}" --mode "${scene.model}"`;

    const output = execSync(mcpCommand, { encoding: 'utf-8' });
    const creation = JSON.parse(output);

    results.push({
      sceneId: scene.sceneId,
      identifier: creation.identifier,
      url: creation.url,
      status: 'queued'
    });
  }

  // Esperar a que completen usando creations_wait
  return waitForCreations(results.map(r => r.identifier));
}
```

## 🔧 Cambios Necesarios

### 1. Crear `agents/agent-4-magnific-mcp.js`
Reemplazar `agent-4-magnific-api.js` con wrapper MCP

### 2. Agregar sistema de retry en Agent 5
```javascript
async function generateVideoWithRetry(scene, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateVideo(scene);

      if (result.status === 'failed' && result.failureReason.includes('moderation')) {
        console.log(`❌ Moderación detectada, sanitizando prompt (intento ${attempt})...`);
        scene.prompt = sanitizePromptForSeedance(scene.prompt);
        continue;
      }

      return result;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`⚠️ Error, reintentando (${attempt}/${maxRetries})...`);
      await sleep(5000);
    }
  }
}
```

### 3. Actualizar `run-full-pipeline.sh`
```bash
#!/bin/bash
# Workflow 100% automático

VERSE="$1"
if [ -z "$VERSE" ]; then
  echo "❌ Error: Falta argumento <versículo>"
  echo "Uso: ./run-full-pipeline.sh \"Salmos 23:1\""
  exit 1
fi

echo "🚀 Pipeline Automático: $VERSE"
echo "================================"

# Agent 1: Script
echo "📝 Agent 1: Generando script..."
node agents/agent-1-viral-scriptwriter.js || exit 1

# Agent 2: Visual Design
echo "🎨 Agent 2: Diseñando visuales..."
node agents/agent-2-image-designer-pro.js || exit 1

# Agent 3: Batch
echo "📦 Agent 3: Preparando batch..."
node agents/agent-3-batch-generator.js || exit 1

# Agent 4: Images (NUEVO - MCP)
echo "🖼️  Agent 4: Generando imágenes con MCP..."
node agents/agent-4-magnific-mcp.js || exit 1

# Agent 5: Videos (CON RETRY)
echo "🎬 Agent 5: Animando videos..."
node agents/agent-5-video-animator-retry.js || exit 1

# Agent 6: Audio TTS
echo "🔊 Agent 6: Generando audio..."
node agents/agent-6-audio-voice-expert.js || exit 1

# Agent 7: Video Assembly
echo "🎞️  Agent 7: Ensamblando video final..."
node agents/agent-7-video-editor.js "$VERSE" || exit 1

# Agent 8: YouTube Upload
echo "📺 Agent 8: Subiendo a YouTube..."
node agents/agent-8-youtube-seo-expert.js "$VERSE" || exit 1

# Agent 9: Thumbnail
echo "🎨 Agent 9: Generando thumbnail..."
node agents/agent-9-thumbnail-generator.js "$VERSE" || exit 1

echo "✅ ¡Pipeline completado!"
echo "📊 Resultados en: output/"
```

### 4. n8n Workflow Configuration
```json
{
  "name": "YouTube Video Generator - Daily",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 12 * * *"
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger"
    },
    {
      "parameters": {
        "command": "cd /home/suario/ruy-projects/project-yt && ./run-full-pipeline.sh",
        "sendOutput": true
      },
      "name": "Execute Pipeline",
      "type": "n8n-nodes-base.executeCommand"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.stdout}}",
              "operation": "contains",
              "value2": "✅ ¡Pipeline completado!"
            }
          ]
        }
      },
      "name": "Check Success",
      "type": "n8n-nodes-base.if"
    },
    {
      "parameters": {
        "to": "tu@email.com",
        "subject": "✅ Video generado: {{$json.verse}}",
        "text": "{{$json.stdout}}"
      },
      "name": "Success Notification",
      "type": "n8n-nodes-base.emailSend"
    },
    {
      "parameters": {
        "to": "tu@email.com",
        "subject": "❌ Error en pipeline",
        "text": "{{$json.stderr}}"
      },
      "name": "Error Notification",
      "type": "n8n-nodes-base.emailSend"
    }
  ]
}
```

## 📋 Checklist Implementación (ACTUALIZADO)

### Fase 1: Pre-Sanitización (Evitar problemas desde el origen)
- [ ] Modificar `agents/agent-2-image-designer-pro.js`:
  - Agregar diccionario `MODERATION_PATTERNS` con palabras religiosas
  - Implementar `sanitizePrompt()` que aplica reemplazos
  - Aplicar a TODOS los prompts antes de guardar batch
  - Guardar `originalPrompt` para debugging

### Fase 2: Validación Obligatoria (No avanzar si hay fallos)
- [ ] Crear `agents/agent-5-video-animator-retry.js` (reemplaza agent-5):
  - Implementar `processVideoGeneration()` con validación `allSuccess`
  - Si `allSuccess === false` → `process.exit(1)` (detiene pipeline)
  - Guardar metadata con `status: 'FAILED'` y lista de clips fallidos
  - Implementar `generateVideoWithRetry()` con 3 intentos
  - Sanitización adicional en retry si detecta moderación

### Fase 3: MCP Integration (Robustez)
- [ ] Crear `agents/agent-4-magnific-mcp.js`:
  - Wrapper que llama `images_generate` vía MCP
  - Usa `creations_wait` para verificar completado real
  - Descarga imágenes a `output/images/`

### Fase 4: Shell Script & n8n
- [ ] Actualizar `run-full-pipeline.sh`:
  - Usar `||exit 1` en cada agente (bash fail-fast)
  - Agregar logging a `output/logs/pipeline-YYYYMMDD.log`
- [ ] Configurar n8n workflow:
  - Schedule Trigger diario (12:00 PM)
  - Execute Command con `sendOutput: true`
  - IF node que detecta exit code
  - Email notificaciones (éxito/error)

### Fase 5: Testing
- [ ] Probar pipeline completo 3 veces con diferentes versículos
- [ ] Validar que falla correctamente si hay moderación
- [ ] Validar que no avanza si Agent 5 detecta fallos
- [ ] Verificar logs y metadata en caso de error

## 🧪 Testing

```bash
# Test completo
./run-full-pipeline.sh "Juan 3:16"

# Validar cada agente por separado
node agents/agent-1-viral-scriptwriter.js
node agents/agent-2-image-designer-pro.js
# ... etc
```

## 🔍 Monitoreo

```bash
# Ver logs en tiempo real
tail -f output/logs/pipeline-$(date +%Y%m%d).log

# Verificar estado de n8n
n8n executions list --limit 10

# Revisar errores
grep -r "ERROR" output/logs/
```

## 💰 Costos Estimados (por video)

```
Agent 4: Imágenes (5 escenas × 60 créditos) = 300 créditos
Agent 5: Videos (10 clips × ~50 créditos)    = ~500 créditos
Agent 6: Audio TTS (~100 palabras)           = ~10 créditos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL POR VIDEO: ~810 créditos
TOTAL MENSUAL (30 videos): ~24,300 créditos
```

## 🚀 Despliegue Producción

1. **Instalar dependencias en servidor**
   ```bash
   cd /home/suario/ruy-projects/project-yt
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   nano .env  # Agregar API keys
   ```

3. **Hacer ejecutable el script**
   ```bash
   chmod +x run-full-pipeline.sh
   ```

4. **Importar workflow a n8n**
   ```bash
   n8n import:workflow --input=workflow-youtube-daily.json
   n8n start
   ```

5. **Verificar que funciona**
   ```bash
   # Ejecución manual
   ./run-full-pipeline.sh "Salmos 23:1"

   # Verificar resultado
   ls output/final-videos/
   ```

## 🧠 Aprendizaje Continuo de Patrones (Futuro)

### Sistema de Logging de Moderación
```javascript
// agents/utils/moderation-logger.js

function logModerationBlock(prompt, failureReason, scene) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    verse: scene.verse,
    sceneType: scene.type,
    originalPrompt: prompt,
    failureReason: failureReason,
    triggeredWords: extractTriggerWords(prompt, failureReason)
  };

  // Guardar en archivo de aprendizaje
  const logPath = path.join(__dirname, '../output/logs/moderation-blocks.jsonl');
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

  // Actualizar diccionario si detectamos palabra nueva
  if (logEntry.triggeredWords.length > 0) {
    updateModerationDictionary(logEntry.triggeredWords);
  }
}

function extractTriggerWords(prompt, failureReason) {
  // Analizar qué palabras específicas dispararon moderación
  // Esto requeriría análisis de la respuesta de Seedance
  // Por ahora, registrar prompt completo para análisis manual posterior
  return [];
}

function updateModerationDictionary(newWords) {
  // Agregar automáticamente a MODERATION_PATTERNS si confirmado
  // Requiere revisión manual inicial, luego puede ser automático
}
```

### Análisis Mensual de Logs
```bash
# Script para revisar patrones de moderación cada mes
# Identifica palabras/frases que consistentemente disparan bloqueos

node scripts/analyze-moderation-logs.js --last-30-days
# Output:
#   Palabras bloqueadas más comunes:
#   1. "prayer" - 12 veces
#   2. "celestial" - 8 veces
#   3. "divine light" - 5 veces
#
#   Sugerencias de reemplazo:
#   - "prayer" → "contemplation" (100% éxito en reintentos)
#   - "celestial" → "ethereal" (85% éxito)
```

## 📅 Próximos Pasos

### Inmediato (Hoy)
1. [ ] Terminar video actual (Isaías 41:10) - esperando clips 7 y 8
2. [ ] Guardar experiencia de hoy en memoria (Engram)

### Corto Plazo (Esta Semana)
3. [ ] Implementar cambios documentados aquí:
   - Fase 1: Pre-sanitización en Agent 2
   - Fase 2: Validación obligatoria en Agent 5
   - Fase 3: MCP wrapper en Agent 4
4. [ ] Probar pipeline completo 3 veces con diferentes versículos
5. [ ] Configurar n8n workflow con Schedule Trigger diario

### Mediano Plazo (Este Mes)
6. [ ] Activar n8n daily trigger (después de 3 pruebas exitosas)
7. [ ] Monitorear primera semana
8. [ ] Revisar logs de moderación y ajustar diccionario
9. [ ] Implementar sistema de logging de moderación

### Largo Plazo (Próximos Meses)
10. [ ] Sistema de aprendizaje automático de patrones
11. [ ] Análisis mensual de logs para mejorar diccionario
12. [ ] Optimización de prompts basada en data histórica
