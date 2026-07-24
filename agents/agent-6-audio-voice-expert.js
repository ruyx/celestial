#!/usr/bin/env node

/**
 * AGENTE 6: AUDIO & VOICE EXPERT
 *
 * Convierte el guión de texto a audio TTS profesional usando Magnific Audio
 * Utiliza voces en español optimizadas para contenido bíblico inspiracional
 *
 * IMPORTANTE: Este script debe ejecutarse desde Claude Code con acceso a MCP
 */

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, '../output/scripts');
const AUDIO_METADATA_DIR = path.join(__dirname, '../output/audio-metadata');
const AUDIO_OUTPUT_DIR = path.join(__dirname, '../output/audio');

// Asegurar directorios
[AUDIO_METADATA_DIR, AUDIO_OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * CONFIGURACIÓN DE VOCES POR CATEGORÍA BÍBLICA
 */
const VOICE_CONFIG = {
  // Voz principal recomendada para TODOS los videos
  default: {
    voiceId: 863, // Matías Cárdenas
    name: 'Matías Cárdenas',
    description: 'Deep, dramatic Chilean Spanish with powerful storytelling presence',
    provider: 'elevenlabs',
    model: 'eleven_v3' // Mejor calidad
  },

  // Voces alternativas por categoría emocional
  fortaleza: {
    voiceId: 590, // Valen Cid
    name: 'Valen Cid',
    description: 'Commanding, brave, fierce - epic battle scenes'
  },

  consuelo: {
    voiceId: 560, // Emilio Ortega
    name: 'Emilio Ortega',
    description: 'Warm, deep, confident - trustworthy and grounded'
  },

  salvacion: {
    voiceId: 643, // Ernesto Calderón
    name: 'Ernesto Calderón',
    description: 'Clarity, charisma, natural authority'
  },

  esperanza: {
    voiceId: 863, // Matías Cárdenas (mismo que default)
    name: 'Matías Cárdenas',
    description: 'Deep, dramatic, powerful storytelling'
  }
};

/**
 * CONFIGURACIÓN DE TTS
 */
const TTS_CONFIG = {
  model: 'eleven_v3', // Mejor calidad para narración larga
  speed: 1.0, // Velocidad normal (0.7-1.2 permitido)
  stability: 0.5, // Estabilidad media (0-1)
  similarityBoost: 0.2, // Boost de similitud (0-1)
  useSpeakerBoost: true // Mejora de voz
};

/**
 * Preparar especificación de audio batch
 */
async function generateAudioBatch(scriptPath) {
  console.log('🎤 Agente 6: Audio & Voice Expert');
  console.log('============================\n');

  // Leer guión
  const script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
  const { metadata, scenes } = script;

  console.log(`📖 Video: ${metadata.verse}`);
  console.log(`🎭 Categoría: ${metadata.category}`);
  console.log(`🎬 Escenas: ${scenes.length}`);

  // Seleccionar voz según categoría
  const voiceConfig = VOICE_CONFIG[metadata.category] || VOICE_CONFIG.default;

  console.log(`\n🎤 Voz seleccionada: ${voiceConfig.name}`);
  console.log(`   ${voiceConfig.description}\n`);

  // Concatenar todo el texto en un solo audio continuo
  const fullText = scenes.map(scene => scene.text).join('\n\n');
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  console.log(`📝 Longitud total del texto: ${fullText.length} caracteres`);
  console.log(`⏱️  Duración estimada: ${totalDuration}s (~${Math.floor(totalDuration / 60)}:${totalDuration % 60})`);

  // Crear especificación de audio
  const audioSpec = {
    videoId: path.basename(scriptPath),
    verse: metadata.verse,
    category: metadata.category,
    voice: {
      id: voiceConfig.voiceId,
      name: voiceConfig.name,
      description: voiceConfig.description,
      provider: voiceConfig.provider || 'elevenlabs'
    },
    tts: {
      model: TTS_CONFIG.model,
      speed: TTS_CONFIG.speed,
      stability: TTS_CONFIG.stability,
      similarityBoost: TTS_CONFIG.similarityBoost,
      useSpeakerBoost: TTS_CONFIG.useSpeakerBoost
    },
    fullText: fullText,
    textLength: fullText.length,
    estimatedDuration: totalDuration,
    scenes: scenes.map((scene, idx) => ({
      sceneId: scene.id,
      type: scene.type,
      text: scene.text,
      duration: scene.duration,
      // Calcular tiempo de inicio aproximado
      startTime: scenes.slice(0, idx).reduce((sum, s) => sum + s.duration, 0)
    })),
    magnificParams: {
      text: fullText,
      voiceId: voiceConfig.voiceId,
      model: TTS_CONFIG.model,
      speed: TTS_CONFIG.speed,
      stability: TTS_CONFIG.stability,
      similarityBoost: TTS_CONFIG.similarityBoost,
      useSpeakerBoost: TTS_CONFIG.useSpeakerBoost
    },
    createdAt: new Date().toISOString()
  };

  // Guardar especificación
  const specFile = `audio-spec-${metadata.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`;
  const specPath = path.join(AUDIO_METADATA_DIR, specFile);
  fs.writeFileSync(specPath, JSON.stringify(audioSpec, null, 2));

  console.log(`\n✅ Especificación de audio creada`);
  console.log(`📁 ${specPath}`);
  console.log(`\n⚠️  SIGUIENTE PASO:`);
  console.log('   Desde Claude Code con MCP, ejecutar:');
  console.log(`   audio_tts(text, voiceId: ${voiceConfig.voiceId}, model: "${TTS_CONFIG.model}")`);
  console.log(`\n💡 Ejemplo de llamada MCP:`);
  console.log('```javascript');
  console.log('const result = await mcp__magnific__audio_tts({');
  console.log(`  text: ${JSON.stringify(fullText.substring(0, 100))}...,`);
  console.log(`  voiceId: ${voiceConfig.voiceId},`);
  console.log(`  model: "${TTS_CONFIG.model}",`);
  console.log(`  speed: ${TTS_CONFIG.speed},`);
  console.log(`  stability: ${TTS_CONFIG.stability},`);
  console.log(`  similarityBoost: ${TTS_CONFIG.similarityBoost},`);
  console.log(`  useSpeakerBoost: ${TTS_CONFIG.useSpeakerBoost}`);
  console.log('});');
  console.log('```\n');

  return {
    success: true,
    specFile: specFile,
    specPath: specPath,
    textLength: fullText.length,
    estimatedDuration: totalDuration
  };
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  try {
    // Buscar guión más reciente
    const files = fs.readdirSync(SCRIPTS_DIR)
      .filter(f => f.startsWith('script-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(SCRIPTS_DIR, f),
        time: fs.statSync(path.join(SCRIPTS_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      throw new Error('No se encontró ningún guión generado por el Agente 1');
    }

    const latestScript = files[0];
    console.log(`\n📂 Guión encontrado: ${latestScript.name}\n`);

    generateAudioBatch(latestScript.path).then(result => {
      console.log(`\n🎉 Especificación de audio completada!`);
      console.log(`\n📋 Siguiente: Ejecutar audio_tts vía MCP`);
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Error en Agente 6:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { generateAudioBatch };
