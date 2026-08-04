#!/usr/bin/env node
/**
 * ============================================================================
 * Agent 6: Audio Generator (FREE VERSION - AWS Polly TTS)
 * ============================================================================
 *
 * COSTO: $0 USD (AWS Polly free tier: 5M caracteres/mes primer año)
 *
 * ALTERNATIVA PAGA: agents/ALTERNATIVES-PAID/agent-6-magnific-mcp.md
 * Magnific cuesta créditos por cada audio generado
 *
 * Esta versión usa:
 * - AWS Polly Neural TTS (máxima calidad)
 * - Voz "Lupe" o "Mia" (español latino, femenina, natural)
 * - Free tier: 5,000,000 caracteres/mes (suficiente para ~500 videos)
 * - Después: $4 USD por millón de caracteres
 *
 * ============================================================================
 */

const fs = require('fs').promises;
const path = require('path');
const AWS = require('aws-sdk');

// Configuración
const SCRIPT_DIR = path.join(__dirname, '../output/scripts');
const AUDIO_METADATA_DIR = path.join(__dirname, '../output/audio-metadata');
const AUDIO_OUTPUT_DIR = path.join(__dirname, '../output/audio');

// Inicializar AWS Polly
const polly = new AWS.Polly({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Convierte versículo a formato filename
 */
function verseToFilename(verse) {
  return verse.replace(/\s+/g, '-').replace(/:/g, '-');
}

/**
 * Encuentra el script más reciente para un versículo
 */
async function findScriptFile(verse) {
  const verseFilename = verseToFilename(verse);
  const files = await fs.readdir(SCRIPT_DIR);

  const matching = files
    .filter(f => f.startsWith(`script-${verseFilename}-`) && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(SCRIPT_DIR, f),
      timestamp: parseInt(f.split('-').pop().replace('.json', ''))
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  if (matching.length === 0) {
    throw new Error(`No se encontró script para el versículo: ${verse}`);
  }

  return matching[0].path;
}

/**
 * Genera audio con AWS Polly
 */
async function generateAudio(text, voiceId = 'Lupe') {
  console.log(`  🎤 Generando audio con AWS Polly...`);
  console.log(`  🗣️  Voz: ${voiceId} (neural)`);
  console.log(`  📝 Texto: ${text.substring(0, 100)}...`);
  console.log(`  📊 Caracteres: ${text.length}`);

  try {
    const params = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: 'neural', // Máxima calidad (gratis en free tier)
      LanguageCode: 'es-MX', // Español latino
      TextType: 'text'
    };

    const data = await polly.synthesizeSpeech(params).promise();

    if (!data.AudioStream) {
      throw new Error('No se recibió audio de AWS Polly');
    }

    console.log(`  ✅ Audio generado exitosamente`);
    console.log(`  📊 Tamaño: ${Buffer.byteLength(data.AudioStream)} bytes`);

    return {
      audioBuffer: data.AudioStream,
      characters: text.length,
      voiceId: voiceId,
      engine: 'neural',
      format: 'mp3',
      costUSD: 0 // FREE tier (primer año)
    };
  } catch (error) {
    console.error(`  ❌ Error generando audio: ${error.message}`);
    throw error;
  }
}

/**
 * Procesa un script completo
 */
async function processScript(verse) {
  console.log(`\n🎤 Iniciando Agent 6 (AWS Polly FREE)...`);
  console.log(`📖 Versículo: ${verse}\n`);

  const verseFilename = verseToFilename(verse);

  // 1. Buscar script
  console.log('📂 Buscando script...');
  const scriptPath = await findScriptFile(verse);
  console.log(`✅ Encontrado: ${path.basename(scriptPath)}\n`);

  // 2. Leer script
  const scriptContent = await fs.readFile(scriptPath, 'utf-8');
  const script = JSON.parse(scriptContent);

  console.log(`📋 Script info:`);
  console.log(`   - Versículo: ${script.verse}`);
  console.log(`   - Categoría: ${script.category}`);
  console.log(`   - Escenas: ${script.scenes.length}`);
  console.log(`   - Hook: "${script.hook.substring(0, 50)}..."`);
  console.log(``);

  // 3. Construir texto completo del narrador
  const narratorText = script.scenes
    .map(scene => scene.narrator)
    .join(' ... '); // Pausas entre escenas

  console.log(`📝 Texto del narrador:`);
  console.log(`   - Total caracteres: ${narratorText.length}`);
  console.log(`   - Costo: $0 USD (free tier)\n`);

  // 4. Generar audio principal
  console.log(`🎤 Generando audio del narrador...\n`);
  const mainAudio = await generateAudio(narratorText, 'Lupe');

  // 5. Guardar archivo de audio
  const timestamp = Date.now();
  const audioFilename = `audio-narrator-${verseFilename}-${timestamp}.mp3`;
  const audioPath = path.join(AUDIO_OUTPUT_DIR, audioFilename);

  await fs.writeFile(audioPath, mainAudio.audioBuffer);
  console.log(`\n✅ Audio guardado: ${audioFilename}`);

  // 6. Generar audio del hook (opcional, voz diferente para variedad)
  console.log(`\n🎤 Generando audio del hook (voz alternativa)...\n`);
  const hookAudio = await generateAudio(script.hook, 'Mia'); // Voz diferente

  const hookFilename = `audio-hook-${verseFilename}-${timestamp}.mp3`;
  const hookPath = path.join(AUDIO_OUTPUT_DIR, hookFilename);

  await fs.writeFile(hookPath, hookAudio.audioBuffer);
  console.log(`\n✅ Hook guardado: ${hookFilename}`);

  // 7. Guardar metadata
  const metadataFilename = `audio-metadata-${verseFilename}-${timestamp}.json`;
  const metadataPath = path.join(AUDIO_METADATA_DIR, metadataFilename);

  const metadata = {
    scriptId: path.basename(scriptPath),
    verse: verse,
    category: script.category,
    audio: {
      narrator: {
        filename: audioFilename,
        path: audioPath,
        voiceId: mainAudio.voiceId,
        engine: mainAudio.engine,
        format: mainAudio.format,
        characters: mainAudio.characters,
        sizeBytes: Buffer.byteLength(mainAudio.audioBuffer),
        costUSD: mainAudio.costUSD
      },
      hook: {
        filename: hookFilename,
        path: hookPath,
        voiceId: hookAudio.voiceId,
        engine: hookAudio.engine,
        format: hookAudio.format,
        characters: hookAudio.characters,
        sizeBytes: Buffer.byteLength(hookAudio.audioBuffer),
        costUSD: hookAudio.costUSD
      }
    },
    generatedAt: new Date().toISOString(),
    provider: 'aws-polly',
    totalCharacters: mainAudio.characters + hookAudio.characters,
    totalCostUSD: 0 // FREE tier
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`\n✅ Metadata guardada: ${metadataFilename}`);
  console.log(`📊 Resumen:`);
  console.log(`   - Audio narrador: ${(metadata.audio.narrator.sizeBytes / 1024).toFixed(1)} KB`);
  console.log(`   - Audio hook: ${(metadata.audio.hook.sizeBytes / 1024).toFixed(1)} KB`);
  console.log(`   - Total caracteres: ${metadata.totalCharacters}`);
  console.log(`   - Costo: $0 USD (free tier)`);
  console.log(`\n✅ Agent 6 completado exitosamente`);

  process.exit(0);
}

// Ejecutar
const verse = process.argv[2];
if (!verse) {
  console.error('❌ Error: Se requiere el versículo como parámetro');
  console.error('Uso: node agent-6-aws-polly-free.js "Filipenses 4:13"');
  process.exit(1);
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ Error: AWS credentials no configuradas');
  console.error('');
  console.error('Necesitas configurar en .env:');
  console.error('  AWS_ACCESS_KEY_ID=AKIA...');
  console.error('  AWS_SECRET_ACCESS_KEY=...');
  console.error('  AWS_REGION=us-east-1');
  console.error('');
  console.error('AWS Polly FREE tier: 5M caracteres/mes (primer año)');
  console.error('Suficiente para ~500 videos de 60s');
  process.exit(1);
}

processScript(verse).catch(error => {
  console.error(`\n❌ Error fatal: ${error.message}`);
  process.exit(1);
});
