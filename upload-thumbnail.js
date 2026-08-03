#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TOKEN_PATH = '/home/suario/ruy-projects/project-yt/youtube-token.json';
const CLIENT_SECRET_PATH = '/home/suario/ruy-projects/project-yt/client_secret.json';

async function uploadThumbnail(videoId, thumbnailPath) {
  // Cargar credenciales
  const credentials = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH));
  const { client_id, client_secret } = credentials.installed;

  // Crear cliente OAuth2
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:8080/oauth2callback'
  );

  // Cargar token guardado
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oauth2Client.setCredentials(token);

  // Crear cliente de YouTube
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  console.log(`\n🚀 Subiendo thumbnail a video ${videoId}...`);
  console.log(`📸 Thumbnail: ${thumbnailPath}\n`);

  try {
    const result = await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        body: fs.createReadStream(thumbnailPath)
      }
    });

    console.log('✅ Thumbnail subido exitosamente!\n');
    console.log('Detalles:');
    console.log(`   Default: ${result.data.items[0].default.url}`);
    console.log(`   Medium: ${result.data.items[0].medium.url}`);
    console.log(`   High: ${result.data.items[0].high.url}\n`);

    return result.data;
  } catch (error) {
    console.error('❌ Error subiendo thumbnail:', error.message);
    if (error.code === 401) {
      console.error('\n💡 El token puede estar expirado. Ejecuta youtube-auth.js de nuevo.\n');
    }
    throw error;
  }
}

// CLI
const videoId = process.argv[2];
const thumbnailPath = process.argv[3];

if (!videoId || !thumbnailPath) {
  console.error('\n❌ Uso: node upload-thumbnail.js <videoId> <thumbnailPath>\n');
  console.error('Ejemplo:');
  console.error('  node upload-thumbnail.js pbhSzjVxbHo /tmp/thumbnail.jpg\n');
  process.exit(1);
}

uploadThumbnail(videoId, thumbnailPath)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
