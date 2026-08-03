# Agent-4: Magnific Image Generator

## ⚠️ IMPORTANTE: Requiere Intervención de Claude Code

**Este agente NO puede ejecutarse de forma completamente autónoma** debido a limitaciones del Model Context Protocol (MCP).

## Limitación Técnica

### Por qué no es autónomo

Los MCP tools (Model Context Protocol) de Magnific **solo funcionan desde Claude Code**, no desde scripts Node.js standalone. Esto significa que:

- ❌ **No funciona**: Ejecutar `node agents/agent-4-magnific-api.js` directamente
- ✅ **Sí funciona**: Ejecutar desde Claude Code con acceso a MCP

### Alternativa intentada (REST API)

Se intentó usar la REST API de Magnific, pero presenta problemas:
- Crea tasks correctamente
- **No implementa status polling** - no verifica si las tareas se completaron
- Solo espera 3 minutos y asume que completó (código en líneas 140-144)
- Nunca obtiene las URLs de las imágenes generadas

**Resultado**: Genera metadata con `status: "CREATED"` y arrays `generated: []` vacíos.

## Solución Actual

Agent-4 ahora funciona en dos pasos:

### Paso 1: Crear Metadata Placeholder (Autónomo)

```bash
node agents/agent-4-magnific-api.js
```

**Salida**:
- Crea archivo `/output/image-metadata/images-{verse}.json`
- Inicializa 5 escenas con `status: "CREATED"`
- Muestra instrucciones para generar imágenes vía MCP

### Paso 2: Generar Imágenes (Requiere Claude Code)

Desde Claude Code, ejecutar para cada escena:

```javascript
// Generar imagen
const result = await mcp__magnific__images_generate({
  prompt: scene.prompt,
  aspectRatio: scene.aspectRatio,
  mode: scene.model,  // ej: "recraft-v4-1"
  count: 1
});

// Esperar completitud
const completed = await mcp__magnific__creations_wait({
  identifiers: [result.identifier],
  timeoutSeconds: 25
});

// Actualizar metadata con identifier, url, status: "COMPLETED"
```

## Impacto en Métricas de Autonomía

### Antes (con REST API rota)
- ✅ Autonomía: 100% (sin intervención manual)
- ❌ Confiabilidad: 100% pero **FALSA** (genera metadata pero sin imágenes reales)
- 📊 Score: 87%

### Ahora (con MCP + intervención)
- ❌ Autonomía: 0% (requiere intervención de Claude Code)
- ✅ Confiabilidad: 100% **REAL** (genera imágenes reales)
- 📊 Score: ~50% (reducido por falta de autonomía)

**Trade-off aceptado**: Preferimos **funcionalidad real** sobre **falsa autonomía**.

## Ejemplo Completo: Fix #11

### Caso: Romanos 8:28

**Paso 1 - Metadata Inicial** (Autónomo):
```json
{
  "verse": "Romanos 8:28",
  "images": [
    {
      "sceneId": 1,
      "type": "hook",
      "status": "CREATED",
      "generated": [],
      "prompt": "Dawn sky with first light..."
    }
  ]
}
```

**Paso 2 - Generación vía MCP** (Intervención Claude Code):
```javascript
// 5 llamadas paralelas a mcp__magnific__images_generate
// Costo: 300 créditos (60 por escena)
// Tiempo: ~25 segundos
```

**Paso 3 - Metadata Actualizado**:
```json
{
  "verse": "Romanos 8:28",
  "images": [
    {
      "sceneId": 1,
      "type": "hook",
      "identifier": "LUjpCEZswO",
      "url": "https://pikaso.cdnpk.net/private/production/4996569105/render.png?...",
      "status": "COMPLETED",
      "generated": [
        {
          "url": "https://pikaso.cdnpk.net/private/production/4996569105/render.png?...",
          "thumbnailUrl": "https://pikaso.cdnpk.net/private/production/4996569105/conversions/render-preview.jpg?..."
        }
      ]
    }
  ]
}
```

## Output Esperado

Cuando Agent-4 completa correctamente (con intervención MCP):

- ✅ Archivo: `/output/image-metadata/images-{verse}.json`
- ✅ Estructura: 5 escenas correspondientes al batch
- ✅ Cada escena con:
  - `identifier`: Creation identifier de Magnific
  - `url`: URL de la imagen full-res
  - `thumbnailUrl`: URL del thumbnail
  - `status`: "COMPLETED"
  - `generated`: Array con objeto {url, thumbnailUrl}

## Agentes Downstream

Agent-5 (Video Animator) depende de que Agent-4 genere metadata con URLs reales:

```javascript
// Agent-5 lee images-{verse}.json
const imageMetadata = JSON.parse(fs.readFileSync(IMAGES_FILE));

// Para cada escena, usa imageUrl en video spec
imageMetadata.images.forEach(img => {
  clips.push({
    imageUrl: img.url,  // ← Necesita URL real
    imageIdentifier: img.identifier,
    // ...
  });
});
```

**Sin URLs reales**: Agent-5 falla al crear especificación de video.

## Mejora Futura Posible

Si Magnific mejora su REST API para incluir:
1. Endpoint de status polling
2. Endpoint para obtener URLs de tareas completadas

Entonces Agent-4 podría volver a ser autónomo usando REST API.

Hasta entonces, la intervención de Claude Code es **necesaria** para funcionalidad real.

## Conclusión

**Agent-4 sacrifica autonomía por confiabilidad**:
- Prefiere generar imágenes reales que metadata vacía
- Requiere intervención humana vía Claude Code
- Mantiene consistencia en pipeline: Agent-5 puede proceder con datos válidos
