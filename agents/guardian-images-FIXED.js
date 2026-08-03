#!/usr/bin/env node

/**
 * 👼 GUARDIAN IMAGES (FIXED)
 *
 * Valida que todas las imágenes se hayan generado correctamente
 *
 * CAMBIOS vs VERSIÓN ANTERIOR:
 * ✅ Lee datos de Agent 2 (visual design), Agent 3 (batch)
 * ✅ Integra con Agent 4 para regeneración real
 * ✅ Retorna JSON estructurado para n8n
 * ✅ Usa timestamp-based sorting (no alfabético)
 * ✅ NO hardcodea - todo fluye entre agentes
 *
 * ARQUITECTURA:
 * - Agent 2 → visual-design.json (prompts cinematográficos)
 * - Agent 3 → batch.json (estructura de batches)
 * - Agent 4 → images.json (imágenes generadas)
 * - Guardian Images → valida + regenera + retorna JSON
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGE_METADATA_DIR = path.join(__dirname, '../output/image-metadata');
const VISUAL_DESIGN_DIR = path.join(__dirname, '../output/image-prompts');
const BATCH_DIR = path.join(__dirname, '../output/image-batches');

// Configuración
const MAX_RETRIES = 3;
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

class GuardianImagesFIXED {
  constructor(verse) {
    this.verse = verse;
    this.verseSlug = verse.replace(/[:\s]/g, '-');

    // Datos de agentes upstream (NO HARDCODEADOS)
    this.visualDesignData = null;
    this.batchData = null;
    this.imageMetadata = null;

    // Estado de validación
    this.totalImagesExpected = 0;
    this.totalImagesValid = 0;
    this.totalImagesMissing = 0;
    this.retriesPerformed = 0;
    this.maxRetries = MAX_RETRIES;
    this.startTime = Date.now();
    this.errorLog = [];
  }

  /**
   * Helper: Encontrar archivo más reciente por timestamp FILTRADO POR VERSÍCULO
   */
  findLatestFile(directory, prefix, suffix = '.json') {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory not found: ${directory}`);
    }

    // CRÍTICO: Convertir versículo a formato de filename para filtrado correcto
    const verseFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');

    const files = fs.readdirSync(directory)
      .filter(f => {
        // Filtro 1: Debe empezar con el prefix
        if (!f.startsWith(prefix)) return false;

        // Filtro 2: Debe terminar con el suffix
        if (!f.endsWith(suffix)) return false;

        // Filtro 3: CRÍTICO - Debe contener el versículo específico
        // Ejemplo: "batch-Salmos-23-1-1785754470254.json" debe coincidir con "Salmos-23-1"
        if (!f.includes(verseFilename)) return false;

        return true;
      })
      .map(f => ({
        name: f,
        path: path.join(directory, f),
        timestamp: parseInt(f.match(/-(\d+)\.json$/)?.[1] || '0')
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    if (files.length === 0) {
      throw new Error(`No files found in ${directory} with prefix "${prefix}" for verse "${verseFilename}"`);
    }

    return files[0];
  }

  /**
   * 1. Cargar datos de Agent 2 (Visual Design)
   */
  loadVisualDesignData() {
    console.log('\n🎨 Cargando datos de Agent 2 (Visual Design)...');

    try {
      const latestDesign = this.findLatestFile(VISUAL_DESIGN_DIR, 'visual-design-PRO-');
      console.log(`   ✅ Visual design encontrado: ${latestDesign.name}`);

      this.visualDesignData = JSON.parse(fs.readFileSync(latestDesign.path, 'utf-8'));

      console.log(`   🎬 Estilo: ${this.visualDesignData.cinematicStyle?.styleReference || 'N/A'}`);
      console.log(`   📊 Escenas diseñadas: ${this.visualDesignData.scenes?.length || 0}`);

    } catch (error) {
      throw new Error(`Failed to load visual design data: ${error.message}`);
    }
  }

  /**
   * 2. Cargar datos de Agent 3 (Batch)
   */
  loadBatchData() {
    console.log('\n📦 Cargando datos de Agent 3 (Batch)...');

    try {
      const latestBatch = this.findLatestFile(BATCH_DIR, 'batch-');
      console.log(`   ✅ Batch encontrado: ${latestBatch.name}`);

      this.batchData = JSON.parse(fs.readFileSync(latestBatch.path, 'utf-8'));

      const scenes = this.batchData.scenes || this.batchData.imagePrompts || this.batchData.prompts || [];
      this.totalImagesExpected = scenes.length;

      console.log(`   📊 Imágenes esperadas: ${this.totalImagesExpected}`);

    } catch (error) {
      throw new Error(`Failed to load batch data: ${error.message}`);
    }
  }

  /**
   * 3. Cargar metadata de imágenes (Agent 4)
   */
  loadImageMetadata() {
    console.log('\n🖼️  Cargando metadata de imágenes (Agent 4)...');

    try {
      const latestImages = this.findLatestFile(IMAGE_METADATA_DIR, 'images-');
      console.log(`   ✅ Image metadata encontrado: ${latestImages.name}`);

      this.imageMetadata = JSON.parse(fs.readFileSync(latestImages.path, 'utf-8'));

      const images = this.imageMetadata.images || this.imageMetadata.scenes || [];
      console.log(`   📊 Imágenes generadas: ${images.length}`);

      // VALIDACIÓN CRÍTICA: Verificar que el metadata corresponde al batch actual
      const metadataVideoId = this.imageMetadata.videoId;
      const batchVideoId = this.batchData?.videoId;

      if (metadataVideoId && batchVideoId && metadataVideoId !== batchVideoId) {
        console.log(`   ⚠️  Metadata es de un batch diferente!`);
        console.log(`      Metadata videoId: ${metadataVideoId}`);
        console.log(`      Batch videoId: ${batchVideoId}`);
        console.log(`   🗑️  Descartando metadata antiguo - se necesita regeneración completa`);
        this.imageMetadata = null;
        return false;
      }

      return true;

    } catch (error) {
      console.log(`   ⚠️  No image metadata found: ${error.message}`);
      this.imageMetadata = null;
      return false;
    }
  }

  /**
   * 4. Validar que todas las imágenes existan
   */
  validateImages() {
    console.log('\n🔍 Validando imágenes...');

    if (!this.imageMetadata || !this.imageMetadata.images) {
      console.log('   ❌ No image metadata found - all images need to be generated');
      this.totalImagesMissing = this.totalImagesExpected;
      return [];
    }

    const images = this.imageMetadata.images || this.imageMetadata.scenes || [];
    const expectedScenes = this.visualDesignData.scenes || [];

    const missing = [];

    // Helper: Normalizar IDs para comparación
    // Visual Design usa id=1, Batch usa sceneId=1, Image Metadata usa sceneId="scene-0"
    const normalizeSceneId = (id) => {
      if (typeof id === 'string' && id.startsWith('scene-')) {
        return parseInt(id.replace('scene-', ''));
      }
      return typeof id === 'number' ? id - 1 : parseInt(id) - 1; // Convertir 1-indexed a 0-indexed
    };

    for (const scene of expectedScenes) {
      const sceneId = scene.sceneId || scene.id;
      const normalizedSceneId = normalizeSceneId(sceneId);

      // Buscar imagen comparando IDs normalizados
      const image = images.find(img => {
        const imgId = img.sceneId || img.id;
        const normalizedImgId = normalizeSceneId(imgId);
        return normalizedImgId === normalizedSceneId;
      });

      if (!image) {
        console.log(`   ❌ Missing image for scene: ${sceneId}`);
        missing.push({
          sceneId,
          type: scene.type,
          reason: 'not_generated'
        });
      } else if (!image.creationIdentifier && !image.identifier) {
        console.log(`   ❌ Invalid image for scene: ${sceneId} (no identifier)`);
        missing.push({
          sceneId,
          type: scene.type,
          reason: 'missing_identifier'
        });
      } else if (!image.url || image.url.trim() === '') {
        console.log(`   ❌ Invalid image for scene: ${sceneId} (no URL)`);
        missing.push({
          sceneId,
          type: scene.type,
          reason: 'missing_url'
        });
      } else if (image.status && image.status !== 'completed') {
        console.log(`   ❌ Incomplete image for scene: ${sceneId} (status: ${image.status})`);
        missing.push({
          sceneId,
          type: scene.type,
          reason: `status_${image.status}`
        });
      } else {
        console.log(`   ✅ Valid image for scene: ${sceneId}`);
        this.totalImagesValid++;
      }
    }

    this.totalImagesMissing = missing.length;

    console.log(`\n📊 Resumen de validación:`);
    console.log(`   Total esperados: ${this.totalImagesExpected}`);
    console.log(`   Total válidos: ${this.totalImagesValid}`);
    console.log(`   Total faltantes: ${this.totalImagesMissing}`);

    return missing;
  }

  /**
   * 5. Regenerar imágenes faltantes usando Agent 4
   */
  async regenerateImages(missing) {
    if (missing.length === 0) {
      console.log('\n✅ No hay imágenes faltantes - skip regeneration');
      return true;
    }

    console.log(`\n🔧 Regenerando ${missing.length} imágenes faltantes...`);
    console.log(`   Escenas a regenerar: ${missing.map(m => m.sceneId).join(', ')}`);

    try {
      // PASO 0.5: Sincronizar batch y visual design TO remote ANTES de ejecutar Agent 4
      console.log('\n📤 Sincronizando archivos TO remote server...');
      const verseFilename = this.verse.replace(/[:\s]/g, '-');
      const baseDir = path.join(__dirname, '..');

      // Sincronizar batch file (Agent 3)
      try {
        execSync(
          `scp output/image-batches/batch-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/image-batches/ || echo "No batch files to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced batch file for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync batch file: ${e.message}`);
      }

      // Sincronizar visual design file (Agent 2)
      try {
        execSync(
          `scp output/image-prompts/visual-design-PRO-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/image-prompts/ || echo "No visual design to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced visual design file for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync visual design: ${e.message}`);
      }

      // Ejecutar Agent 4 VIA SSH en el servidor remoto con MCP configurado
      // CRÍTICO: MCP solo está disponible en desarrollo@10.254.80.29
      console.log('\n🎨 Ejecutando Agent 4 (Magnific MCP) via SSH on remote server...');

      const agent4Output = execSync(
        `ssh desarrollo@10.254.80.29 "cd ~/project-yt && bash run-agent-4.sh \\"${this.verse}\\""`,
        {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 15 * 60 * 1000, // 15 minutos
          cwd: path.join(__dirname, '..')
        }
      );

      console.log(agent4Output);

      // PASO 1.5: Sincronizar metadata y base-images FROM remote después de Agent 4
      console.log('\n📦 Sincronizando metadata y base-images FROM remote server...');

      // Sincronizar image metadata - usando rsync para mejor sincronización
      try {
        execSync(
          `rsync -avz desarrollo@10.254.80.29:~/project-yt/output/image-metadata/images-${verseFilename}-*.json output/image-metadata/ || echo "No metadata to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced image metadata for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync metadata: ${e.message}`);
      }

      // Sincronizar base images - usando rsync para mejor sincronización
      try {
        execSync(
          `rsync -avz desarrollo@10.254.80.29:~/project-yt/output/base-images/base-${verseFilename}-*.png output/base-images/ || echo "No base images to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced base images for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync base images: ${e.message}`);
      }

      // Recargar image metadata después de regenerar
      console.log('\n🔄 Recargando image metadata después de regeneración...');
      this.loadImageMetadata();

      // Validar nuevamente
      const stillMissing = this.validateImages();

      if (stillMissing.length === 0) {
        console.log('\n✅ Regeneración exitosa - todas las imágenes ahora existen');
        return true;
      } else {
        console.log(`\n⚠️  Regeneración parcial - aún faltan ${stillMissing.length} imágenes`);
        this.errorLog.push(`Regeneration incomplete: ${stillMissing.length} images still missing`);
        return false;
      }

    } catch (error) {
      console.error(`\n❌ Error regenerando imágenes: ${error.message}`);
      this.errorLog.push(`Regeneration failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 6. Proteger con retry automático
   */
  async protect() {
    console.log('👼 Guardian Images (FIXED) - Iniciando protección');
    console.log('====================================================\n');
    console.log(`📖 Versículo: "${this.verse}"`);

    try {
      // Paso 1: Cargar datos de agentes upstream
      this.loadVisualDesignData();
      this.loadBatchData();

      // Paso 2: Cargar metadata de imágenes (si existe)
      const hasImageMetadata = this.loadImageMetadata();

      // Paso 3: Validar imágenes
      let missing = this.validateImages();

      // Paso 4: Regenerar si hay faltantes (con retry)
      while (missing.length > 0 && this.retriesPerformed < this.maxRetries) {
        // Verificar timeout
        if (Date.now() - this.startTime > TIMEOUT_MS) {
          throw new Error(`Timeout: ${TIMEOUT_MS / 1000}s exceeded`);
        }

        this.retriesPerformed++;
        console.log(`\n🔄 Intento de regeneración ${this.retriesPerformed}/${this.maxRetries}`);

        const success = await this.regenerateImages(missing);

        if (success) {
          break;
        }

        // Revalidar para ver cuántos siguen faltando
        missing = this.validateImages();

        if (this.retriesPerformed >= this.maxRetries && missing.length > 0) {
          throw new Error(`Max retries reached (${this.maxRetries}). Still missing ${missing.length} images.`);
        }
      }

      // Paso 5: Resultado final
      console.log('\n✅ Guardian Images completado exitosamente');
      console.log(`   Total imágenes válidas: ${this.totalImagesValid}/${this.totalImagesExpected}`);
      console.log(`   Reintentos realizados: ${this.retriesPerformed}`);

      const result = {
        success: true,
        verse: this.verse,
        guardianImagesSuccess: true,
        totalImagesExpected: this.totalImagesExpected,
        totalImagesValid: this.totalImagesValid,
        totalImagesMissing: this.totalImagesMissing,
        retriesPerformed: this.retriesPerformed,
        metadata: {
          visualDesignLoaded: !!this.visualDesignData,
          batchDataLoaded: !!this.batchData,
          imageMetadataLoaded: !!this.imageMetadata
        }
      };

      console.log('\n📋 JSON Output (for n8n):');
      console.log(JSON.stringify(result, null, 2));

      return result;

    } catch (error) {
      console.error('\n❌ Guardian Images FAILED');
      console.error(`   Error: ${error.message}`);

      const result = {
        success: false,
        verse: this.verse,
        guardianImagesSuccess: false,
        error: error.message,
        errorLog: this.errorLog,
        retriesPerformed: this.retriesPerformed
      };

      console.log('\n📋 JSON Output (error):');
      console.log(JSON.stringify(result, null, 2));

      throw error;
    }
  }
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  const verse = process.argv[2];

  if (!verse) {
    console.error('❌ Error: Verse parameter required');
    console.error('Usage: node guardian-images-FIXED.js "Juan 3:16"');
    process.exit(1);
  }

  const guardian = new GuardianImagesFIXED(verse);

  guardian.protect()
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { GuardianImagesFIXED };
