#!/usr/bin/env node
/**
 * METADATA PROCESSOR
 * Procesa metadata de YouTube reemplazando TODOS los placeholders automáticamente
 *
 * Placeholders detectados y reemplazados:
 * - @TuCanal → @rey-celestial (handle real del canal)
 * - https://www.youtube.com/@TuCanal → URL real de suscripción
 * - https://www.youtube.com/playlist?list=FORTALEZA → IDs reales de playlists
 * - {otros placeholders según el template}
 */

const { getChannelInfo } = require('./get-channel-info.js');
const fs = require('fs');
const path = require('path');

async function processMetadata(metadata, playlists = {}) {
  // Obtener información real del canal
  const channelInfo = await getChannelInfo();

  // Clonar metadata para no mutar el original
  const processed = JSON.parse(JSON.stringify(metadata));

  // Reemplazos globales
  const replacements = {
    '@TuCanal': channelInfo.handle,
    'https://www.youtube.com/@TuCanal?sub_confirmation=1': channelInfo.subscribeUrl,
    'https://www.youtube.com/@TuCanal': channelInfo.channelUrl
  };

  // Agregar reemplazos de playlists si se proporcionaron
  // Ejemplo: { 'FORTALEZA': 'PLYwKTflEBQts', 'ESPERANZA': 'PLXP4vXKSJJHk' }
  Object.keys(playlists).forEach(key => {
    replacements[`https://www.youtube.com/playlist?list=${key}`] =
      `https://www.youtube.com/playlist?list=${playlists[key]}`;
  });

  // Función auxiliar para reemplazar en cualquier string
  function replaceInString(str) {
    if (typeof str !== 'string') return str;

    let result = str;
    Object.keys(replacements).forEach(placeholder => {
      result = result.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
    });
    return result;
  }

  // Función recursiva para procesar objetos anidados
  function processObject(obj) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = replaceInString(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map(item =>
          typeof item === 'string' ? replaceInString(item) : processObject(item)
        );
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = processObject(obj[key]);
      }
    });
    return obj;
  }

  // Procesar toda la metadata recursivamente
  const result = processObject(processed);

  // Logs de verificación
  console.log('\n🔄 METADATA PROCESSOR - Placeholders Reemplazados');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  Object.keys(replacements).forEach(placeholder => {
    const original = JSON.stringify(metadata).includes(placeholder);
    if (original) {
      console.log(`   ✅ ${placeholder}`);
      console.log(`      → ${replacements[placeholder]}\n`);
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return result;
}

// Función para cargar playlists reales del canal
async function loadPlaylists() {
  const { google } = require('googleapis');
  const TOKEN_PATH = path.join(__dirname, 'youtube-token.json');

  if (!fs.existsSync(TOKEN_PATH)) {
    return {};
  }

  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'client_secret.json')));
    const { client_id, client_secret } = credentials.installed;

    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      'http://localhost:8080/oauth2callback'
    );

    oauth2Client.setCredentials(token);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.playlists.list({
      part: 'snippet',
      mine: true,
      maxResults: 50
    });

    // Mapear nombres conocidos a IDs reales
    const playlistMap = {};
    response.data.items.forEach(playlist => {
      const title = playlist.snippet.title.toLowerCase();

      // Detectar playlist de fortaleza/fuerza
      if (title.includes('fortaleza') || title.includes('fuerza') || title.includes('strength')) {
        playlistMap['FORTALEZA'] = playlist.id;
      }

      // Detectar playlist de esperanza
      if (title.includes('esperanza') || title.includes('hope')) {
        playlistMap['ESPERANZA'] = playlist.id;
      }

      // Detectar playlist de consuelo/comfort
      if (title.includes('consuelo') || title.includes('comfort')) {
        playlistMap['CONSUELO'] = playlist.id;
      }

      // Detectar playlist de promesas
      if (title.includes('promesas') || title.includes('promises')) {
        playlistMap['PROMESAS'] = playlist.id;
      }
    });

    return playlistMap;
  } catch (error) {
    console.warn('⚠️  No se pudieron cargar playlists:', error.message);
    return {};
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const metadataPath = process.argv[2];

  if (!metadataPath) {
    console.error('\n❌ Error: Debes especificar la ruta del archivo de metadata');
    console.error('Uso: node process-metadata.js /path/to/metadata.json\n');
    process.exit(1);
  }

  if (!fs.existsSync(metadataPath)) {
    console.error(`\n❌ Error: Archivo no encontrado: ${metadataPath}\n`);
    process.exit(1);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  loadPlaylists()
    .then(playlists => processMetadata(metadata, playlists))
    .then(processed => {
      // Guardar metadata procesada
      const outputPath = metadataPath.replace('.json', '-processed.json');
      fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2));

      console.log(`✅ Metadata procesada guardada en:`);
      console.log(`   ${outputPath}\n`);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error fatal:', err.message);
      process.exit(1);
    });
}

module.exports = { processMetadata, loadPlaylists };
