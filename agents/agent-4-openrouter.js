#!/usr/bin/env node

/**
 * AGENTE 4: GENERADOR DE IMÁGENES VÍA OPENROUTER API
 *
 * Genera imágenes usando OpenRouter API (Ideogram v2)
 * Versión standalone que funciona en Render.com sin dependencias de MCP
 *
 * Flujo:
 * 1. Lee el batch más reciente de image-batches/
 * 2. Para cada escena, llama a OpenRouter API
 * 3. Espera a que las imágenes se generen
 * 4. Guarda metadata completa con URLs en image-metadata/
 */

const fs = require('fs');
const path = require('path');

// Configuración
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const IMAGE_MODEL = 'black-forest-labs/flux.2-klein-4b'; // Modelo de imágenes en OpenRouter (rápido y económico - Flux.2)

if (!OPENROUTER_API_KEY) {
  console.error('❌ Error: OPENROUTER_API_KEY no está configurada');
  process.exit(1);
}

// Encontrar el batch más reciente automáticamente
function findLatestBatch() {
  const batchDir = path.join(__dirname, '../output/image-batches');

  if (!fs.existsSync(batchDir)) {
    throw new Error('❌ No existe el directorio de batches. Ejecuta primero Agent-3 (Batch Generator).');
  }

  const files = fs.readdirSync(batchDir)
    .filter(f => f.startsWith('batch-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(batchDir, f),
      time: fs.statSync(path.join(batchDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error('❌ No se encontró ningún batch generado. Ejecuta primero Agent-3 (Batch Generator).');
  }

  console.log(`✅ Batch encontrado: ${files[0].name}`);
  return files[0].path;
}

/**
 * Genera una imagen usando OpenRouter API
 */
async function generateImage(prompt, aspectRatio, sceneId) {
  console.log(`\n🎨 Generando imagen para escena ${sceneId}...`);
  console.log(`📝 Prompt (primeros 80 chars): ${prompt.substring(0, 80)}...`);

  // OpenRouter espera un formato de chat para modelos de imagen
  // Ideogram v2 puede recibir el prompt directamente
  const requestBody = {
    model: IMAGE_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    // Parámetros específicos para Ideogram
    max_tokens: 1000,
    temperature: 0.8
  };

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://retea.vercel.app',
        'X-Title': 'Retea Video Generator'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // OpenRouter devuelve la URL de la imagen en el contenido de la respuesta
    // El formato exacto depende del modelo, pero típicamente está en choices[0].message.content
    const imageUrl = extractImageUrl(data);

    if (!imageUrl) {
      console.error('⚠️  Respuesta completa:', JSON.stringify(data, null, 2));
      throw new Error('No se pudo extraer la URL de la imagen de la respuesta');
    }

    console.log(`✅ Imagen generada: ${imageUrl.substring(0, 60)}...`);

    return {
      url: imageUrl,
      identifier: `openrouter-${sceneId}-${Date.now()}`,
      status: 'completed',
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Error generando imagen: ${error.message}`);
    return {
      url: '',
      identifier: '',
      status: 'failed',
      error: error.message,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Extrae la URL de la imagen de la respuesta de OpenRouter
 * El formato puede variar según el modelo
 */
function extractImageUrl(response) {
  try {
    // Caso 1: La URL está directamente en el contenido del mensaje
    if (response.choices && response.choices[0] && response.choices[0].message) {
      const content = response.choices[0].message.content;

      // Si el contenido es una URL directa
      if (typeof content === 'string' && content.startsWith('http')) {
        return content;
      }

      // Si el contenido contiene markdown con imagen
      const markdownMatch = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
      if (markdownMatch) {
        return markdownMatch[1];
      }

      // Si el contenido contiene solo la URL
      const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
    }

    // Caso 2: Algunos modelos devuelven un objeto con url
    if (response.data && response.data.url) {
      return response.data.url;
    }

    return null;
  } catch (error) {
    console.error('Error extrayendo URL:', error.message);
    return null;
  }
}

/**
 * Procesa el batch completo de imágenes
 */
async function processBatch() {
  console.log('🚀 Agente 4: OpenRouter Image Generator');
  console.log('=========================================\n');

  const BATCH_FILE = findLatestBatch();
  const batch = JSON.parse(fs.readFileSync(BATCH_FILE, 'utf-8'));

  console.log(`📖 Video: ${batch.verse}`);
  console.log(`🎬 Escenas: ${batch.scenes.length}`);
  console.log(`🤖 Modelo: ${IMAGE_MODEL}`);
  console.log(`💰 Costo estimado: ${batch.totalCost} créditos\n`);

  const results = {
    videoId: batch.videoId,
    verse: batch.verse,
    category: batch.category,
    images: [],
    generatedAt: new Date().toISOString(),
    model: IMAGE_MODEL
  };

  // Generar imágenes secuencialmente para evitar rate limits
  for (let i = 0; i < batch.scenes.length; i++) {
    const scene = batch.scenes[i];

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎬 Escena ${i + 1}/${batch.scenes.length}: ${scene.type.toUpperCase()}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 Prompt: ${scene.prompt}`);
    console.log(`📐 Aspect Ratio: ${scene.aspectRatio}`);
    console.log(`🎯 Resolución: ${scene.resolution}`);

    const imageResult = await generateImage(
      scene.prompt,
      scene.aspectRatio,
      scene.sceneId
    );

    results.images.push({
      sceneId: scene.sceneId,
      type: scene.type,
      taskId: imageResult.identifier,
      status: imageResult.status,
      url: imageResult.url,
      identifier: imageResult.identifier,
      generated: imageResult.url ? [imageResult.url] : [],
      error: imageResult.error,
      estimatedCost: scene.estimatedCost,
      prompt: scene.prompt,
      aspectRatio: scene.aspectRatio,
      resolution: scene.resolution,
      generatedAt: imageResult.generatedAt
    });

    // Pequeña pausa entre imágenes para evitar rate limits
    if (i < batch.scenes.length - 1) {
      console.log('\n⏳ Esperando 2 segundos antes de la siguiente imagen...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Guardar metadata
  const METADATA_FILE = path.join(
    __dirname,
    `../output/image-metadata/images-${batch.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`
  );

  fs.writeFileSync(METADATA_FILE, JSON.stringify(results, null, 2));

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  RESUMEN DE GENERACIÓN                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const completed = results.images.filter(img => img.status === 'completed').length;
  const failed = results.images.filter(img => img.status === 'failed').length;

  console.log(`✅ Exitosas: ${completed}/${batch.scenes.length}`);
  console.log(`❌ Fallidas: ${failed}/${batch.scenes.length}`);
  console.log(`📁 Metadata guardada: ${METADATA_FILE}\n`);

  if (failed > 0) {
    console.log('⚠️  Advertencia: Algunas imágenes fallaron. Revisa los errores arriba.\n');
  }

  return results;
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  processBatch()
    .then((results) => {
      const completed = results.images.filter(img => img.status === 'completed').length;
      const failed = results.images.filter(img => img.status === 'failed').length;

      if (failed > 0) {
        console.error(`\n❌ Proceso completado con errores: ${failed} imágenes fallaron`);
        process.exit(1);
      } else {
        console.log(`\n✅ Proceso completado exitosamente: ${completed} imágenes generadas`);
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { processBatch };
