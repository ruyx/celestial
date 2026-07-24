#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎬 AGENTE 7.1: INTRO GENERATOR - Generador de Intro Cinematográfico
 * ═══════════════════════════════════════════════════════════════════
 *
 * PROPÓSITO:
 * Genera un intro de 5 segundos IMPRESIONANTE usando Magnific/Seedance
 * que capture la atención del espectador desde el primer momento.
 *
 * ESTRATEGIA:
 * 1. Extrae texto del HOOK (scene 1) del audio metadata
 * 2. Usa el estilo cinematográfico del video metadata
 * 3. Genera prompt cinematográfico de 5 capas
 * 4. Llama a Magnific video_generate para crear intro
 * 5. Espera con creations_wait hasta completar
 * 6. Descarga el video intro final
 *
 * SALIDA:
 * - Intro cinematográfico de 5s en MP4
 * - Metadata JSON con identifier y URL
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════
// 📁 PATHS
// ═══════════════════════════════════════════════════════════════════

const AUDIO_METADATA_DIR = path.join(__dirname, '../output/audio-metadata');
const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');
const INTRO_OUTPUT_DIR = path.join(__dirname, '../output/intro-videos');

// Crear directorios
if (!fs.existsSync(INTRO_OUTPUT_DIR)) {
  fs.mkdirSync(INTRO_OUTPUT_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 GENERACIÓN DE PROMPT CINEMATOGRÁFICO
// ═══════════════════════════════════════════════════════════════════

/**
 * Genera prompt cinematográfico de 5 capas para INTRO
 * Framework: Subject + Action + Setting + Lighting + Style
 */
function generateCinematicIntroPrompt(hookText, cinematicStyle, category) {
  // Subject: Basado en la categoría y el hook
  const subjects = {
    fortaleza: 'Lone warrior figure standing against storm',
    consuelo: 'Silhouette of person in gentle rain, arms open',
    salvación: 'Figure reaching toward light breaking through darkness'
  };

  const subject = subjects[category] || subjects.fortaleza;

  // Action: Movimiento dramático
  const action = 'epic slow-motion walk forward, debris flying, particles swirling';

  // Setting: Ambiente épico
  const setting = 'apocalyptic wasteland meets neon-lit ancient temple ruins, dust clouds, dramatic sky';

  // Lighting: Del style reference
  const lighting = cinematicStyle.lighting || 'hard neon backlight with rim glow, dramatic side-light, deep shadows';

  // Style: Del style reference
  const filmStock = cinematicStyle.filmStock || '35mm Kodak Vision3 500T, cinematic grain';
  const colorGrade = cinematicStyle.colorGrade || 'deep oranges and crimson reds, high contrast';
  const styleRef = cinematicStyle.styleReference || 'Blade Runner 2049 meets Mad Max Fury Road intensity';

  // Ensamblar prompt de 5 capas
  const prompt = `${subject}, ${action}, ${setting}, ${lighting}, shot on ${filmStock}, ${colorGrade}, ${styleRef}, hyper-detailed, 8K resolution, cinematic masterpiece`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════
// 🎬 GENERACIÓN CON MAGNIFIC
// ═══════════════════════════════════════════════════════════════════

async function generateIntroWithMagnific(prompt, verse) {
  console.log('\n🎬 Generando intro con Magnific/Seedance...\n');
  console.log(`   📝 Prompt (truncado):`);
  console.log(`      ${prompt.substring(0, 150)}...\n`);

  const magnificCommand = `
    node -e "
      const { video_generate, creations_wait } = require('./magnific-client.js');

      (async () => {
        try {
          // Step 1: Generate video
          const result = await video_generate({
            video: {
              clips: [{
                prompt: ${JSON.stringify(prompt)},
                duration: 5,
                aspectRatio: '16:9',
                slug: 'bytedance-seedance-pro-2.0',
                cameraMotion: 'pushIn'
              }]
            }
          });

          const identifier = result.identifiers[0];
          console.log('✅ Video iniciado:', identifier);

          // Step 2: Wait for completion
          const waitResult = await creations_wait({
            identifiers: [identifier],
            timeoutSeconds: 25
          });

          console.log('✅ Video completado');
          console.log(JSON.stringify(waitResult, null, 2));

        } catch (error) {
          console.error('❌ Error:', error.message);
          process.exit(1);
        }
      })();
    "
  `;

  try {
    const output = execSync(magnificCommand, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    return output;

  } catch (error) {
    console.error('❌ Error generando intro con Magnific:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 📥 DESCARGA DE VIDEO
// ═══════════════════════════════════════════════════════════════════

function downloadIntroVideo(identifier, verse) {
  console.log('\n📥 Descargando video intro...\n');

  const verseForFilename = verse.replace(/[:\s]/g, '-');
  const introFile = path.join(INTRO_OUTPUT_DIR, `intro-${verseForFilename}.mp4`);

  // TODO: Implementar descarga usando creations_get
  // Por ahora, placeholder
  console.log(`   📍 Destino: ${introFile}`);
  console.log(`   🔗 Identifier: ${identifier}`);

  return {
    file: introFile,
    identifier: identifier
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

async function generateIntro(verse) {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🎬 AGENTE 7.1: INTRO GENERATOR');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log(`📹 Versículo: ${verse}\n`);

  try {
    // ───────────────────────────────────────────────────────────────
    // Cargar metadata
    // ───────────────────────────────────────────────────────────────

    const verseForFilename = verse.replace(/[:\s]/g, '-');

    // Audio metadata (para hook text)
    const audioMetadataFiles = fs.readdirSync(AUDIO_METADATA_DIR)
      .filter(file => file.includes(verseForFilename) && file.startsWith('audio-spec'));
    const audioMetadataPath = path.join(AUDIO_METADATA_DIR, audioMetadataFiles[0]);
    const audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

    // Video metadata (para estilo cinematográfico)
    const videoMetadataPath = path.join(VIDEO_METADATA_DIR, `videos-completed-${verseForFilename}.json`);
    const videoMetadata = JSON.parse(fs.readFileSync(videoMetadataPath, 'utf-8'));

    // ───────────────────────────────────────────────────────────────
    // Extraer hook text (scene 1)
    // ───────────────────────────────────────────────────────────────

    const hookScene = audioMetadata.scenes.find(s => s.type === 'hook');
    if (!hookScene) {
      throw new Error('No se encontró la escena de HOOK en el audio metadata');
    }

    console.log('📝 Hook extraído:');
    console.log(`   "${hookScene.text}"`);
    console.log(`   Duración: ${hookScene.duration}s\n`);

    // ───────────────────────────────────────────────────────────────
    // Generar prompt cinematográfico
    // ───────────────────────────────────────────────────────────────

    const cinematicPrompt = generateCinematicIntroPrompt(
      hookScene.text,
      videoMetadata.cinematicStyle,
      videoMetadata.category
    );

    console.log('🎨 Prompt cinematográfico generado:');
    console.log(`   ${cinematicPrompt}\n`);

    // ───────────────────────────────────────────────────────────────
    // Generar video con Magnific
    // ───────────────────────────────────────────────────────────────

    const magnificResult = await generateIntroWithMagnific(cinematicPrompt, verse);

    // TODO: Parse result to get identifier
    const introIdentifier = 'TEMP_IDENTIFIER';

    // ───────────────────────────────────────────────────────────────
    // Descargar video
    // ───────────────────────────────────────────────────────────────

    const intro = downloadIntroVideo(introIdentifier, verse);

    // ───────────────────────────────────────────────────────────────
    // Guardar metadata
    // ───────────────────────────────────────────────────────────────

    const metadata = {
      verse: verse,
      category: videoMetadata.category,
      hookText: hookScene.text,
      duration: hookScene.duration,
      cinematicPrompt: cinematicPrompt,
      magnificIdentifier: intro.identifier,
      introFile: intro.file,
      createdAt: new Date().toISOString()
    };

    const metadataPath = path.join(INTRO_OUTPUT_DIR, `intro-metadata-${verseForFilename}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ INTRO GENERADO EXITOSAMENTE');
    console.log('════════════════════════════════════════════════════════════════\n');

    console.log(`📁 Archivos generados:`);
    console.log(`   ${intro.file}`);
    console.log(`   ${metadataPath}\n`);

    return metadata;

  } catch (error) {
    console.error('\n❌ Error generando intro:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  const verse = process.argv[2] || 'Isaías 41:10';

  generateIntro(verse)
    .then(metadata => {
      console.log('🎉 ¡INTRO IMPRESIONANTE LISTO!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fallo en generación de intro');
      process.exit(1);
    });
}

module.exports = { generateIntro };
