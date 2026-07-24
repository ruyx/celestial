#!/usr/bin/env node

/**
 * MAGNIFIC MCP SERVER
 *
 * Servidor HTTP que actúa como puente entre n8n y Magnific MCP
 * n8n llama a este servidor, y este ejecuta las llamadas MCP
 *
 * Puerto: 3030
 * Endpoints:
 *   POST /generate-image - Genera una imagen con Magnific
 *   POST /generate-batch - Genera un batch completo de imágenes
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3030;
const OUTPUT_DIR = path.join(__dirname, '../output/images');
const METADATA_DIR = path.join(__dirname, '../output/image-metadata');

// Asegurar que existen los directorios
[OUTPUT_DIR, METADATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Servidor HTTP
 */
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        if (req.url === '/generate-image') {
          // Generar una sola imagen
          const result = await handleSingleImage(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));

        } else if (req.url === '/generate-batch') {
          // Generar batch completo
          const result = await handleBatch(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));

        } else if (req.url === '/health') {
          // Health check
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));

        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
        }

      } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });

  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

/**
 * Manejar generación de una sola imagen
 */
async function handleSingleImage(params) {
  console.log('\n🎨 Generando imagen individual...');
  console.log(`   Prompt: ${params.prompt.substring(0, 80)}...`);

  // NOTA: Este código se ejecutará desde Claude Code con acceso a MCP
  // Por ahora, guardamos las especificaciones para procesamiento manual

  const spec = {
    type: 'single',
    params: params,
    timestamp: Date.now(),
    status: 'pending'
  };

  const specFile = path.join(METADATA_DIR, `spec-single-${Date.now()}.json`);
  fs.writeFileSync(specFile, JSON.stringify(spec, null, 2));

  console.log(`   ✅ Especificación guardada: ${specFile}`);
  console.log(`   ⚠️  Requiere ejecución manual desde Claude Code con MCP`);

  return {
    success: true,
    message: 'Especificación guardada - requiere ejecución manual',
    specFile: specFile,
    requiresManualExecution: true
  };
}

/**
 * Manejar generación de batch completo
 */
async function handleBatch(batchData) {
  console.log('\n🎨 Generando batch de imágenes...');
  console.log(`   Video: ${batchData.verse}`);
  console.log(`   Escenas: ${batchData.scenes.length}`);
  console.log(`   Costo total: ${batchData.totalCost} créditos`);

  const spec = {
    type: 'batch',
    batch: batchData,
    timestamp: Date.now(),
    status: 'pending',
    images: []
  };

  const specFile = path.join(METADATA_DIR, `spec-batch-${batchData.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`);
  fs.writeFileSync(specFile, JSON.stringify(spec, null, 2));

  console.log(`   ✅ Especificación guardada: ${specFile}`);
  console.log(`   ⚠️  Requiere ejecución manual desde Claude Code con MCP`);
  console.log(`\n📋 Para ejecutar:`);
  console.log(`   1. Desde Claude Code, leer: ${specFile}`);
  console.log(`   2. Para cada escena, llamar: mcp__magnific__images_generate`);
  console.log(`   3. Esperar con: mcp__magnific__creations_wait`);
  console.log(`   4. Guardar URLs en metadata`);

  return {
    success: true,
    message: 'Especificación guardada - requiere ejecución manual',
    specFile: specFile,
    scenesCount: batchData.scenes.length,
    totalCost: batchData.totalCost,
    requiresManualExecution: true
  };
}

/**
 * Iniciar servidor
 */
server.listen(PORT, () => {
  console.log('\n🚀 Magnific MCP Server iniciado');
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/generate-image`);
  console.log(`   - POST http://localhost:${PORT}/generate-batch`);
  console.log(`   - POST http://localhost:${PORT}/health`);
  console.log(`\n⚠️  NOTA: Las generaciones MCP requieren ejecución manual desde Claude Code`);
  console.log(`\n✅ Listo para recibir peticiones de n8n\n`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});
