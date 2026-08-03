#!/usr/bin/env node

/**
 * 👼 GUARDIAN AUDIO (FIXED)
 *
 * Valida que todos los audios se hayan generado correctamente
 *
 * CAMBIOS vs VERSIÓN ANTERIOR:
 * ✅ Lee datos de Agent 1 (script) para saber voiceover esperado
 * ✅ Integra con Agent 6 para regeneración real
 * ✅ Retorna JSON estructurado para n8n
 * ✅ Usa timestamp-based sorting (no alfabético)
 * ✅ NO hardcodea - todo fluye entre agentes
 *
 * ARQUITECTURA:
 * - Agent 1 → script.json (voiceover de cada escena)
 * - Agent 6 → audio.json (audio TTS generado)
 * - Guardian Audio → valida + regenera + retorna JSON
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIO_METADATA_DIR = path.join(__dirname, '../output/audio-metadata');
const SCRIPTS_DIR = path.join(__dirname, '../output/scripts');

// Configuración
const MAX_RETRIES = 3;
const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos

class GuardianAudioFIXED {
  constructor(verse) {
    this.verse = verse;
    this.verseSlug = verse.replace(/[:\s]/g, '-');

    // Datos de agentes upstream (NO HARDCODEADOS)
    this.scriptData = null;
    this.audioMetadata = null;

    // Estado de validación
    this.totalAudioExpected = 0;
    this.totalAudioValid = 0;
    this.totalAudioMissing = 0;
    this.retriesPerformed = 0;
    this.maxRetries = MAX_RETRIES;
    this.startTime = Date.now();
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
        timestamp: parseInt(f.match(/-(\d+)\.json$/)?.[1] || '0')
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

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
      this.totalAudioExpected = scenes.length;

      console.log(`   📊 Escenas esperadas: ${this.totalAudioExpected}`);
      console.log(`   🎤 Voiceover texts: ${scenes.map(s => `${s.sceneId}: "${s.voiceover?.substring(0, 30)}..."`).join(', ')}`);

    } catch (error) {
      throw new Error(`Failed to load script data: ${error.message}`);
    }
  }

  /**
   * 2. Cargar metadata de audio (Agent 6)
   */
  loadAudioMetadata() {
    console.log('\n🎤 Cargando metadata de audio (Agent 6)...');

    try {
      const latestAudio = this.findLatestFile(AUDIO_METADATA_DIR, 'audio-');
      console.log(`   ✅ Audio metadata encontrado: ${latestAudio.name}`);

      this.audioMetadata = JSON.parse(fs.readFileSync(latestAudio.path, 'utf-8'));

      const audioFiles = this.audioMetadata.audioFiles || this.audioMetadata.scenes || [];
      console.log(`   📊 Audios generados: ${audioFiles.length}`);

      // VALIDACIÓN CRÍTICA: Verificar que el metadata corresponde al script actual
      const metadataVerse = this.audioMetadata.verse || this.audioMetadata.verse_reference;
      const scriptVerse = this.scriptData?.verse_reference;

      if (metadataVerse && scriptVerse && metadataVerse !== scriptVerse) {
        console.log(`   ⚠️  Metadata es de un script diferente!`);
        console.log(`      Metadata verse: ${metadataVerse}`);
        console.log(`      Script verse: ${scriptVerse}`);
        console.log(`   🗑️  Descartando metadata antiguo - se necesita regeneración completa`);
        this.audioMetadata = null;
        return false;
      }

      return true;

    } catch (error) {
      console.log(`   ⚠️  No audio metadata found: ${error.message}`);
      this.audioMetadata = null;
      return false;
    }
  }

  /**
   * 3. Validar que todos los audios existan
   */
  validateAudio() {
    console.log('\n🔍 Validando audios...');

    if (!this.audioMetadata || !this.audioMetadata.audioFiles) {
      console.log('   ❌ No audio metadata found - all audio needs to be generated');
      this.totalAudioMissing = this.totalAudioExpected;
      return [];
    }

    const audioFiles = this.audioMetadata.audioFiles || this.audioMetadata.scenes || [];
    const expectedScenes = this.scriptData.scenes || [];

    const missing = [];

    for (const scene of expectedScenes) {
      const sceneId = scene.sceneId || scene.id;
      const audio = audioFiles.find(a => a.sceneId === sceneId || a.id === sceneId);

      if (!audio) {
        console.log(`   ❌ Missing audio for scene: ${sceneId}`);
        missing.push({
          sceneId,
          voiceover: scene.voiceover,
          reason: 'not_generated'
        });
      } else if (!audio.audioIdentifier && !audio.identifier && !audio.url) {
        console.log(`   ❌ Invalid audio for scene: ${sceneId} (no identifier/url)`);
        missing.push({
          sceneId,
          voiceover: scene.voiceover,
          reason: 'missing_identifier'
        });
      } else if (!audio.url || audio.url.trim() === '') {
        console.log(`   ❌ Invalid audio for scene: ${sceneId} (no URL)`);
        missing.push({
          sceneId,
          voiceover: scene.voiceover,
          reason: 'missing_url'
        });
      } else if (audio.status && audio.status !== 'completed') {
        console.log(`   ❌ Incomplete audio for scene: ${sceneId} (status: ${audio.status})`);
        missing.push({
          sceneId,
          voiceover: scene.voiceover,
          reason: `status_${audio.status}`
        });
      } else {
        console.log(`   ✅ Valid audio for scene: ${sceneId}`);
        this.totalAudioValid++;
      }
    }

    this.totalAudioMissing = missing.length;

    console.log(`\n📊 Resumen de validación:`);
    console.log(`   Total esperados: ${this.totalAudioExpected}`);
    console.log(`   Total válidos: ${this.totalAudioValid}`);
    console.log(`   Total faltantes: ${this.totalAudioMissing}`);

    return missing;
  }

  /**
   * 4. Regenerar audios faltantes usando Agent 6
   */
  async regenerateAudio(missing) {
    if (missing.length === 0) {
      console.log('\n✅ No hay audios faltantes - skip regeneration');
      return true;
    }

    console.log(`\n🔧 Regenerando ${missing.length} audios faltantes...`);
    console.log(`   Escenas a regenerar: ${missing.map(m => m.sceneId).join(', ')}`);

    try {
      // PASO 0.5: Sincronizar archivos TO remote ANTES de ejecutar Agent 6
      console.log('\n📤 Sincronizando archivos TO remote server...');
      const verseFilename = this.verse.replace(/[:\s]/g, '-');
      const baseDir = path.join(__dirname, '..');

      // Sincronizar script file (Agent 1) - único input necesario para Agent 6
      try {
        execSync(
          `scp output/scripts/script-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/scripts/ || echo "No script files to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced script file for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync script file: ${e.message}`);
      }

      // Ejecutar Agent 6 VIA SSH en el servidor remoto con MCP configurado
      // CRÍTICO: MCP solo está disponible en desarrollo@10.254.80.29
      console.log('\n🎤 Ejecutando Agent 6 (Audio TTS Generator) via SSH on remote server...');

      const agent6Output = execSync(
        `ssh desarrollo@10.254.80.29 "cd ~/project-yt && bash run-agent-6.sh \\"${this.verse}\\""`,
        {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 15 * 60 * 1000, // 15 minutos
          cwd: path.join(__dirname, '..')
        }
      );

      console.log(agent6Output);

      // PASO 1.5: Sincronizar metadata FROM remote después de Agent 6
      console.log('\n📦 Sincronizando metadata FROM remote server...');

      // Sincronizar audio metadata - usando rsync para mejor sincronización
      try {
        execSync(
          `rsync -avz desarrollo@10.254.80.29:~/project-yt/output/audio-metadata/audio-${verseFilename}-*.json output/audio-metadata/ || echo "No audio metadata to sync"`,
          { encoding: 'utf-8', cwd: baseDir }
        );
        console.log(`   ✅ Synced audio metadata for ${this.verse}`);
      } catch (e) {
        console.log(`   ⚠️  Warning: Could not sync audio metadata: ${e.message}`);
      }

      // Recargar audio metadata después de regenerar
      console.log('\n🔄 Recargando audio metadata después de regeneración...');
      this.loadAudioMetadata();

      // Validar nuevamente
      const stillMissing = this.validateAudio();

      if (stillMissing.length === 0) {
        console.log('\n✅ Regeneración exitosa - todos los audios ahora existen');
        return true;
      } else {
        console.log(`\n⚠️  Regeneración parcial - aún faltan ${stillMissing.length} audios`);
        this.errorLog.push(`Regeneration incomplete: ${stillMissing.length} audio files still missing`);
        return false;
      }

    } catch (error) {
      console.error(`\n❌ Error regenerando audios: ${error.message}`);
      this.errorLog.push(`Regeneration failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 5. Proteger con retry automático
   */
  async protect() {
    console.log('👼 Guardian Audio (FIXED) - Iniciando protección');
    console.log('====================================================\n');
    console.log(`📖 Versículo: "${this.verse}"`);

    try {
      // Paso 1: Cargar datos de agentes upstream
      this.loadScriptData();

      // Paso 2: Cargar metadata de audio (si existe)
      const hasAudioMetadata = this.loadAudioMetadata();

      // Paso 3: Validar audios
      let missing = this.validateAudio();

      // Paso 4: Regenerar si hay faltantes (con retry)
      while (missing.length > 0 && this.retriesPerformed < this.maxRetries) {
        // Verificar timeout
        if (Date.now() - this.startTime > TIMEOUT_MS) {
          throw new Error(`Timeout: ${TIMEOUT_MS / 1000}s exceeded`);
        }

        this.retriesPerformed++;
        console.log(`\n🔄 Intento de regeneración ${this.retriesPerformed}/${this.maxRetries}`);

        const success = await this.regenerateAudio(missing);

        if (success) {
          break;
        }

        // Revalidar para ver cuántos siguen faltando
        missing = this.validateAudio();

        if (this.retriesPerformed >= this.maxRetries && missing.length > 0) {
          throw new Error(`Max retries reached (${this.maxRetries}). Still missing ${missing.length} audio files.`);
        }
      }

      // Paso 5: Resultado final
      console.log('\n✅ Guardian Audio completado exitosamente');
      console.log(`   Total audios válidos: ${this.totalAudioValid}/${this.totalAudioExpected}`);
      console.log(`   Reintentos realizados: ${this.retriesPerformed}`);

      const result = {
        success: true,
        verse: this.verse,
        guardianAudioSuccess: true,
        totalAudioExpected: this.totalAudioExpected,
        totalAudioValid: this.totalAudioValid,
        totalAudioMissing: this.totalAudioMissing,
        retriesPerformed: this.retriesPerformed,
        metadata: {
          scriptLoaded: !!this.scriptData,
          audioMetadataLoaded: !!this.audioMetadata
        }
      };

      console.log('\n📋 JSON Output (for n8n):');
      console.log(JSON.stringify(result, null, 2));

      return result;

    } catch (error) {
      console.error('\n❌ Guardian Audio FAILED');
      console.error(`   Error: ${error.message}`);

      const result = {
        success: false,
        verse: this.verse,
        guardianAudioSuccess: false,
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
    console.error('Usage: node guardian-audio-FIXED.js "Juan 3:16"');
    process.exit(1);
  }

  const guardian = new GuardianAudioFIXED(verse);

  guardian.protect()
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { GuardianAudioFIXED };
