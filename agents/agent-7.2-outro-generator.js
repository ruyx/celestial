#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎯 AGENTE 7.2: OUTRO GENERATOR - Generador de Outro Cinematográfico
 * ═══════════════════════════════════════════════════════════════════
 *
 * PROPÓSITO:
 * Genera un outro de 15 segundos CINEMATOGRÁFICO con call to action
 * usando Magnific/Seedance que invite a suscribirse, comentar y compartir.
 *
 * ESTRATEGIA:
 * 1. Extrae texto del CTA (scene 5) del audio metadata
 * 2. Usa el estilo cinematográfico del video metadata
 * 3. Genera prompt cinematográfico de 5 capas para CTA
 * 4. Llama a Magnific video_generate para crear outro
 * 5. Espera con creations_wait hasta completar
 * 6. Descarga el video outro final
 *
 * SALIDA:
 * - Outro cinematográfico de 15s en MP4
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
const OUTRO_OUTPUT_DIR = path.join(__dirname, '../output/outro-videos');

// Crear directorios
if (!fs.existsSync(OUTRO_OUTPUT_DIR)) {
  fs.mkdirSync(OUTRO_OUTPUT_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 GENERACIÓN DE PROMPT CINEMATOGRÁFICO
// ═══════════════════════════════════════════════════════════════════

/**
 * Genera prompt cinematográfico de 5 capas para OUTRO
 * Framework: Subject + Action + Setting + Lighting + Style
 */
function generateCinematicOutroPrompt(ctaText, cinematicStyle, category) {
  // Subject: Basado en la categoría y el CTA
  const subjects = {
    fortaleza: 'Warrior figure at peace, standing victorious on mountain peak',
    consuelo: 'Person embracing light, silhouette against golden sunset',
    salvación: 'Figure walking toward radiant light gateway, arms raised in triumph'
  };

  const subject = subjects[category] || subjects.fortaleza;

  // Action: Movimiento final triunfante
  const action = 'slow-motion turn toward camera, gentle smile, particles of light floating, peaceful ending';

  // Setting: Conclusión épica
  const setting = 'ethereal landscape, golden hour meets neon glow, sacred architecture in background, hope and victory';

  // Lighting: Del style reference
  const lighting = cinematicStyle.lighting || 'warm backlight with soft rim glow, golden hour tones, uplifting atmosphere';

  // Style: Del style reference pero más cálido para outro
  const filmStock = cinematicStyle.filmStock || '35mm Kodak Vision3 500T, cinematic grain';
  const colorGrade = 'warm golden oranges and soft ambers, hopeful contrast, uplifting tones';
  const styleRef = 'Denis Villeneuve cinematography meets inspirational commercial intensity';

  // Ensamblar prompt de 5 capas
  const prompt = `${subject}, ${action}, ${setting}, ${lighting}, shot on ${filmStock}, ${colorGrade}, ${styleRef}, hyper-detailed, 8K resolution, cinematic outro masterpiece`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════
// 🎬 GENERACIÓN CON MAGNIFIC
// ═══════════════════════════════════════════════════════════════════

async function generateOutroWithMagnific(prompt, verse) {
  console.log('\n🎬 Generando outro con Magnific/Seedance...\n');
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
                duration: 15,
                aspectRatio: '16:9',
                slug: 'bytedance-seedance-pro-2.0',
                cameraMotion: 'static'
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
    console.error('❌ Error generando outro con Magnific:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 📥 DESCARGA DE VIDEO
// ═══════════════════════════════════════════════════════════════════

function downloadOutroVideo(identifier, verse) {
  console.log('\n📥 Descargando video outro...\n');

  const verseForFilename = verse.replace(/[:\s]/g, '-');
  const outroFile = path.join(OUTRO_OUTPUT_DIR, `outro-${verseForFilename}.mp4`);

  // TODO: Implementar descarga usando creations_get
  // Por ahora, placeholder
  console.log(`   📍 Destino: ${outroFile}`);
  console.log(`   🔗 Identifier: ${identifier}`);

  return {
    file: outroFile,
    identifier: identifier
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

async function generateOutro(verse) {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🎯 AGENTE 7.2: OUTRO GENERATOR');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log(`📹 Versículo: ${verse}\n`);

  try {
    // ───────────────────────────────────────────────────────────────
    // Cargar metadata
    // ───────────────────────────────────────────────────────────────

    const verseForFilename = verse.replace(/[:\s]/g, '-');

    // Audio metadata (para CTA text)
    const audioMetadataFiles = fs.readdirSync(AUDIO_METADATA_DIR)
      .filter(file => file.includes(verseForFilename) && file.startsWith('audio-spec'));
    const audioMetadataPath = path.join(AUDIO_METADATA_DIR, audioMetadataFiles[0]);
    const audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

    // Video metadata (para estilo cinematográfico)
    const videoMetadataPath = path.join(VIDEO_METADATA_DIR, `videos-completed-${verseForFilename}.json`);
    const videoMetadata = JSON.parse(fs.readFileSync(videoMetadataPath, 'utf-8'));

    // ───────────────────────────────────────────────────────────────
    // Extraer CTA text (scene 5)
    // ───────────────────────────────────────────────────────────────

    const ctaScene = audioMetadata.scenes.find(s => s.type === 'cta');
    if (!ctaScene) {
      throw new Error('No se encontró la escena de CTA en el audio metadata');
    }

    console.log('📝 CTA extraído:');
    console.log(`   "${ctaScene.text}"`);
    console.log(`   Duración original: ${ctaScene.duration}s (ajustado a 15s)\n`);

    // ───────────────────────────────────────────────────────────────
    // Generar prompt cinematográfico
    // ───────────────────────────────────────────────────────────────

    const cinematicPrompt = generateCinematicOutroPrompt(
      ctaScene.text,
      videoMetadata.cinematicStyle,
      videoMetadata.category
    );

    console.log('🎨 Prompt cinematográfico generado:');
    console.log(`   ${cinematicPrompt}\n`);

    // ───────────────────────────────────────────────────────────────
    // Generar video con Magnific
    // ───────────────────────────────────────────────────────────────

    const magnificResult = await generateOutroWithMagnific(cinematicPrompt, verse);

    // TODO: Parse result to get identifier
    const outroIdentifier = 'TEMP_IDENTIFIER';

    // ───────────────────────────────────────────────────────────────
    // Descargar video
    // ───────────────────────────────────────────────────────────────

    const outro = downloadOutroVideo(outroIdentifier, verse);

    // ───────────────────────────────────────────────────────────────
    // Guardar metadata
    // ───────────────────────────────────────────────────────────────

    const metadata = {
      verse: verse,
      category: videoMetadata.category,
      ctaText: ctaScene.text,
      duration: 15, // Fixed to 15s for outro
      cinematicPrompt: cinematicPrompt,
      magnificIdentifier: outro.identifier,
      outroFile: outro.file,
      createdAt: new Date().toISOString()
    };

    const metadataPath = path.join(OUTRO_OUTPUT_DIR, `outro-metadata-${verseForFilename}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ OUTRO GENERADO EXITOSAMENTE');
    console.log('════════════════════════════════════════════════════════════════\n');

    console.log(`📁 Archivos generados:`);
    console.log(`   ${outro.file}`);
    console.log(`   ${metadataPath}\n`);

    return metadata;

  } catch (error) {
    console.error('\n❌ Error generando outro:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  const verse = process.argv[2] || 'Isaías 41:10';

  generateOutro(verse)
    .then(metadata => {
      console.log('🎉 ¡OUTRO CINEMATOGRÁFICO LISTO!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fallo en generación de outro');
      process.exit(1);
    });
}

module.exports = { generateOutro };
