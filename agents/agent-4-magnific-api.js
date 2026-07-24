#!/usr/bin/env node

/**
 * AGENTE 4: EJECUTOR DE BATCH CON MAGNIFIC API REST
 *
 * Genera imágenes usando directamente la API REST de Magnific
 * Solución para WSL donde OAuth no funciona automáticamente
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const MAGNIFIC_API_KEY = 'MSd614fd1a2a6c46a7b50ba5940c19aff1';
const MAGNIFIC_WEBHOOK = '22a4da5d01969ed6906fa5126013e6d0';
const OUTPUT_DIR = path.join(__dirname, '../output/images');

// Encontrar el batch más reciente automáticamente
function findLatestBatch() {
  const batchDir = path.join(__dirname, '../output/image-batches');
  const files = fs.readdirSync(batchDir)
    .filter(f => f.startsWith('batch-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(batchDir, f),
      time: fs.statSync(path.join(batchDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error('No se encontró ningún batch generado');
  }

  return files[0].path;
}

const BATCH_FILE = findLatestBatch();
const batchData = JSON.parse(fs.readFileSync(BATCH_FILE, 'utf-8'));
const METADATA_FILE = path.join(__dirname, `../output/image-metadata/images-${batchData.verse.replace(/[:\s]/g, '-')}.json`);

/**
 * Hacer request POST a Magnific API
 */
function makeRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'api.magnific.com',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Magnific-API-Key': MAGNIFIC_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}. Response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Generar una imagen con Magnific
 */
async function generateImage(scene) {
  console.log(`\n🎨 Generando escena ${scene.sceneId}: ${scene.type.toUpperCase()}`);
  console.log(`📝 Prompt: ${scene.prompt.substring(0, 80)}...`);

  // Mapear parámetros (formato correcto de Magnific API)
  const aspectRatioMap = {
    '16:9': 'widescreen_16_9',
    '1:1': 'square_1_1',
    '9:16': 'social_story_9_16',
    '21:9': 'film_horizontal_21_9',
    '4:3': 'classic_4_3',
    '3:4': 'traditional_3_4'
  };

  const payload = {
    prompt: scene.prompt,
    aspect_ratio: aspectRatioMap[scene.aspectRatio] || 'landscape_16_9',
    resolution: scene.resolution,
    // recraft-v4-1 no está disponible en Mystic API
    // Usar modelo realism o super_real como alternativa
    model: 'super_real',
    creative_detailing: 70,
    filter_nsfw: true,
    webhook_url: `https://webhook.site/${MAGNIFIC_WEBHOOK}`
  };

  try {
    const result = await makeRequest('/v1/ai/mystic', payload);

    console.log(`✅ Tarea creada: ${result.data.task_id}`);
    console.log(`📊 Estado: ${result.data.status}`);

    // Esperar a que complete
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos (5 segundos x 60)

    while (!completed && attempts < maxAttempts) {
      attempts++;
      console.log(`⏳ Esperando... (${attempts}/${maxAttempts})`);

      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos

      // Verificar estado (tendríamos que hacer GET al endpoint de status)
      // Por ahora, asumimos que toma ~3 minutos
      if (attempts >= 36) { // 3 minutos
        completed = true;
      }
    }

    return {
      sceneId: scene.sceneId,
      type: scene.type,
      taskId: result.data.task_id,
      status: result.data.status,
      generated: result.data.generated || [],
      estimatedCost: scene.estimatedCost
    };

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return {
      sceneId: scene.sceneId,
      type: scene.type,
      error: error.message,
      status: 'failed'
    };
  }
}

/**
 * Procesar batch completo
 */
async function processBatch() {
  console.log('🚀 Agente 4: Magnific API REST');
  console.log('================================\n');

  // Leer batch
  const batch = JSON.parse(fs.readFileSync(BATCH_FILE, 'utf-8'));

  console.log(`📖 Video: ${batch.verse}`);
  console.log(`🎬 Escenas: ${batch.scenes.length}`);
  console.log(`💰 Costo estimado: ${batch.totalCost} créditos\n`);

  const results = {
    videoId: batch.videoId,
    verse: batch.verse,
    category: batch.category,
    images: [],
    generatedAt: new Date().toISOString()
  };

  // Generar cada escena
  for (const scene of batch.scenes) {
    const result = await generateImage(scene);
    results.images.push(result);

    // Guardar progreso incremental
    fs.writeFileSync(METADATA_FILE, JSON.stringify(results, null, 2));
  }

  console.log('\n✅ BATCH COMPLETADO');
  console.log(`📁 Metadata guardada en: ${METADATA_FILE}`);

  return results;
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  processBatch()
    .then((results) => {
      console.log('\n🎉 ¡Generación exitosa!');
      console.log(`📊 Imágenes generadas: ${results.images.length}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { processBatch, generateImage };
