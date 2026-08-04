#!/usr/bin/env node
/**
 * ============================================================================
 * Agent 4: Image Generator (FREE VERSION - Stable Diffusion via Replicate)
 * ============================================================================
 *
 * COSTO: $0 USD (Replicate free tier + open-source model)
 *
 * ALTERNATIVA PAGA: agents/ALTERNATIVES-PAID/agent-4-magnific-mcp.md
 * Magnific cuesta ~$5,000 créditos por 5 imágenes (~$5 USD)
 *
 * Esta versión usa:
 * - Stable Diffusion XL (modelo open-source)
 * - Replicate API (free tier: primeros $10 gratis, luego $0.003/imagen)
 * - Total: ~$0.015 por batch de 5 imágenes (vs $5 con Magnific)
 *
 * ============================================================================
 */

const fs = require('fs').promises;
const path = require('path');
const Replicate = require('replicate');

// Configuración
const BATCH_DIR = path.join(__dirname, '../output/image-batches');
const IMAGE_METADATA_DIR = path.join(__dirname, '../output/image-metadata');

// Inicializar Replicate (API key desde env)
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

/**
 * Convierte versículo a formato filename (espacios → -, : → -)
 */
function verseToFilename(verse) {
  return verse.replace(/\s+/g, '-').replace(/:/g, '-');
}

/**
 * Encuentra el batch file más reciente para un versículo específico
 */
async function findBatchFile(verse) {
  const verseFilename = verseToFilename(verse);
  const files = await fs.readdir(BATCH_DIR);

  // Filtrar solo archivos del versículo específico
  const verseBatches = files
    .filter(f => f.startsWith(`batch-${verseFilename}-`) && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BATCH_DIR, f),
      timestamp: parseInt(f.split('-').pop().replace('.json', ''))
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  if (verseBatches.length === 0) {
    throw new Error(`No se encontró batch file para el versículo: ${verse}`);
  }

  return verseBatches[0].path;
}

/**
 * Genera imagen con Stable Diffusion XL via Replicate
 */
async function generateImage(prompt, aspectRatio = '16:9') {
  console.log(`  🎨 Generando imagen con SDXL...`);
  console.log(`  📝 Prompt: ${prompt.substring(0, 80)}...`);

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          width: aspectRatio === '16:9' ? 1024 : 1024,
          height: aspectRatio === '16:9' ? 576 : 1024,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
          refine: "expert_ensemble_refiner",
          scheduler: "K_EULER",
          high_noise_frac: 0.8
        }
      }
    );

    // Replicate devuelve array de URLs
    const imageUrl = Array.isArray(output) ? output[0] : output;

    console.log(`  ✅ Imagen generada: ${imageUrl.substring(0, 60)}...`);

    return {
      url: imageUrl,
      model: 'stable-diffusion-xl',
      resolution: aspectRatio === '16:9' ? '1024x576' : '1024x1024',
      aspectRatio: aspectRatio,
      credits: 0, // FREE (dentro del free tier)
      provider: 'replicate'
    };
  } catch (error) {
    console.error(`  ❌ Error generando imagen: ${error.message}`);
    throw error;
  }
}

/**
 * Procesa un batch completo
 */
async function processBatch(verse) {
  console.log(`\n🎬 Iniciando Agent 4 (Stable Diffusion FREE)...`);
  console.log(`📖 Versículo: ${verse}\n`);

  // 1. Buscar batch file
  console.log('📂 Buscando batch file...');
  const batchPath = await findBatchFile(verse);
  console.log(`✅ Encontrado: ${path.basename(batchPath)}\n`);

  // 2. Leer batch
  const batchContent = await fs.readFile(batchPath, 'utf-8');
  const batch = JSON.parse(batchContent);

  console.log(`📋 Batch contiene ${batch.prompts.length} imágenes a generar\n`);

  // 3. Generar cada imagen
  const images = [];
  let totalCredits = 0;

  for (let i = 0; i < batch.prompts.length; i++) {
    const promptData = batch.prompts[i];
    console.log(`\n[${i + 1}/${batch.prompts.length}] Generando imagen para escena: ${promptData.sceneType}`);

    try {
      const result = await generateImage(promptData.prompt, promptData.aspectRatio);

      images.push({
        imageId: i + 1,
        sceneType: promptData.sceneType,
        prompt: promptData.prompt,
        aspectRatio: promptData.aspectRatio,
        url: result.url,
        model: result.model,
        resolution: result.resolution,
        credits: result.credits,
        provider: result.provider,
        status: 'completed',
        generatedAt: new Date().toISOString()
      });

      totalCredits += result.credits;

      // Pausa entre requests (rate limiting)
      if (i < batch.prompts.length - 1) {
        console.log(`  ⏳ Pausa 2s antes de siguiente imagen...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ❌ Error generando imagen ${i + 1}: ${error.message}`);

      // Guardar como failed
      images.push({
        imageId: i + 1,
        sceneType: promptData.sceneType,
        prompt: promptData.prompt,
        aspectRatio: promptData.aspectRatio,
        url: null,
        status: 'failed',
        error: error.message,
        generatedAt: new Date().toISOString()
      });
    }
  }

  // 4. Guardar metadata
  const verseFilename = verseToFilename(verse);
  const timestamp = Date.now();
  const metadataFilename = `images-${verseFilename}-${timestamp}.json`;
  const metadataPath = path.join(IMAGE_METADATA_DIR, metadataFilename);

  const metadata = {
    batchId: path.basename(batchPath),
    verse: verse,
    category: batch.category,
    images: images,
    generatedAt: new Date().toISOString(),
    provider: 'replicate-stable-diffusion-xl',
    totalImages: images.length,
    successfulImages: images.filter(img => img.status === 'completed').length,
    failedImages: images.filter(img => img.status === 'failed').length,
    totalCredits: totalCredits,
    costUSD: 0 // FREE tier
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`\n✅ Metadata guardada en: ${metadataFilename}`);
  console.log(`📊 Resumen:`);
  console.log(`   - Exitosas: ${metadata.successfulImages}/${metadata.totalImages}`);
  console.log(`   - Fallidas: ${metadata.failedImages}/${metadata.totalImages}`);
  console.log(`   - Créditos: ${totalCredits} (FREE)`);
  console.log(`   - Costo: $0 USD`);

  // Exit code basado en éxito
  if (metadata.failedImages > 0) {
    console.error(`\n❌ Algunas imágenes fallaron`);
    process.exit(1);
  } else {
    console.log(`\n✅ Todas las imágenes generadas exitosamente`);
    process.exit(0);
  }
}

// Ejecutar
const verse = process.argv[2];
if (!verse) {
  console.error('❌ Error: Se requiere el versículo como parámetro');
  console.error('Uso: node agent-4-stable-diffusion-free.js "Filipenses 4:13"');
  process.exit(1);
}

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ Error: REPLICATE_API_TOKEN no configurado en .env');
  console.error('');
  console.error('Obtén tu token gratis en: https://replicate.com/account/api-tokens');
  console.error('Luego agrégalo a .env:');
  console.error('  REPLICATE_API_TOKEN=r8_xxx...');
  process.exit(1);
}

processBatch(verse).catch(error => {
  console.error(`\n❌ Error fatal: ${error.message}`);
  process.exit(1);
});
