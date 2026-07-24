#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎬 AGENTE 7 CON TEMPLATES - Wrapper para Video Editor
 * ═══════════════════════════════════════════════════════════════════
 *
 * Este script wrapper:
 * 1. Lee la categoría del video metadata
 * 2. Selecciona templates de intro/outro según categoría
 * 3. Copia templates a ubicaciones temporales
 * 4. Llama al Agent 7 modificado que usa templates
 *
 * USAGE: node agent-7-with-templates.js "Isaías 41:10"
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getTemplatePaths } = require('./template-selector.js');

// ═══════════════════════════════════════════════════════════════════
// 📁 PATHS
// ═══════════════════════════════════════════════════════════════════

const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');
const FINAL_OUTPUT_DIR = path.join(__dirname, '../output/final-videos');

// ═══════════════════════════════════════════════════════════════════
// 🎨 PREPARAR TEMPLATES
// ═══════════════════════════════════════════════════════════════════

async function prepareTemplates(verse) {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🎨 PREPARANDO TEMPLATES CINEMATOGRÁFICOS');
  console.log('════════════════════════════════════════════════════════════════\n');

  // ───────────────────────────────────────────────────────────────
  // Cargar metadata para obtener categoría
  // ───────────────────────────────────────────────────────────────

  const verseForFilename = verse.replace(/[:\s]/g, '-');
  const videoMetadataPath = path.join(VIDEO_METADATA_DIR, `videos-completed-${verseForFilename}.json`);

  if (!fs.existsSync(videoMetadataPath)) {
    throw new Error(`No se encontró metadata de video para ${verse}: ${videoMetadataPath}`);
  }

  const videoMetadata = JSON.parse(fs.readFileSync(videoMetadataPath, 'utf-8'));
  const category = videoMetadata.category;

  console.log(`📹 Versículo: ${verse}`);
  console.log(`🎨 Categoría: ${category}\n`);

  // ───────────────────────────────────────────────────────────────
  // Seleccionar templates
  // ───────────────────────────────────────────────────────────────

  const templates = getTemplatePaths(category);

  console.log('✅ Templates seleccionados:');
  console.log(`   Intro (${templates.intro.duration}s): ${path.basename(templates.intro.path)}`);
  console.log(`   Outro (${templates.outro.duration}s): ${path.basename(templates.outro.path)}\n`);

  // ───────────────────────────────────────────────────────────────
  // Copiar templates a ubicaciones que Agent 7 espera
  // ───────────────────────────────────────────────────────────────

  const introDestPath = path.join(FINAL_OUTPUT_DIR, 'intro-template.mp4');
  const outroDestPath = path.join(FINAL_OUTPUT_DIR, 'outro-template.mp4');

  console.log('📋 Copiando templates...');
  fs.copyFileSync(templates.intro.path, introDestPath);
  fs.copyFileSync(templates.outro.path, outroDestPath);
  console.log(`   ✅ Intro copiado: ${introDestPath}`);
  console.log(`   ✅ Outro copiado: ${outroDestPath}\n`);

  return {
    intro: {
      path: introDestPath,
      duration: templates.intro.duration,
      size: fs.statSync(introDestPath).size
    },
    outro: {
      path: outroDestPath,
      duration: templates.outro.duration,
      size: fs.statSync(outroDestPath).size
    },
    category: category,
    theme: templates.theme
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const verse = process.argv[2] || 'Isaías 41:10';

  try {
    // Step 1: Preparar templates
    const templates = await prepareTemplates(verse);

    console.log('════════════════════════════════════════════════════════════════');
    console.log('🎬 EJECUTANDO VIDEO EDITOR CON TEMPLATES');
    console.log('════════════════════════════════════════════════════════════════\n');

    console.log('🎯 ESTRUCTURA FINAL:');
    console.log(`   1. Intro Template (${templates.intro.duration}s) - ${templates.theme}`);
    console.log('   2. Clips de video (~90s)');
    console.log(`   3. Outro Template (${templates.outro.duration}s) - ${templates.theme}`);
    console.log('   4. Audio sync (120s total)\n');

    // Step 2: Ejecutar Agent 7 con templates
    console.log('🚀 Ejecutando Agent 7 Video Editor...\n');

    const agent7Script = path.join(__dirname, 'agent-7-video-editor-v2-templates.js');
    execSync(`node "${agent7Script}" "${verse}"`, {
      stdio: 'inherit'
    });

    return templates;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Templates preparados y listos');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fallo en preparación de templates');
      process.exit(1);
    });
}

module.exports = { prepareTemplates };
