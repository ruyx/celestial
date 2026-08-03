#!/usr/bin/env node

/**
 * 👼 GUARDIAN VIDEOS (FIXED)
 *
 * Valida que todos los videos se hayan generado correctamente
 *
 * CAMBIOS vs VERSIÓN ANTERIOR:
 * ✅ Lee datos de Agent 1 (script), Agent 2 (visual design), Agent 4 (images)
 * ✅ Integra con Agent 5 para regeneración real
 * ✅ Retorna JSON estructurado para n8n
 * ✅ Usa timestamp-based sorting (no alfabético)
 * ✅ NO hardcodea - todo fluye entre agentes
 *
 * ARQUITECTURA:
 * - Agent 1 → script.json (escenas con duraciones)
 * - Agent 2 → visual-design.json (prompts cinematográficos)
 * - Agent 4 → images.json (creationIdentifier por escena)
 * - Agent 5 → videos.json (videoIdentifier por escena)
 * - Guardian Videos → valida + regenera + retorna JSON
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');
const IMAGE_METADATA_DIR = path.join(__dirname, '../output/image-metadata');
const SCRIPTS_DIR = path.join(__dirname, '../output/scripts');
const VISUAL_DESIGN_DIR = path.join(__dirname, '../output/image-prompts');

/**
 * Clase Guardian Videos FIXED
 */
class GuardianVideosFIXED {
  constructor(verse) {
    this.verse = verse;
    this.verseSlug = verse.replace(/[:\s]/g, '-');

    // Datos de agentes upstream (NO HARDCODEADOS)
    this.scriptData = null;
    this.visualDesignData = null;
    this.imageMetadata = null;
    this.videoMetadata = null;

    // Estado de validación
    this.totalVideosExpected = 0;
    this.totalVideosValid = 0;
    this.totalVideosMissing = 0;
    this.retriesPerformed = 0;
    this.maxRetries = 3;

    this.errorLog = [];
  }

  /**
   * Helper: Encontrar archivo más reciente por timestamp
   */
  findLatestFile(directory, prefix, suffix = '.json') {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory not found: ${directory}`);
    }

    const files = fs.readdirSync(directory)
      .filter(f => f.startsWith(prefix) && f.endsWith(suffix))
      .map(f => ({
        name: f,
        path: path.join(directory, f),
        // Extraer timestamp del filename: {prefix}-{verse}-{timestamp}.json
        timestamp: parseInt(f.match(/-(\d+)\.json$/)?.[1] || '0')
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Más reciente primero

    if (files.length === 0) {
      throw new Error(`No files found in ${directory} with prefix "${prefix}"`);
    }

    return files[0];
  }

  /**
   * 1. Cargar datos de Agent 1 (Script)
   */
  loadScriptData() {
    console.log('\n📖 Cargando datos de Agent 1 (Script)...');

    try {
      const latestScript = this.findLatestFile(SCRIPTS_DIR, 'script-');
      console.log(`   ✅ Script encontrado: ${latestScript.name}`);

      this.scriptData = JSON.parse(fs.readFileSync(latestScript.path, 'utf-8'));

      // Verificar que el script corresponde al verse correcto
      if (this.scriptData.verse_reference !== this.verse) {
        console.warn(`   ⚠️  Script verse mismatch: expected "${this.verse}", got "${this.scriptData.verse_reference}"`);
      }

      const scenes = this.scriptData.scenes || [];
      this.totalVideosExpected = scenes.length;

      console.log(`   📊 Escenas esperadas: ${this.totalVideosExpected}`);
      console.log(`   📋 Escenas: ${scenes.map(s => s.sceneId || s.id).join(', ')}`);

    } catch (error) {
      throw new Error(`Failed to load script data: ${error.message}`);
    }
  }

  /**
   * 2. Cargar datos de Agent 2 (Visual Design)
   */
  loadVisualDesignData() {
    console.log('\n🎨 Cargando datos de Agent 2 (Visual Design)...');

    try {
      const latestDesign = this.findLatestFile(VISUAL_DESIGN_DIR, 'visual-design-PRO-');
      console.log(`   ✅ Visual design encontrado: ${latestDesign.name}`);

      this.visualDesignData = JSON.parse(fs.readFileSync(latestDesign.path, 'utf-8'));

      console.log(`   🎬 Estilo cinematográfico: ${this.visualDesignData.cinematicStyle?.styleReference || 'N/A'}`);
      console.log(`   📊 Escenas diseñadas: ${this.visualDesignData.scenes?.length || 0}`);

    } catch (error) {
      throw new Error(`Failed to load visual design data: ${error.message}`);
    }
  }

  /**
   * 3. Cargar datos de Agent 4 (Images)
   */
  loadImageMetadata() {
    console.log('\n🖼️  Cargando datos de Agent 4 (Images)...');

    try {
      const latestImages = this.findLatestFile(IMAGE_METADATA_DIR, 'images-');
      console.log(`   ✅ Image metadata encontrado: ${latestImages.name}`);

      this.imageMetadata = JSON.parse(fs.readFileSync(latestImages.path, 'utf-8'));

      const images = this.imageMetadata.scenes || this.imageMetadata.images || [];
      console.log(`   📊 Imágenes generadas: ${images.length}`);

      // Verificar que tenemos la misma cantidad de imágenes que escenas
      if (images.length !== this.totalVideosExpected) {
        console.warn(`   ⚠️  Image count mismatch: expected ${this.totalVideosExpected}, got ${images.length}`);
      }

    } catch (error) {
      throw new Error(`Failed to load image metadata: ${error.message}`);
    }
  }

  /**
   * 4. Cargar metadata de videos (Agent 5)
   */
  loadVideoMetadata() {
    console.log('\n🎬 Cargando metadata de videos (Agent 5)...');

    try {
      // Buscar archivo más reciente
      const latestVideo = this.findLatestFile(VIDEO_METADATA_DIR, 'video-');
      console.log(`   ✅ Video metadata encontrado: ${latestVideo.name}`);

      this.videoMetadata = JSON.parse(fs.readFileSync(latestVideo.path, 'utf-8'));

      const clips = this.videoMetadata.clips || [];
      console.log(`   📊 Videos generados: ${clips.length}`);

      // VALIDACIÓN CRÍTICA: Verificar que el metadata corresponde al script actual
      const metadataVerse = this.videoMetadata.verse || this.videoMetadata.verse_reference;
      const scriptVerse = this.scriptData?.verse_reference;

      if (metadataVerse && scriptVerse && metadataVerse !== scriptVerse) {
        console.log(`   ⚠️  Metadata es de un script diferente!`);
        console.log(`      Metadata verse: ${metadataVerse}`);
        console.log(`      Script verse: ${scriptVerse}`);
        console.log(`   🗑️  Descartando metadata antiguo - se necesita regeneración completa`);
        this.videoMetadata = null;
        return false;
      }

      return true;

    } catch (error) {
      console.log(`   ⚠️  No video metadata found: ${error.message}`);
      console.log(`   🔄 Videos need to be generated`);
      this.videoMetadata = null;
      return false;
    }
  }

  /**
   * 5. Validar que todos los videos existan
   */
  validateVideos() {
    console.log('\n🔍 Validando videos...');

    if (!this.videoMetadata || !this.videoMetadata.clips) {
      console.log('   ❌ No video metadata found - all videos need to be generated');
      this.totalVideosMissing = this.totalVideosExpected;
      return [];
    }

    const clips = this.videoMetadata.clips;
    const expectedScenes = this.scriptData.scenes || [];

    const missing = [];

    for (const scene of expectedScenes) {
      const sceneId = scene.sceneId || scene.id;
      const clip = clips.find(c => c.sceneId === sceneId || c.clipId === sceneId);

      if (!clip) {
        console.log(`   ❌ Missing video for scene: ${sceneId}`);
        missing.push({
          sceneId,
          type: scene.type,
          duration: scene.duration
        });
      } else if (!clip.videoIdentifier && !clip.url) {
        console.log(`   ❌ Invalid video metadata for scene: ${sceneId} (no identifier/url)`);
        missing.push({
          sceneId,
          type: scene.type,
          duration: scene.duration
        });
      } else {
        console.log(`   ✅ Valid video for scene: ${sceneId}`);
        this.totalVideosValid++;
      }
    }

    this.totalVideosMissing = missing.length;

    console.log(`\n📊 Resumen de validación:`);
    console.log(`   Total esperados: ${this.totalVideosExpected}`);
    console.log(`   Total válidos: ${this.totalVideosValid}`);
    console.log(`   Total faltantes: ${this.totalVideosMissing}`);

    return missing;
  }

  /**
   * 6. Regenerar videos faltantes usando Agent 5
   */
  async regenerateVideos(missing) {
    if (missing.length === 0) {
      console.log('\n✅ No hay videos faltantes - skip regeneration');
      return true;
    }

    console.log(`\n🔧 Regenerando ${missing.length} videos faltantes...`);
    console.log(`   Escenas a regenerar: ${missing.map(m => m.sceneId).join(', ')}`);

    try {
      // PASO 0.5: Sincronizar archivos TO remote ANTES de ejecutar Agent 5
      console.log('\n📤 Sincronizando archivos TO remote server...');
      const verseFilename = this.verse.replace(/[:\s]/g, '-');
      const baseDir = path.join(__dirname, '..');

      // Sincronizar script file (Agent 1)
      try {
        execSync(
          `scp output/scripts/script-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/scripts/ || echo "No script files to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced script file for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync script file: ${e.message}`);
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

      // Sincronizar image metadata file (Agent 4)
      try {
        execSync(
          `scp output/image-metadata/images-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/image-metadata/ || echo "No image metadata to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced image metadata for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync image metadata: ${e.message}`);
      }

      // Ejecutar Agent 5 VIA SSH en el servidor remoto con MCP configurado
      // CRÍTICO: MCP solo está disponible en desarrollo@10.254.80.29
      console.log('\n🎬 Ejecutando Agent 5 (Video Animator) via SSH on remote server...');

      const agent5Output = execSync(
        `ssh desarrollo@10.254.80.29 "cd ~/project-yt && bash run-agent-5.sh \\"${this.verse}\\""`,
        {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 30 * 60 * 1000, // 30 minutos
          cwd: path.join(__dirname, '..')
        }
      );

      console.log(agent5Output);

      // PASO 1.5: Sincronizar metadata y clips FROM remote después de Agent 5
      console.log('\n📦 Sincronizando metadata y clips FROM remote server...');

      // Sincronizar video metadata - usando rsync para mejor sincronización
      try {
        execSync(
          `rsync -avz desarrollo@10.254.80.29:~/project-yt/output/video-metadata/video-${verseFilename}-*.json output/video-metadata/ || echo "No video metadata to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced video metadata for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync video metadata: ${e.message}`);
      }

      // Sincronizar clips (si existen) - usando rsync para mejor sincronización
      try {
        execSync(
          `rsync -avz desarrollo@10.254.80.29:~/project-yt/output/clips/clip-${verseFilename}-*.mp4 output/clips/ || echo "No clips to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced video clips for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync clips: ${e.message}`);
      }

      // Recargar video metadata después de regenerar
      console.log('\n🔄 Recargando video metadata después de regeneración...');
      this.loadVideoMetadata();

      // Validar nuevamente
      const stillMissing = this.validateVideos();

      if (stillMissing.length === 0) {
        console.log('\n✅ Regeneración exitosa - todos los videos ahora existen');
        return true;
      } else {
        console.log(`\n⚠️  Regeneración parcial - aún faltan ${stillMissing.length} videos`);
        this.errorLog.push(`Regeneration incomplete: ${stillMissing.length} videos still missing`);
        return false;
      }

    } catch (error) {
      console.error(`\n❌ Error regenerando videos: ${error.message}`);
      this.errorLog.push(`Regeneration failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 7. Proteger con retry automático
   */
  async protect() {
    console.log('👼 Guardian Videos (FIXED) - Iniciando protección');
    console.log('====================================================\n');
    console.log(`📖 Versículo: "${this.verse}"`);

    try {
      // Paso 1: Cargar datos de agentes upstream
      this.loadScriptData();
      this.loadVisualDesignData();
      this.loadImageMetadata();

      // Paso 2: Cargar metadata de videos (si existe)
      const hasVideoMetadata = this.loadVideoMetadata();

      // Paso 3: Validar videos
      let missing = this.validateVideos();

      // Paso 4: Regenerar si hay faltantes (con retry)
      while (missing.length > 0 && this.retriesPerformed < this.maxRetries) {
        this.retriesPerformed++;
        console.log(`\n🔄 Intento de regeneración ${this.retriesPerformed}/${this.maxRetries}`);

        const success = await this.regenerateVideos(missing);

        if (success) {
          break;
        }

        // Revalidar para ver cuántos siguen faltando
        missing = this.validateVideos();

        if (this.retriesPerformed >= this.maxRetries && missing.length > 0) {
          throw new Error(`Max retries reached (${this.maxRetries}). Still missing ${missing.length} videos.`);
        }
      }

      // Paso 5: Resultado final
      console.log('\n✅ Guardian Videos completado exitosamente');
      console.log(`   Total videos válidos: ${this.totalVideosValid}/${this.totalVideosExpected}`);
      console.log(`   Reintentos realizados: ${this.retriesPerformed}`);

      // IMPORTANTE: Retornar JSON estructurado para n8n
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

      console.log('\n📋 JSON Output (for n8n):');
      console.log(JSON.stringify(result, null, 2));

      return result;

    } catch (error) {
      console.error('\n❌ Guardian Videos FAILED');
      console.error(`   Error: ${error.message}`);

      const result = {
        success: false,
        verse: this.verse,
        guardianVideosSuccess: false,
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
    console.error('Usage: node guardian-videos-FIXED.js "Juan 3:16"');
    process.exit(1);
  }

  const guardian = new GuardianVideosFIXED(verse);

  guardian.protect()
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { GuardianVideosFIXED };
