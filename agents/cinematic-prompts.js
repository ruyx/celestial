#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎨 CINEMATIC PROMPTS GENERATOR
 * ═══════════════════════════════════════════════════════════════════
 *
 * Genera prompts cinematográficos de 5 capas para intro y outro
 * Framework: Subject + Action + Setting + Lighting + Style
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// 🎨 INTRO PROMPT (5 segundos - IMPRESIONANTE para captar atención)
// ═══════════════════════════════════════════════════════════════════

function generateIntroPrompt(hookText, cinematicStyle, category) {
  // Subject: Basado en la categoría
  const subjects = {
    fortaleza: 'Epic warrior silhouette emerging from mist and flames',
    consuelo: 'Gentle figure surrounded by soft light, arms open in peace',
    salvación: 'Person reaching toward brilliant light breaking through storm clouds'
  };

  const subject = subjects[category] || subjects.fortaleza;

  // Action: Movimiento dramático de apertura
  const action = 'epic slow-motion walk forward, camera push-in, debris and particles swirling dramatically';

  // Setting: Ambiente épico
  const setting = 'apocalyptic wasteland meets ancient temple ruins, neon-lit atmosphere, dust clouds, dramatic epic sky';

  // Lighting: Del style reference
  const lighting = cinematicStyle.lighting || 'hard neon backlight with rim glow, dramatic side-light, deep shadows';

  // Style: Del style reference
  const filmStock = cinematicStyle.filmStock || '35mm Kodak Vision3 500T, cinematic grain';
  const colorGrade = cinematicStyle.colorGrade || 'deep oranges and crimson reds, high contrast';
  const styleRef = cinematicStyle.styleReference || 'Blade Runner 2049 meets Mad Max Fury Road intensity';

  // Ensamblar prompt de 5 capas
  const prompt = `${subject}, ${action}, ${setting}, ${lighting}, shot on ${filmStock}, ${colorGrade}, ${styleRef}, hyper-detailed, 8K resolution, cinematic opening masterpiece, attention-grabbing`;

  return {
    prompt: prompt,
    duration: 5,
    cameraMotion: 'pushIn',
    aspectRatio: '16:9'
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 OUTRO PROMPT (15 segundos - CINEMATOGRÁFICO con CTA)
// ═══════════════════════════════════════════════════════════════════

function generateOutroPrompt(ctaText, cinematicStyle, category) {
  // Subject: Basado en la categoría (final triunfante)
  const subjects = {
    fortaleza: 'Victorious warrior figure at peace, standing on mountain peak overlooking vast landscape',
    consuelo: 'Person embracing warm light, silhouette against golden sunset, peaceful smile',
    salvación: 'Figure walking confidently toward radiant light gateway, arms raised in triumph and gratitude'
  };

  const subject = subjects[category] || subjects.fortaleza;

  // Action: Movimiento final triunfante pero sereno
  const action = 'slow-motion turn toward camera with gentle smile, particles of golden light floating upward, peaceful victorious ending';

  // Setting: Conclusión épica pero esperanzadora
  const setting = 'ethereal landscape bathed in golden hour light, sacred architecture silhouettes in background, hope and victory atmosphere';

  // Lighting: Más cálido para outro (esperanza)
  const lighting = 'warm golden backlight with soft rim glow, golden hour tones, uplifting atmosphere, hopeful rays';

  // Style: Del style reference pero ajustado a tono esperanzador
  const filmStock = cinematicStyle.filmStock || '35mm Kodak Vision3 500T, cinematic grain';
  const colorGrade = 'warm golden oranges and soft ambers with touches of sacred light, hopeful contrast, uplifting tones';
  const styleRef = 'Denis Villeneuve cinematography meets inspirational triumph, The Revenant golden hour intensity';

  // Ensamblar prompt de 5 capas
  const prompt = `${subject}, ${action}, ${setting}, ${lighting}, shot on ${filmStock}, ${colorGrade}, ${styleRef}, hyper-detailed, 8K resolution, cinematic outro masterpiece, uplifting ending`;

  return {
    prompt: prompt,
    duration: 15,
    cameraMotion: 'static',
    aspectRatio: '16:9'
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

function generateCinematicPrompts(verse) {
  const AUDIO_METADATA_DIR = path.join(__dirname, '../output/audio-metadata');
  const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');

  const verseForFilename = verse.replace(/[:\s]/g, '-');

  // Cargar metadata
  const audioMetadataFiles = fs.readdirSync(AUDIO_METADATA_DIR)
    .filter(file => file.includes(verseForFilename) && file.startsWith('audio-spec'));
  const audioMetadataPath = path.join(AUDIO_METADATA_DIR, audioMetadataFiles[0]);
  const audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

  const videoMetadataPath = path.join(VIDEO_METADATA_DIR, `videos-completed-${verseForFilename}.json`);
  const videoMetadata = JSON.parse(fs.readFileSync(videoMetadataPath, 'utf-8'));

  // Extraer hook y CTA
  const hookScene = audioMetadata.scenes.find(s => s.type === 'hook');
  const ctaScene = audioMetadata.scenes.find(s => s.type === 'cta');

  if (!hookScene || !ctaScene) {
    throw new Error('No se encontraron las escenas de HOOK o CTA');
  }

  // Generar prompts
  const introConfig = generateIntroPrompt(
    hookScene.text,
    videoMetadata.cinematicStyle,
    videoMetadata.category
  );

  const outroConfig = generateOutroPrompt(
    ctaScene.text,
    videoMetadata.cinematicStyle,
    videoMetadata.category
  );

  return {
    verse: verse,
    category: videoMetadata.category,
    intro: {
      hookText: hookScene.text,
      ...introConfig
    },
    outro: {
      ctaText: ctaScene.text,
      ...outroConfig
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  const verse = process.argv[2] || 'Isaías 41:10';

  try {
    const prompts = generateCinematicPrompts(verse);

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🎨 CINEMATIC PROMPTS GENERATED');
    console.log('════════════════════════════════════════════════════════════════\n');

    console.log('📝 INTRO (5s):');
    console.log(`   Hook: "${prompts.intro.hookText}"`);
    console.log(`   Prompt: ${prompts.intro.prompt.substring(0, 100)}...`);
    console.log(`   Camera: ${prompts.intro.cameraMotion}\n`);

    console.log('📝 OUTRO (15s):');
    console.log(`   CTA: "${prompts.outro.ctaText.substring(0, 80)}..."`);
    console.log(`   Prompt: ${prompts.outro.prompt.substring(0, 100)}...`);
    console.log(`   Camera: ${prompts.outro.cameraMotion}\n`);

    // Guardar para uso en Claude Code
    const outputPath = path.join(__dirname, '../output/cinematic-prompts', `prompts-${verse.replace(/[:\s]/g, '-')}.json`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(prompts, null, 2));

    console.log(`💾 Prompts guardados en:`);
    console.log(`   ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { generateCinematicPrompts, generateIntroPrompt, generateOutroPrompt };
